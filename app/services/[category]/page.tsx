import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  ShieldCheck, 
  MapPin, 
  Star, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  Clock,
  ThumbsUp,
  CreditCard,
  PhoneCall,
  Wrench,
  Check
} from 'lucide-react';
import SchemaData from '@/components/SchemaData';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

interface CategoryDetail {
  name: string;
  shortDesc: string;
  minPrice: number;
  maxPrice: number;
  services: { name: string; price: string; desc: string }[];
  problemsSolved: string[];
  nearMeSlug?: string;
  faqs: { question: string; answer: string }[];
}

const CATEGORY_DATA: Record<string, CategoryDetail> = {
  'plumbing': {
    name: 'Plumbing',
    shortDesc: 'Certified plumbers for tap leaks, pipe installations, blockages, and water tank maintenance.',
    minPrice: 149,
    maxPrice: 1999,
    nearMeSlug: 'plumber-near-me',
    services: [
      { name: 'Tap & Mixer Repair/Replacement', price: '₹149', desc: 'Fix dripping faucets, faulty cartridges, or install brand new water mixers.' },
      { name: 'Pipe Leakage & Burst Repair', price: '₹249', desc: 'Diagnostic inspection and precision sealing of concealed and exposed water pipes.' },
      { name: 'Drainage & Sewer Blockage Clearing', price: '₹349', desc: 'High-pressure unclogging of sinks, toilets, gully traps, and bathroom drains.' },
      { name: 'Water Tank Cleaning & Sanitization', price: '₹699', desc: '4-stage mechanized deep scrubbing, sludge removal, and antibacterial UV treatment.' },
      { name: 'Sanitary Ware & Toilet Installation', price: '₹499', desc: 'Western/Indian commode fitting, flush valve replacement, and seat adjustments.' }
    ],
    problemsSolved: [
      'Continuous tap dripping wasting domestic water',
      'Low water pressure across bathroom and kitchen taps',
      'Concealed pipe seepage causing dampness on walls',
      'Foul odor and slow water draining from sinks',
      'Broken or malfunctioning toilet flush tanks'
    ],
    faqs: [
      { question: 'How quickly can a plumber arrive at my house?', answer: 'In our operational zones, a verified plumber is dispatched within 15 minutes and typically arrives in 30 to 45 minutes.' },
      { question: 'Do I need to arrange replacement plumbing parts myself?', answer: 'Technicians carry standard fittings, teflon tape, and washers. If special fixtures are required, you can purchase them yourself or have the pro procure genuine parts with bills provided.' },
      { question: 'Is there any warranty on plumbing repairs?', answer: 'Yes, all repair work carried out by Go_Repireo technicians is backed by our standard 30-day service warranty.' }
    ]
  },
  'electrical': {
    name: 'Electrical',
    shortDesc: 'Licensed electricians for switchboard repairs, wiring diagnostics, MCB trips, and appliance hookups.',
    minPrice: 129,
    maxPrice: 2499,
    nearMeSlug: 'electrician-near-me',
    services: [
      { name: 'Switchboard Repair & Replacement', price: '₹129', desc: 'Fix burned switches, loose wiring, and install modern modular faceplates.' },
      { name: 'Ceiling Fan Installation & Repair', price: '₹199', desc: 'Mount new fans, replace regulators, balance blades, and repair humming motors.' },
      { name: 'MCB Tripping & Short Circuit Diagnosis', price: '₹349', desc: 'Systematic electrical panel fault-finding to resolve repetitive power trips.' },
      { name: 'House Wiring & Inverter Setup', price: '₹599', desc: 'Concealed copper wiring, inverter battery terminal wiring, and earthing checks.' },
      { name: 'LED & Decorative Lighting Installation', price: '₹149', desc: 'Safe installation of chandeliers, strip lights, spotlights, and wall fixtures.' }
    ],
    problemsSolved: [
      'Frequent main breaker (MCB) or fuse tripping',
      'Burnt electrical switches with sparking or burning plastic smell',
      'Ceiling fan making strange rattling sounds or running too slow',
      'Inverter failing to transfer load during unexpected power outages',
      'Wall sockets not charging laptops or household appliances'
    ],
    faqs: [
      { question: 'Are Go_Repireo electricians certified and background checked?', answer: 'Yes, every electrician on the Go_Repireo platform undergoes rigorous technical assessments, identity verification, and police record checks.' },
      { question: 'What safety precautions do your technicians take?', answer: 'Our professionals use insulated tools rated up to 1000V, rubber footwear, voltage detectors, and follow Indian electrical safety codes.' },
      { question: 'What if an issue reappears after the electrician leaves?', answer: 'We offer a 30-day revisit warranty. If the exact same repaired fault recurs within 30 days, we fix it with zero inspection fee.' }
    ]
  },
  'ac-repair': {
    name: 'AC Repair & Service',
    shortDesc: 'Complete air conditioner servicing, high-pressure jet washing, eco gas refilling, and cooling diagnostics.',
    minPrice: 399,
    maxPrice: 2999,
    nearMeSlug: 'ac-repair-near-me',
    services: [
      { name: 'Deep Jet Pump AC Servicing', price: '₹449', desc: 'Specialized 2-in-1 indoor and outdoor coil wash using an anti-splash foam jacket.' },
      { name: 'AC Gas Leak Detection & Refill', price: '₹1,799', desc: 'Nitrogen pressure testing, copper brazing of leaks, and 100% pure R32/R410A gas top-up.' },
      { name: 'AC Not Cooling Diagnostic Inspection', price: '₹299', desc: 'Comprehensive check of PCB, capacitor, sensor values, compressor amperage, and coils.' },
      { name: 'Split AC Installation / Uninstallation', price: '₹799', desc: 'Precision wall mounting, bracket fixing, copper pipe flare connection, and vacuum testing.' }
    ],
    problemsSolved: [
      'AC running but blowing room-temperature or warm air',
      'Water leaking or dripping from indoor AC evaporator unit',
      'AC compressor repeatedly turning on and abruptly shutting down',
      'Musty or foul smell emanating whenever the air conditioner is turned on',
      'Abnormal ice or frost accumulation along the indoor cooling coils'
    ],
    faqs: [
      { question: 'How frequently should an air conditioner be serviced in India?', answer: 'We recommend at least two services per year: one comprehensive deep jet wash before peak summer and one basic cleaning post-monsoon.' },
      { question: 'Which AC brands do your technicians service?', answer: 'Our specialists repair all top brands including Daikin, Voltas, LG, Samsung, Hitachi, Blue Star, Carrier, Lloyd, and Godrej.' }
    ]
  },
  'cleaning': {
    name: 'Home Cleaning',
    shortDesc: 'Deep residential cleaning, bathroom descaling, kitchen degreasing, and sofa upholstery shampooing.',
    minPrice: 399,
    maxPrice: 3999,
    nearMeSlug: 'deep-cleaning-near-me',
    services: [
      { name: 'Intense Bathroom Deep Cleaning', price: '₹399', desc: 'Removal of hard water scales, yellow toilet stains, tile grouting, and mirror buffing.' },
      { name: 'Modular Kitchen Deep Degreasing', price: '₹799', desc: 'Chimney surface wipe, oil stain removal from tiles, sink sanitization, and cabinets.' },
      { name: 'Sofa & Fabric Upholstery Shampooing', price: '₹499', desc: 'Mechanized vacuum extraction and fabric shampooing to eradicate dust mites and stains.' },
      { name: 'Full Home Deep Cleaning (1BHK / 2BHK / 3BHK)', price: '₹1,999', desc: 'Comprehensive floor scrubbing, window track brushing, cobweb removal, and disinfection.' }
    ],
    problemsSolved: [
      'Persistent hard water mineral crusts on bathroom tiles and taps',
      'Sticky grease accumulation across kitchen backsplashes and cabinets',
      'Dust mite accumulation and stubborn liquid spills on fabric sofas',
      'Post-renovation fine cement residue and paint speckles'
    ],
    faqs: [
      { question: 'What cleaning chemicals are used by your staff?', answer: 'We exclusively use professional-grade, government-approved non-toxic and biodegradable cleaning agents that are safe for pets and children.' },
      { question: 'Do I need to supply buckets, mops, or cleaning supplies?', answer: 'No. Our cleaning crews arrive fully equipped with industrial wet/dry vacuum cleaners, microfiber cloths, pads, and cleaning solutions.' }
    ]
  },
  'appliance': {
    name: 'Appliance Repair',
    shortDesc: 'On-demand repair for automatic washing machines, refrigerators, microwave ovens, and televisions.',
    minPrice: 199,
    maxPrice: 2499,
    nearMeSlug: 'washing-machine-repair-near-me',
    services: [
      { name: 'Washing Machine Repair (Top/Front Load)', price: '₹249', desc: 'Fix drum spin issues, drainage pump failures, inlet valves, and PCB error codes.' },
      { name: 'Refrigerator Repair & Gas Charging', price: '₹299', desc: 'Fix cooling failures, thermostat tripping, defroster faults, and relay replacements.' },
      { name: 'Microwave Oven Heating Repair', price: '₹249', desc: 'Diagnose magnetron, high-voltage diode, door switch, and turntable turntable motor.' },
      { name: 'LED/LCD TV Wall Mounting & Diagnostics', price: '₹299', desc: 'Sturdy bracket mounting, HDMI cable routing, and sound or display troubleshoot.' }
    ],
    problemsSolved: [
      'Washing machine shaking excessively during high-speed spin cycle',
      'Fridge freezer freezing ice but main bottom compartment remaining warm',
      'Microwave spinning and illuminating but failing to heat food',
      'Washing machine displaying OE, UE, or DE error codes'
    ],
    faqs: [
      { question: 'Do you provide genuine original spare parts?', answer: 'Yes. All replaced components are OEM or certified grade-A compatible spares with standard manufacturer warranties.' },
      { question: 'Can the technician fix my appliance on the same day?', answer: 'Over 85% of standard appliance faults (drain pumps, valves, relays, thermostats) are resolved on the spot during the initial visit.' }
    ]
  },
  'carpentry': {
    name: 'Carpentry',
    shortDesc: 'Expert woodworkers for door locks, hinges, modular furniture assembly, and custom repairs.',
    minPrice: 149,
    maxPrice: 2499,
    nearMeSlug: 'carpenter-near-me',
    services: [
      { name: 'Door Lock Installation & Repair', price: '₹199', desc: 'Mortise locks, smart digital locks, cylindrical latches, and handle replacements.' },
      { name: 'Furniture Assembly (IKEA / Pepperfry)', price: '₹399', desc: 'Precision assembling of beds, wardrobes, study desks, and TV entertainment units.' },
      { name: 'Drawer Channel & Hinge Replacement', price: '₹149', desc: 'Smooth soft-close hydraulic hinge installation and telescopic channel fixes.' },
      { name: 'Door Trimming & Adjustment', price: '₹249', desc: 'Planing swollen doors that scrape tile floors due to humidity or misaligned frames.' }
    ],
    problemsSolved: [
      'Wooden doors scraping against the floor or failing to latch shut',
      'Kitchen cabinet doors hanging crooked or dropping down',
      'Sticky drawer slides that refuse to open smoothly',
      'Loose bed headboards or squeaking wooden furniture frames'
    ],
    faqs: [
      { question: 'Can the carpenter assemble custom modular wardrobes?', answer: 'Yes, our carpenters handle both pre-engineered flatpack furniture assembly and custom on-site wooden repairs.' },
      { question: 'What tools does the carpenter bring along?', answer: 'Technicians bring cordless power drills, circular saws, planers, chisels, levels, and measurement equipment.' }
    ]
  },
  'painting': {
    name: 'Painting & Waterproofing',
    shortDesc: 'Interior/exterior wall painting, ceiling seepage treatment, primer coating, and wall putty application.',
    minPrice: 499,
    maxPrice: 8999,
    nearMeSlug: 'painter-near-me',
    services: [
      { name: 'Single Room / Accent Wall Painting', price: '₹999', desc: '2 coats of premium plastic emulsion with surface sanding and primer.' },
      { name: 'Full Home Interior Repainting', price: '₹4,999', desc: 'Complete wall crack filling, putty leveling, and roller application of washable paint.' },
      { name: 'Ceiling Seepage & Waterproofing Treatment', price: '₹799', desc: 'Elastomeric waterproofing membranes to halt terrace water intrusion and wall peel.' }
    ],
    problemsSolved: [
      'Paint bubbling, flaking, or peeling due to concealed water seepage',
      'Hairline plaster cracks showing along living room walls',
      'Faded, soiled, or crayon-stained interior walls needing fresh coats'
    ],
    faqs: [
      { question: 'Do you help with color consultation?', answer: 'Yes, our painting supervisors bring official color shade cards (Asian Paints, Berger, Dulux) to help you pick the perfect shade.' },
      { question: 'Do painters cover floors and furniture before starting?', answer: 'Yes, full masking and drop-sheet masking of floors, switchboards, and furniture is mandatory before any sanding or painting begins.' }
    ]
  },
  'pest-control': {
    name: 'Pest Control',
    shortDesc: 'Odorless pest eradication for cockroaches, termites, bedbugs, mosquitoes, and rodents.',
    minPrice: 499,
    maxPrice: 3499,
    nearMeSlug: 'pest-control-near-me',
    services: [
      { name: 'Odorless Cockroach Gel Treatment', price: '₹499', desc: 'Targeted herbal baiting behind cabinets, refrigerators, and drainage pipes.' },
      { name: 'Termite Drill-Fill-Seal Treatment', price: '₹1,499', desc: 'Chemical wall drilling barrier treatment with 1-year termite eradication guarantee.' },
      { name: 'Bedbug Elimination Spraying', price: '₹899', desc: 'Two-round contact spray targeting mattress seams, bed frames, and sofa joints.' }
    ],
    problemsSolved: [
      'Cockroaches invading kitchen pantries and food prep counters',
      'Hollow sounding wood or mud tubes signaling active termite colonies',
      'Unexplained itchy red bites caused by bedbug infestations in mattresses'
    ],
    faqs: [
      { question: 'Do we have to vacate the house during cockroach treatment?', answer: 'No. Our advanced gel baiting method is 100% odorless and safe for residents, so there is no need to empty your kitchen cabinets or leave the premises.' }
    ]
  },
  'cctv-installation': {
    name: 'CCTV Installation',
    shortDesc: 'High-definition surveillance cameras, IP network setup, DVR/NVR cabling, and mobile app integration.',
    minPrice: 399,
    maxPrice: 3999,
    nearMeSlug: 'cctv-installation-near-me',
    services: [
      { name: 'Wireless Smart WiFi Camera Setup', price: '₹399', desc: 'Wall mounting, 2.4GHz WiFi connection, SD card setup, and smartphone view app.' },
      { name: '4/8 Channel CCTV DVR Cable Installation', price: '₹1,299', desc: 'Concealed coaxial/CAT6 cabling, BNC crimping, power supply, and display setup.' },
      { name: 'CCTV Fault Diagnosis & Video Loss Fix', price: '₹299', desc: 'Troubleshoot flickering video, dead cameras, night-vision IR failure, or HDD errors.' }
    ],
    problemsSolved: [
      'Black screen or video loss on security monitor',
      'CCTV app unable to connect when away from home on mobile data',
      'Blurry or dark night vision recording around entrances'
    ],
    faqs: [
      { question: 'Can I view camera feeds on my smartphone anywhere in the world?', answer: 'Yes! Our technicians configure cloud P2P remote monitoring so you can check live feeds and playback directly from your iPhone or Android phone.' }
    ]
  },
  'ro-service': {
    name: 'RO Water Purifier Service',
    shortDesc: 'Reverse osmosis water purifier filter replacement, membrane descaling, and TDS calibration.',
    minPrice: 199,
    maxPrice: 1999,
    nearMeSlug: 'ro-repair-near-me',
    services: [
      { name: 'Complete Filter Replacement Kit', price: '₹899', desc: 'Sediment filter, pre-carbon block, post-carbon, and inline sediment replacement.' },
      { name: 'RO Membrane Replacement & TDS Tuning', price: '₹1,299', desc: 'Genuine high-rejection 75/80 GPD membrane installation and drinking water TDS optimization.' },
      { name: 'Water Purifier Leakage & Pump Diagnosis', price: '₹199', desc: 'Fix SMPS adapter failures, high-pressure pump chatter, and push-fit tube leaks.' }
    ],
    problemsSolved: [
      'Purified water tastes bitter, salty, or smells unpleasant',
      'Storage tank takes hours to fill due to clogged pre-filters',
      'Continuous reject wastewater flow even when power is turned off'
    ],
    faqs: [
      { question: 'What is the optimal drinking water TDS level?', answer: 'According to WHO and BIS standards, palatable and healthy drinking water TDS ranges between 80 to 150 mg/L.' }
    ]
  },
  'geyser-repair': {
    name: 'Geyser & Water Heater Repair',
    shortDesc: 'Instant and storage water heater element replacement, thermostat repair, and pressure valve fixes.',
    minPrice: 199,
    maxPrice: 1899,
    nearMeSlug: 'geyser-repair-near-me',
    services: [
      { name: 'Heating Element Replacement', price: '₹449', desc: 'Heavy-duty copper/enamel heating coil installation with new rubber gasket.' },
      { name: 'Thermostat & Thermal Cutout Fix', price: '₹249', desc: 'Prevent dangerous water overheating and eliminate MCB tripping caused by faulty switches.' },
      { name: 'Tank Descaling & Magnesium Anode Rod', price: '₹349', desc: 'Flush hard mineral scale to protect geyser inner tank from premature rust perforation.' }
    ],
    problemsSolved: [
      'Geyser light turns on but water stays cold',
      'Water heater causes the house main MCB to trip instantly',
      'Rust-colored water dripping from geyser safety pressure valve'
    ],
    faqs: [
      { question: 'Why does my geyser trip the MCB when switched on?', answer: 'This almost always indicates a short circuit in the heating element caused by mineral calcification. Replacing the element restores normal operation safely.' }
    ]
  },
  'deep-cleaning': {
    name: 'Deep Cleaning Services',
    shortDesc: 'Thorough sanitization, high-power floor scrubbing, kitchen chimney degrease, and sanitization.',
    minPrice: 799,
    maxPrice: 4999,
    nearMeSlug: 'deep-cleaning-near-me',
    services: [
      { name: 'Complete Flat/Villa Deep Clean', price: '₹2,499', desc: 'Wall-to-wall mechanized floor scrubbing, balcony pressure wash, glass polishing.' },
      { name: 'Intense Kitchen & Appliance Degreasing', price: '₹899', desc: 'Remove grease grime from cabinets, exhaust vents, stove tops, and backsplashes.' },
      { name: 'Sanitized Bathroom Scrub & Scale Removal', price: '₹449', desc: 'Acid-free restoration of porcelain, tiles, shower glass, and chrome fixtures.' }
    ],
    problemsSolved: [
      'Stubborn hard water deposits that normal household detergents fail to remove',
      'Heavy grease residue accumulated on kitchen exhaust vents and tiles',
      'Post-construction dust settling into tile joints and aluminum window tracks'
    ],
    faqs: [
      { question: 'How much time does a full apartment deep cleaning take?', answer: 'Depending on the carpet area (1BHK to 3BHK), a team of 2 to 3 trained cleaners typically takes between 3 to 5 hours.' }
    ]
  }
};

const supportedCategories = new Set(Object.keys(CATEGORY_DATA));

function capitalize(str: string): string {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;

  if (!supportedCategories.has(category)) {
    return { title: 'Service Not Found | Go_Repireo', robots: { index: false, follow: false } };
  }

  const detail = CATEGORY_DATA[category];
  const categoryName = detail.name;
  const title = `${categoryName} Services | Verified Professionals & Upfront Pricing`;
  const description = `Book trusted ${categoryName} professionals on Go_Repireo. Verified doorstep technicians, 30-day service warranty, transparent pricing, and rapid response.`;

  return {
    title,
    description,
    keywords: [
      `${categoryName} services`,
      `book ${categoryName}`,
      `doorstep ${categoryName}`,
      `emergency ${categoryName}`,
      `best ${categoryName} technician`,
      'Go_Repireo home services'
    ],
    alternates: {
      canonical: `https://gorepireo.in/services/${category}`
    },
    openGraph: {
      title,
      description,
      url: `https://gorepireo.in/services/${category}`,
      siteName: 'Go_Repireo',
      type: 'website',
      images: [
        {
          url: 'https://gorepireo.in/icon.png',
          width: 512,
          height: 512,
          alt: `Go_Repireo ${categoryName} Services`
        }
      ]
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['https://gorepireo.in/icon.png']
    }
  };
}

export default async function CategoryHubPage({ params }: CategoryPageProps) {
  const { category } = await params;

  if (!supportedCategories.has(category)) {
    notFound();
  }

  const detail = CATEGORY_DATA[category];
  const pageUrl = `https://gorepireo.in/services/${category}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Header />

      <SchemaData 
        title={`${detail.name} Services - Go_Repireo`}
        description={detail.shortDesc}
        url={pageUrl}
        category={detail.name}
        minPrice={detail.minPrice}
        maxPrice={detail.maxPrice}
        faqs={detail.faqs}
      />

      {/* Crawlable Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <li>
            <Link href="/" className="hover:text-[#007AFF] transition-colors">Home</Link>
          </li>
          <ChevronRight size={12} className="text-slate-400" />
          <li>
            <Link href="/services" className="hover:text-[#007AFF] transition-colors">Services</Link>
          </li>
          <ChevronRight size={12} className="text-slate-400" />
          <li className="text-slate-900 font-bold" aria-current="page">
            {detail.name}
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#e8f0fe] to-[#F8FAFC] pt-6 pb-8 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-blue-100 shadow-xs">
            <ShieldCheck size={14} className="text-[#007AFF]" />
            <span className="text-[10px] font-extrabold text-[#007AFF] uppercase tracking-wider">
              Verified & Guaranteed
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Professional <span className="text-[#007AFF]">{detail.name}</span> Services at Your Doorstep
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            {detail.shortDesc} Book background-verified technicians with upfront fixed pricing, live map tracking, and 30-day post-service warranty.
          </p>

          {/* Value Props Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
              <Clock size={16} className="text-[#007AFF] mb-1" />
              <p className="text-xs font-bold text-slate-900">Rapid Arrival</p>
              <p className="text-[10px] text-slate-500">30-45 min arrival</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
              <ShieldCheck size={16} className="text-emerald-600 mb-1" />
              <p className="text-xs font-bold text-slate-900">30-Day Warranty</p>
              <p className="text-[10px] text-slate-500">Free revisit support</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
              <CreditCard size={16} className="text-[#007AFF] mb-1" />
              <p className="text-xs font-bold text-slate-900">Upfront Rates</p>
              <p className="text-[10px] text-slate-500">Starts ₹{detail.minPrice}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
              <ThumbsUp size={16} className="text-amber-500 mb-1" />
              <p className="text-xs font-bold text-slate-900">Pay After Work</p>
              <p className="text-[10px] text-slate-500">Cash or UPI</p>
            </div>
          </div>

          <div className="pt-2 flex gap-3 flex-wrap">
            <Link 
              href="/services/service" 
              className="h-12 px-6 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Book {detail.name} Now <ArrowRight size={16} />
            </Link>

            <Link 
              href={`/services/${category}/etawah`} 
              className="h-12 px-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
            >
              <MapPin size={14} className="text-[#007AFF]" />
              View Etawah Hub Availability
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Popular Services & Pricing Table */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
              Popular {detail.name} Services & Price Guide
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Standard baseline rates</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {detail.services.map((item, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition-colors"
              >
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">{item.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <span className="text-sm font-black text-[#007AFF]">{item.price}</span>
                  <Link 
                    href="/services/service" 
                    className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-transform active:scale-95"
                  >
                    Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common Issues / Problems We Solve */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
            Common {detail.name} Issues We Resolve Daily
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detail.problemsSolved.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-[#007AFF] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700 leading-snug">{issue}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-5">
          <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
            How Go_Repireo Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-[#007AFF] text-white text-xs font-black flex items-center justify-center">1</span>
              <p className="text-xs font-bold text-slate-900 pt-1">Select Service</p>
              <p className="text-[10px] text-slate-500">Pick repair, maintenance or installation in 60s.</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-[#007AFF] text-white text-xs font-black flex items-center justify-center">2</span>
              <p className="text-xs font-bold text-slate-900 pt-1">Live Tracking</p>
              <p className="text-[10px] text-slate-500">Watch the technician travel toward your pin live on map.</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-[#007AFF] text-white text-xs font-black flex items-center justify-center">3</span>
              <p className="text-xs font-bold text-slate-900 pt-1">Expert Job</p>
              <p className="text-[10px] text-slate-500">Background-checked professional completes repair safely.</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-[#007AFF] text-white text-xs font-black flex items-center justify-center">4</span>
              <p className="text-xs font-bold text-slate-900 pt-1">Pay After Service</p>
              <p className="text-[10px] text-slate-500">Inspect work and pay via Cash or UPI with 30-day warranty.</p>
            </div>
          </div>
        </section>

        {/* Local Landing Links */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-3xl border border-blue-100 space-y-3">
          <div className="flex items-center gap-2 text-[#007AFF]">
            <MapPin size={18} />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Local Service Coverage & Fast Dispatch
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Looking for doorstep {detail.name.toLowerCase()} in your locality? We offer dedicated local service hubs with rapid 30-minute technician dispatch.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link 
              href={`/services/${category}/etawah`} 
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <MapPin size={12} className="text-[#007AFF]" />
              {detail.name} in Etawah
            </Link>
            {detail.nearMeSlug && (
              <Link 
                href={`/near-me/${detail.nearMeSlug}`} 
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <MapPin size={12} className="text-[#007AFF]" />
                {capitalize(detail.nearMeSlug)}
              </Link>
            )}
            <Link 
              href="/services" 
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              Explore All Services
            </Link>
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
            Frequently Asked Questions ({detail.name})
          </h2>
          <div className="space-y-4 divide-y divide-slate-100">
            {detail.faqs.map((faq, idx) => (
              <div key={idx} className="pt-3 first:pt-0 space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">{faq.question}</h3>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final Conversion CTA */}
        <section className="bg-[#0A1629] text-white p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Need an Expert {detail.name} Technician Right Away?
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Book now in under 60 seconds. Guaranteed arrival within 30 to 45 minutes with transparent upfront pricing.
          </p>
          <div className="pt-2 flex justify-center">
            <Link 
              href="/services/service" 
              className="h-12 px-8 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
            >
              Book {detail.name} Now <ArrowRight size={16} />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
