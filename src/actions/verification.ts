'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function verifyCandidateDocument(candidateId: string, docType: 'AADHAAR' | 'POLICE_CHECK') {
  if (typeof candidateId !== 'string') return { success: false, error: 'Invalid candidate ID' };

  try {
    const updateData = docType === 'AADHAAR' 
      ? { isVerified: true } 
      : { policeVerified: true };

    await prisma.candidate.update({
      where: { id: candidateId },
      data: updateData
    });

    revalidatePath('/dashboard/candidates');
    revalidatePath('/dashboard/match');
    
    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: 'Failed to update verification status' };
  }
}
