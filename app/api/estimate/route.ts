import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: Request) {
  try {
    const { problemStatement, category, distanceKm } = await request.json();

    if (!problemStatement) {
      return NextResponse.json({ error: 'Problem statement is required' }, { status: 400 });
    }

    // 1. Calculate Travel Charges
    let travelCharge = 0;
    const distance = parseFloat(distanceKm || '0');
    if (distance <= 5) {
      travelCharge = 0;
    } else if (distance <= 10) {
      travelCharge = 20;
    } else if (distance <= 15) {
      travelCharge = 70;
    } else if (distance <= 20) {
      travelCharge = 100;
    } else {
      travelCharge = 100 + ((distance - 20) * 6);
    }
    
    // Round to whole number
    travelCharge = Math.round(travelCharge);

    // 2. Prepare AI Prompt
    const systemPrompt = `
You are an expert pricing estimator for a home service platform.
You must analyze the user's problem statement and provide an estimated pricing breakdown based on the following framework:

1. Inspection / Assessment Charges:
   - Plumbing: ₹150–₹250
   - Electrical: ₹150–₹250
   - Cleaning: ₹100–₹200
   - Other Services: ₹150–₹300

2. Service Pricing Logic:
   - Plumbing (Leak repair without replacement parts): ₹300–₹800
   - Plumbing (Leak repair requiring replacement of pipes/fittings): ₹500–₹2,000
   - Electrical (Fault diagnosis and repair without replacement): ₹300–₹700
   - Electrical (Fault repair requiring replacement of parts): ₹500–₹2,500
   - Cleaning (Basic Cleaning): ₹500–₹1,500
   - Cleaning (Deep Cleaning): ₹1,500–₹5,000
   - Cleaning (Bathroom Cleaning): ₹300–₹1,000
   - Cleaning (Kitchen Cleaning): ₹500–₹2,000
   - Cleaning (Full Home): ₹2,000–₹10,000+
   - For all other services not listed here, generate a logical estimated range (e.g., ₹500-₹1500) based on typical market rates.

3. Platform Fees:
   - Fixed service fee of ₹49.

Return your response in STRICT JSON format matching this structure exactly. Do not include markdown formatting or extra text:
{
  "inspectionFee": 150,
  "minServiceFee": 300,
  "maxServiceFee": 800,
  "platformFee": 49,
  "reasoning": "A brief explanation of how you categorized the issue (e.g., 'Plumbing leak repair without parts replacement.')"
}
`;

    const userPrompt = `Category: ${category}\nProblem Statement: ${problemStatement}`;

    // Call InsForge AI
    const completion = await insforge.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const aiContent = completion.choices[0].message.content || '';
    
    // Parse the JSON (safely handle markdown code blocks if AI ignores instructions)
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : aiContent;
    
    let estimation;
    try {
      estimation = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI JSON:', aiContent);
      estimation = {
        inspectionFee: 150,
        minServiceFee: 500,
        maxServiceFee: 1000,
        platformFee: 49,
        reasoning: "General estimate applied."
      };
    }

    const result = {
      ...estimation,
      travelFee: travelCharge,
      totalMin: estimation.inspectionFee + estimation.minServiceFee + estimation.platformFee + travelCharge,
      totalMax: estimation.inspectionFee + estimation.maxServiceFee + estimation.platformFee + travelCharge
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Estimation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate estimate' }, { status: 500 });
  }
}
