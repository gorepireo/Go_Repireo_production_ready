/**
 * Checks if a worker's trade/discipline matches a booking request category or service name.
 */
export const isServiceMatching = (
  workerService?: string,
  jobService?: string,
  jobCategory?: string
): boolean => {
  if (!workerService || workerService === 'all' || workerService === 'general') return true;

  const w = workerService.toLowerCase().trim();
  const s = (jobService || '').toLowerCase().trim();
  const c = (jobCategory || '').toLowerCase().trim();

  if (!s && !c) return true;

  // Direct string equality or substring check
  if (
    (s && (s.includes(w) || w.includes(s))) ||
    (c && (c.includes(w) || w.includes(c)))
  ) {
    return true;
  }

  // Known discipline synonyms
  const synonymsMap: Record<string, string[]> = {
    plumbing: ['plumber', 'pipe', 'leak', 'plumbing', 'tap', 'water', 'drain'],
    plumber: ['plumbing', 'pipe', 'leak', 'plumber', 'tap', 'water', 'drain'],
    electrical: ['electrician', 'electric', 'wire', 'circuit', 'electrical', 'switch', 'light'],
    electrician: ['electrical', 'electric', 'wire', 'circuit', 'electrician', 'switch', 'light'],
    cleaning: ['cleaner', 'clean', 'sanitization', 'cleaning', 'wash', 'sweep'],
    cleaner: ['cleaning', 'clean', 'sanitization', 'cleaner', 'wash', 'sweep'],
    repair: ['appliance', 'fixture', 'fix', 'repair', 'mechanic', 'technician'],
    carpentry: ['carpenter', 'wood', 'furniture', 'carpentry', 'door', 'table'],
    carpenter: ['carpentry', 'wood', 'furniture', 'carpenter', 'door', 'table'],
    ac_repair: ['ac', 'air conditioner', 'ac_repair', 'cooling', 'hvac', 'chiller'],
    ac: ['ac_repair', 'air conditioner', 'cooling', 'hvac', 'chiller', 'ac']
  };

  const workerSynonyms = synonymsMap[w] || [w];
  const targetTerms = [s, c].filter(Boolean);

  return workerSynonyms.some((syn) =>
    targetTerms.some((term) => term.includes(syn) || syn.includes(term))
  );
};
