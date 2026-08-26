import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RoleCategory, WorkType } from '@prisma/client';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roleCategory, workType, maxBudget, notes } = body;

    // 1. Fetch baseline matches from the database
    const baselineCandidates = await prisma.candidate.findMany({
      where: {
        roleCategory: roleCategory as RoleCategory,
        workType: workType as WorkType,
        status: 'AVAILABLE',
        isVerified: true,
        salaryExpected: {
          lte: maxBudget ? parseInt(maxBudget) + 5000 : undefined, // Give AI wiggle room on budget
        },
      },
    });

    if (baselineCandidates.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // 2. If no notes exist, just return the baseline matches
    if (!notes || notes.trim() === '' || notes === 'EMPTY') {
      return NextResponse.json({ matches: baselineCandidates.slice(0, 5) });
    }

    // 3. AI Smart Matching
    const candidateData = baselineCandidates.map(c => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      skills: c.skills || 'General domestic work',
      expectedSalary: c.salaryExpected
    }));

    const prompt = `
      You are an expert HR matchmaker for a domestic staffing agency.
      A client is looking for a ${workType.replace('_', ' ')} ${roleCategory}.
      Client's Maximum Budget: ₹${maxBudget || 'Flexible'}
      Client's Custom Requirements: "${notes}"

      Here is the pool of available candidates:
      ${JSON.stringify(candidateData, null, 2)}

      Rank the top 5 candidates based on how well their skills match the client's custom requirements.
      Return EXACTLY a JSON array of objects, with NO markdown formatting, NO backticks, and NO extra text.
      Format: [{"id": "uuid", "matchScore": 95, "reason": "1 short sentence explaining why they are a good fit."}]
    `;

    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const aiResponse = completion.choices[0]?.message?.content || '[]';
    let rankedIds: Array<{id: string, matchScore: number, reason: string}> = [];
    
    try {
      // Clean potential markdown from the response just in case
      const cleanedJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      rankedIds = JSON.parse(cleanedJson);
    } catch (e) {
      console.error("AI JSON Parse Error:", e, aiResponse);
      // Fallback to baseline if AI fails to return valid JSON
      return NextResponse.json({ matches: baselineCandidates.slice(0, 5) });
    }

    // 4. Merge AI ranking with full candidate profiles
    const finalMatches = rankedIds.map((rank) => {
      const candidate = baselineCandidates.find(c => c.id === rank.id);
      if (!candidate) return null;
      return {
        ...candidate,
        matchScore: rank.matchScore,
        matchReason: rank.reason
      };
    }).filter(Boolean);

    return NextResponse.json({ matches: finalMatches });

  } catch (error) {
    console.error("Matching Error:", error);
    return NextResponse.json({ error: "Failed to find matches" }, { status: 500 });
  }
}
