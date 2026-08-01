import { NextResponse } from 'next/server';
import { trainAndEvaluateAIProblem } from '@/lib/ai/estimatorModel';
import { insforge } from '@/lib/insforge';

export async function POST(request: Request) {
  try {
    const { problemStatement, category, distanceKm } = await request.json();

    if (!problemStatement) {
      return NextResponse.json({ error: 'Problem statement is required' }, { status: 400 });
    }

    const dist = parseFloat(distanceKm || '0');

    // 1. Evaluate using Trained Custom AI Model Engine
    let result = trainAndEvaluateAIProblem(problemStatement, category, dist);

    // 2. Optional Enhancement: Call InsForge LLM for deeper problem reasoning if available
    try {
      const systemPrompt = `
You are an expert home repair diagnostic AI. 
Briefly summarize in 1 sentence why this issue ('${problemStatement}') requires professional repair and what safety precaution the customer should take.
Return ONLY valid JSON matching: {"insights": "your 1 sentence diagnostic insight"}`;

      const completion = await insforge.ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }]
      });

      const content = completion.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.insights) {
          result.reasoning = `${result.reasoning} • AI Insight: ${parsed.insights}`;
        }
      }
    } catch (llmErr) {
      // Graceful fallback to trained local model reasoning
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Estimation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate estimate' }, { status: 500 });
  }
}
