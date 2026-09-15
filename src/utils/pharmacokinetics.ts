export interface SubstanceProfile {
  id: string;
  name: string;
  category: 'testosterone' | 'aas' | 'hcg' | 'oral' | 'other';
  halfLifeDays: number;
  timeToPeakHours: number;
  unit: 'mg' | 'IU';
  defaultDose: number;
  recommendedFrequencyDays: number;
  description: string;
  stabilityAdvice: string;
  route: 'IM' | 'SC' | 'Oral';
}

export const SUBSTANCE_PROFILES: SubstanceProfile[] = [
  {
    id: 'test_enanthat',
    name: 'Testosteron Enanthat',
    category: 'testosterone',
    halfLifeDays: 4.5,
    timeToPeakHours: 24,
    unit: 'mg',
    defaultDose: 250,
    recommendedFrequencyDays: 3.5,
    description: 'Popularny długi ester testosteronu.',
    stabilityAdvice: 'Iniekcje 2 razy w tygodniu (co 3.5 dnia) gwarantują wysoką stabilność hormonalną.',
    route: 'IM'
  },
  {
    id: 'test_cypionat',
    name: 'Testosteron Cypionat',
    category: 'testosterone',
    halfLifeDays: 5.0,
    timeToPeakHours: 24,
    unit: 'mg',
    defaultDose: 200,
    recommendedFrequencyDays: 3.5,
    description: 'Długi ester powszechny w protokołach TRT.',
    stabilityAdvice: 'Zalecana częstotliwość co 3.5–4 dni.',
    route: 'IM'
  },
  {
    id: 'test_propionat',
    name: 'Testosteron Propionat',
    category: 'testosterone',
    halfLifeDays: 0.8,
    timeToPeakHours: 12,
    unit: 'mg',
    defaultDose: 100,
    recommendedFrequencyDays: 1.0,
    description: 'Krótki ester testosteronu o szybkiej kinetyce.',
    stabilityAdvice: 'Wymaga częstych iniekcji (ED lub EOD) aby uniknąć znacznych wahań.',
    route: 'IM'
  },
  {
    id: 'hcg_gonadotropin',
    name: 'HCG (Choriogonadotropina)',
    category: 'hcg',
    halfLifeDays: 1.25,
    timeToPeakHours: 12,
    unit: 'IU',
    defaultDose: 250,
    recommendedFrequencyDays: 3.5,
    description: 'Podtrzymanie syntezy wewnątrzjądrowej i płodności.',
    stabilityAdvice: 'Dawkowanie 250-500 IU podskórnie (SC) co 3.5 dnia.',
    route: 'SC'
  },
  {
    id: 'npp_nandrolone',
    name: 'NPP (Nandrolon Phenylpropionat)',
    category: 'aas',
    halfLifeDays: 1.5,
    timeToPeakHours: 16,
    unit: 'mg',
    defaultDose: 150,
    recommendedFrequencyDays: 2.0,
    description: 'Krótki ester nandrolonu.',
    stabilityAdvice: 'Podawaj co 2 dni (EOD) dla ustabilizowania poziomu we krwi.',
    route: 'IM'
  },
  {
    id: 'deca_nandrolone',
    name: 'Deca (Nandrolon Decanoat)',
    category: 'aas',
    halfLifeDays: 7.0,
    timeToPeakHours: 48,
    unit: 'mg',
    defaultDose: 200,
    recommendedFrequencyDays: 5.0,
    description: 'Bardzo długi ester nandrolonu.',
    stabilityAdvice: 'Iniekcje co 5-7 dni.',
    route: 'IM'
  },
  {
    id: 'masteron_propionat',
    name: 'Masteron Propionat (Drostanolon)',
    category: 'aas',
    halfLifeDays: 0.8,
    timeToPeakHours: 12,
    unit: 'mg',
    defaultDose: 100,
    recommendedFrequencyDays: 2.0,
    description: 'Krótki ester drostanolonu.',
    stabilityAdvice: 'Podawaj co 2 dni (EOD).',
    route: 'IM'
  },
  {
    id: 'masteron_enanthat',
    name: 'Masteron Enanthat',
    category: 'aas',
    halfLifeDays: 4.5,
    timeToPeakHours: 24,
    unit: 'mg',
    defaultDose: 200,
    recommendedFrequencyDays: 3.5,
    description: 'Długi ester drostanolonu idealny do łączenia z Enanthatem Testosteronu.',
    stabilityAdvice: 'Podawaj co 3.5 dnia.',
    route: 'IM'
  },
  {
    id: 'primobolan_enanthat',
    name: 'Primobolan Enanthat (Methenolon)',
    category: 'aas',
    halfLifeDays: 5.0,
    timeToPeakHours: 24,
    unit: 'mg',
    defaultDose: 200,
    recommendedFrequencyDays: 3.5,
    description: 'Łagodny preparat anaboliczny o niskim ryzyku aromatyzacji.',
    stabilityAdvice: 'Iniekcje co 3.5 dnia.',
    route: 'IM'
  },
  {
    id: 'anavar_oxandrolone',
    name: 'Anavar (Oxandrolon)',
    category: 'oral',
    halfLifeDays: 0.375,
    timeToPeakHours: 2,
    unit: 'mg',
    defaultDose: 40,
    recommendedFrequencyDays: 1.0,
    description: 'Doustna substancja o bardzo krótkim czasie półtrwania.',
    stabilityAdvice: 'Bierz codziennie (ED) lub w 2 dawkach podzielonych.',
    route: 'Oral'
  },
  {
    id: 'tren_acetate',
    name: 'Trenbolon Acetate',
    category: 'aas',
    halfLifeDays: 1.0,
    timeToPeakHours: 12,
    unit: 'mg',
    defaultDose: 150,
    recommendedFrequencyDays: 1.0,
    description: 'Silny preparat o krótkim estrze.',
    stabilityAdvice: 'Iniekcje codziennie (ED) lub co 2 dni (EOD).',
    route: 'IM'
  }
];

export function calculateDecayLevel(
  dose: number,
  elapsedHours: number,
  halfLifeHours: number,
  timeToPeakHours: number = 24
): number {
  if (elapsedHours < 0) return 0;

  const ke = Math.LN2 / halfLifeHours;
  const ka = Math.LN2 / Math.max(2, timeToPeakHours * 0.4);

  if (Math.abs(ka - ke) < 0.0001) {
    return dose * ka * elapsedHours * Math.exp(-ke * elapsedHours);
  }

  const fraction = (ka / (ka - ke)) * (Math.exp(-ke * elapsedHours) - Math.exp(-ka * elapsedHours));
  return Math.max(0, dose * fraction);
}

export function simulateSteadyState(
  dosePerShot: number,
  intervalDays: number,
  halfLifeDays: number,
  timeToPeakHours: number,
  simulationDays: number = 28
) {
  const stepHours = 6;
  const totalHours = simulationDays * 24;
  const intervalHours = intervalDays * 24;
  const halfLifeHours = halfLifeDays * 24;

  const injectionTimes: number[] = [];
  for (let h = 0; h <= totalHours; h += intervalHours) {
    injectionTimes.push(h);
  }

  const points = [];
  for (let h = 0; h <= totalHours; h += stepHours) {
    let level = 0;
    const isInjection = injectionTimes.includes(h);

    for (const injH of injectionTimes) {
      if (h >= injH) {
        level += calculateDecayLevel(dosePerShot, h - injH, halfLifeHours, timeToPeakHours);
      }
    }

    points.push({
      timeHours: h,
      timeDays: Math.round((h / 24) * 10) / 10,
      level: Math.round(level * 10) / 10,
      isInjection
    });
  }

  return points;
}

export function compareFrequencies(
  weeklyDose: number,
  halfLifeDays: number,
  timeToPeakHours: number
) {
  const frequencies = [
    { label: 'Codziennie (ED)', days: 1.0 },
    { label: 'Co 2 dni (EOD)', days: 2.0 },
    { label: 'Co 3.5 dnia (2x/tyg)', days: 3.5 },
    { label: 'Co 4 dni', days: 4.0 },
    { label: 'Co 5 dni', days: 5.0 },
    { label: 'Co 7 dni (1x/tyg)', days: 7.0 }
  ];

  return frequencies.map((freq) => {
    const dosePerInjection = Math.round((weeklyDose * (freq.days / 7)) * 10) / 10;
    const curve = simulateSteadyState(dosePerInjection, freq.days, halfLifeDays, timeToPeakHours, 28);
    const steadyStateCurve = curve.filter((p) => p.timeDays >= 14);

    const levels = steadyStateCurve.map((p) => p.level);
    const peak = levels.length > 0 ? Math.max(...levels) : dosePerInjection;
    const trough = levels.length > 0 ? Math.min(...levels) : dosePerInjection * 0.5;
    const average = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : dosePerInjection * 0.75;

    const ratio = trough > 0 ? Math.round((peak / trough) * 100) / 100 : 1;
    const fluctuationPct = trough > 0 ? Math.round(((peak - trough) / trough) * 100) : 0;

    let stabilityScore: 'DOSKONAŁA' | 'DOBRA' | 'ŚREDNIA' | 'NISKA' = 'DOSKONAŁA';
    let scoreColor = 'text-emerald-400';

    if (ratio <= 1.35) {
      stabilityScore = 'DOSKONAŁA';
      scoreColor = 'text-emerald-400';
    } else if (ratio <= 1.75) {
      stabilityScore = 'DOBRA';
      scoreColor = 'text-teal-400';
    } else if (ratio <= 2.3) {
      stabilityScore = 'ŚREDNIA';
      scoreColor = 'text-amber-400';
    } else {
      stabilityScore = 'NISKA';
      scoreColor = 'text-rose-400';
    }

    return {
      frequencyLabel: freq.label,
      frequencyDays: freq.days,
      dosePerInjection,
      peak: Math.round(peak * 10) / 10,
      trough: Math.round(trough * 10) / 10,
      average: Math.round(average * 10) / 10,
      peakToTroughRatio: ratio,
      fluctuationPct,
      stabilityScore,
      scoreColor
    };
  });
}

export interface StackCompound {
  id: string;
  profileId: string;
  weeklyDose: number;
  intervalDays: number;
  color: string;
  enabled: boolean;
}

export interface StackPoint {
  timeHours: number;
  timeDays: number;
  dateStr: string;
  compoundLevels: Record<string, number>;
  injections: Record<string, number>;
  totalAasLevel: number;
}

export interface StackPreset {
  id: string;
  name: string;
  description: string;
  compounds: Omit<StackCompound, 'id'>[];
}

export const STACK_COLORS = [
  '#10b981', // Emerald
  '#0ea5e9', // Sky Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#ec4899', // Pink
  '#6366f1'  // Indigo
];

export const STACK_PRESETS: StackPreset[] = [
  {
    id: 'trt_hcg',
    name: 'TRT + HCG (Złoty Standard)',
    description: 'Baza testosteronowa + podtrzymanie pracy jąder i płodności poprzez HCG.',
    compounds: [
      {
        profileId: 'test_cypionat',
        weeklyDose: 140,
        intervalDays: 3.5,
        color: '#10b981',
        enabled: true
      },
      {
        profileId: 'hcg_gonadotropin',
        weeklyDose: 500,
        intervalDays: 3.5,
        color: '#0ea5e9',
        enabled: true
      }
    ]
  },
  {
    id: 'test_npp_bulk',
    name: 'Testosteron + NPP (Blok Masowy)',
    description: 'Szybki ester testosteronu i fenylopropionianu nandrolonu (NPP) dla szybkiej kinetyki.',
    compounds: [
      {
        profileId: 'test_enanthat',
        weeklyDose: 350,
        intervalDays: 3.5,
        color: '#10b981',
        enabled: true
      },
      {
        profileId: 'npp_nandrolone',
        weeklyDose: 200,
        intervalDays: 2.0,
        color: '#8b5cf6',
        enabled: true
      }
    ]
  },
  {
    id: 'test_masteron_cut',
    name: 'Testosteron + Masteron (Cięcie / Rzeźba)',
    description: 'Połączenie estru enanthatu testosteronu i masteronu podawane w te same dni (np. Pn/Czw).',
    compounds: [
      {
        profileId: 'test_enanthat',
        weeklyDose: 250,
        intervalDays: 3.5,
        color: '#10b981',
        enabled: true
      },
      {
        profileId: 'masteron_enanthat',
        weeklyDose: 200,
        intervalDays: 3.5,
        color: '#f59e0b',
        enabled: true
      }
    ]
  },
  {
    id: 'test_primo_quality',
    name: 'Testosteron + Primobolan (Lean Mass & E2 Control)',
    description: 'Czysta jakość, Primobolan działa jak łagodny inhibitor aromatazy i stabilizuje estrogen.',
    compounds: [
      {
        profileId: 'test_enanthat',
        weeklyDose: 300,
        intervalDays: 3.5,
        color: '#10b981',
        enabled: true
      },
      {
        profileId: 'primobolan_enanthat',
        weeklyDose: 300,
        intervalDays: 3.5,
        color: '#14b8a6',
        enabled: true
      }
    ]
  },
  {
    id: 'test_deca_classic',
    name: 'Testosteron + Deca (Klasyczny Oldschool)',
    description: 'Długie estry enanthatu i dekanianu nandrolonu na stawy i gęstość mięśniową.',
    compounds: [
      {
        profileId: 'test_enanthat',
        weeklyDose: 300,
        intervalDays: 3.5,
        color: '#10b981',
        enabled: true
      },
      {
        profileId: 'deca_nandrolone',
        weeklyDose: 200,
        intervalDays: 5.0,
        color: '#8b5cf6',
        enabled: true
      }
    ]
  },
  {
    id: 'test_oxandrolone_cut',
    name: 'Testosteron + Anavar / Oxandrolone',
    description: 'Baza testosteronowa w iniekcji + doustny Anavar (krótki t½ 9h) na siłę i rzeźbę.',
    compounds: [
      {
        profileId: 'test_enanthat',
        weeklyDose: 250,
        intervalDays: 3.5,
        color: '#10b981',
        enabled: true
      },
      {
        profileId: 'anavar_oxandrolone',
        weeklyDose: 280,
        intervalDays: 1.0,
        color: '#f43f5e',
        enabled: true
      }
    ]
  },
  {
    id: 'test_tren_masteron_comp',
    name: 'Testosteron + Trenbolon + Masteron (Tri-Stack)',
    description: 'Trzy odrębne substancje zsynchronizowane w cyklu pod docięcie i max twardość.',
    compounds: [
      {
        profileId: 'test_propionat',
        weeklyDose: 175,
        intervalDays: 2.0,
        color: '#10b981',
        enabled: true
      },
      {
        profileId: 'tren_acetate',
        weeklyDose: 175,
        intervalDays: 2.0,
        color: '#f43f5e',
        enabled: true
      },
      {
        profileId: 'masteron_propionat',
        weeklyDose: 210,
        intervalDays: 2.0,
        color: '#f59e0b',
        enabled: true
      }
    ]
  }
];

/**
 * Simulates a multi-substance stack simultaneously on a single unified timeline
 */
export function simulateMultiSubstanceStack(
  compounds: StackCompound[],
  simulationDays: number = 28
): {
  points: StackPoint[];
  compoundStats: Record<
    string,
    {
      profile: SubstanceProfile;
      dosePerShot: number;
      peak: number;
      trough: number;
      average: number;
      peakToTroughRatio: number;
      fluctuationPct: number;
    }
  >;
  totalAasPeak: number;
  totalAasTrough: number;
  totalWeeklyAasMg: number;
} {
  const points: StackPoint[] = [];
  const stepHours = 6;
  const totalHours = simulationDays * 24;
  const now = new Date();

  // Prepare active compound meta
  const activeConfigs = compounds
    .filter((c) => c.enabled)
    .map((c) => {
      const profile = SUBSTANCE_PROFILES.find((p) => p.id === c.profileId) || SUBSTANCE_PROFILES[0];
      const dosePerShot = Math.round((c.weeklyDose * (c.intervalDays / 7)) * 10) / 10;
      const intervalHours = c.intervalDays * 24;
      const halfLifeHours = profile.halfLifeDays * 24;

      const injectionTimes: number[] = [];
      for (let h = 0; h <= totalHours; h += intervalHours) {
        injectionTimes.push(h);
      }

      return {
        compound: c,
        profile,
        dosePerShot,
        injectionTimes,
        halfLifeHours,
        timeToPeakHours: profile.timeToPeakHours
      };
    });

  let totalWeeklyAasMg = 0;
  activeConfigs.forEach((cfg) => {
    if (cfg.profile.unit === 'mg' && cfg.profile.category !== 'hcg') {
      totalWeeklyAasMg += cfg.compound.weeklyDose;
    }
  });

  // Timeline loop
  for (let h = 0; h <= totalHours; h += stepHours) {
    const compoundLevels: Record<string, number> = {};
    const injections: Record<string, number> = {};
    let totalAasLevel = 0;

    for (const cfg of activeConfigs) {
      let level = 0;
      const isInj = cfg.injectionTimes.includes(h);
      if (isInj) {
        injections[cfg.compound.id] = cfg.dosePerShot;
      }

      for (const injH of cfg.injectionTimes) {
        if (h >= injH) {
          level += calculateDecayLevel(
            cfg.dosePerShot,
            h - injH,
            cfg.halfLifeHours,
            cfg.timeToPeakHours
          );
        }
      }

      const roundedLevel = Math.round(level * 10) / 10;
      compoundLevels[cfg.compound.id] = roundedLevel;

      if (cfg.profile.unit === 'mg' && cfg.profile.category !== 'hcg') {
        totalAasLevel += roundedLevel;
      }
    }

    const pointDate = new Date(now.getTime() + h * 3600 * 1000);
    const dateStr = pointDate.toISOString().split('T')[0];

    points.push({
      timeHours: h,
      timeDays: Math.round((h / 24) * 10) / 10,
      dateStr,
      compoundLevels,
      injections,
      totalAasLevel: Math.round(totalAasLevel * 10) / 10
    });
  }

  // Calculate per-compound steady-state statistics (from the last 14 days)
  const compoundStats: Record<
    string,
    {
      profile: SubstanceProfile;
      dosePerShot: number;
      peak: number;
      trough: number;
      average: number;
      peakToTroughRatio: number;
      fluctuationPct: number;
    }
  > = {};

  const steadyPoints = points.filter((p) => p.timeHours >= Math.max(0, totalHours - 14 * 24));

  for (const cfg of activeConfigs) {
    const vals = steadyPoints.map((p) => p.compoundLevels[cfg.compound.id] || 0);
    const peak = vals.length > 0 ? Math.max(...vals) : cfg.dosePerShot;
    const trough = vals.length > 0 ? Math.min(...vals) : cfg.dosePerShot * 0.5;
    const average = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : cfg.dosePerShot * 0.75;
    const ratio = trough > 0 ? Math.round((peak / trough) * 100) / 100 : 1;
    const fluctuationPct = trough > 0 ? Math.round(((peak - trough) / trough) * 100) : 0;

    compoundStats[cfg.compound.id] = {
      profile: cfg.profile,
      dosePerShot: cfg.dosePerShot,
      peak: Math.round(peak * 10) / 10,
      trough: Math.round(trough * 10) / 10,
      average: Math.round(average * 10) / 10,
      peakToTroughRatio: ratio,
      fluctuationPct
    };
  }

  const totalAasVals = steadyPoints.map((p) => p.totalAasLevel);
  const totalAasPeak = totalAasVals.length > 0 ? Math.round(Math.max(...totalAasVals) * 10) / 10 : 0;
  const totalAasTrough = totalAasVals.length > 0 ? Math.round(Math.min(...totalAasVals) * 10) / 10 : 0;

  return {
    points,
    compoundStats,
    totalAasPeak,
    totalAasTrough,
    totalWeeklyAasMg
  };
}
