const PHONE = '918679245568';

function waLink(message: string) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

const MESSAGES = {
  general: {
    en: 'Hello Go_repario, I want to book a service',
    hi: 'नमस्ते Go_repario, मुझे एक सर्विस बुक करनी है',
  },
  plumbing: {
    en: 'Hello Go_repario, I want to book a Plumbing service',
    hi: 'नमस्ते Go_repario, मुझे प्लंबिंग सर्विस बुक करनी है',
  },
  electrical: {
    en: 'Hello Go_repario, I want to book an Electrical service',
    hi: 'नमस्ते Go_repario, मुझे इलेक्ट्रिकल सर्विस बुक करनी है',
  },
};

export const WA = {
  phoneDisplay: '+91 86792 45568',
  telLink: `tel:+${PHONE}`,
  general: waLink(MESSAGES.general.en),
  plumbing: waLink(MESSAGES.plumbing.en),
  electrical: waLink(MESSAGES.electrical.en),
  getWaLink: (type: 'general' | 'plumbing' | 'electrical' = 'general', lang: 'en' | 'hi' = 'en') => {
    const msg = MESSAGES[type]?.[lang] || MESSAGES[type]?.en || MESSAGES.general.en;
    return waLink(msg);
  },
};
