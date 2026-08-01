import dataset from './dataset.json';

export interface AIGravityResult {
  category: string;
  subIssue: string;
  gravityLevel: 1 | 2 | 3 | 4;
  gravityName: string;
  gravityMultiplier: number;
  gravityFactors: string[];
  confidenceScore: number;
  inspectionFee: number;
  minServiceFee: number;
  maxServiceFee: number;
  platformFee: number;
  travelFee: number;
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
  'renovation', 'post renovation', 'debris'
];

const GRAVITY_3_SEVERE = [
  'concealed', 'in-wall', 'inside wall', 'deewar', 'dampness', 'seepage',
  'short circuit', 'mcb trip', 'burning smell', 'heavy leak', 'gas leak',
  'renovation', 'degreasing', 'multiple lights', 'heavy load'
];

const GRAVITY_2_MODERATE = [
  'clogged', 'slow drain', 'block', 'naali', 'stagnant', 'fan regulator',
  'flickering', 'regulator', 'hard water', 'stains', 'vibration', 'noise',
  'overflow', 'float valve'
];

const GRAVITY_1_MINOR = [
  'small', 'slow drip', 'tapak', 'loose', 'single', 'washer', 'thread',
  'routine', 'mirror', 'filter', 'battery', 'knob'
];

export function trainAndEvaluateAIProblem(
  problemStatement: string,
  categoryInput: string = 'general',
  distanceKm: number = 0
): AIGravityResult {
  const cleanInput = problemStatement.toLowerCase().replace(/[^\w\s]/gi, ' ');
  const inputTokens = cleanInput.split(/\s+/).filter(Boolean);

  // 1. Detect Gravity Level & Factors
  let detectedLevel: 1 | 2 | 3 | 4 = 1;
  const gravityFactors: string[] = [];

  if (GRAVITY_4_CRITICAL.some(kw => cleanInput.includes(kw))) {
    detectedLevel = 4;
    gravityFactors.push('Emergency Signal: Active flooding, fire hazard, or main line failure detected');
  } else if (GRAVITY_3_SEVERE.some(kw => cleanInput.includes(kw))) {
    detectedLevel = 3;
    gravityFactors.push('Severe Issue: Structural in-wall leakage, distribution circuit fault, or heavy contamination');
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

  // 4. Calculate Distance Travel Charge
  let travelCharge = 0;
  if (distanceKm > 5 && distanceKm <= 10) {
    travelCharge = 20;
  } else if (distanceKm > 10 && distanceKm <= 15) {
    travelCharge = 70;
  } else if (distanceKm > 15 && distanceKm <= 20) {
    travelCharge = 100;
  } else if (distanceKm > 20) {
    travelCharge = Math.round(100 + ((distanceKm - 20) * 6));
  }

  // 5. Compute Fees using Base Prices x Gravity Multiplier
  const inspectionFee = Math.round(bestMatch.baseInspection * (detectedLevel >= 3 ? 1.25 : 1.0));
  const minServiceFee = Math.round(bestMatch.baseMinService * multiplier);
  const maxServiceFee = Math.round(bestMatch.baseMaxService * multiplier);
  const platformFee = 49;

  const totalMin = inspectionFee + minServiceFee + platformFee + travelCharge;
  const totalMax = inspectionFee + maxServiceFee + platformFee + travelCharge;

  const confidenceScore = Math.min(99, Math.max(78, 75 + highestMatchScore * 2));
  const suggestedTechniciansCount = detectedLevel >= 3 ? 2 : 1;

  const gravityNames: Record<number, string> = {
    1: "Minor / Basic (Level 1)",
    2: "Moderate / Standard (Level 2)",
    3: "Severe / Structural (Level 3)",
    4: "Critical / Emergency (Level 4)"
  };

  const reasoning = `AI Gravity Engine classified problem as ${gravityNames[detectedLevel]} (${multiplier}x complexity multiplier). Identified issue: '${bestMatch.subIssue}'. Base inspection ₹${inspectionFee} + Gravity-adjusted labor estimate ₹${minServiceFee}-₹${maxServiceFee}. Confidence: ${confidenceScore}%.`;

  return {
    category: bestMatch.category,
    subIssue: bestMatch.subIssue,
    gravityLevel: detectedLevel,
    gravityName: gravityNames[detectedLevel],
    gravityMultiplier: multiplier,
    gravityFactors,
    confidenceScore,
    inspectionFee,
    minServiceFee,
    maxServiceFee,
    platformFee,
    travelFee: travelCharge,
    totalMin,
    totalMax,
    reasoning,
    suggestedTools: bestMatch.suggestedTools || ["Standard Toolkit"],
    suggestedTechniciansCount
  };
}
