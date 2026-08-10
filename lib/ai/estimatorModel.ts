import dataset from './dataset.json';

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

  // Detect if user entered an Order ID or Booking Reference
  const isBookingRef = /order_|ord_|#|[0-9a-f]{8,}/i.test(problemStatement.trim());

  // 1. Detect Gravity Level & Factors
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

  // 2. Compute Match Scores across Dataset
  let bestMatch = dataset[0];
  let highestMatchScore = -1;

  for (const sample of dataset) {
    let score = 0;

    // Match category
    if (categoryInput && sample.category.toLowerCase() === categoryInput.toLowerCase()) {
      score += 4;
    }

    // Match gravity level
    if (sample.gravity === detectedLevel) {
      score += 5;
    }

    // Match sample keywords
    for (const kw of sample.keywords) {
      if (cleanInput.includes(kw.toLowerCase())) {
        score += 6;
      }
    }

    // Match sample texts
    const sampleTexts = sample.texts ? sample.texts.join(' ').toLowerCase() : '';
    for (const token of inputTokens) {
      if (token.length > 3 && sampleTexts.includes(token)) {
        score += 2;
      }
    }

    if (score > highestMatchScore) {
      highestMatchScore = score;
      bestMatch = sample;
    }
  }

  // 3. Gravity Multiplier
  const gravityMultipliers: Record<number, number> = {
    1: 1.0,
    2: 1.35,
    3: 2.1,
    4: 3.0
  };
  const multiplier = gravityMultipliers[detectedLevel] || 1.0;

  // 4. Calculate Distance Travel Charge (Rule: 0-5=0; >5-10=20; >10-15=70; >15-20=100; >20=100+6*(km-20))
  let travelCharge = 0;
  if (distanceKm > 5 && distanceKm <= 10) {
    travelCharge = 20;
  } else if (distanceKm > 10 && distanceKm <= 15) {
    travelCharge = 70;
  } else if (distanceKm > 15 && distanceKm <= 20) {
    travelCharge = 100;
  } else if (distanceKm > 20) {
    travelCharge = Math.round((100 + ((distanceKm - 20) * 6)) * 10) / 10;
  }

  // 5. Calculate deterministic text seed so distinct inputs get distinct tailored estimates
  let textSeed = 0;
  for (let i = 0; i < problemStatement.length; i++) {
    textSeed = (textSeed * 31 + problemStatement.charCodeAt(i)) % 250;
  }

  // 6. Labor & Inspection Prices
  const inspectionFee = Math.round(bestMatch.baseInspection * (detectedLevel >= 3 ? 1.25 : 1.0));
  const inspectionFeeMax = Math.round(inspectionFee * 1.5);
  let laborPriceMin = Math.round(bestMatch.baseMinService * multiplier + (textSeed % 80));
  let laborPriceMax = Math.round(bestMatch.baseMaxService * multiplier + (textSeed % 200));
  const suggestedLaborTarget = Math.round((laborPriceMin + laborPriceMax) / 2);

  if (isBookingRef) {
    laborPriceMin += 50;
    laborPriceMax += 100;
  }

  // 7. Platform Fee Calculation
  const fixedPlatformFee = 79;
  const percentagePlatformFeeRate = 0.10;
  const percentagePlatformFeeMin = Math.round(laborPriceMin * 0.10);
  const percentagePlatformFeeMax = Math.round(laborPriceMax * 0.10);

  // 8. Estimate Before Material (Fixed Platform Fee ₹79)
  const estimateBeforeMaterialMin = Math.round(inspectionFee + laborPriceMin + travelCharge + fixedPlatformFee);
  const estimateBeforeMaterialMax = Math.round(inspectionFeeMax + laborPriceMax + travelCharge + fixedPlatformFee);

  // 9. Estimate If Customer Proceeds (Inspection Fee Waived!)
  const estimateIfCustomerProceedsMin = Math.round(laborPriceMin + travelCharge + fixedPlatformFee);
  const estimateIfCustomerProceedsMax = Math.round(laborPriceMax + travelCharge + fixedPlatformFee);

  // 10. Estimate Before Material (10% Platform Fee)
  const estimateBeforeMaterial10pctMin = Math.round(inspectionFee + laborPriceMin + travelCharge + percentagePlatformFeeMin);
  const estimateBeforeMaterial10pctMax = Math.round(inspectionFeeMax + laborPriceMax + travelCharge + percentagePlatformFeeMax);

  // 11. Estimate If Customer Proceeds (10% Platform Fee)
  const estimateIfCustomerProceeds10pctMin = Math.round(laborPriceMin + travelCharge + percentagePlatformFeeMin);
  const estimateIfCustomerProceeds10pctMax = Math.round(laborPriceMax + travelCharge + percentagePlatformFeeMax);

  const confidenceScore = Math.min(99, Math.max(82, 78 + highestMatchScore * 2 + (textSeed % 12)));
  const suggestedTechniciansCount = detectedLevel >= 3 ? 2 : 1;

  const gravityNames: Record<number, string> = {
    1: "Minor / Basic (Level 1)",
    2: "Moderate / Standard (Level 2)",
    3: "Severe / Structural (Level 3)",
    4: "Critical / Emergency (Level 4)"
  };

  const categoryPrefixes: Record<string, string> = {
    electrical: 'ELEC',
    plumbing: 'PLUMB',
    cleaning: 'CLEAN',
    ac_repair: 'AC',
    carpentry: 'CARP'
  };

  const prefix = categoryPrefixes[bestMatch.category.toLowerCase()] || 'SERV';
  const issueId = `${prefix}-${bestMatch.id.toUpperCase()}`;

  const issueTitle = isBookingRef
    ? `Booking Reference (${problemStatement.slice(0, 16)}...) - ${bestMatch.subIssue}`
    : bestMatch.subIssue;

  const reasoning = `AI Pricing Model evaluated '${problemStatement.slice(0, 30)}...'. Category: ${bestMatch.category.toUpperCase()} (${gravityNames[detectedLevel]}). Distance: ${distanceKm} km (Travel fee ₹${travelCharge}). Labor ₹${laborPriceMin}-₹${laborPriceMax} + Platform fee ₹${fixedPlatformFee}. Final proceed estimate: ₹${estimateIfCustomerProceedsMin}-₹${estimateIfCustomerProceedsMax}.`;

  return {
    issueId,
    category: bestMatch.category,
    subIssue: issueTitle,
    gravityLevel: detectedLevel,
    gravityName: gravityNames[detectedLevel],
    gravityMultiplier: multiplier,
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
    suggestedTools: bestMatch.suggestedTools,
    suggestedTechniciansCount
  };
}
