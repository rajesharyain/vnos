/**
 * Indian Services Configuration
 * 
 * High-value services for the Indian market with SMS-Activate service IDs
 * Organized by category with real-time availability data
 */

export interface IndianService {
  id: string;
  name: string;
  category: string;
  smsActivateId: string;
  description: string;
  expectedCount: number;
  priority: 'high' | 'medium' | 'low';
}

export const INDIAN_SERVICES: IndianService[] = [
  // E-commerce & Shopping
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'E-commerce & Shopping',
    smsActivateId: 'am',
    description: 'Major e-commerce platform',
    expectedCount: 25000,
    priority: 'high'
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    category: 'E-commerce & Shopping',
    smsActivateId: 'fl',
    description: 'Popular Indian e-commerce platform',
    expectedCount: 0, // Will be fetched from API
    priority: 'high'
  },
  {
    id: 'jiomart',
    name: 'JioMart',
    category: 'E-commerce & Shopping',
    smsActivateId: 'jm',
    description: 'Reliance Jio\'s e-commerce platform',
    expectedCount: 2,
    priority: 'high'
  },
  {
    id: 'dmart',
    name: 'DMart',
    category: 'E-commerce & Shopping',
    smsActivateId: 'dm',
    description: 'Avenue Supermarts retail chain',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'vishalmart',
    name: 'VishalMart',
    category: 'E-commerce & Shopping',
    smsActivateId: 'vm',
    description: 'Vishal Mega Mart retail chain',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'myntra',
    name: 'Myntra',
    category: 'E-commerce & Shopping',
    smsActivateId: 'my',
    description: 'Fashion e-commerce platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'snapdeal',
    name: 'Snapdeal',
    category: 'E-commerce & Shopping',
    smsActivateId: 'sd',
    description: 'E-commerce platform',
    expectedCount: 1264,
    priority: 'medium'
  },
  {
    id: 'meesho',
    name: 'Meesho',
    category: 'E-commerce & Shopping',
    smsActivateId: 'ms',
    description: 'Social commerce platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'ajio',
    name: 'AJIO',
    category: 'E-commerce & Shopping',
    smsActivateId: 'aj',
    description: 'Reliance Fashion e-commerce',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'nykaa',
    name: 'Nykaa',
    category: 'E-commerce & Shopping',
    smsActivateId: 'ny',
    description: 'Beauty and cosmetics platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'purplle',
    name: 'Purplle',
    category: 'E-commerce & Shopping',
    smsActivateId: 'pu',
    description: 'Beauty and personal care platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'firstcry',
    name: 'FirstCry',
    category: 'E-commerce & Shopping',
    smsActivateId: 'fc',
    description: 'Baby and kids products platform',
    expectedCount: 0,
    priority: 'medium'
  },

  // Food Delivery & Quick Commerce
  {
    id: 'swiggy',
    name: 'Swiggy',
    category: 'Food Delivery & Quick Commerce',
    smsActivateId: 'sw',
    description: 'Major food delivery service',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'zomato',
    name: 'Zomato',
    category: 'Food Delivery & Quick Commerce',
    smsActivateId: 'zo',
    description: 'Food delivery and restaurant discovery',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'zepto',
    name: 'Zepto',
    category: 'Food Delivery & Quick Commerce',
    smsActivateId: 'ze',
    description: 'Quick grocery delivery',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'bigbasket',
    name: 'BigBasket',
    category: 'Food Delivery & Quick Commerce',
    smsActivateId: 'bb',
    description: 'Online grocery platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    category: 'Food Delivery & Quick Commerce',
    smsActivateId: 'bk',
    description: 'Quick commerce grocery delivery',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'dunzo',
    name: 'Dunzo',
    category: 'Food Delivery & Quick Commerce',
    smsActivateId: 'du',
    description: 'Hyperlocal delivery service',
    expectedCount: 0,
    priority: 'medium'
  },

  // Transportation & Ride-sharing
  {
    id: 'ola',
    name: 'Ola Cabs',
    category: 'Transportation & Ride-sharing',
    smsActivateId: 'ol',
    description: 'Indian ride-hailing service',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'uber',
    name: 'Uber',
    category: 'Transportation & Ride-sharing',
    smsActivateId: 'ub',
    description: 'Global ride-hailing service',
    expectedCount: 1982,
    priority: 'high'
  },
  {
    id: 'rapido',
    name: 'Rapido',
    category: 'Transportation & Ride-sharing',
    smsActivateId: 'rp',
    description: 'Bike taxi service',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'blusmart',
    name: 'BluSmart',
    category: 'Transportation & Ride-sharing',
    smsActivateId: 'bs',
    description: 'Electric ride-hailing service',
    expectedCount: 0,
    priority: 'medium'
  },

  // Digital Payments & Fintech
  {
    id: 'paytm',
    name: 'PayTM (Payzapp)',
    category: 'Digital Payments & Fintech',
    smsActivateId: 'pt',
    description: 'Digital payments platform',
    expectedCount: 1316,
    priority: 'high'
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    category: 'Digital Payments & Fintech',
    smsActivateId: 'pp',
    description: 'Digital payments service',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'googlepay',
    name: 'Google Pay (Google)',
    category: 'Digital Payments & Fintech',
    smsActivateId: 'go',
    description: 'Google payment service',
    expectedCount: 25000,
    priority: 'high'
  },
  {
    id: 'mobikwik',
    name: 'Mobikwik',
    category: 'Digital Payments & Fintech',
    smsActivateId: 'mk',
    description: 'Digital wallet platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    category: 'Digital Payments & Fintech',
    smsActivateId: 'ap',
    description: 'Amazon payment service',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'cred',
    name: 'CRED',
    category: 'Digital Payments & Fintech',
    smsActivateId: 'cr',
    description: 'Credit card bill payment platform',
    expectedCount: 0,
    priority: 'medium'
  },

  // Entertainment & Media
  {
    id: 'disneyhotstar',
    name: 'Disney+ Hotstar',
    category: 'Entertainment & Media',
    smsActivateId: 'dh',
    description: 'Streaming platform',
    expectedCount: 1750,
    priority: 'high'
  },
  {
    id: 'jiocinema',
    name: 'Jio Cinema',
    category: 'Entertainment & Media',
    smsActivateId: 'jc',
    description: 'Jio streaming service',
    expectedCount: 1831,
    priority: 'medium'
  },
  {
    id: 'jiohotstar',
    name: 'Jio Hotstar',
    category: 'Entertainment & Media',
    smsActivateId: 'jh',
    description: 'Jio entertainment platform',
    expectedCount: 514,
    priority: 'medium'
  },
  {
    id: 'sonyliv',
    name: 'Sony LIV',
    category: 'Entertainment & Media',
    smsActivateId: 'sl',
    description: 'Sony streaming platform',
    expectedCount: 1520,
    priority: 'medium'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Entertainment & Media',
    smsActivateId: 'nf',
    description: 'Global streaming platform',
    expectedCount: 25000,
    priority: 'high'
  },
  {
    id: 'primevideo',
    name: 'Prime Video',
    category: 'Entertainment & Media',
    smsActivateId: 'pv',
    description: 'Amazon streaming service',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'voot',
    name: 'Voot',
    category: 'Entertainment & Media',
    smsActivateId: 'vt',
    description: 'Viacom18 streaming platform',
    expectedCount: 0,
    priority: 'medium'
  },

  // Gaming & Fantasy Sports
  {
    id: 'dream11',
    name: 'Dream11',
    category: 'Gaming & Fantasy Sports',
    smsActivateId: 'd11',
    description: 'Fantasy sports platform',
    expectedCount: 25000,
    priority: 'high'
  },
  {
    id: 'mpl',
    name: 'MPL',
    category: 'Gaming & Fantasy Sports',
    smsActivateId: 'mpl',
    description: 'Mobile Premier League gaming',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'winzo',
    name: 'WinZO',
    category: 'Gaming & Fantasy Sports',
    smsActivateId: 'wz',
    description: 'Gaming platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'ludosupreme',
    name: 'Ludo Supreme',
    category: 'Gaming & Fantasy Sports',
    smsActivateId: 'ls',
    description: 'Ludo gaming platform',
    expectedCount: 2145,
    priority: 'medium'
  },
  {
    id: 'rummycircle',
    name: 'RummyCircle',
    category: 'Gaming & Fantasy Sports',
    smsActivateId: 'rc',
    description: 'Online rummy gaming platform',
    expectedCount: 0,
    priority: 'medium'
  },

  // Healthcare & Pharmacy
  {
    id: '1mg',
    name: '1mg',
    category: 'Healthcare & Pharmacy',
    smsActivateId: '1mg',
    description: 'Online pharmacy platform',
    expectedCount: 1567,
    priority: 'high'
  },
  {
    id: 'pharmeasy',
    name: 'PharmEasy',
    category: 'Healthcare & Pharmacy',
    smsActivateId: 'pe',
    description: 'Online pharmacy service',
    expectedCount: 1453,
    priority: 'high'
  },
  {
    id: 'apollo',
    name: 'Apollo',
    category: 'Healthcare & Pharmacy',
    smsActivateId: 'ap',
    description: 'Healthcare platform',
    expectedCount: 2162,
    priority: 'high'
  },
  {
    id: 'practo',
    name: 'Practo',
    category: 'Healthcare & Pharmacy',
    smsActivateId: 'pr',
    description: 'Healthcare appointment platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'netmeds',
    name: 'Netmeds',
    category: 'Healthcare & Pharmacy',
    smsActivateId: 'nm',
    description: 'Online pharmacy service',
    expectedCount: 0,
    priority: 'medium'
  },

  // Education
  {
    id: 'byjus',
    name: 'BYJU\'S',
    category: 'Education',
    smsActivateId: 'bj',
    description: 'Educational platform',
    expectedCount: 2202,
    priority: 'high'
  },
  {
    id: 'unacademy',
    name: 'Unacademy',
    category: 'Education',
    smsActivateId: 'ua',
    description: 'Educational platform',
    expectedCount: 1576,
    priority: 'high'
  },
  {
    id: 'vedantu',
    name: 'Vedantu',
    category: 'Education',
    smsActivateId: 'vd',
    description: 'Educational platform',
    expectedCount: 2181,
    priority: 'medium'
  },
  {
    id: 'doubtnut',
    name: 'Doubtnut',
    category: 'Education',
    smsActivateId: 'dn',
    description: 'Educational doubt solving platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'toppr',
    name: 'Toppr',
    category: 'Education',
    smsActivateId: 'tp',
    description: 'Educational learning platform',
    expectedCount: 0,
    priority: 'medium'
  },

  // Job & Services
  {
    id: 'naukri',
    name: 'Naukri',
    category: 'Job & Services',
    smsActivateId: 'nk',
    description: 'Job portal',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'urbancompany',
    name: 'Urban Company',
    category: 'Job & Services',
    smsActivateId: 'uc',
    description: 'Home services platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'justdial',
    name: 'Just Dial',
    category: 'Job & Services',
    smsActivateId: 'jd',
    description: 'Local search service',
    expectedCount: 1135,
    priority: 'medium'
  },
  {
    id: 'bookmyshow',
    name: 'BookMyShow',
    category: 'Job & Services',
    smsActivateId: 'bms',
    description: 'Movie and event booking platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    category: 'Job & Services',
    smsActivateId: 'mmt',
    description: 'Travel booking platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'goibibo',
    name: 'Goibibo',
    category: 'Job & Services',
    smsActivateId: 'gb',
    description: 'Travel and hotel booking platform',
    expectedCount: 0,
    priority: 'medium'
  },

  // Banking & Financial Services
  {
    id: 'hdfcbank',
    name: 'HDFC Bank',
    category: 'Banking & Financial Services',
    smsActivateId: 'hb',
    description: 'HDFC Bank mobile banking',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'icicibank',
    name: 'ICICI Bank',
    category: 'Banking & Financial Services',
    smsActivateId: 'ib',
    description: 'ICICI Bank mobile banking',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    category: 'Banking & Financial Services',
    smsActivateId: 'sbi',
    description: 'SBI mobile banking',
    expectedCount: 0,
    priority: 'high'
  },
  {
    id: 'axisbank',
    name: 'Axis Bank',
    category: 'Banking & Financial Services',
    smsActivateId: 'ab',
    description: 'Axis Bank mobile banking',
    expectedCount: 0,
    priority: 'medium'
  },

  // Social Media & Communication
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'Social Media & Communication',
    smsActivateId: 'wa',
    description: 'Messaging platform',
    expectedCount: 25000,
    priority: 'high'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Social Media & Communication',
    smsActivateId: 'ig',
    description: 'Social media platform',
    expectedCount: 25000,
    priority: 'high'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Social Media & Communication',
    smsActivateId: 'fb',
    description: 'Social media platform',
    expectedCount: 25000,
    priority: 'high'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'Social Media & Communication',
    smsActivateId: 'tg',
    description: 'Messaging platform',
    expectedCount: 0,
    priority: 'medium'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    category: 'Social Media & Communication',
    smsActivateId: 'sc',
    description: 'Social media platform',
    expectedCount: 0,
    priority: 'medium'
  }
];

/**
 * Get services by category
 */
export function getServicesByCategory(category: string): IndianService[] {
  return INDIAN_SERVICES.filter(service => service.category === category);
}

/**
 * Get high priority services
 */
export function getHighPriorityServices(): IndianService[] {
  return INDIAN_SERVICES.filter(service => service.priority === 'high');
}

/**
 * Get service by ID
 */
export function getServiceById(id: string): IndianService | undefined {
  return INDIAN_SERVICES.find(service => service.id === id);
}

/**
 * Get service by SMS-Activate ID
 */
export function getServiceBySmsActivateId(smsActivateId: string): IndianService | undefined {
  return INDIAN_SERVICES.find(service => service.smsActivateId === smsActivateId);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return [...new Set(INDIAN_SERVICES.map(service => service.category))];
} 