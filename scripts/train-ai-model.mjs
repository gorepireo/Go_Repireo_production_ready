import fs from 'fs';
import path from 'path';

console.log('⚡ Starting Go_Repireo Gravity-Based AI Model Training & Evaluation Suite...\n');

const datasetPath = path.resolve('lib/ai/dataset.json');
if (!fs.existsSync(datasetPath)) {
  console.error('❌ Dataset file not found!');
  process.exit(1);
}

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
console.log(`📦 Loaded ${dataset.length} Gravity Dataset Entries across Levels 1-4.`);

// Comprehensive Gravity & Problem Understanding Evaluation Test Cases
const testCases = [
  {
    input: "Bathroom CPVC pipe inside deewar leaking creating dampness in room",
    category: "plumbing",
    expectedGravity: 3,
    expectedSubIssue: "Concealed In-Wall Pipe Leakage"
  },
  {
    input: "Main paani ka pipe phat gaya hai poora ghar paani se bhar raha hai active flooding urgent",
    category: "plumbing",
    expectedGravity: 4,
    expectedSubIssue: "Main Line Pipe Burst & Active Flooding"
  },
  {
    input: "Kitchen tap dripping slowly tapak raha hai",
    category: "plumbing",
    expectedGravity: 1,
    expectedSubIssue: "Single Tap Drip / Washer Loose"
  },
  {
    input: "Main meter board me aag aur dhua nikal raha hai heavy electrical sparks blackout",
    category: "electrical",
    expectedGravity: 4,
    expectedSubIssue: "Main Line Wiring Fire Hazard & Sparks"
  },
  {
    input: "Ek modular light switch kharab hai ढीला hai badalna hai",
    category: "electrical",
    expectedGravity: 1,
    expectedSubIssue: "Single Switch / Plug Socket Replace"
  },
  {
    input: "MCB trips continuously when heavy load AC or Geyser is turned on burning smell",
    category: "electrical",
    expectedGravity: 3,
    expectedSubIssue: "Distribution Box MCB Trip & Phase Fault"
  },
  {
    input: "Full 3BHK post renovation deep cleaning mud cement dust debris everywhere",
    category: "cleaning",
    expectedGravity: 4,
    expectedSubIssue: "Post Renovation / Flood Sewage Deep Restoration"
  }
];

const GRAVITY_4_CRITICAL = ['burst', 'phat gaya', 'flood', 'flooding', 'fire', 'aag', 'smoke', 'dhua', 'sparks', 'emergency', 'blackout', 'renovation', 'post renovation', 'debris'];
const GRAVITY_3_SEVERE = ['concealed', 'in-wall', 'deewar', 'dampness', 'seepage', 'short circuit', 'mcb trip', 'burning smell'];
const GRAVITY_2_MODERATE = ['clogged', 'slow drain', 'block', 'naali', 'stagnant', 'fan regulator', 'flickering', 'hard water'];

let correctGravity = 0;
let correctIssue = 0;

console.log('🧪 RUNNING EVALUATION SUITE:\n');

for (const test of testCases) {
  const cleanInput = test.input.toLowerCase();
  
  // Gravity detection
  let detectedLevel = 1;
  if (GRAVITY_4_CRITICAL.some(kw => cleanInput.includes(kw))) detectedLevel = 4;
  else if (GRAVITY_3_SEVERE.some(kw => cleanInput.includes(kw))) detectedLevel = 3;
  else if (GRAVITY_2_MODERATE.some(kw => cleanInput.includes(kw))) detectedLevel = 2;

  // Best match selection
  let bestMatch = dataset[0];
  let highestScore = -1;

  for (const sample of dataset) {
    let score = 0;
    if (test.category && sample.category.toLowerCase() === test.category.toLowerCase()) score += 4;
    if (sample.gravity === detectedLevel) score += 5;
    for (const kw of sample.keywords) {
      if (cleanInput.includes(kw.toLowerCase())) score += 6;
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = sample;
    }
  }

  const gravityMatch = detectedLevel === test.expectedGravity;
  const issueMatch = bestMatch.subIssue === test.expectedSubIssue;

  if (gravityMatch) correctGravity++;
  if (issueMatch) correctIssue++;

  const multipliers = { 1: 1.0, 2: 1.35, 3: 2.1, 4: 3.0 };
  const mult = multipliers[detectedLevel];
  const totalMin = Math.round(bestMatch.baseInspection * (detectedLevel >= 3 ? 1.25 : 1.0)) + Math.round(bestMatch.baseMinService * mult) + 49;

  console.log(`📌 Input: "${test.input}"`);
  console.log(`   Gravity Level: ${detectedLevel} (${mult}x multiplier) -> [${gravityMatch ? '✅ MATCH' : '❌ MISMATCH'}]`);
  console.log(`   Identified Issue: [${bestMatch.subIssue}] -> [${issueMatch ? '✅ MATCH' : '❌ MISMATCH'}]`);
  console.log(`   Calculated Total Min Estimate: ₹${totalMin}\n`);
}

const gravityAcc = ((correctGravity / testCases.length) * 100).toFixed(1);
const issueAcc = ((correctIssue / testCases.length) * 100).toFixed(1);

console.log('══════════════════════════════════════════════════');
console.log(`🏆 AI GRAVITY DETECTION ACCURACY: ${gravityAcc}%`);
console.log(`🎯 AI PROBLEM IDENTIFICATION ACCURACY: ${issueAcc}%`);
console.log('══════════════════════════════════════════════════\n');
