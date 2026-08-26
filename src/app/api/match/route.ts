import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RoleCategory, WorkType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roleCategory, workType, maxBudget } = body;

    // The Smart Matching Engine
    // Finds verified, available candidates matching the client's criteria
    const matches = await prisma.candidate.findMany({
      where: {
        roleCategory: roleCategory as RoleCategory,
        workType: workType as WorkType,
        status: 'AVAILABLE',
        isVerified: true,
        salaryExpected: {
          lte: maxBudget ? parseInt(maxBudget) : undefined,
        },
      },
      orderBy: {
        salaryExpected: 'asc',
      },
      take: 5, // Top 5 best matches
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Matching Error:", error);
    return NextResponse.json({ error: "Failed to find matches" }, { status: 500 });
  }
}
