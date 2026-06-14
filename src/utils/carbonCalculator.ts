import { EmissionRecord } from '../types';

// Emission factors in kg CO2e
export const TRANSPORT_FACTORS: Record<string, number> = {
  petrol_car: 0.18,
  diesel_car: 0.20,
  electric_car: 0.05,
  hybrid: 0.10,
  motorcycle: 0.09,
  bus_train: 0.04,
  bicycle_walk: 0.00,
};

export const TRANSPORT_LABEL: Record<string, string> = {
  petrol_car: 'Petrol Vehicle',
  diesel_car: 'Diesel Vehicle',
  electric_car: 'Electric Vehicle',
  hybrid: 'Hybrid Vehicle',
  motorcycle: 'Motorcycle/Scooter',
  bus_train: 'Public Transit (Bus/Train)',
  bicycle_walk: 'Self-Powered (Bicycle/Walking)',
};

export const ELECTRICITY_FACTOR = 0.82; // kg CO2e per kWh

export const DIET_FACTORS: Record<string, number> = {
  vegan: 1.5,
  vegetarian: 2.1,
  pescatarian: 2.7,
  flexitarian: 3.4,
  meat_heavy: 5.8,
};

export const DIET_LABEL: Record<string, string> = {
  vegan: 'Plant-Based Vegan',
  vegetarian: 'Vegetarian',
  pescaratian: 'Pescatarian (Fish & Veggies)',
  flexitarian: 'Flexitarian (Occasional Meat)',
  meat_heavy: 'Meat-Heavy Diet',
};

export const SHOPPING_FACTORS: Record<string, number> = {
  minimal: 1.0,
  average: 2.4,
  frequent: 5.2,
  extreme: 11.5,
};

export const SHOPPING_LABEL: Record<string, string> = {
  minimal: 'Low Consumption (Eco Essentialist)',
  average: 'Standard Consumption (Casual)',
  frequent: 'Frequent Consumer (High Fashion/Tech)',
  extreme: 'Extreme Consumer (Heavy Retail Overload)',
};

export function calculateDailyFootprint(inputs: {
  transportKm: number;
  transportType: string;
  electricityKwh: number;
  dietType: string;
  shoppingLevel: string;
}): number {
  const transportDaily = inputs.transportKm * (TRANSPORT_FACTORS[inputs.transportType] ?? 0.18);
  const electricityDaily = (inputs.electricityKwh * ELECTRICITY_FACTOR) / 7;
  const dietDaily = DIET_FACTORS[inputs.dietType] ?? 2.1;
  const shoppingDaily = SHOPPING_FACTORS[inputs.shoppingLevel] ?? 2.4;

  const total = transportDaily + electricityDaily + dietDaily + shoppingDaily;
  return Number(total.toFixed(2));
}

// Map emission to Green Score (0 - 100)
// High footprint results in low score
export function getGreenScore(dailyFootprint: number): number {
  // Score range: < 8 kg/day is excellent (Green)
  // 8 to 16 kg/day is warning (Yellow)
  // > 16 kg/day is critical (Red)
  const score = Math.max(10, Math.min(100, Math.round(110 - (dailyFootprint * 3.5))));
  return score;
}

// Calculate trees needed to offset footprint yearly
// A mature tree absorbs roughly 22 kg CO2 per year
export function calculateTreesNeeded(yearlyEmissionsKg: number): number {
  return Math.max(1, Math.ceil(yearlyEmissionsKg / 22));
}
