'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RoleCategory, WorkType } from '@prisma/client';

export async function syncWebsiteLeads() {
  const url = process.env.WEBSITE_SUPABASE_URL?.replaceAll('"', '').replaceAll("'", '').trim();
  const key = process.env.WEBSITE_SUPABASE_ANON_KEY?.replaceAll('"', '').replaceAll("'", '').trim();

  if (!url || !key || url.includes('[YOUR-WEBSITE-PROJECT-REF]')) {
    return { success: false, error: 'Please configure WEBSITE_SUPABASE_URL and WEBSITE_SUPABASE_ANON_KEY in your .env file.' };
  }

  try {
    const endpoint = `${url}/rest/v1/bookings?status=eq.pending`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) throw new Error(`External API returned ${response.status}`);
    const bookings = await response.json();
    
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return { success: true, count: 0, message: 'No new pending bookings found.' };
    }

    type BookingInput = {
      email?: string;
      phone?: string;
      updated_at?: string;
      created_at?: string;
      city?: string;
      service?: string;
      amount?: number;
      notes?: string;
    };

    const validBookings: BookingInput[] = bookings.filter((b: unknown): b is BookingInput => {
      return typeof b === 'object' && b !== null && ('email' in b || 'phone' in b);
    });
    const emails = validBookings.map(b => b.email).filter((e): e is string => Boolean(e));

    const existingClients = await prisma.client.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true }
    });
    const existingEmailSet = new Set(existingClients.map(c => c.email));

    const newClientsData = [];
    const processedEmails = new Set();

    for (const booking of validBookings) {
      if (booking.email && !existingEmailSet.has(booking.email) && !processedEmails.has(booking.email)) {
        processedEmails.add(booking.email);
        
        let fullName = "Website Lead";
        if (booking.email) {
          fullName = booking.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        }

        const originalDate = new Date(booking.updated_at || booking.created_at || new Date());

        newClientsData.push({
          fullName,
          phone: booking.phone || 'N/A',
          email: booking.email,
          city: booking.city || 'Unknown',
          address: 'Imported from Website',
          createdAt: originalDate,
          updatedAt: originalDate,
        });
      }
    }

    if (newClientsData.length > 0) {
      await prisma.client.createMany({
        data: newClientsData,
        skipDuplicates: true
      });
    }

    const allRelevantClients = await prisma.client.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true }
    });
    const emailToIdMap = new Map(allRelevantClients.map(c => [c.email, c.id]));

    const clientIds = Array.from(emailToIdMap.values());
    const existingReqs = await prisma.requirement.findMany({
      where: { clientId: { in: clientIds }, isFulfilled: false },
      select: { clientId: true, requestedRole: true }
    });
    
    const reqLookup = new Set(existingReqs.map(r => `${r.clientId}_${r.requestedRole}`));

    const newReqsData = [];
    let syncedCount = 0;

    for (const booking of validBookings) {
      if (!booking.email) continue;
      
      const clientId = emailToIdMap.get(booking.email);
      if (!clientId) continue;

      let role: RoleCategory = 'MAID';
      let type: WorkType = 'EIGHT_HOUR';
      const srv = booking.service?.toLowerCase() || '';
      
      if (srv.includes('nanny')) role = 'NANNY';
      else if (srv.includes('cook')) role = 'COOK';
      else if (srv.includes('elderly')) role = 'CAREGIVER';

      if (srv.includes('full-time') || srv.includes('live-in')) type = 'LIVE_IN';
      else if (srv.includes('part-time')) type = 'EIGHT_HOUR';

      const lookupKey = `${clientId}_${role}`;
      const originalDate = new Date(booking.updated_at || booking.created_at || new Date());

      if (!reqLookup.has(lookupKey)) {
        reqLookup.add(lookupKey);
        newReqsData.push({
          clientId,
          requestedRole: role,
          requestedType: type,
          budgetMax: booking.amount || 15000,
          notes: booking.notes === 'EMPTY' ? null : booking.notes,
          createdAt: originalDate,
        });
        syncedCount++;
      }
    }

    if (newReqsData.length > 0) {
      await prisma.requirement.createMany({
        data: newReqsData,
        skipDuplicates: true
      });
    }

    // Note: revalidatePath is skipped here as it's triggered via client component now
    return { success: true, count: syncedCount, message: `High-Speed Sync Complete! Safely imported ${syncedCount} new leads.` };

  } catch (error) {
    console.error("Sync Error:", error);
    // We log the real error securely on Vercel's backend servers, but NEVER send it to the user's screen.
    return { success: false, error: 'Sync failed due to an internal system error. Please check the server logs.' };
  }
}
