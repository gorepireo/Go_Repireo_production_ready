import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  ShieldCheck, 
  MapPin, 
  Star, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Headphones, 
  Wrench, 
  Droplet, 
  Sparkles, 
  Flame,
  ArrowRight
} from 'lucide-react';
import SchemaData from '@/components/SchemaData';
import Footer from '@/components/Footer';

interface ServicePageProps {
  params: Promise<{ service: string }>;
}

const serviceCatalog: Record<string, {
  name: string;
  nameEtawah: string;
  category: string;
  heroImg: string;
  startingPrice: number;
  avgRating: number;
  reviewsCount: number;
  description: string;
  descriptionLong: string;
  features: string[];
  keywords: string[];
  faqs: { question: string; answer: string }[];
}> = {
  'electrician-near-me': {
    name: 'Electrician Near Me',
    nameEtawah: 'Best Electrician in Etawah',
    category: 'electrical',
    heroImg: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=600',
    startingPrice: 199,
    avgRating: 4.9,
    reviewsCount: 3420,
    description: 'Book certified doorstep electricians in Etawah within 15 minutes. Switch repair, MCB, short circuit, fan, light installation & complete house wiring.',
    descriptionLong: 'Go_Repireo connects you with the best certified electricians in Etawah, Uttar Pradesh. Whether you need an emergency short-circuit fix, a new fan installation, MCB replacement, complete house wiring, or LED light fitting — our background-verified electricians arrive at your doorstep in 30–45 minutes. All work comes with a 30-day service warranty and transparent upfront pricing.',
    features: [
      'Background-verified certified electricians in Etawah',
      '100% transparent pricing — no hidden charges',
      '30-day post-service warranty on all work',
      'Same-day emergency doorstep service',
      'Available for switch, fan, MCB, wiring & inverter repair',
      'Serves all areas of Etawah within 15 km radius'
    ],
    keywords: [
      'electrician in etawah', 'best electrician etawah', 'electrician near me etawah',
      'emergency electrician etawah', 'electrician etawah uttar pradesh',
      'house wiring etawah', 'fan installation etawah', 'MCB repair etawah',
      'short circuit repair etawah', 'light installation etawah',
      'go repireo electrician', 'gorepireo electrician etawah',
      'certified electrician etawah', 'doorstep electrician etawah',
      'electrician booking etawah', '24 hour electrician etawah'
    ],
    faqs: [
      { question: 'How quickly can an electrician arrive in Etawah?', answer: 'Our verified electricians in Etawah are dispatched within 15 minutes and arrive in 30 to 45 minutes.' },
      { question: 'What is the electrician inspection fee in Etawah?', answer: 'Basic inspection starts at ₹99, waived if you proceed with the repair service.' },
      { question: 'Do you provide electricians in all areas of Etawah?', answer: 'Yes, Go_Repireo covers all localities in Etawah within a 15 km radius including Civil Lines, Sadar Bazar, Jarar Road, and surrounding areas.' },
      { question: 'Is the electrical work covered under warranty?', answer: 'Yes, all repair and installation work comes with a 30-day service guarantee.' }
    ]
  },
  'plumber-near-me': {
    name: 'Plumber Near Me',
    nameEtawah: 'Best Plumber in Etawah',
    category: 'plumbing',
    heroImg: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    startingPrice: 249,
    avgRating: 4.8,
    reviewsCount: 2980,
    description: 'Find top-rated plumbers in Etawah. Fast doorstep fixing for pipe leaks, tap repair, water tank cleaning, toilet fitting & drain blockage.',
    descriptionLong: 'Go_Repireo brings you Etawah\'s most reliable plumbers for all household plumbing needs. From emergency pipe burst repairs to tap fitting, water tank cleaning, toilet installation, and drain unblocking — our verified plumbers carry professional toolkits and genuine spare parts. Available same-day across all areas of Etawah.',
    features: [
      'Expert plumbers in Etawah with professional toolkits',
      'Emergency pipe burst & leak repair same day',
      'Toilet, wash basin & bathroom installation',
      'Water tank cleaning & motor pump repair',
      'Drain unblocking & kitchen plumbing',
      'Clean post-service cleanup guaranteed'
    ],
    keywords: [
      'plumber in etawah', 'best plumber etawah', 'plumber near me etawah',
      'emergency plumber etawah', 'pipe repair etawah', 'leak repair etawah',
      'tap repair etawah', 'water tank cleaning etawah', 'toilet repair etawah',
      'drain cleaning etawah', 'motor pump repair etawah', 'bathroom plumber etawah',
      'plumbing services etawah', 'go repireo plumber', 'gorepireo plumber etawah',
      'plumber booking etawah', 'plumber 24 hour etawah'
    ],
    faqs: [
      { question: 'Do plumbers bring their own spare parts to Etawah homes?', answer: 'Yes, technicians carry genuine standard spare parts. You are billed transparently for any materials used.' },
      { question: 'How do you handle emergency pipe bursts in Etawah?', answer: 'Our instant dispatch assigns the closest available plumber within 15 km of your Etawah location immediately.' },
      { question: 'What areas of Etawah do your plumbers cover?', answer: 'We cover all of Etawah city and surrounding areas within 15 km including Sadar, Jarar Road, Civil Lines, and more.' }
    ]
  },
  'ac-service-near-me': {
    name: 'AC Service & Repair Near Me',
    nameEtawah: 'Best AC Service & Repair in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
    startingPrice: 499,
    avgRating: 4.9,
    reviewsCount: 5120,
    description: 'Book expert AC service, jet cleaning, gas refilling & split/window AC installation in Etawah. Energy-efficient cooling guaranteed.',
    descriptionLong: 'Go_Repireo offers Etawah\'s best AC service and repair — covering all brands including Daikin, Voltas, LG, Samsung, Hitachi, Blue Star, Carrier, and Whirlpool. Our AC technicians provide deep jet servicing, gas charging (R22, R32, R410A), compressor diagnostics, PCB repair, and new AC installation.',
    features: [
      'High-pressure foam & jet cleaning for split & window ACs',
      'Genuine gas charging — R22, R32, R410A',
      'Compressor, PCB & cooling coil diagnostics',
      '30-day AC cooling performance guarantee',
      'All brands — Voltas, LG, Daikin, Samsung, Hitachi',
      'Available across Etawah city same day'
    ],
    keywords: [
      'ac repair etawah', 'ac service etawah', 'best ac repair etawah',
      'ac service near me etawah', 'ac gas refilling etawah', 'split ac repair etawah',
      'window ac repair etawah', 'ac installation etawah', 'ac cleaning etawah',
      'ac technician etawah', 'voltas ac repair etawah', 'lg ac repair etawah',
      'daikin ac service etawah', 'ac not cooling etawah', 'ac service cost etawah',
      'go repireo ac repair', 'gorepireo ac etawah', 'best ac technician etawah',
      'summer ac repair etawah', 'air conditioner repair etawah'
    ],
    faqs: [
      { question: 'What is included in AC jet servicing in Etawah?', answer: 'Deep foam jet wash of indoor cooling coils, outdoor condenser unit cleaning, filter cleaning, and cooling pressure check.' },
      { question: 'How much does AC gas refilling cost in Etawah?', answer: 'Gas refilling starts at ₹800 including leak testing. Final cost depends on the gas type (R22, R32, or R410A) and quantity needed.' },
      { question: 'Do you service all AC brands in Etawah?', answer: 'Yes — Voltas, LG, Daikin, Samsung, Hitachi, Blue Star, Carrier, Whirlpool, O General, and all other brands.' },
      { question: 'How quickly can an AC technician arrive in Etawah?', answer: 'Our AC technicians in Etawah are typically at your doorstep within 45 to 60 minutes of booking.' }
    ]
  },
  'ac-repair-near-me': {
    name: 'AC Repair Near Me',
    nameEtawah: 'AC Repair Service in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
    startingPrice: 399,
    avgRating: 4.9,
    reviewsCount: 4800,
    description: 'Emergency AC repair in Etawah. AC not cooling, strange noise, water leaking, or not turning on — get a verified AC mechanic at your doorstep fast.',
    descriptionLong: 'AC stopped working in Etawah? Go_Repireo dispatches verified AC repair technicians across Etawah to fix all AC problems including no-cooling, gas leakage, PCB failure, compressor noise, water dripping, and remote issues. Fast, reliable, and with a 30-day repair guarantee.',
    features: [
      'Emergency AC repair same day in Etawah',
      'AC not cooling, noise, water leak — all fixed',
      'PCB, compressor & capacitor replacement',
      'Genuine spare parts with 90-day part warranty',
      'All brands serviced — Voltas, LG, Hitachi, Daikin',
      '30-day service warranty on every repair'
    ],
    keywords: [
      'ac repair etawah', 'ac not cooling etawah', 'emergency ac repair etawah',
      'ac mechanic etawah', 'ac compressor repair etawah', 'ac pcb repair etawah',
      'ac water leaking etawah', 'ac noise repair etawah', 'split ac not working etawah',
      'window ac repair etawah', 'ac repair cost etawah', 'ac repair near me etawah'
    ],
    faqs: [
      { question: 'My AC is not cooling in Etawah — what should I do?', answer: 'Book an AC repair on Go_Repireo. Most AC not-cooling issues are caused by low gas, dirty filters, or faulty capacitors — all fixed in one visit.' },
      { question: 'How much does AC repair cost in Etawah?', answer: 'AC repair starts at ₹399 for basic diagnostics. Final cost depends on the problem — gas refill, PCB repair, or part replacement.' }
    ]
  },
  'washing-machine-repair-near-me': {
    name: 'Washing Machine Repair Near Me',
    nameEtawah: 'Washing Machine Repair in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600',
    startingPrice: 299,
    avgRating: 4.8,
    reviewsCount: 1840,
    description: 'Washing machine repair in Etawah for front load, top load & semi-automatic machines. Samsung, LG, Whirlpool, Bosch & IFB experts.',
    descriptionLong: 'Go_Repireo\'s washing machine repair technicians in Etawah service all brands including LG, Samsung, Whirlpool, Bosch, IFB, Godrej, Panasonic, and Haier. From drum issues, motor failure, drain pump problems, water inlet valve repair to PCB and control board replacement — all done at your doorstep in Etawah.',
    features: [
      'Front load, top load & semi-automatic machine repair',
      'Drum, motor, drain pump & PCB repair',
      'Genuine OEM spare parts with 90-day warranty',
      'Doorstep diagnostic within 60 minutes in Etawah',
      'All brands — LG, Samsung, Whirlpool, Bosch, IFB',
      'Transparent pricing — no repair, no charge'
    ],
    keywords: [
      'washing machine repair etawah', 'washing machine mechanic etawah',
      'lg washing machine repair etawah', 'samsung washing machine repair etawah',
      'whirlpool washing machine repair etawah', 'front load repair etawah',
      'top load repair etawah', 'semi automatic washing machine repair etawah',
      'washing machine not draining etawah', 'washing machine drum repair etawah',
      'washing machine repair near me etawah', 'go repireo washing machine'
    ],
    faqs: [
      { question: 'Which washing machine brands are repaired in Etawah?', answer: 'We repair all brands: LG, Samsung, Whirlpool, Bosch, IFB, Godrej, Panasonic, Haier, and more.' },
      { question: 'How much does washing machine repair cost in Etawah?', answer: 'Repair starts at ₹299. Most common repairs (pump, belt, door latch, PCB) cost between ₹499 and ₹1,499 including parts.' }
    ]
  },
  'refrigerator-repair-near-me': {
    name: 'Refrigerator Repair Near Me',
    nameEtawah: 'Fridge & Refrigerator Repair in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&q=80&w=600',
    startingPrice: 349,
    avgRating: 4.8,
    reviewsCount: 1620,
    description: 'Fridge & refrigerator repair in Etawah. Not cooling, ice not forming, water dripping, compressor noise — same-day doorstep repair.',
    descriptionLong: 'Go_Repireo offers expert refrigerator and fridge repair in Etawah for all brands including LG, Samsung, Whirlpool, Godrej, Haier, Panasonic, and Voltas. Our technicians fix all problems including no-cooling, gas leakage, compressor failure, thermostat issues, ice maker problems, and freezer not working.',
    features: [
      'All fridge brands repaired in Etawah',
      'Gas refilling (R600a, R134a) with leak test',
      'Compressor, thermostat & PCB replacement',
      'Single door, double door & side-by-side models',
      'Genuine spare parts with 90-day warranty',
      'Same-day doorstep service in Etawah'
    ],
    keywords: [
      'refrigerator repair etawah', 'fridge repair etawah', 'fridge not cooling etawah',
      'refrigerator mechanic etawah', 'lg fridge repair etawah', 'samsung fridge repair etawah',
      'whirlpool fridge repair etawah', 'godrej fridge repair etawah',
      'fridge gas refilling etawah', 'compressor repair etawah', 'double door fridge repair etawah',
      'refrigerator repair near me etawah', 'go repireo fridge repair'
    ],
    faqs: [
      { question: 'My fridge is not cooling in Etawah — how fast can you repair it?', answer: 'A technician will reach your Etawah address within 45 to 60 minutes. Most not-cooling issues are fixed in one visit.' },
      { question: 'How much does fridge repair cost in Etawah?', answer: 'Fridge repair starts at ₹349. Gas refill is ₹700–₹900 extra. PCB or compressor replacement is quoted separately after diagnosis.' }
    ]
  },
  'bathroom-cleaning-near-me': {
    name: 'Bathroom Cleaning Services Near Me',
    nameEtawah: 'Bathroom Deep Cleaning in Etawah',
    category: 'cleaning',
    heroImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    startingPrice: 399,
    avgRating: 4.9,
    reviewsCount: 4210,
    description: 'Deep bathroom cleaning in Etawah. Hard water stain removal, tile descaling, sanitizer spray, mirror polishing & full toilet scrubbing.',
    descriptionLong: 'Go_Repireo\'s professional bathroom cleaning team in Etawah uses hospital-grade eco-friendly chemicals to deep-clean your bathroom — removing hard water stains, limescale, tiles joint scrubbing, chrome fitting polishing, mirror cleaning, and complete toilet sanitization.',
    features: [
      'Hospital-grade eco-friendly disinfectant chemicals',
      'Tile joint scrubbing & hard water stain removal',
      'Tap & chrome fitting polishing',
      'Odour removal & sanitization guarantee',
      '1, 2, or 3-bathroom packages available',
      'Professional cleaning team in Etawah'
    ],
    keywords: [
      'bathroom cleaning etawah', 'bathroom deep cleaning etawah', 'bathroom cleaning service etawah',
      'bathroom cleaning near me etawah', 'tile cleaning etawah', 'toilet cleaning etawah',
      'bathroom sanitization etawah', 'hard water stain removal etawah',
      'professional bathroom cleaning etawah', 'go repireo cleaning etawah'
    ],
    faqs: [
      { question: 'How long does a deep bathroom cleaning take in Etawah?', answer: 'A single bathroom deep cleaning takes approximately 60 to 90 minutes.' },
      { question: 'What chemicals are used for bathroom cleaning in Etawah?', answer: 'We use eco-friendly, hospital-grade anti-bacterial and anti-fungal chemicals safe for all surfaces.' }
    ]
  },
  'sofa-cleaning-near-me': {
    name: 'Sofa Cleaning Services Near Me',
    nameEtawah: 'Sofa & Upholstery Cleaning in Etawah',
    category: 'cleaning',
    heroImg: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
    startingPrice: 499,
    avgRating: 4.8,
    reviewsCount: 2100,
    description: 'Professional sofa & upholstery cleaning in Etawah. Deep stain removal, foam extraction, deodorization for fabric, leather & rexine sofas.',
    descriptionLong: 'Go_Repireo\'s sofa cleaning service in Etawah uses industrial foam extraction and steam cleaning to remove stains, pet hair, dust, allergens, and odours from fabric, leather, and rexine sofas. Service includes pre-stain treatment, deep foam wash, and post-clean deodorizing spray.',
    features: [
      'Foam extraction & steam cleaning for all sofa types',
      'Pre-treatment for stubborn stains',
      'Fabric, leather & rexine sofas cleaned',
      'Deodorization & anti-bacterial spray',
      'Dries within 4 hours',
      'Doorstep service in Etawah'
    ],
    keywords: [
      'sofa cleaning etawah', 'sofa cleaning near me etawah', 'sofa washing etawah',
      'sofa dry cleaning etawah', 'upholstery cleaning etawah', 'sofa stain removal etawah',
      'leather sofa cleaning etawah', 'fabric sofa cleaning etawah', 'go repireo sofa cleaning'
    ],
    faqs: [
      { question: 'How long does sofa cleaning take in Etawah?', answer: 'Sofa cleaning takes 2 to 3 hours depending on size. Drying takes 4 to 6 hours.' },
      { question: 'Do you clean leather sofas in Etawah?', answer: 'Yes, we clean fabric, leather, rexine, and velvet sofas using material-specific cleaning solutions.' }
    ]
  },
  'carpenter-near-me': {
    name: 'Carpenter Near Me',
    nameEtawah: 'Best Carpenter in Etawah',
    category: 'carpentry',
    heroImg: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600',
    startingPrice: 299,
    avgRating: 4.8,
    reviewsCount: 1950,
    description: 'Find skilled carpenters in Etawah for furniture repair, assembly, door fixing, window repair, and modular furniture installation.',
    descriptionLong: 'Go_Repireo\'s verified carpenters in Etawah handle furniture repair, assembly, new furniture making, door hinge repair, window fixing, bed repair, wardrobe installation, and modular kitchen work. Fast, skilled, and with transparent per-hour or per-job pricing.',
    features: [
      'Skilled verified carpenters in Etawah',
      'Furniture repair, assembly & new furniture work',
      'Door, window, wardrobe & bed repair',
      'Modular kitchen & false ceiling installation',
      'Transparent pricing — hourly or per job',
      'Same-day service available in Etawah'
    ],
    keywords: [
      'carpenter in etawah', 'best carpenter etawah', 'carpenter near me etawah',
      'furniture repair etawah', 'door repair etawah', 'window repair etawah',
      'modular furniture etawah', 'wardrobe repair etawah', 'bed repair etawah',
      'carpenter booking etawah', 'go repireo carpenter', 'gorepireo carpenter etawah'
    ],
    faqs: [
      { question: 'What carpentry services are available in Etawah?', answer: 'Furniture repair, assembly, door hinge fixing, window repair, wardrobe installation, bed frame repair, and modular furniture work.' },
      { question: 'How much does a carpenter charge in Etawah?', answer: 'Carpenter charges start at ₹299 per visit. Hourly rates are ₹200–₹350 per hour. Complex jobs are quoted separately.' }
    ]
  },
  'painter-near-me': {
    name: 'Painter Near Me',
    nameEtawah: 'Best House Painter in Etawah',
    category: 'painting',
    heroImg: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600',
    startingPrice: 999,
    avgRating: 4.8,
    reviewsCount: 870,
    description: 'Professional house painters in Etawah for interior & exterior wall painting, POP work, waterproofing & texture painting.',
    descriptionLong: 'Go_Repireo connects you with experienced house painters in Etawah for full interior and exterior painting, texture painting, POP work, false ceiling, waterproofing, and whitewashing. All paint brands including Asian Paints, Berger, Nippon, and Dulux available.',
    features: [
      'Interior & exterior painting in Etawah',
      'Asian Paints, Berger, Nippon, Dulux available',
      'Texture, POP & false ceiling work',
      'Waterproofing & weather-resistant coatings',
      'Free site visit and transparent quote',
      'Experienced team with 5+ years average experience'
    ],
    keywords: [
      'painter in etawah', 'house painter etawah', 'wall painting etawah',
      'interior painting etawah', 'exterior painting etawah', 'painter near me etawah',
      'painting service etawah', 'pop work etawah', 'waterproofing etawah',
      'painting cost etawah', 'go repireo painter', 'gorepireo painter etawah'
    ],
    faqs: [
      { question: 'How much does house painting cost in Etawah?', answer: 'House painting starts at ₹12 per sq ft for basic emulsion paint. Premium textures and weather coats cost more. Free site visit for exact quote.' },
      { question: 'Which paint brands do your painters use in Etawah?', answer: 'We use Asian Paints, Berger, Nippon, Dulux, and Jotun as per customer preference.' }
    ]
  },
  'ro-repair-near-me': {
    name: 'RO Water Purifier Repair Near Me',
    nameEtawah: 'RO Repair & Service in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600',
    startingPrice: 299,
    avgRating: 4.8,
    reviewsCount: 1240,
    description: 'RO water purifier repair and servicing in Etawah. Filter change, membrane replacement, UV lamp, TDS controller — all brands.',
    descriptionLong: 'Go_Repireo\'s RO technicians in Etawah service and repair all water purifier brands including Kent, Aquaguard, Pureit, Livpure, HUL, and Eureka Forbes. Service includes filter replacement, RO membrane change, UV lamp replacement, motor repair, and AMC packages.',
    features: [
      'All RO brands — Kent, Aquaguard, Pureit, Livpure',
      'Filter, membrane & UV lamp replacement',
      'TDS controller & motor repair',
      'AMC packages available for Etawah homes',
      'Same-day service in Etawah',
      'Genuine filter cartridges used'
    ],
    keywords: [
      'ro repair etawah', 'ro service etawah', 'water purifier repair etawah',
      'kent ro repair etawah', 'aquaguard service etawah', 'pureit repair etawah',
      'ro membrane replacement etawah', 'ro filter change etawah',
      'ro technician etawah', 'ro amc etawah', 'go repireo ro service'
    ],
    faqs: [
      { question: 'How often should I service my RO in Etawah?', answer: 'RO systems in Etawah should be serviced every 6 months due to high TDS levels in local water.' },
      { question: 'How much does RO service cost in Etawah?', answer: 'Basic RO servicing starts at ₹299. Filter change is ₹400–₹800, and membrane replacement is ₹700–₹1,200.' }
    ]
  },
  'geyser-repair-near-me': {
    name: 'Geyser Repair Near Me',
    nameEtawah: 'Geyser & Water Heater Repair in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    startingPrice: 249,
    avgRating: 4.8,
    reviewsCount: 980,
    description: 'Geyser & water heater repair in Etawah. Not heating, leaking, thermostat failure, element replacement — all geyser brands repaired.',
    descriptionLong: 'Go_Repireo offers fast geyser and water heater repair in Etawah for all brands including Havells, Bajaj, AO Smith, Racold, V-Guard, Crompton, and Jaquar. Common repairs include element replacement, thermostat fixing, pressure valve issues, and water leakage from the tank.',
    features: [
      'All geyser brands repaired in Etawah',
      'Heating element & thermostat replacement',
      'Water leakage & pressure valve repair',
      'Instant geyser & storage geyser both',
      'Same-day service in Etawah',
      '30-day service warranty'
    ],
    keywords: [
      'geyser repair etawah', 'geyser service etawah', 'water heater repair etawah',
      'geyser not heating etawah', 'geyser leaking etawah', 'geyser mechanic etawah',
      'havells geyser repair etawah', 'bajaj geyser repair etawah', 'ao smith geyser etawah',
      'go repireo geyser repair', 'geyser repair near me etawah'
    ],
    faqs: [
      { question: 'My geyser is not heating water in Etawah — how quickly can it be fixed?', answer: 'Our technician will arrive within 45 to 60 minutes. Most geyser heating issues (element or thermostat) are fixed in the first visit.' },
      { question: 'How much does geyser repair cost in Etawah?', answer: 'Geyser repair starts at ₹249. Element replacement is ₹450–₹700. Full geyser servicing is ₹400.' }
    ]
  },
  'cctv-installation-near-me': {
    name: 'CCTV Installation Near Me',
    nameEtawah: 'CCTV Camera Installation in Etawah',
    category: 'installation',
    heroImg: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600',
    startingPrice: 999,
    avgRating: 4.9,
    reviewsCount: 540,
    description: 'Professional CCTV camera installation in Etawah for homes, shops & offices. HD, IP & wireless cameras with mobile app remote viewing.',
    descriptionLong: 'Go_Repireo provides expert CCTV camera installation in Etawah for residential and commercial properties. We install HD analog, IP (network), and wireless cameras with DVR/NVR setup, mobile remote viewing, and night vision. Brands include Hikvision, Dahua, CP Plus, Axis, and Godrej.',
    features: [
      'HD, IP & wireless CCTV installation in Etawah',
      'DVR & NVR setup with mobile app remote viewing',
      'Night vision & 4K cameras available',
      'Hikvision, Dahua, CP Plus & more brands',
      'Homes, shops, offices & warehouses',
      'Cabling, power & network setup included'
    ],
    keywords: [
      'cctv installation etawah', 'cctv camera etawah', 'security camera etawah',
      'cctv fitting etawah', 'cctv installer etawah', 'ip camera etawah',
      'hikvision installation etawah', 'cp plus etawah', 'dahua camera etawah',
      'cctv for home etawah', 'cctv for shop etawah', 'cctv cost etawah',
      'go repireo cctv etawah', 'cctv installation near me etawah'
    ],
    faqs: [
      { question: 'How much does CCTV installation cost in Etawah?', answer: 'CCTV installation starts at ₹999 per camera (labour only). Camera prices vary from ₹800 to ₹5,000 depending on specs.' },
      { question: 'Can I view my Etawah CCTV cameras on my mobile?', answer: 'Yes, all our installed systems come with mobile app setup for live viewing from anywhere via Wi-Fi or internet.' }
    ]
  },
  'pest-control-near-me': {
    name: 'Pest Control Near Me',
    nameEtawah: 'Pest Control Service in Etawah',
    category: 'pest-control',
    heroImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600',
    startingPrice: 699,
    avgRating: 4.8,
    reviewsCount: 720,
    description: 'Professional pest control in Etawah for cockroaches, termites, mosquitoes, bed bugs, rats & ants. Safe chemicals for home & office.',
    descriptionLong: 'Go_Repireo\'s certified pest control technicians in Etawah provide complete pest management for homes, offices, restaurants, and warehouses. Services include cockroach treatment, termite control, mosquito fogging, bed bug treatment, rodent control, and ant management using WHO-approved safe chemicals.',
    features: [
      'Cockroach, termite & mosquito treatment',
      'Bed bug & rodent control in Etawah',
      'WHO-approved, child & pet-safe chemicals',
      'Pre & post-construction termite treatment',
      'Annual Maintenance Contracts (AMC) available',
      'Certified pest control operators'
    ],
    keywords: [
      'pest control etawah', 'pest control near me etawah', 'cockroach treatment etawah',
      'termite control etawah', 'mosquito treatment etawah', 'bed bug treatment etawah',
      'rodent control etawah', 'rat control etawah', 'ant control etawah',
      'pest control cost etawah', 'go repireo pest control', 'pest control service etawah'
    ],
    faqs: [
      { question: 'Is pest control safe for children and pets in Etawah?', answer: 'Yes, we use WHO-approved chemicals that are safe for children and pets after a 2-hour drying period.' },
      { question: 'How much does pest control cost in Etawah?', answer: 'Cockroach treatment starts at ₹699 for a 1BHK. Termite treatment and mosquito fogging are priced based on area size.' }
    ]
  },
  'deep-cleaning-near-me': {
    name: 'Deep Cleaning Services Near Me',
    nameEtawah: 'Home Deep Cleaning in Etawah',
    category: 'cleaning',
    heroImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    startingPrice: 1499,
    avgRating: 4.9,
    reviewsCount: 1680,
    description: 'Full home deep cleaning in Etawah. Kitchen, bathroom, living room, sofa, fans, AC, tiles — complete 1BHK, 2BHK, 3BHK packages.',
    descriptionLong: 'Go_Repireo offers complete home deep cleaning services in Etawah with professional teams covering every corner of your house. Services include kitchen degreasing, bathroom deep scrub, sofa vacuuming, fan and AC grille cleaning, tile & floor mopping, switchboard cleaning, and balcony washing.',
    features: [
      '1BHK, 2BHK & 3BHK packages available',
      'Kitchen, bathroom, living room & bedroom cleaning',
      'Sofa, fan, AC filter & tile deep cleaning',
      'Eco-friendly professional-grade chemicals',
      'Team of 2–4 trained cleaners',
      'Move-in & move-out cleaning available'
    ],
    keywords: [
      'deep cleaning etawah', 'home cleaning etawah', 'house cleaning etawah',
      'deep cleaning service etawah', '2bhk cleaning etawah', '3bhk cleaning etawah',
      'move in cleaning etawah', 'move out cleaning etawah', 'professional cleaning etawah',
      'home cleaning service etawah', 'go repireo cleaning', 'deep cleaning near me etawah'
    ],
    faqs: [
      { question: 'What is included in home deep cleaning in Etawah?', answer: 'Kitchen degreasing, bathroom scrubbing, sofa vacuuming, fan & AC filter cleaning, floor mopping, and window sill cleaning.' },
      { question: 'How much does home deep cleaning cost in Etawah?', answer: '1BHK starts at ₹1,499, 2BHK at ₹1,999, and 3BHK at ₹2,499. Prices include all chemicals and equipment.' }
    ]
  },
  'microwave-repair-near-me': {
    name: 'Microwave Repair Near Me',
    nameEtawah: 'Microwave Oven Repair in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600',
    startingPrice: 299,
    avgRating: 4.7,
    reviewsCount: 760,
    description: 'Microwave oven repair in Etawah. Not heating, rotating plate issues, sparking, door not closing — all brands repaired at your doorstep.',
    descriptionLong: 'Go_Repireo provides doorstep microwave repair in Etawah for all brands including LG, Samsung, IFB, Whirlpool, Bajaj, and Morphy Richards. Common problems fixed include microwave not heating, turntable not rotating, sparking inside, door latch broken, and control panel issues.',
    features: [
      'All microwave brands repaired in Etawah',
      'Not heating, sparking & door repair',
      'Magnetron, capacitor & fuse replacement',
      'IFB, LG, Samsung, Whirlpool, Bajaj fixed',
      'Doorstep repair in Etawah',
      '30-day service warranty'
    ],
    keywords: [
      'microwave repair etawah', 'microwave oven repair etawah', 'microwave not heating etawah',
      'microwave sparking etawah', 'lg microwave repair etawah', 'samsung microwave etawah',
      'ifb microwave repair etawah', 'microwave repair near me etawah', 'go repireo microwave'
    ],
    faqs: [
      { question: 'How much does microwave repair cost in Etawah?', answer: 'Microwave repair starts at ₹299. Magnetron replacement costs ₹800–₹1,500 depending on brand and model.' }
    ]
  },
  'tv-repair-near-me': {
    name: 'TV Repair Near Me',
    nameEtawah: 'LED TV Repair in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=600',
    startingPrice: 349,
    avgRating: 4.8,
    reviewsCount: 890,
    description: 'LED & Smart TV repair in Etawah. No display, no sound, panel issues, HDMI port, smart TV apps — all brands repaired at your doorstep.',
    descriptionLong: 'Go_Repireo\'s TV repair technicians in Etawah fix all LED, LCD, Smart TV, and OLED TVs from brands like Samsung, LG, Sony, Mi, Vu, and TCL. Common repairs include no display, backlight failure, no sound, HDMI port issue, smart TV boot loop, and panel cracking assessment.',
    features: [
      'LED, LCD, Smart TV & OLED repair in Etawah',
      'No display, no sound & backlight repair',
      'Samsung, LG, Sony, Mi, Vu, TCL repaired',
      'Smart TV app & software issues fixed',
      'Panel, motherboard & power board replacement',
      'Doorstep repair in Etawah'
    ],
    keywords: [
      'tv repair etawah', 'led tv repair etawah', 'smart tv repair etawah',
      'samsung tv repair etawah', 'lg tv repair etawah', 'sony tv repair etawah',
      'mi tv repair etawah', 'tv no display etawah', 'tv no sound etawah',
      'tv repair near me etawah', 'go repireo tv repair'
    ],
    faqs: [
      { question: 'How much does TV repair cost in Etawah?', answer: 'TV repair starts at ₹349 for basic diagnostics. Panel replacement and motherboard repair cost is quoted after checking the TV.' },
      { question: 'Do you repair Smart TVs in Etawah?', answer: 'Yes, we repair all smart TV issues including software problems, app crashes, boot loops, and connectivity issues.' }
    ]
  },
  'chimney-repair-near-me': {
    name: 'Chimney Repair & Cleaning Near Me',
    nameEtawah: 'Kitchen Chimney Repair in Etawah',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=600',
    startingPrice: 399,
    avgRating: 4.7,
    reviewsCount: 420,
    description: 'Kitchen chimney repair and deep cleaning in Etawah. Suction motor, filter, LED lights, auto-clean function — all brands serviced.',
    descriptionLong: 'Go_Repireo provides kitchen chimney repair and deep cleaning in Etawah for all brands including Faber, Elica, Hindware, Glen, Bosch, and IFB. Services include motor repair, filter deep cleaning, grease removal, LED light replacement, and auto-clean mechanism repair.',
    features: [
      'Chimney deep cleaning & grease removal in Etawah',
      'Motor, filter & LED light repair',
      'Auto-clean function repair',
      'Faber, Elica, Hindware, Glen & more brands',
      'Baffle & mesh filter cleaning',
      '30-day service warranty'
    ],
    keywords: [
      'chimney repair etawah', 'chimney cleaning etawah', 'kitchen chimney etawah',
      'chimney service etawah', 'faber chimney repair etawah', 'elica chimney repair etawah',
      'chimney deep cleaning etawah', 'chimney near me etawah', 'go repireo chimney'
    ],
    faqs: [
      { question: 'How often should kitchen chimneys be cleaned in Etawah?', answer: 'Chimneys used daily should be deep cleaned every 3 to 6 months to maintain suction efficiency.' },
      { question: 'How much does chimney cleaning cost in Etawah?', answer: 'Deep chimney cleaning starts at ₹399. Motor and auto-clean repair are quoted separately after inspection.' }
    ]
  }
};

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { service } = await params;
  const item = serviceCatalog[service];

  if (!item) {
    const name = service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      title: `${name} in Etawah | Book on Go_Repireo`,
      description: `Book trusted ${name} in Etawah with Go_Repireo. Verified professionals, transparent pricing, same-day service.`,
    };
  }

  return {
    title: `${item.nameEtawah} | Book Online | Go_Repireo`,
    description: item.descriptionLong.slice(0, 165),
    keywords: item.keywords,
    alternates: {
      canonical: `https://gorepireo.in/near-me/${service}`
    },
    openGraph: {
      title: `${item.nameEtawah} | Go_Repireo`,
      description: item.description,
      url: `https://gorepireo.in/near-me/${service}`,
      siteName: 'Go_Repireo',
      type: 'website'
    }
  };
}

export default async function NearMeServicePage({ params }: ServicePageProps) {
  const { service } = await params;
  const item = serviceCatalog[service] || {
    name: service.replace(/-/g, ' ').toUpperCase(),
    category: 'service',
    heroImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    startingPrice: 199,
    avgRating: 4.8,
    reviewsCount: 1500,
    description: `Book doorstep ${service.replace(/-/g, ' ')} with verified experts near you. Transparent pricing, fast service, and 30-day warranty.`,
    features: [
      'Background-verified professional technicians',
      'Transparent pricing & zero hidden charges',
      '30-day post-service guarantee',
      'Fast doorstep response within 15km'
    ],
    faqs: [
      { question: `How do I book ${service.replace(/-/g, ' ')}?`, answer: 'Select your service category, describe your issue, select your address, and choose cash or online payment.' }
    ]
  };

  const pageUrl = `https://gorepireo.in/near-me/${service}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      <SchemaData 
        title={item.name}
        description={item.description}
        url={pageUrl}
        category={item.category}
        minPrice={item.startingPrice}
        maxPrice={item.startingPrice * 5}
        ratingValue={item.avgRating}
        reviewCount={item.reviewsCount}
        faqs={item.faqs}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#e8f0fe] to-[#F8FAFC] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-100 shadow-sm">
            <ShieldCheck size={14} className="text-[#007AFF]" />
            <span className="text-[10px] font-extrabold text-[#007AFF] uppercase tracking-wider">Verified Local Technicians</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {item.name}
          </h1>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 flex-wrap">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} className="fill-current" />
              <span className="font-extrabold text-slate-900">{item.avgRating}</span>
              <span className="text-slate-400">({item.reviewsCount} reviews)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-[#007AFF]">
              <MapPin size={14} />
              <span>Available in your 15km Radius</span>
            </div>
            <span>•</span>
            <div className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Starts @ ₹{item.startingPrice}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            {item.description}
          </p>

          <div className="pt-2 flex gap-3 flex-wrap">
            <Link 
              href="/services/service" 
              className="h-12 px-6 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Book Service Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content & Features */}
      <section className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Features Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Why Choose Go_Repireo for {item.name}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {item.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/60">
                <CheckCircle2 size={16} className="text-[#007AFF] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Frequently Asked Questions</h2>
          <div className="space-y-3 divide-y divide-slate-100">
            {item.faqs.map((faq, idx) => (
              <div key={idx} className="pt-3 first:pt-0 space-y-1">
                <h3 className="text-xs font-bold text-slate-900">{faq.question}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}
