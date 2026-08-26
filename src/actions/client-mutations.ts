'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const extUrl = process.env.WEBSITE_SUPABASE_URL;
const extKey = process.env.WEBSITE_SUPABASE_ANON_KEY;

export async function deleteClients(clientIds: string[], deleteFromExternal: boolean) {
  try {
    const clients = await prisma.client.findMany({ where: { id: { in: clientIds } } });

    // 1. Delete Internally (Transaction)
    await prisma.$transaction([
      prisma.requirement.deleteMany({ where: { clientId: { in: clientIds } } }),
      prisma.placement.deleteMany({ where: { clientId: { in: clientIds } } }),
      prisma.client.deleteMany({ where: { id: { in: clientIds } } })
    ]);

    // 2. Delete Externally (if requested)
    if (deleteFromExternal && extUrl && extKey) {
      for (const client of clients) {
        if (client.email) {
          const res = await fetch(`${extUrl}/rest/v1/bookings?email=eq.${encodeURIComponent(client.email as string)}`, {
            method: 'DELETE',
            headers: {
              'apikey': extKey,
              'Authorization': `Bearer ${extKey}`,
              'Content-Type': 'application/json',
            }
          });
          if (!res.ok) console.error(`Failed to delete external booking for ${client.email}`);
        }
      }
    }

    revalidatePath('/dashboard/clients');
    revalidatePath('/dashboard');
    return { success: true, message: `Successfully deleted ${clientIds.length} leads.` };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: 'Failed to delete clients.' };
  }
}

export async function updateClientLead(clientId: string, data: {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  requirementId?: string;
  budgetMax?: string;
  notes?: string;
}, updateExternal: boolean) {
  try {
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        city: data.city,
        address: data.address,
      }
    });

    if (data.requirementId && data.budgetMax) {
      await prisma.requirement.update({
        where: { id: data.requirementId },
        data: {
          budgetMax: parseInt(data.budgetMax),
          notes: data.notes
        }
      });
    }

    // Update external real database
    if (updateExternal && extUrl && extKey && client.email) {
      const res = await fetch(`${extUrl}/rest/v1/bookings?email=eq.${encodeURIComponent(client.email as string)}`, {
        method: 'PATCH',
        headers: {
          'apikey': extKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          city: data.city,
          phone: data.phone,
          notes: data.notes || 'EMPTY',
          amount: parseInt(data.budgetMax || '0')
        })
      });
      if (!res.ok) throw new Error("External DB patch failed");
    }

    revalidatePath('/dashboard/clients');
    return { success: true, message: 'Lead updated successfully on both databases.' };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: 'Failed to update lead.' };
  }
}
