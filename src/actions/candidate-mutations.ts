'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RoleCategory, WorkType, CandidateStatus } from '@prisma/client';

export async function deleteCandidates(candidateIds: string[]) {
  try {
    // Transaction to safely delete associated placements before the candidate
    await prisma.$transaction([
      prisma.placement.deleteMany({ where: { candidateId: { in: candidateIds } } }),
      prisma.candidate.deleteMany({ where: { id: { in: candidateIds } } })
    ]);

    revalidatePath('/dashboard/candidates');
    revalidatePath('/dashboard');
    return { success: true, message: `Successfully deleted ${candidateIds.length} candidate(s).` };
  } catch (error) {
    console.error("Candidate Delete Error:", error);
    return { success: false, error: 'Failed to delete candidates. Check database constraints.' };
  }
}

export async function updateCandidateProfile(candidateId: string, data: any) {
  try {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roleCategory: data.roleCategory as RoleCategory,
        workType: data.workType as WorkType,
        salaryExpected: parseInt(data.salaryExpected, 10),
        status: data.status as CandidateStatus,
      }
    });

    revalidatePath('/dashboard/candidates');
    revalidatePath('/dashboard/match');
    return { success: true, message: 'Candidate profile and status updated successfully.' };
  } catch (error) {
    console.error("Candidate Update Error:", error);
    return { success: false, error: 'Failed to update candidate profile.' };
  }
}
