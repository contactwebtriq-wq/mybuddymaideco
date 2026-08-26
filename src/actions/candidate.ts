'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RoleCategory, WorkType } from '@prisma/client';

export async function createCandidate(formData: FormData) {
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const phone = formData.get('phone');
  const roleCategory = formData.get('roleCategory');
  const workType = formData.get('workType');
  const salaryExpected = formData.get('salaryExpected');

  // Strict type guarding to replace 'any'
  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof phone !== 'string' ||
    typeof roleCategory !== 'string' ||
    typeof workType !== 'string' ||
    typeof salaryExpected !== 'string'
  ) {
    throw new Error('Invalid form data provided');
  }

  try {
    await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        phone,
        roleCategory: roleCategory as RoleCategory,
        workType: workType as WorkType,
        salaryExpected: parseInt(salaryExpected, 10),
        isVerified: false,
        policeVerified: false,
        status: 'PENDING_VERIFICATION'
      }
    });

    // Automatically trigger Next.js to re-fetch the live data on the UI
    revalidatePath('/dashboard/candidates');
    return { success: true };
  } catch (error) {
    console.error('Failed to create candidate:', error);
    return { success: false, error: 'Failed to create candidate' };
  }
}
