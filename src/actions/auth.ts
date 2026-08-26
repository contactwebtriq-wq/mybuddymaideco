'use server';

import { prisma } from '@/lib/db';
import { verifyPassword, setSessionCookie, deleteSessionCookie, getSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  pin: z.string().optional()
});

export async function login(formData: FormData) {
  const rawEmail = formData.get('email');
  const rawPassword = formData.get('password');
  const rawPin = formData.get('pin') ? formData.get('pin')?.toString() : undefined;

  const validated = loginSchema.safeParse({ email: rawEmail, password: rawPassword, pin: rawPin });
  if (!validated.success) {
    return { error: 'Invalid input data' };
  }
  
  const { email, password } = validated.data;
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown IP';
  const userAgent = headersList.get('user-agent') || 'Unknown Browser';

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    // Intentionally vague to prevent email enumeration
    return { error: 'Invalid credentials' };
  }

  // Check if account is locked out
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Account locked due to multiple failed attempts. Try again in ${minLeft} minutes.` };
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    const attempts = user.failedLoginAttempts + 1;
    const isLocked = attempts >= 5;
    const lockedUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 mins lock

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts, lockedUntil }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FAILED_LOGIN',
        details: `Failed attempt ${attempts}. ${isLocked ? 'Account locked.' : ''}`,
        ipAddress
      }
    });

    return { error: 'Invalid credentials' };
  }

  // Password is valid. Now check 2FA PIN
  if (user.isTwoFactorEnabled) {
    const { pin } = validated.data;
    
    if (!pin) {
      return { requiresPin: true };
    }
    
    if (pin !== user.twoFactorPin) {
      // Log failed PIN attempt
      const attempts = user.failedLoginAttempts + 1;
      const isLocked = attempts >= 5;
      const lockedUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'FAILED_2FA',
          details: `Failed 2FA PIN. ${isLocked ? 'Account locked.' : ''}`,
          ipAddress
        }
      });
      return { error: 'Invalid 2FA PIN' };
    }
  }

  // Successful Login (both password and PIN)
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null }
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt,
      userAgent,
      ipAddress
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'SUCCESSFUL_LOGIN',
      details: `User agent: ${userAgent}`,
      ipAddress
    }
  });

  await setSessionCookie(session.id, expiresAt);

  return { success: true };
}

export async function logout() {
  const sessionId = await getSessionId();
  if (sessionId) {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown IP';

    const session = await prisma.session.findUnique({ where: { id: sessionId }});
    if (session) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'LOGOUT',
          ipAddress
        }
      });
    }

    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  
  await deleteSessionCookie();
  redirect('/login');
}

export async function verifySudo(formData: FormData) {
  const sessionId = await getSessionId();
  if (!sessionId) return { error: 'Not authenticated' };

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session) return { error: 'Invalid session' };

  const rawPassword = formData.get('password');
  const rawPin = formData.get('pin');

  if (typeof rawPassword !== 'string' || typeof rawPin !== 'string') {
    return { error: 'Invalid input' };
  }

  const isValidPassword = verifyPassword(rawPassword, session.user.passwordHash);
  if (!isValidPassword) {
    return { error: 'Invalid credentials' };
  }

  if (session.user.isTwoFactorEnabled && rawPin !== session.user.twoFactorPin) {
    return { error: 'Invalid 2FA PIN' };
  }

  // Set sudo mode for 15 minutes
  const sudoExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.session.update({
    where: { id: sessionId },
    data: { sudoExpiresAt }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'SUDO_MODE_ENABLED',
      details: 'User authenticated for security dashboard access',
      ipAddress: session.ipAddress
    }
  });

  return { success: true };
}
