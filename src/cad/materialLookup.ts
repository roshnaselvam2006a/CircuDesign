/**
 * Material lookup utilities for mapping CAD part names to material properties.
 * Uses keyword matching against part names to infer material category,
 * density, tensile strength, carbon footprint, and joinery type.
 */

import type { BOMItem } from '../types';

/** Density in g/cm³ for common material categories */
export const MATERIAL_DENSITIES: Record<string, number> = {
  'abs': 1.05,
  'polycarbonate': 1.20,
  'pvc': 1.40,
  'polypropylene': 0.90,
  'nylon': 1.14,
  'pla': 1.24,
  'polyester': 1.38,
  'rubber': 1.15,
  'silicone': 1.10,
  'steel': 7.85,
  'stainless_steel': 8.00,
  'aluminum': 2.70,
  'copper': 8.96,
  'titanium': 4.50,
  'glass': 2.50,
  'wood': 0.60,
  'generic_plastic': 1.10,
  'generic_metal': 7.80,
};

interface MaterialInference {
  material: string;
  category: BOMItem['category'];
  tensileStrengthMPa: number;
  carbonFootprintKgCO2PerKg: number;
  joineryType: BOMItem['joineryType'];
  densityGPerCm3: number;
  recyclablePercent: number;
}

/** Keyword rules for inferring material from part names */
const PART_NAME_RULES: Array<{
  keywords: string[];
  inference: MaterialInference;
}> = [
  {
    keywords: ['housing', 'enclosure', 'cover', 'shell', 'casing', 'lid', 'cap', 'panel'],
    inference: {
      material: 'Virgin ABS',
      category: 'Housing/Enclosure',
      tensileStrengthMPa: 45,
      carbonFootprintKgCO2PerKg: 3.8,
      joineryType: 'Snap-fit',
      densityGPerCm3: 1.05,
      recyclablePercent: 35,
    },
  },
  {
    keywords: ['frame', 'chassis', 'bracket', 'beam', 'strut', 'support', 'rail', 'arm'],
    inference: {
      material: 'Virgin Carbon Steel',
      category: 'Structural Frame',
      tensileStrengthMPa: 250,
      carbonFootprintKgCO2PerKg: 8.2,
      joineryType: 'Threaded Fasteners',
      densityGPerCm3: 7.85,
      recyclablePercent: 85,
    },
  },
  {
    keywords: ['screw', 'bolt', 'nut', 'washer', 'fastener', 'rivet', 'pin', 'clip'],
    inference: {
      material: 'Virgin Stainless Steel',
      category: 'Fasteners/Hardware',
      tensileStrengthMPa: 520,
      carbonFootprintKgCO2PerKg: 6.1,
      joineryType: 'Threaded Fasteners',
      densityGPerCm3: 8.0,
      recyclablePercent: 90,
    },
  },
  {
    keywords: ['pcb', 'board', 'circuit', 'sensor', 'chip', 'connector', 'wire', 'cable', 'electronic'],
    inference: {
      material: 'FR-4 PCB Laminate',
      category: 'Electronics/PCB',
      tensileStrengthMPa: 280,
      carbonFootprintKgCO2PerKg: 5.5,
      joineryType: 'Molded insert',
      densityGPerCm3: 1.85,
      recyclablePercent: 15,
    },
  },
  {
    keywords: ['seal', 'gasket', 'o-ring', 'grommet', 'bushing', 'pad', 'cushion', 'rubber', 'bumper'],
    inference: {
      material: 'Silicone Rubber',
      category: 'Flexible/Seals',
      tensileStrengthMPa: 15,
      carbonFootprintKgCO2PerKg: 4.2,
      joineryType: 'Press-fit',
      densityGPerCm3: 1.15,
      recyclablePercent: 20,
    },
  },
  {
    keywords: ['heatsink', 'heat_sink', 'fin', 'radiator', 'cooler', 'thermal'],
    inference: {
      material: 'Virgin Aluminum',
      category: 'Thermal/Heat Sink',
      tensileStrengthMPa: 90,
      carbonFootprintKgCO2PerKg: 12.5,
      joineryType: 'Threaded Fasteners',
      densityGPerCm3: 2.70,
      recyclablePercent: 95,
    },
  },
  {
    keywords: ['lens', 'window', 'glass', 'screen', 'display', 'transparent'],
    inference: {
      material: 'Virgin Polycarbonate (PC)',
      category: 'Housing/Enclosure',
      tensileStrengthMPa: 62,
      carbonFootprintKgCO2PerKg: 6.2,
      joineryType: 'Adhesive/Glued',
      densityGPerCm3: 1.20,
      recyclablePercent: 40,
    },
  },
  {
    keywords: ['gear', 'bearing', 'shaft', 'axle', 'wheel', 'pulley', 'cam'],
    inference: {
      material: 'Virgin Nylon (Polyamide)',
      category: 'Structural Frame',
      tensileStrengthMPa: 78,
      carbonFootprintKgCO2PerKg: 7.1,
      joineryType: 'Press-fit',
      densityGPerCm3: 1.14,
      recyclablePercent: 30,
    },
  },
];

/** Default inference when no keyword matches */
const DEFAULT_INFERENCE: MaterialInference = {
  material: 'Virgin ABS',
  category: 'Housing/Enclosure',
  tensileStrengthMPa: 45,
  carbonFootprintKgCO2PerKg: 3.8,
  joineryType: 'Snap-fit',
  densityGPerCm3: 1.10,
  recyclablePercent: 30,
};

/**
 * Infer material properties from a CAD part name using keyword matching.
 */
export function inferMaterialFromPartName(partName: string): MaterialInference {
  const lower = partName.toLowerCase().replace(/[_\-]/g, ' ');

  for (const rule of PART_NAME_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        return rule.inference;
      }
    }
  }

  return DEFAULT_INFERENCE;
}

/**
 * Get density for a material name (fuzzy match).
 */
export function getDensityForMaterial(materialName: string): number {
  const lower = materialName.toLowerCase();

  if (lower.includes('steel') || lower.includes('iron')) return MATERIAL_DENSITIES['steel'];
  if (lower.includes('aluminum') || lower.includes('aluminium')) return MATERIAL_DENSITIES['aluminum'];
  if (lower.includes('copper')) return MATERIAL_DENSITIES['copper'];
  if (lower.includes('titanium')) return MATERIAL_DENSITIES['titanium'];
  if (lower.includes('rubber') || lower.includes('silicone')) return MATERIAL_DENSITIES['rubber'];
  if (lower.includes('nylon') || lower.includes('polyamide')) return MATERIAL_DENSITIES['nylon'];
  if (lower.includes('abs')) return MATERIAL_DENSITIES['abs'];
  if (lower.includes('polycarbonate') || lower.includes('pc')) return MATERIAL_DENSITIES['polycarbonate'];
  if (lower.includes('glass')) return MATERIAL_DENSITIES['glass'];
  if (lower.includes('wood')) return MATERIAL_DENSITIES['wood'];

  // Generic fallback
  if (lower.includes('metal')) return MATERIAL_DENSITIES['generic_metal'];
  return MATERIAL_DENSITIES['generic_plastic'];
}
