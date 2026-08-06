import { NextResponse } from 'next/server';
import { trainAndEvaluateAIProblem } from '@/lib/ai/estimatorModel';
import { insforge } from '@/lib/insforge';

export async function POST(request: Request) {
  try {
    const { problemStatement, category, distanceKm } = await request.json();

    if (!problemStatement) {
      return NextResponse.json({ error: 'Problem statement or Booking ID is required' }, { status: 400 });
    }

    const trimmedInput = problemStatement.trim();

    // 1. Order Lookup: Check if input is a real Booking / Order ID in InsForge DB
    try {
      const { data: orderData } = await insforge.database
        .from('orders')
        .select('*')
        .eq('id', trimmedInput)
        .single();

      if (orderData) {
        const orderPrice = orderData.total_price || 499;
        return NextResponse.json({
          category: orderData.service_name || category || 'General',
          subIssue: `Order #${orderData.id.slice(0, 8)} (${orderData.service_name})`,
          gravityLevel: 2,
          gravityName: 'Verified Order Record',
          gravityMultiplier: 1.0,
          gravityFactors: [
            `Database Order Status: ${orderData.status.toUpperCase()}`,
            `Payment Status: ${orderData.payment_status.toUpperCase()}`
          ],
          confidenceScore: 100,
          inspectionFee: 100,
          minServiceFee: Math.max(0, orderPrice - 149),
          maxServiceFee: Math.max(0, orderPrice - 100),
          platformFee: 49,
          travelFee: 0,
          totalMin: orderPrice,
          totalMax: orderPrice,
          reasoning: `Matched Database Booking #${orderData.id.slice(0, 8)}. Stored Total Order Price is ₹${orderPrice} (Payment: ${orderData.payment_status.toUpperCase()}).`,
          suggestedTools: ['Order Diagnostic Kit'],
          suggestedTechniciansCount: 1
        });
      }
    } catch (dbErr) {
      // Continue to AI estimator if not a DB order lookup
    }

    const dist = parseFloat(distanceKm || '0');

    // 2. Evaluate using Trained Custom AI Model Engine
    let result = trainAndEvaluateAIProblem(trimmedInput, category, dist);

    // 3. Optional Enhancement: Call InsForge LLM for deeper problem reasoning if available
    try {
      const systemPrompt = `
You are an expert home repair diagnostic AI. 
Briefly summarize in 1 sentence why this issue ('${trimmedInput}') requires professional repair and what safety precaution the customer should take.
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
