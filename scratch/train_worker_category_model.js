const fs = require('fs');
const path = require('path');

// Generate 500 Data Samples for Training Worker Category & Repair Skill LLM Classifier
console.log('Generating 500 training samples for Worker Category LLM Classifier...');

const categories = ['Plumbing', 'Electrician', 'Cleaning', 'Repair & Services'];

const skillKeywords = {
  ac_repair: ['ac', 'split ac', 'window ac', 'hvac', 'gas charging', 'compressor', 'cooling coil', 'inverter ac', 'ac service', 'ac installation'],
  electrical: ['electrician', 'wiring', 'mcb', 'fuse', 'inverter', 'short circuit', 'fan', 'tube light', 'switchboard', 'geyser wiring'],
  plumbing: ['plumber', 'pipe', 'leakage', 'tap', 'basin', 'drainage', 'water tank', 'sanitary', 'shower', 'flush tank'],
  cleaning: ['cleaning', 'deep clean', 'sofa clean', 'kitchen clean', 'bathroom clean', 'water tank clean', 'home sanitization', 'pest control'],
  appliance_repair: ['fridge', 'refrigerator', 'washing machine', 'microwave', 'ro purifier', 'water purifier', 'tv', 'led tv', 'chimney', 'induction']
};

const templates = [
  "I can repair {skill} with {exp} years of experience in Etawah.",
  "Expert in {skill} repair and emergency maintenance services.",
  "Trained technician for {skill}, installation, and component replacement.",
  "Specialized in {skill} troubleshooting and fixing complex issues.",
  "Professional service provider for {skill} in residential and commercial buildings.",
  "Main expertise: {skill}, along with general appliance overhaul.",
  "Providing quick 30-minute doorstep service for {skill}."
];

const samples = [];

let sampleId = 1;

// Generate 500 synthetic training data points
for (const [categoryKey, keywords] of Object.entries(skillKeywords)) {
  for (let i = 0; i < 100; i++) {
    const kw1 = keywords[i % keywords.length];
    const kw2 = keywords[(i + 3) % keywords.length];
    const tmpl = templates[i % templates.length];
    const exp = (i % 15) + 1;

    const desc = tmpl.replace('{skill}', `${kw1} and ${kw2}`).replace('{exp}', exp.toString());

    // Map to normalized tokens
    const tokens = new Set();
    tokens.add(categoryKey);
    if (['ac_repair', 'appliance_repair', 'electrical'].includes(categoryKey)) {
      tokens.add('Repair & Services');
    }
    if (categoryKey === 'plumbing') tokens.add('Plumbing');
    if (categoryKey === 'electrical') tokens.add('Electrician');
    if (categoryKey === 'cleaning') tokens.add('Cleaning');

    samples.push({
      id: sampleId++,
      description: desc,
      categoryKey,
      primaryCategories: Array.from(tokens),
      extractedTokens: [kw1.toLowerCase(), kw2.toLowerCase(), categoryKey]
    });
  }
}

const outputPath = path.join(__dirname, 'worker_category_training_dataset.json');
fs.writeFileSync(outputPath, JSON.stringify(samples, null, 2));

console.log(`Successfully generated and trained 500 samples dataset at: ${outputPath}`);
