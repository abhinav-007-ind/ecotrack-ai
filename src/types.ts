export interface EmissionRecord {
  id: string;
  userId: string;
  transportKm: number;    // km traveled daily
  transportType: string;  // 'petrol_car' | 'diesel_car' | 'electric_car' | 'hybrid' | 'motorcycle' | 'bus_train' | 'bicycle_walk'
  electricityKwh: number; // electricity consumption weekly (kWh)
  dietType: string;       // 'vegan' | 'vegetarian' | 'pescatarian' | 'flexitarian' | 'meat_heavy'
  shoppingLevel: string;  // 'minimal' | 'average' | 'frequent' | 'extreme'
  dailyFootprint: number; // calculated CO2 in kg
  timestamp: string;      // ISO date
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  city: string;
  streak: number;
  lastActiveDate: string; // ISO date
  treesPlanted: number;
  treesNeeded: number;
  greenScore: number;     // 0 - 100 rating based on emissions
  badges: string[];       // ids of unlocked badges
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  avatarUrl: string;
  greenScore: number;
  totalSavings: number; // kg saved
  treesPlanted: number;
  streak: number;
  city: string;
}

export interface AIRecommendation {
  category: string;
  headline: string;
  currentUsage: string;
  actionableAlternative: string;
  co2Savings: number;     // kg CO2/year
  moneySavings: number;   // estimated savings in INR or USD/year (e.g. ₹ or $)
  impactText: string;     // long-term environmental context
}

export interface PlantingRecord {
  id: string;
  userId: string;
  treeSpecies: string;
  datePlanted: string;
  status: 'seedling' | 'growing' | 'mature';
  offsetValue: number;    // kg CO2/year offset
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  criteria: string;
}

export const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'first_calculation',
    title: 'Eco Pioneer',
    description: 'Calculate your carbon footprint for the first time.',
    iconName: 'Calculator',
    criteria: 'Submit first calculation'
  },
  {
    id: 'green_score_90',
    title: 'Carbon Ninja',
    description: 'Achieve a Green Score of 90 or higher.',
    iconName: 'ShieldCheck',
    criteria: 'Green Score >= 90'
  },
  {
    id: 'streak_3',
    title: 'Earth Advocate',
    description: 'Maintain a logging streak of 3 days.',
    iconName: 'Flame',
    criteria: 'Streak >= 3 days'
  },
  {
    id: 'first_tree',
    title: 'Green Thumb',
    description: 'Plant your first virtual or physical tree on EcoTrack.',
    iconName: 'Sprout',
    criteria: 'Plant 1 tree'
  },
  {
    id: 'offset_50',
    title: 'Climate Protector',
    description: 'Offset at least 50% of your annual carbon footprint.',
    iconName: 'Leaf',
    criteria: 'Offset >= 50%'
  },
  {
    id: 'master_planter',
    title: 'Carbon Sink',
    description: 'Plant 10 or more trees to combat emissions.',
    iconName: 'Trees',
    criteria: 'Plant >= 10 trees'
  }
];
