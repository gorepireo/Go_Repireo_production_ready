import dataset from './dataset.json';
import trainingSamples from './trainingDataset.json';

export interface AIGravityResult {
  issueId: string;
  category: string;
  subIssue: string;
  gravityLevel: 1 | 2 | 3 | 4;
  gravityName: string;
  gravityMultiplier: number;
  gravityFactors: string[];
  confidenceScore: number;
  
  // Labor & Inspection Breakdown
  laborPriceMin: number;
  laborPriceMax: number;
  suggestedLaborTarget: number;
  inspectionFee: number;
  inspectionFeeMax: number;

  // Travel & Platform Fee Rules
  travelFee: number;
  travelRule: string;
  fixedPlatformFee: number;
  percentagePlatformFeeRate: number;
  percentagePlatformFeeMin: number;
  percentagePlatformFeeMax: number;

  // Final Calculated Estimates (Fixed Fee & 10% Fee)
  estimateBeforeMaterialMin: number;
  estimateBeforeMaterialMax: number;
  estimateIfCustomerProceedsMin: number;
  estimateIfCustomerProceedsMax: number;
  
  estimateBeforeMaterial10pctMin: number;
  estimateBeforeMaterial10pctMax: number;
  estimateIfCustomerProceeds10pctMin: number;
  estimateIfCustomerProceeds10pctMax: number;

  // Legacy compatibility fields
  minServiceFee: number;
  maxServiceFee: number;
  platformFee: number;
  totalMin: number;
  totalMax: number;

  reasoning: string;
  suggestedTools: string[];
  suggestedTechniciansCount: number;
}

// Key gravity indicator dictionaries
const GRAVITY_4_CRITICAL = [
  'burst', 'phat gaya', 'flood', 'flooding', 'fire', 'aag', 'smoke', 'dhua',
  'sparks', 'sparking', 'emergency', 'blackout', 'main line', 'gushing',
  'dangerous', 'sewer overflow', 'compressor seized', 'meter board fire',
  'renovation', 'post renovation', 'debris', 'burning smell'
];

const GRAVITY_3_SEVERE = [
  'concealed', 'in-wall', 'inside wall', 'deewar', 'dampness', 'seepage',
  'short circuit', 'mcb trip', 'heavy leak', 'gas leak',
  'renovation', 'degreasing', 'multiple lights', 'heavy load'
];

const GRAVITY_2_MODERATE = [
  'clogged', 'slow drain', 'block', 'naali', 'stagnant', 'fan regulator',
  'flickering', 'regulator', 'hard water', 'stains', 'vibration', 'noise',
  'overflow', 'float valve'
];

export function trainAndEvaluateAIProblem(
  problemStatement: string,
  categoryInput: string = 'general',
  distanceKm: number = 0
): AIGravityResult {
  const cleanInput = problemStatement.toLowerCase().replace(/[^\w\s]/gi, ' ');
  const inputTokens = cleanInput.split(/\s+/).filter(Boolean);

  // 1. Calculate Distance Travel Charge (Intra-city local service cap)
  const cappedDistance = Math.min(Math.abs(distanceKm || 0), 25);
  let travelCharge = 0;
  if (cappedDistance > 5 && cappedDistance <= 10) {
    travelCharge = 20;
  } else if (cappedDistance > 10 && cappedDistance <= 15) {
    travelCharge = 70;
  } else if (cappedDistance > 15 && cappedDistance <= 20) {
    travelCharge = 100;
  } else if (cappedDistance > 20) {
    travelCharge = Math.min(130, Math.round(100 + ((cappedDistance - 20) * 6)));
  }

  // 2. Search for best match in training dataset
  let bestTrainingMatch: any = null;
  let highestScore = -1;

  for (const sample of (trainingSamples as any[])) {
    let score = 0;

    // Match category
    if (categoryInput && sample.form_input.category.toLowerCase() === categoryInput.toLowerCase()) {
      score += 6;
    }

    // Match problem statement similarity
    const sampleInput = sample.form_input.problem_statement.toLowerCase();
    if (cleanInput === sampleInput) {
      score += 30;
    } else if (cleanInput.includes(sampleInput) || sampleInput.includes(cleanInput)) {
      score += 20;
    }

    const sampleTokens = sampleInput.replace(/[^\w\s]/gi, ' ').split(/\s+/).filter(Boolean);
    for (const token of inputTokens) {
      if (token.length > 3 && sampleTokens.includes(token)) {
        score += 4;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestTrainingMatch = sample;
    }
  }

  // Detect if user entered an Order ID or Booking Reference
  const isBookingRef = /order_|ord_|#|[0-9a-f]{8,}/i.test(problemStatement.trim());

  // 3. Fallback to dataset.json if training sample score is low
  let bestMatch = dataset[0];
  let highestMatchScore = -1;

  let detectedLevel: 1 | 2 | 3 | 4 = 1;
  const gravityFactors: string[] = [];

  if (GRAVITY_4_CRITICAL.some(kw => cleanInput.includes(kw))) {
    detectedLevel = 4;
    gravityFactors.push('Critical Emergency: Active fire, electric sparking, main line burst, or high risk detected');
  } else if (GRAVITY_3_SEVERE.some(kw => cleanInput.includes(kw))) {
    detectedLevel = 3;
    gravityFactors.push('Severe Issue: In-wall concealed pipe leak, distribution fault, or heavy contamination');
  } else if (GRAVITY_2_MODERATE.some(kw => cleanInput.includes(kw))) {
    detectedLevel = 2;
    gravityFactors.push('Moderate Issue: Component replacement, drainage blockage, or electrical instability');
  } else {
    detectedLevel = 1;
    gravityFactors.push('Minor Issue: Routine single-component fix or minor adjustment');
  }

  for (const sample of dataset) {
    let score = 0;
    if (categoryInput && sample.category.toLowerCase() === categoryInput.toLowerCase()) score += 4;
    if (sample.gravity === detectedLevel) score += 5;
    for (const kw of sample.keywords) {
      if (cleanInput.includes(kw.toLowerCase())) score += 6;
    }
    if (score > highestMatchScore) {
      highestMatchScore = score;
      bestMatch = sample;
    }
  }

  // Determine Labor & Inspection Prices from Trained Dataset Sample or Calculated Model
  let issueId = 'SERV-GENERAL';
  let categoryName = bestMatch.category;
  let subIssueTitle = bestMatch.subIssue;
  let laborPriceMin = 300;
  let laborPriceMax = 700;
  let suggestedLaborTarget = 500;
  let inspectionFee = 150;
  let inspectionFeeMax = 250;

  if (bestTrainingMatch && highestScore >= 8) {
    const tAi = bestTrainingMatch.ai_identifier_output;
    issueId = tAi.issue_id;
    categoryName = bestTrainingMatch.form_input.category;
    subIssueTitle = tAi.diagnosis_summary;
    detectedLevel = tAi.gravity_level as 1 | 2 | 3 | 4;
    laborPriceMin = tAi.labor_price_min;
    laborPriceMax = tAi.labor_price_max;
    suggestedLaborTarget = tAi.suggested_labor_target;
    inspectionFee = tAi.inspection_price_min;
    inspectionFeeMax = tAi.inspection_price_max;
  } else {
    const gravityMultipliers: Record<number, number> = { 1: 1.0, 2: 1.35, 3: 2.1, 4: 3.0 };
    const multiplier = gravityMultipliers[detectedLevel] || 1.0;
    inspectionFee = Math.round(bestMatch.baseInspection * (detectedLevel >= 3 ? 1.25 : 1.0));
    inspectionFeeMax = Math.round(inspectionFee * 1.5);
    laborPriceMin = Math.round(bestMatch.baseMinService * multiplier);
    laborPriceMax = Math.round(bestMatch.baseMaxService * multiplier);
    suggestedLaborTarget = Math.round((laborPriceMin + laborPriceMax) / 2);
  }

  // 4. Platform Fee Calculation
  const fixedPlatformFee = 79;
  const percentagePlatformFeeRate = 0.10;
  const percentagePlatformFeeMin = Math.round(laborPriceMin * 0.10);
  const percentagePlatformFeeMax = Math.round(laborPriceMax * 0.10);

  // 5. Final Calculated Estimates (Fixed Fee & 10% Fee)
  const estimateBeforeMaterialMin = Math.round(inspectionFee + laborPriceMin + travelCharge + fixedPlatformFee);
  const estimateBeforeMaterialMax = Math.round(inspectionFeeMax + laborPriceMax + travelCharge + fixedPlatformFee);

  const estimateIfCustomerProceedsMin = Math.round(laborPriceMin + travelCharge + fixedPlatformFee);
  const estimateIfCustomerProceedsMax = Math.round(laborPriceMax + travelCharge + fixedPlatformFee);

  const estimateBeforeMaterial10pctMin = Math.round(inspectionFee + laborPriceMin + travelCharge + percentagePlatformFeeMin);
  const estimateBeforeMaterial10pctMax = Math.round(inspectionFeeMax + laborPriceMax + travelCharge + percentagePlatformFeeMax);

  const estimateIfCustomerProceeds10pctMin = Math.round(laborPriceMin + travelCharge + percentagePlatformFeeMin);
  const estimateIfCustomerProceeds10pctMax = Math.round(laborPriceMax + travelCharge + percentagePlatformFeeMax);

  const confidenceScore = Math.min(99, Math.max(85, 82 + highestScore));
  const suggestedTechniciansCount = detectedLevel >= 3 ? 2 : 1;

  const gravityNames: Record<number, string> = {
    1: "Minor / Basic (Level 1)",
    2: "Moderate / Standard (Level 2)",
    3: "Severe / Structural (Level 3)",
    4: "Critical / Emergency (Level 4)"
  };

  const reasoning = `Trained AI Pricing Engine evaluated '${problemStatement.slice(0, 35)}...'. Matched Issue: ${issueId} (${subIssueTitle}). Distance: ${distanceKm} km (Travel fee ₹${travelCharge}). Labor ₹${laborPriceMin}-₹${laborPriceMax} + Platform fee ₹${fixedPlatformFee}. Final proceed estimate: ₹${estimateIfCustomerProceedsMin}-₹${estimateIfCustomerProceedsMax}.`;

  return {
    issueId,
    category: categoryName,
    subIssue: subIssueTitle,
    gravityLevel: detectedLevel,
    gravityName: gravityNames[detectedLevel],
    gravityMultiplier: 1.0,
    gravityFactors: isBookingRef 
      ? ['Verified Booking Reference / Order Lookup ID', ...gravityFactors]
      : gravityFactors,
    confidenceScore,

    // Labor & Inspection
    laborPriceMin,
    laborPriceMax,
    suggestedLaborTarget,
    inspectionFee,
    inspectionFeeMax,

    // Travel & Platform Fee Rules
    travelFee: travelCharge,
    travelRule: "0-5=0; >5-10=20; >10-15=70; >15-20=100; >20=100+6*(km-20)",
    fixedPlatformFee,
    percentagePlatformFeeRate,
    percentagePlatformFeeMin,
    percentagePlatformFeeMax,

    // Calculated Final Estimates
    estimateBeforeMaterialMin,
    estimateBeforeMaterialMax,
    estimateIfCustomerProceedsMin,
    estimateIfCustomerProceedsMax,

    estimateBeforeMaterial10pctMin,
    estimateBeforeMaterial10pctMax,
    estimateIfCustomerProceeds10pctMin,
    estimateIfCustomerProceeds10pctMax,

    // Legacy fields
    minServiceFee: laborPriceMin,
    maxServiceFee: laborPriceMax,
    platformFee: fixedPlatformFee,
    totalMin: estimateIfCustomerProceedsMin,
    totalMax: estimateIfCustomerProceedsMax,

    reasoning,
    suggestedTools: bestMatch.suggestedTools || ["Standard Toolkit"],
    suggestedTechniciansCount
  };
}
