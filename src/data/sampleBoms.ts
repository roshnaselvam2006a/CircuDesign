import { BOMItem, MaterialAlternative } from '../types';

export const SAMPLE_BOMS: { id: string; name: string; description: string; items: BOMItem[] }[] = [
  {
    id: 'smart-hub',
    name: 'Smart Home Sensor Hub',
    description: 'Compact IoT gateway casing, structural mounts, and optical windows',
    items: [
      {
        partId: 'P01',
        name: 'Main Enclosure Housing',
        category: 'Housing/Enclosure',
        quantity: 1,
        currentMaterial: 'ABS (Acrylonitrile Butadiene Styrene)',
        massGrams: 145,
        unitCostUSD: 2.80,
        joineryType: 'Snap-fit',
        tensileStrengthMPa: 42,
        maxOperatingTempC: 85,
        recyclablePercent: 35,
        disassemblyTimeSec: 15,
        carbonFootprintKgCO2PerKg: 3.8
      },
      {
        partId: 'P02',
        name: 'Infrared Sensor Lens Window',
        category: 'Housing/Enclosure',
        quantity: 1,
        currentMaterial: 'Polycarbonate (PC) Clear',
        massGrams: 22,
        unitCostUSD: 1.15,
        joineryType: 'Adhesive/Glued',
        tensileStrengthMPa: 62,
        maxOperatingTempC: 110,
        recyclablePercent: 25,
        disassemblyTimeSec: 60,
        carbonFootprintKgCO2PerKg: 6.2
      },
      {
        partId: 'P03',
        name: 'Internal PCB Mounting Bracket',
        category: 'Structural Frame',
        quantity: 2,
        currentMaterial: 'Virgin Nylon PA66',
        massGrams: 38,
        unitCostUSD: 0.95,
        joineryType: 'Threaded Fasteners',
        tensileStrengthMPa: 78,
        maxOperatingTempC: 130,
        recyclablePercent: 40,
        disassemblyTimeSec: 25,
        carbonFootprintKgCO2PerKg: 7.1
      },
      {
        partId: 'P04',
        name: 'Base Heat Sink Plate',
        category: 'Thermal/Heat Sink',
        quantity: 1,
        currentMaterial: 'Primary Virgin Aluminum 1100',
        massGrams: 90,
        unitCostUSD: 2.10,
        joineryType: 'Threaded Fasteners',
        tensileStrengthMPa: 90,
        maxOperatingTempC: 200,
        recyclablePercent: 80,
        disassemblyTimeSec: 20,
        carbonFootprintKgCO2PerKg: 12.5
      },
      {
        partId: 'P05',
        name: 'Antenna Strain Relief Grommet',
        category: 'Flexible/Seals',
        quantity: 1,
        currentMaterial: 'Synthetic PVC elastomer',
        massGrams: 12,
        unitCostUSD: 0.45,
        joineryType: 'Press-fit',
        tensileStrengthMPa: 18,
        maxOperatingTempC: 75,
        recyclablePercent: 10,
        disassemblyTimeSec: 10,
        carbonFootprintKgCO2PerKg: 4.2
      }
    ]
  },
  {
    id: 'ergo-chair',
    name: 'Ergonomic Office Chair Frame',
    description: 'High-load task chair backrest, armrest sub-assemblies, and base shroud',
    items: [
      {
        partId: 'C01',
        name: 'Main Seat Spine Shell',
        category: 'Structural Frame',
        quantity: 1,
        currentMaterial: 'Glass-Filled Nylon PA6-GF30',
        massGrams: 1850,
        unitCostUSD: 18.50,
        joineryType: 'Threaded Fasteners',
        tensileStrengthMPa: 145,
        maxOperatingTempC: 120,
        recyclablePercent: 20,
        disassemblyTimeSec: 90,
        carbonFootprintKgCO2PerKg: 8.8
      },
      {
        partId: 'C02',
        name: 'Lumbar Cushion Foam Core',
        category: 'Flexible/Seals',
        quantity: 1,
        currentMaterial: 'Petroleum Polyurethane Foam (PUR)',
        massGrams: 620,
        unitCostUSD: 8.20,
        joineryType: 'Adhesive/Glued',
        tensileStrengthMPa: 12,
        maxOperatingTempC: 70,
        recyclablePercent: 5,
        disassemblyTimeSec: 120,
        carbonFootprintKgCO2PerKg: 5.4
      },
      {
        partId: 'C03',
        name: 'Armrest Height Slider',
        category: 'Structural Frame',
        quantity: 2,
        currentMaterial: 'Die-cast Zinc Alloy ZAMAK-3',
        massGrams: 420,
        unitCostUSD: 5.40,
        joineryType: 'Threaded Fasteners',
        tensileStrengthMPa: 280,
        maxOperatingTempC: 150,
        recyclablePercent: 70,
        disassemblyTimeSec: 40,
        carbonFootprintKgCO2PerKg: 4.9
      }
    ]
  },
  {
    id: 'drone-frame',
    name: 'Autonomous Quadcopter Drone',
    description: 'Lightweight high-impact aerial frame, rotor guards, and gimbal mounts',
    items: [
      {
        partId: 'D01',
        name: 'Main Chassis Top Plate',
        category: 'Structural Frame',
        quantity: 1,
        currentMaterial: 'Virgin Epoxy Carbon Fiber Sheet',
        massGrams: 280,
        unitCostUSD: 24.00,
        joineryType: 'Threaded Fasteners',
        tensileStrengthMPa: 600,
        maxOperatingTempC: 130,
        recyclablePercent: 8,
        disassemblyTimeSec: 45,
        carbonFootprintKgCO2PerKg: 28.5
      },
      {
        partId: 'D02',
        name: 'Impact Rotor Bumpers',
        category: 'Housing/Enclosure',
        quantity: 4,
        currentMaterial: 'Polycarbonate/ABS Blend (PC/ABS)',
        massGrams: 110,
        unitCostUSD: 3.20,
        joineryType: 'Snap-fit',
        tensileStrengthMPa: 55,
        maxOperatingTempC: 95,
        recyclablePercent: 30,
        disassemblyTimeSec: 15,
        carbonFootprintKgCO2PerKg: 4.6
      },
      {
        partId: 'D03',
        name: 'Camera Gimbal Vibration Dampers',
        category: 'Flexible/Seals',
        quantity: 4,
        currentMaterial: 'Petrochemical TPU 85A',
        massGrams: 28,
        unitCostUSD: 1.10,
        joineryType: 'Press-fit',
        tensileStrengthMPa: 35,
        maxOperatingTempC: 80,
        recyclablePercent: 15,
        disassemblyTimeSec: 10,
        carbonFootprintKgCO2PerKg: 5.9
      }
    ]
  }
];

export const ECO_MATERIAL_DATABASE: MaterialAlternative[] = [
  {
    id: 'mat-bio-pla-recycled',
    name: 'Post-Consumer Recycled Bio-PLA (rPLA-30)',
    category: 'Housing/Enclosure',
    carbonFootprintKgCO2PerKg: 1.1,
    recyclabilityScore: 88,
    tensileStrengthMPa: 48,
    costMultiplier: 0.94,
    biobasedContentPercent: 85,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Reduces embodied carbon by 71% compared to virgin ABS while maintaining adequate tensile rigidity and snap-fit flexure.',
    source: 'curated',
    confidence: 95
  },
  {
    id: 'mat-bamboo-polycarbonate',
    name: 'Bamboo Fiber Bio-Polycarbonate Composite (30% Bio-PC)',
    category: 'Housing/Enclosure',
    carbonFootprintKgCO2PerKg: 2.2,
    recyclabilityScore: 78,
    tensileStrengthMPa: 68,
    costMultiplier: 1.05,
    biobasedContentPercent: 45,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Bio-reinforced resin provides clear transparency and high impact resistance with 64% carbon footprint reduction over petroleum PC.',
    source: 'curated',
    confidence: 92
  },
  {
    id: 'mat-recycled-aluminum-6061',
    name: '100% Recycled Secondary Aluminum (rAlu-6061)',
    category: 'Thermal/Heat Sink',
    carbonFootprintKgCO2PerKg: 1.8,
    recyclabilityScore: 98,
    tensileStrengthMPa: 110,
    costMultiplier: 0.88,
    biobasedContentPercent: 0,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Secondary recycled aluminum saves 90% energy during smelting compared to virgin bauxite ore with identical thermal conductivity.',
    source: 'curated',
    confidence: 98
  },
  {
    id: 'mat-flax-epoxy-composite',
    name: 'Bio-Based Flax Fiber Bio-Epoxy Structural Matrix',
    category: 'Structural Frame',
    carbonFootprintKgCO2PerKg: 5.2,
    recyclabilityScore: 65,
    tensileStrengthMPa: 380,
    costMultiplier: 1.12,
    biobasedContentPercent: 60,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'Moderate',
    reasoning: 'Natural flax weave replacing carbon fiber slashes carbon intensity by 81% while providing exceptional vibration damping for structural arms.',
    source: 'curated',
    confidence: 88
  },
  {
    id: 'mat-algae-tpu',
    name: 'Bloom® Algae-Based Thermoplastic Elastomer (Bio-TPU)',
    category: 'Flexible/Seals',
    carbonFootprintKgCO2PerKg: 1.4,
    recyclabilityScore: 82,
    tensileStrengthMPa: 32,
    costMultiplier: 0.98,
    biobasedContentPercent: 55,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Sequesters toxic algae blooms into flexible grommets, completely phasing out hazardous PVC plasticizers.',
    source: 'curated',
    confidence: 90
  },
  {
    id: 'mat-mycelium-foam',
    name: 'Mycelium Organic Bio-Foam Core',
    category: 'Flexible/Seals',
    carbonFootprintKgCO2PerKg: 0.4,
    recyclabilityScore: 99,
    tensileStrengthMPa: 14,
    costMultiplier: 0.82,
    biobasedContentPercent: 100,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Grown from agricultural byproduct and mushroom roots; 100% home-compostable core replacing toxic polyurethane foam.',
    source: 'curated',
    confidence: 96
  }
];

export const KAGGLE_MATERIAL_DATABASE: MaterialAlternative[] = [
  {
    id: 'kaggle-green-pa11',
    name: 'Kaggle DB: Rilsan® PA11 Bio-Polyamide (Castor Seed)',
    category: 'Structural Frame',
    carbonFootprintKgCO2PerKg: 3.2,
    recyclabilityScore: 85,
    tensileStrengthMPa: 85,
    costMultiplier: 1.08,
    biobasedContentPercent: 100,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Extracted from Kaggle Green Supply Chain Dataset v2. 100% renewable castor bean origin replacing virgin petrochemical PA66.',
    source: 'kaggle',
    confidence: 82
  },
  {
    id: 'kaggle-hemp-polypropylene',
    name: 'Kaggle DB: Hemp Fiber Reinforced Bio-PP Composite',
    category: 'Housing/Enclosure',
    carbonFootprintKgCO2PerKg: 1.6,
    recyclabilityScore: 80,
    tensileStrengthMPa: 52,
    costMultiplier: 0.92,
    biobasedContentPercent: 40,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Extracted from Kaggle Industrial Materials Index. Industrial hemp biomass reinforces structural stiffness while keeping cost low.',
    source: 'kaggle',
    confidence: 80
  },
  {
    id: 'kaggle-recycled-zinc',
    name: 'Kaggle DB: Secondary Recycled Die-Cast Zinc Alloy (rZAMAK)',
    category: 'Structural Frame',
    carbonFootprintKgCO2PerKg: 1.9,
    recyclabilityScore: 95,
    tensileStrengthMPa: 275,
    costMultiplier: 0.90,
    biobasedContentPercent: 0,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'High',
    reasoning: 'Matched via Kaggle Green Metallurgy spectrum. 60% lower melting footprint than primary virgin zinc ingots.',
    source: 'kaggle',
    confidence: 85
  }
];

export const WEB_SEARCH_MATERIAL_DATABASE: MaterialAlternative[] = [
  {
    id: 'web-lignin-resin',
    name: 'Web Research: Bio-Lignin Thermoplastic Polymer (Arboform®)',
    category: 'Housing/Enclosure',
    carbonFootprintKgCO2PerKg: 0.8,
    recyclabilityScore: 90,
    tensileStrengthMPa: 40,
    costMultiplier: 0.98,
    biobasedContentPercent: 95,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'Moderate',
    reasoning: 'Researched live via Web Search fallback. Liquid wood derived from papermaking byproduct pulp; fully biodegradable.',
    source: 'web',
    confidence: 72
  },
  {
    id: 'web-citrus-pectin-film',
    name: 'Web Research: Bio-Pectin Citrus Waste Elastomer Seal',
    category: 'Flexible/Seals',
    carbonFootprintKgCO2PerKg: 0.6,
    recyclabilityScore: 92,
    tensileStrengthMPa: 22,
    costMultiplier: 0.95,
    biobasedContentPercent: 90,
    toxicityIndex: 'Low (Non-Toxic)',
    supplyAvailabilityIndex: 'Moderate',
    reasoning: 'Researched live via Web Search. Synthesized from upcycled agricultural orange peels for flexible waterproofing grommets.',
    source: 'web',
    confidence: 68
  }
];

