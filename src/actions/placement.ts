'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function triggerPlacement(candidateId: string, clientId: string) {
  if (typeof candidateId !== 'string' || typeof clientId !== 'string') {
    return { success: false, error: 'Invalid IDs provided' };
  }

  try {
    // 1. Get candidate's expected salary to use as agreed salary
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) throw new Error("Candidate not found");

    // 2. Find the active requirement to fulfill it
    const requirement = await prisma.requirement.findFirst({
      where: { clientId: clientId, isFulfilled: false }
    });

    // 3. Transaction: Create Placement, Update Candidate, Fulfill Requirement
    const transaction: any[] = [
      prisma.placement.create({
        data: {
          candidateId,
          clientId,
          status: 'TRIAL',
          agreedSalary: candidate.salaryExpected,
          placementFee: candidate.salaryExpected,
          feePaid: false,
        }
      }),
      prisma.candidate.update({
        where: { id: candidateId },
        data: { status: 'ON_TRIAL' }
      })
    ];

    if (requirement) {
      transaction.push(
        prisma.requirement.update({
          where: { id: requirement.id },
          data: { isFulfilled: true }
        })
      );
    }

    await prisma.$transaction(transaction);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/match');
    revalidatePath('/dashboard/candidates');
    revalidatePath('/dashboard/placements');
    
    return { success: true };
  } catch (error) {
    console.error("Placement error:", error);
    return { success: false, error: 'Failed to create placement' };
  }
}
