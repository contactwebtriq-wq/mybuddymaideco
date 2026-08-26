'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function markFeePaid(placementId: string) {
  if (typeof placementId !== 'string') {
    return { success: false, error: 'Invalid placement ID' };
  }

  try {
    // Standard agency placement guarantee is 6 months from the date of payment
    const guaranteeEnd = new Date();
    guaranteeEnd.setMonth(guaranteeEnd.getMonth() + 6);

    await prisma.placement.update({
      where: { id: placementId },
      data: {
        feePaid: true,
        status: 'ACTIVE',
        guaranteeEnd: guaranteeEnd
      }
    });

    revalidatePath('/dashboard/finance');
    revalidatePath('/dashboard/placements');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error("Payment update failed:", error);
    return { success: false, error: 'Failed to update payment status' };
  }
}
