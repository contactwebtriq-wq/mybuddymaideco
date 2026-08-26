'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { CandidateStatus } from '@prisma/client';

export async function editPlacementDetails(placementId: string, agreedSalary: number) {
  try {
    await prisma.placement.update({
      where: { id: placementId },
      data: { agreedSalary }
    });
    
    revalidatePath('/dashboard/placements');
    return { success: true, message: 'Placement agreement updated.' };
  } catch (error) {
    console.error("Edit placement error:", error);
    return { success: false, error: 'Failed to update placement.' };
  }
}

export async function terminatePlacement(
  placementId: string, 
  candidateId: string, 
  clientId: string,
  newCandidateStatus: CandidateStatus,
  reopenClientRequirement: boolean
) {
  try {
    const transaction: Prisma.PrismaPromise<unknown>[] = [
      // 1. Mark the placement as TERMINATED and set end date
      prisma.placement.update({
        where: { id: placementId },
        data: { 
          status: 'TERMINATED',
          endDate: new Date()
        }
      }),
      // 2. Update the candidate's status (e.g. back to AVAILABLE or BLACKLISTED)
      prisma.candidate.update({
        where: { id: candidateId },
        data: { status: newCandidateStatus }
      })
    ];

    // 3. If the client needs a replacement, reopen their requirement
    // so they show up in the Match Engine again.
    if (reopenClientRequirement) {
      // Find the most recent requirement for this client and set it back to active
      const recentReq = await prisma.requirement.findFirst({
        where: { clientId: clientId },
        orderBy: { createdAt: 'desc' }
      });

      if (recentReq) {
        transaction.push(
          prisma.requirement.update({
            where: { id: recentReq.id },
            data: { isFulfilled: false }
          })
        );
      }
    }

    await prisma.$transaction(transaction);

    revalidatePath('/dashboard/placements');
    revalidatePath('/dashboard/candidates');
    revalidatePath('/dashboard/match');
    revalidatePath('/dashboard');
    
    return { success: true, message: reopenClientRequirement 
      ? 'Placement terminated. Client has been sent back to the Match Engine.' 
      : 'Placement terminated successfully.' 
    };

  } catch (error) {
    console.error("Terminate placement error:", error);
    return { success: false, error: 'Failed to process termination.' };
  }
}
