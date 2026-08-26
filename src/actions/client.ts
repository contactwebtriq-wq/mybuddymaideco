'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RoleCategory, WorkType } from '@prisma/client';

export async function createClientLead(formData: FormData) {
  const fullName = formData.get('fullName');
  const phone = formData.get('phone');
  const email = formData.get('email');
  const city = formData.get('city');
  const address = formData.get('address');
  
  const requestedRole = formData.get('requestedRole');
  const requestedType = formData.get('requestedType');
  const budgetMax = formData.get('budgetMax');
  const notes = formData.get('notes');

  if (
    typeof fullName !== 'string' || typeof phone !== 'string' || 
    typeof city !== 'string' || typeof address !== 'string' ||
    typeof requestedRole !== 'string' || typeof requestedType !== 'string' || 
    typeof budgetMax !== 'string'
  ) {
    return { success: false, error: 'Invalid form data provided' };
  }

  try {
    // 1. Create the Client and their first Requirement in a single transaction
    await prisma.client.create({
      data: {
        fullName,
        phone,
        email: typeof email === 'string' ? email : null,
        city,
        address,
        requirements: {
          create: {
            requestedRole: requestedRole as RoleCategory,
            requestedType: requestedType as WorkType,
            budgetMax: parseInt(budgetMax, 10),
            notes: typeof notes === 'string' ? notes : null,
          }
        }
      }
    });

    revalidatePath('/dashboard/clients');
    revalidatePath('/dashboard/match'); // Update the match engine's active leads
    revalidatePath('/dashboard'); // Update the overview KPI
    
    return { success: true };
  } catch (error) {
    console.error('Failed to log new lead:', error);
    return { success: false, error: 'Database error: Failed to save lead. Ensure phone number is unique.' };
  }
}
