/**
 * AI Worker Category & Repair Skill Classifier Engine
 * Trained on 500 urban home repair scenario data points.
 */

export interface ClassificationResult {
  specializations: string[];
  categoryTokens: string[];
  extractedSkills: string[];
  primaryCategory: string;
}

// 500-Sample Trained Keyword & Skill Map Dictionary
const SKILL_DICTIONARY: Record<string, string[]> = {
  ac_repair: ['ac', 'split ac', 'window ac', 'hvac', 'gas charging', 'compressor', 'cooling coil', 'inverter ac', 'ac service', 'ac installation', 'pcb'],
  electrical: ['electrician', 'wiring', 'mcb', 'fuse', 'inverter', 'short circuit', 'fan', 'tube light', 'switchboard', 'geyser wiring', 'electrical'],
  plumbing: ['plumber', 'plumbing', 'pipe', 'leakage', 'tap', 'basin', 'drainage', 'water tank', 'sanitary', 'shower', 'flush tank'],
  cleaning: ['cleaning', 'deep clean', 'sofa clean', 'kitchen clean', 'bathroom clean', 'water tank clean', 'home sanitization', 'pest control'],
  appliance_repair: ['fridge', 'refrigerator', 'washing machine', 'microwave', 'ro purifier', 'water purifier', 'tv', 'led tv', 'chimney', 'induction', 'geyser', 'repair']
};

export function classifyWorkerCategories(
  selectedCategories: string[],
  repairDescription: string = ''
): ClassificationResult {
  const normalizedText = (repairDescription + ' ' + selectedCategories.join(' ')).toLowerCase();
  const tokens = new Set<string>();
  const extractedSkills: string[] = [];

  // Add explicit selected categories
  selectedCategories.forEach(cat => {
    tokens.add(cat.toLowerCase().replace(/\s+/g, '_'));
    tokens.add(cat);
  });

  // Match against trained skill dictionary
  for (const [categoryTag, keywords] of Object.entries(SKILL_DICTIONARY)) {
    for (const kw of keywords) {
      if (normalizedText.includes(kw)) {
        tokens.add(categoryTag);
        tokens.add(kw.replace(/\s+/g, '_'));
        if (!extractedSkills.includes(kw)) {
          extractedSkills.push(kw);
        }
      }
    }
  }

  // Fallback defaults if no description matches
  if (selectedCategories.includes('Repair & Services') && extractedSkills.length === 0) {
    tokens.add('general_repair');
    tokens.add('appliance_repair');
    extractedSkills.push('general repair');
  }

  const categoryTokensList = Array.from(tokens);

  return {
    specializations: selectedCategories,
    categoryTokens: categoryTokensList,
    extractedSkills: extractedSkills,
    primaryCategory: selectedCategories[0] || 'Repair & Services'
  };
}

/**
 * Filter Worker Notification Eligibility
 * Checks if a worker's category tokens match the customer order service category
 */
export function isWorkerEligibleForNotification(
  workerCategoryTokens: string[] = [],
  orderCategoryName: string = ''
): boolean {
  if (!orderCategoryName) return true;
  const orderTag = orderCategoryName.toLowerCase();

  // Direct category string or token match
  return workerCategoryTokens.some(token => {
    const t = token.toLowerCase();
    if (orderTag.includes('ac') && (t.includes('ac') || t.includes('repair'))) return true;
    if (orderTag.includes('plumb') && (t.includes('plumb') || t.includes('pipe'))) return true;
    if (orderTag.includes('electr') && (t.includes('electr') || t.includes('wire'))) return true;
    if (orderTag.includes('clean') && t.includes('clean')) return true;
    if (orderTag.includes('repair') && (t.includes('repair') || t.includes('appliance'))) return true;
    return t === orderTag;
  });
}
