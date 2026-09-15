import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Clock, 
  Layers, 
  Sliders, 
  Zap, 
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  GitMerge,
  Eye,
  EyeOff,
  Dumbbell
} from 'lucide-react';
import { ProtocolEntry } from '../types';
import { 
  SUBSTANCE_PROFILES, 
  SubstanceProfile, 
  simulateSteadyState, 
  compareFrequencies, 
  calculateDecayLevel,
  StackCompound,
  STACK_COLORS,
  STACK_PRESETS,
  simulateMultiSubstanceStack
} from '../utils/pharmacokinetics';

interface BloodConcentrationCalculatorProps {
  protocolEntries: ProtocolEntry[];
  theme?: 'dark' | 'light';
}

export const BloodConcentrationCalculator: React.FC<BloodConcentrationCalculatorProps> = ({
  protocolEntries = [],
  theme = 'dark'
}) => {
  // Mode selection:
  // - "stack": Multi-compound stack simulator (Łączenie substancji)
  // - "single": Single ester deep-dive with frequency comparison table
  // - "real_log": Actual blood curve from user's logged doses
  const [mode, setMode] = useState<'stack' | 'single' | 'real_log'>('stack');

  // =========================================================================
  // 1. MULTI-COMPOUND STACK STATE (ŁĄCZENIE SUBSTANCJI)
  // =========================================================================
  const [stackCompounds, setStackCompounds] = useState<StackCompound[]>([
    {
      id: 'stack-c1',
      profileId: 'test_enanthat',
      weeklyDose: 250,
      intervalDays: 3.5,
      color: STACK_COLORS[0],
      enabled: true
    },
    {
      id: 'stack-c2',
      profileId: 'masteron_enanthat',
      weeklyDose: 200,
      intervalDays: 3.5,
      color: STACK_COLORS[3],
      enabled: true
    }
  ]);

  const [showTotalAasCurve, setShowTotalAasCurve] = useState<boolean>(true);
  const [hoveredStackIndex, setHoveredStackIndex] = useState<number | null>(null);

  // Run multi-substance simulation
  const stackSimulation = useMemo(() => {
    return simulateMultiSubstanceStack(stackCompounds, 28);
  }, [stackCompounds]);

  // Stack handlers
  const handleAddCompoundToStack = () => {
    if (stackCompounds.length >= 6) return;
    const usedProfiles = stackCompounds.map((c) => c.profileId);
    const nextProfile = SUBSTANCE_PROFILES.find((p) => !usedProfiles.includes(p.id)) || SUBSTANCE_PROFILES[0];
    const nextColor = STACK_COLORS[stackCompounds.length % STACK_COLORS.length];

    const newCompound: StackCompound = {
      id: `stack-c${Date.now()}`,
      profileId: nextProfile.id,
      weeklyDose: nextProfile.defaultDose,
      intervalDays: nextProfile.recommendedFrequencyDays,
      color: nextColor,
      enabled: true
    };

    setStackCompounds([...stackCompounds, newCompound]);
  };

  const handleRemoveCompoundFromStack = (id: string) => {
    if (stackCompounds.length <= 1) return;
    setStackCompounds(stackCompounds.filter((c) => c.id !== id));
  };

  const handleUpdateStackCompound = (id: string, updates: Partial<StackCompound>) => {
    setStackCompounds(
      stackCompounds.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };
        // If profile changed, adjust default recommended interval if needed
        if (updates.profileId && updates.profileId !== c.profileId) {
          const prof = SUBSTANCE_PROFILES.find((p) => p.id === updates.profileId);
          if (prof) {
            updated.intervalDays = prof.recommendedFrequencyDays;
            updated.weeklyDose = prof.defaultDose;
          }
        }
        return updated;
      })
    );
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = STACK_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setStackCompounds(
      preset.compounds.map((c, i) => ({
        ...c,
        id: `stack-p-${i}-${Date.now()}`
      }))
    );
  };

  // =========================================================================
  // 2. SINGLE ESTER SIMULATION STATE
  // =========================================================================
  const [singleProfileId, setSingleProfileId] = useState<string>('test_enanthat');
  const singleProfile: SubstanceProfile = useMemo(() => {
    return SUBSTANCE_PROFILES.find((p) => p.id === singleProfileId) || SUBSTANCE_PROFILES[0];
  }, [singleProfileId]);

  const [singleWeeklyDose, setSingleWeeklyDose] = useState<number>(250);
  const [singleIntervalDays, setSingleIntervalDays] = useState<number>(3.5);
  const [hoveredSingleIndex, setHoveredSingleIndex] = useState<number | null>(null);

  const singleDosePerShot = Math.round((singleWeeklyDose * (singleIntervalDays / 7)) * 10) / 10;

  const singleSimulationCurve = useMemo(() => {
    return simulateSteadyState(
      singleDosePerShot,
      singleIntervalDays,
      singleProfile.halfLifeDays,
      singleProfile.timeToPeakHours,
      28
    );
  }, [singleDosePerShot, singleIntervalDays, singleProfile]);

  const singleComparisons = useMemo(() => {
    return compareFrequencies(
      singleWeeklyDose,
      singleProfile.halfLifeDays,
      singleProfile.timeToPeakHours
    );
  }, [singleWeeklyDose, singleProfile]);

  const singleActiveComparison =
    singleComparisons.find((c) => Math.abs(c.frequencyDays - singleIntervalDays) < 0.1) ||
    singleComparisons[2];

  // =========================================================================
  // 3. REAL LOG MULTI-SUBSTANCE STATE
  // =========================================================================
  // Find distinct logged substances in protocolEntries
  const distinctLoggedSubstances = useMemo(() => {
    const map = new Map<string, { count: number; matchedProfile: SubstanceProfile; color: string }>();
    protocolEntries.forEach((e) => {
      const rawSub = e.substance.trim();
      if (!rawSub) return;
      if (!map.has(rawSub)) {
        // match to closest profile
        const lower = rawSub.toLowerCase();
        const matched =
          SUBSTANCE_PROFILES.find((p) => {
            const pLower = p.name.toLowerCase();
            return (
              (lower.includes('test') && pLower.includes('test')) ||
              (lower.includes('hcg') && pLower.includes('hcg')) ||
              (lower.includes('nand') && pLower.includes('nand')) ||
              (lower.includes('mast') && pLower.includes('mast')) ||
              (lower.includes('primo') && pLower.includes('primo')) ||
              (lower.includes('oxa') || lower.includes('anavar')) && pLower.includes('anavar')
            );
          }) || SUBSTANCE_PROFILES[0];

        const color = STACK_COLORS[map.size % STACK_COLORS.length];
        map.set(rawSub, { count: 1, matchedProfile: matched, color });
      } else {
        const item = map.get(rawSub)!;
        item.count += 1;
      }
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [protocolEntries]);

  const [selectedLoggedSubstances, setSelectedLoggedSubstances] = useState<string[]>([]);
  const [showTotalRealLogCurve, setShowTotalRealLogCurve] = useState<boolean>(true);

  // Initialize selection when entries change
  React.useEffect(() => {
    if (distinctLoggedSubstances.length > 0 && selectedLoggedSubstances.length === 0) {
      setSelectedLoggedSubstances(distinctLoggedSubstances.map((s) => s.name));
    }
  }, [distinctLoggedSubstances]);

  const [hoveredLogIndex, setHoveredLogIndex] = useState<number | null>(null);

  const handleAddSingleToStack = (profileId: string, weeklyDose: number, intervalDays: number) => {
    if (stackCompounds.length >= 6) return;
    const profile = SUBSTANCE_PROFILES.find((p) => p.id === profileId) || SUBSTANCE_PROFILES[0];
    const newCompound: StackCompound = {
      id: `stack-c-${Date.now()}`,
      profileId: profile.id,
      weeklyDose,
      intervalDays,
      color: STACK_COLORS[stackCompounds.length % STACK_COLORS.length],
      enabled: true
    };
    setStackCompounds([...stackCompounds, newCompound]);
    setMode('stack');
  };

  // Multi-substance real log curve
  const realLogMultiCurve = useMemo(() => {
    if (mode !== 'real_log' || protocolEntries.length === 0 || selectedLoggedSubstances.length === 0) {
      return { points: [], substances: [] };
    }

    const filteredEntries = protocolEntries
      .filter((e) => selectedLoggedSubstances.includes(e.substance.trim()))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    if (filteredEntries.length === 0) return { points: [], substances: [] };

    const firstDate = new Date(filteredEntries[0].date + 'T00:00:00');
    const lastDate = new Date(filteredEntries[filteredEntries.length - 1].date + 'T00:00:00');
    const totalDays = Math.max(14, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)) + 10);

    const stepHours = 12;
    const totalHours = totalDays * 24;

    const points = [];
    for (let h = 0; h <= totalHours; h += stepHours) {
      const currentPointDate = new Date(firstDate.getTime() + h * 3600 * 1000);
      const dateStr = currentPointDate.toISOString().split('T')[0];

      const levels: Record<string, number> = {};
      const injections: Record<string, number> = {};
      let totalLogLevel = 0;

      selectedLoggedSubstances.forEach((subName) => {
        const subMeta = distinctLoggedSubstances.find((s) => s.name === subName);
        const profile = subMeta ? subMeta.matchedProfile : SUBSTANCE_PROFILES[0];
        const halfLifeHours = profile.halfLifeDays * 24;

        let subLevel = 0;
        let subInj = 0;

        const subEntries = filteredEntries.filter((e) => e.substance.trim() === subName);
        for (const entry of subEntries) {
          const entryDate = new Date(`${entry.date}T${entry.time || '08:00'}:00`);
          const elapsedH = (currentPointDate.getTime() - entryDate.getTime()) / (1000 * 3600);
          if (elapsedH >= 0) {
            subLevel += calculateDecayLevel(
              entry.dosage,
              elapsedH,
              halfLifeHours,
              profile.timeToPeakHours
            );
          }
          if (Math.abs(elapsedH) < stepHours / 2) {
            subInj += entry.dosage;
          }
        }

        const roundedSub = Math.round(subLevel * 10) / 10;
        levels[subName] = roundedSub;
        if (profile.unit === 'mg' && profile.category !== 'hcg') {
          totalLogLevel += roundedSub;
        }
        if (subInj > 0) injections[subName] = subInj;
      });

      points.push({
        timeHours: h,
        timeDays: Math.round((h / 24) * 10) / 10,
        dateStr,
        levels,
        injections,
        totalLogLevel: Math.round(totalLogLevel * 10) / 10
      });
    }

    return { points, substances: selectedLoggedSubstances };
  }, [mode, protocolEntries, selectedLoggedSubstances, distinctLoggedSubstances]);

  // =========================================================================
  // CHART RENDERING HELPERS
  // =========================================================================
  const chartW = 760;
  const chartH = 280;
  const padLeft = 52;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 42;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  // Compute SVG coordinates for Stack Mode
  const stackSvgData = useMemo(() => {
    const pts = stackSimulation.points;
    if (pts.length === 0) return null;

    let maxVal = 10;
    pts.forEach((p) => {
      if (showTotalAasCurve && p.totalAasLevel > maxVal) maxVal = p.totalAasLevel;
      Object.values(p.compoundLevels).forEach((val: number) => {
        if (val > maxVal) maxVal = val;
      });
    });

    const rangeY = maxVal * 1.15 || 1;

    const scaledPoints = pts.map((p, idx) => {
      const x = pts.length > 1 ? padLeft + (idx / (pts.length - 1)) * innerW : padLeft + innerW / 2;
      const compoundYs: Record<string, number> = {};
      Object.entries(p.compoundLevels).forEach(([id, val]: [string, number]) => {
        compoundYs[id] = padTop + innerH - (val / rangeY) * innerH;
      });
      const totalAasY = padTop + innerH - (p.totalAasLevel / rangeY) * innerH;

      return {
        ...p,
        x,
        compoundYs,
        totalAasY
      };
    });

    // Paths per compound
    const paths: Record<string, string> = {};
    stackCompounds
      .filter((c) => c.enabled)
      .forEach((c) => {
        paths[c.id] = scaledPoints.reduce(
          (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.compoundYs[c.id]}` : `${acc} L ${pt.x},${pt.compoundYs[c.id]}`),
          ''
        );
      });

    const totalAasPath = scaledPoints.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.totalAasY}` : `${acc} L ${pt.x},${pt.totalAasY}`),
      ''
    );

    return {
      scaledPoints,
      paths,
      totalAasPath,
      rangeY,
      maxVal
    };
  }, [stackSimulation, stackCompounds, showTotalAasCurve, innerW, innerH]);

  // Compute SVG coordinates for Single Mode
  const singleSvgData = useMemo(() => {
    const pts = singleSimulationCurve;
    if (pts.length === 0) return null;
    const maxVal = Math.max(...pts.map((p) => p.level), 10);
    const rangeY = maxVal * 1.15 || 1;

    const scaled = pts.map((p, idx) => {
      const x = pts.length > 1 ? padLeft + (idx / (pts.length - 1)) * innerW : padLeft + innerW / 2;
      const y = padTop + innerH - (p.level / rangeY) * innerH;
      return { ...p, x, y };
    });

    const pathD = scaled.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '');
    return { scaled, pathD, rangeY, maxVal };
  }, [singleSimulationCurve, innerW, innerH]);

  // Compute SVG coordinates for Real Log Mode
  const realLogSvgData = useMemo(() => {
    const pts = realLogMultiCurve.points;
    if (pts.length === 0) return null;

    let maxVal = 10;
    pts.forEach((p) => {
      if (showTotalRealLogCurve && p.totalLogLevel > maxVal) maxVal = p.totalLogLevel;
      Object.values(p.levels).forEach((val: number) => {
        if (val > maxVal) maxVal = val;
      });
    });

    const rangeY = maxVal * 1.15 || 1;

    const scaled = pts.map((p, idx) => {
      const x = pts.length > 1 ? padLeft + (idx / (pts.length - 1)) * innerW : padLeft + innerW / 2;
      const ys: Record<string, number> = {};
      Object.entries(p.levels).forEach(([name, val]: [string, number]) => {
        ys[name] = padTop + innerH - (val / rangeY) * innerH;
      });
      const totalY = padTop + innerH - (p.totalLogLevel / rangeY) * innerH;
      return { ...p, x, ys, totalY };
    });

    const paths: Record<string, string> = {};
    realLogMultiCurve.substances.forEach((subName) => {
      paths[subName] = scaled.reduce(
        (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.ys[subName]}` : `${acc} L ${pt.x},${pt.ys[subName]}`),
        ''
      );
    });

    const totalPath = scaled.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.totalY}` : `${acc} L ${pt.x},${pt.totalY}`),
      ''
    );

    return { scaled, paths, totalPath, rangeY, maxVal };
  }, [realLogMultiCurve, showTotalRealLogCurve, innerW, innerH]);

  return (
    <div className="space-y-6" id="blood-concentration-calculator">
      {/* ======================================================== */}
      {/* Top Banner & Mode Switcher */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Estymator Farmakokinetyki & Stabilności Hormonalnej</span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              Kalkulator Okresu Półtrwania & Stężenia we Krwi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Modeluj uwalnianie leków z depot i eliminację biologiczną. Łącz wiele substancji w jeden stack,
              kontroluj łączne stężenie anabolików oraz eliminuj dołki hormonalne.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setMode('stack')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'stack'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="btn-calc-mode-stack"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Łączenie Substancji (Stack)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="btn-calc-mode-single"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pojedynczy Ester</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('real_log')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'real_log'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="btn-calc-mode-real-log"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Z Moich Dawek ({protocolEntries.length})</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: MULTI-COMPOUND STACK PRESETS BAR */}
        {/* ======================================================== */}
        {mode === 'stack' && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Gotowe Połączenia (Stack Presets):</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Wybierz gotowy sprawdzony schemat lub skonfiguruj własny poniżej
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {STACK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5"
                  title={preset.description}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. STACK MODE: BUILDER, CARDS & CHART */}
      {/* ========================================================================= */}
      {mode === 'stack' && (
        <div className="space-y-6">
          {/* Compound Builder Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-emerald-400" />
                  <span>Substancje w Twoim Stacku ({stackCompounds.length})</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dodawaj kolejne środki, dobieraj dawki i częstotliwość iniekcji, aby uzyskać optymalne zgranie estrów.
                </p>
              </div>

              {stackCompounds.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddCompoundToStack}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  id="btn-add-compound-stack"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dodaj Środek do Stacka</span>
                </button>
              )}
            </div>

            {/* List of Compounds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {stackCompounds.map((item, idx) => {
                const profile = SUBSTANCE_PROFILES.find((p) => p.id === item.profileId) || SUBSTANCE_PROFILES[0];
                const stats = stackSimulation.compoundStats[item.id];
                const dosePerShot = Math.round((item.weeklyDose * (item.intervalDays / 7)) * 10) / 10;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.enabled
                        ? 'bg-slate-950/80 border-slate-800/90 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                    }`}
                  >
                    {/* Compound Card Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <select
                          value={item.profileId}
                          onChange={(e) => handleUpdateStackCompound(item.id, { profileId: e.target.value })}
                          className="bg-slate-900 border border-slate-700 text-white text-xs font-extrabold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 max-w-[190px] truncate"
                        >
                          {SUBSTANCE_PROFILES.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (t½ {p.halfLifeDays}d)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateStackCompound(item.id, { enabled: !item.enabled })}
                          className={`p-1.5 rounded-lg border text-xs transition-all ${
                            item.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                          title={item.enabled ? 'Ukryj na wykresie' : 'Pokaż na wykresie'}
                        >
                          {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {stackCompounds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCompoundFromStack(item.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700/60 transition-all"
                            title="Usuń ze stacka"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dosing Controls */}
                    <div className="space-y-3 text-xs">
                      {/* Weekly dose slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-400">Dawka tygodniowa:</span>
                          <span className="font-mono font-bold text-white">
                            {item.weeklyDose} {profile.unit} / tydz.
                          </span>
                        </div>
                        <input
                          type="range"
                          min={profile.unit === 'IU' ? 100 : 20}
                          max={profile.unit === 'IU' ? 2500 : 1000}
                          step={profile.unit === 'IU' ? 50 : 25}
                          value={item.weeklyDose}
                          onChange={(e) =>
                            handleUpdateStackCompound(item.id, { weeklyDose: Number(e.target.value) })
                          }
                          className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
                        />
                      </div>

                      {/* Frequency buttons */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                          <span>Częstotliwość podawania:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {dosePerShot} {profile.unit} / iniekcję
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[10px]">
                          {[
                            { label: 'ED', days: 1.0 },
                            { label: 'EOD (co 2d)', days: 2.0 },
                            { label: 'Co 3.5d (2x/tyg)', days: 3.5 },
                            { label: 'Co 4d', days: 4.0 },
                            { label: 'Co 5d', days: 5.0 },
                            { label: 'Co 7d (1x/tyg)', days: 7.0 }
                          ].map((f) => {
                            const isAct = Math.abs(item.intervalDays - f.days) < 0.1;
                            return (
                              <button
                                key={f.label}
                                type="button"
                                onClick={() => handleUpdateStackCompound(item.id, { intervalDays: f.days })}
                                className={`py-1 px-1.5 rounded-lg font-bold border transition-all text-center truncate ${
                                  isAct
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {f.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mini Pharmacokinetics Badge for this Compound */}
                      {stats && (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Szczyt</span>
                            <span className="font-bold text-white">{stats.peak}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Dołek</span>
                            <span className="font-bold text-sky-400">{stats.trough}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Stosunek</span>
                            <span
                              className={`font-bold ${
                                stats.peakToTroughRatio <= 1.5
                                  ? 'text-emerald-400'
                                  : stats.peakToTroughRatio <= 2.0
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {stats.peakToTroughRatio}×
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stack Summary KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Łącznie AAS</span>
              <div className="text-2xl font-black text-emerald-400 font-mono my-1">
                {stackSimulation.totalWeeklyAasMg}
                <span className="text-xs text-slate-400 font-normal ml-1">mg / tydz.</span>
              </div>
              <span className="text-[11px] text-slate-400">Całkowita tygodniowa pula anabolików</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Szczyt Łączny</span>
              <div className="text-2xl font-black text-white font-mono my-1">
                {stackSimulation.totalAasPeak}
                <span className="text-xs text-slate-400 font-normal ml-1">j. wzgl.</span>
              </div>
              <span className="text-[11px] text-slate-400">Maksymalne łączne stężenie</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Dołek Łączny</span>
              <div className="text-2xl font-black text-sky-400 font-mono my-1">
                {stackSimulation.totalAasTrough}
                <span className="text-xs text-slate-400 font-normal ml-1">j. wzgl.</span>
              </div>
              <span className="text-[11px] text-slate-400">Najniższy łączny poziom nasycenia</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Zgranie Iniekcji</span>
              <div className="text-base font-black text-amber-400 my-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Synchronizacja</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Możliwość iniekcji w jednej strzykawce
              </span>
            </div>
          </div>

          {/* Interactive Multi-Compound SVG Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Krzywa Stężeń we Krwi dla Połączonego Stacka (Stan Stacjonarny 28 dni)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Każda linia reprezentuje uwalnianie i rozpad poszczególnej substancji. Cienkie kropki oznaczają momenty iniekcji.
                </p>
              </div>

              {/* Toggle Total AAS Curve */}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  checked={showTotalAasCurve}
                  onChange={(e) => setShowTotalAasCurve(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
                <span>Pokaż Łączne AAS (Total Steroids)</span>
              </label>
            </div>

            {/* Hover tooltip stats */}
            {hoveredStackIndex !== null && stackSvgData && stackSvgData.scaledPoints[hoveredStackIndex] && (
              <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
                <div className="font-mono text-emerald-300 font-bold">
                  Dzień {stackSvgData.scaledPoints[hoveredStackIndex].timeDays}d ({stackSvgData.scaledPoints[hoveredStackIndex].dateStr})
                </div>

                {showTotalAasCurve && (
                  <div className="font-mono text-white font-black flex items-center gap-1.5 border-l border-slate-800 pl-3">
                    <span className="w-2.5 h-1 bg-white rounded-full inline-block" />
                    <span>Total AAS: {stackSvgData.scaledPoints[hoveredStackIndex].totalAasLevel}</span>
                  </div>
                )}

                {stackCompounds
                  .filter((c) => c.enabled)
                  .map((c) => {
                    const prof = SUBSTANCE_PROFILES.find((p) => p.id === c.profileId);
                    const lvl = stackSvgData.scaledPoints[hoveredStackIndex].compoundLevels[c.id];
                    const inj = stackSvgData.scaledPoints[hoveredStackIndex].injections[c.id];
                    return (
                      <div key={c.id} className="font-mono flex items-center gap-1.5 border-l border-slate-800 pl-3">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-slate-300">{prof?.name.split(' ')[0]}:</span>
                        <strong className="text-white">{lvl}</strong>
                        {inj && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                            +{inj} {prof?.unit}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* SVG Canvas */}
            {stackSvgData && (
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full h-auto min-w-[580px] select-none"
                >
                  <defs>
                    <linearGradient id="totalAasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const yVal = stackSvgData.rangeY * (1 - ratio);
                    const yPx = padTop + innerH * ratio;
                    return (
                      <g key={ratio}>
                        <line
                          x1={padLeft}
                          y1={yPx}
                          x2={chartW - padRight}
                          y2={yPx}
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padLeft - 8}
                          y={yPx + 4}
                          fill="#64748b"
                          fontSize="10"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          {Math.round(yVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Day Labels */}
                  {stackSvgData.scaledPoints
                    .filter((_, idx) => idx % Math.max(1, Math.floor(stackSvgData.scaledPoints.length / 8)) === 0)
                    .map((pt, i) => (
                      <text
                        key={i}
                        x={pt.x}
                        y={chartH - 12}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        Dzień {Math.round(pt.timeDays)}
                      </text>
                    ))}

                  {/* Total AAS Area & Line (if enabled) */}
                  {showTotalAasCurve && stackSvgData.scaledPoints.length > 1 && (
                    <>
                      <path
                        d={`${stackSvgData.totalAasPath} L ${
                          stackSvgData.scaledPoints[stackSvgData.scaledPoints.length - 1].x
                        },${padTop + innerH} L ${stackSvgData.scaledPoints[0].x},${padTop + innerH} Z`}
                        fill="url(#totalAasGrad)"
                      />
                      <path
                        d={stackSvgData.totalAasPath}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        opacity="0.85"
                      />
                    </>
                  )}

                  {/* Individual Compound Lines */}
                  {stackCompounds
                    .filter((c) => c.enabled)
                    .map((c) => {
                      const path = stackSvgData.paths[c.id];
                      if (!path) return null;
                      return (
                        <path
                          key={c.id}
                          d={path}
                          fill="none"
                          stroke={c.color}
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    })}

                  {/* Injection Markers */}
                  {stackSvgData.scaledPoints.map((pt, idx) => {
                    return stackCompounds
                      .filter((c) => c.enabled && pt.injections[c.id])
                      .map((c) => (
                        <g key={`${idx}-${c.id}`}>
                          <circle
                            cx={pt.x}
                            cy={pt.compoundYs[c.id]}
                            r="4.5"
                            fill={c.color}
                            stroke="#0f172a"
                            strokeWidth="2"
                          />
                        </g>
                      ));
                  })}

                  {/* Hover Rectangles */}
                  {stackSvgData.scaledPoints.map((pt, idx) => (
                    <rect
                      key={idx}
                      x={pt.x - innerW / (stackSvgData.scaledPoints.length * 2)}
                      y={padTop}
                      width={innerW / stackSvgData.scaledPoints.length}
                      height={innerH}
                      fill="transparent"
                      onMouseEnter={() => setHoveredStackIndex(idx)}
                      className="cursor-crosshair"
                    />
                  ))}

                  {/* Crosshair on hover */}
                  {hoveredStackIndex !== null && stackSvgData.scaledPoints[hoveredStackIndex] && (
                    <line
                      x1={stackSvgData.scaledPoints[hoveredStackIndex].x}
                      y1={padTop}
                      x2={stackSvgData.scaledPoints[hoveredStackIndex].x}
                      y2={padTop + innerH}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </svg>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-800 text-xs">
              {showTotalAasCurve && (
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-4 h-1 border-t-2 border-dashed border-white inline-block" />
                  <span>Łączne Stężenie AAS (mg)</span>
                </div>
              )}
              {stackCompounds
                .filter((c) => c.enabled)
                .map((c) => {
                  const prof = SUBSTANCE_PROFILES.find((p) => p.id === c.profileId);
                  return (
                    <div key={c.id} className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>
                        {prof?.name}: <strong>{c.weeklyDose} {prof?.unit}/tydz.</strong> (co {c.intervalDays}d)
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Stack Synergy Advice Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-300">
              <h5 className="font-extrabold text-white text-sm">
                Wskazówki Synergii i Bezpieczeństwa dla Połączonego Protokołu
              </h5>
              <p className="leading-relaxed">
                Łącząc estry o zbliżonym okresie półtrwania (np. <strong>Enanthat Testosteronu + Enanthat Masteronu / Primobolanu</strong>), 
                uzyskujesz idealnie równoległą kinetykę uwalniania. Możesz mieszać oba roztwory olejowe w jednej strzykawce i podawać 
                w ten sam dzień (np. Pn rano / Czw wieczór), redukując liczbę ukłuć o połowę i zachowując stały stosunek androgenowo-anaboliczny.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SINGLE ESTER MODE: SLIDERS, STATS & COMPARISON TABLE */}
      {/* ========================================================================= */}
      {mode === 'single' && (
        <div className="space-y-6">
          {/* Substance selector pills */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Wybierz Ester do Szczegółowej Analizy:</span>
              <span className="text-[11px] font-mono text-emerald-400">
                Okres półtrwania: <strong>{singleProfile.halfLifeDays} dni</strong> ({singleProfile.halfLifeDays * 24} godz.)
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {SUBSTANCE_PROFILES.map((prof) => {
                const isSelected = prof.id === singleProfileId;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => {
                      setSingleProfileId(prof.id);
                      setSingleIntervalDays(prof.recommendedFrequencyDays);
                      setSingleWeeklyDose(prof.defaultDose);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white ring-1 ring-emerald-500/40 shadow-xs'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-extrabold text-xs truncate text-slate-100">{prof.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>t½: {prof.halfLifeDays}d</span>
                      <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 uppercase text-[9px]">{prof.route}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dosing Controls & Single KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Parametry Pojedynczej Substancji</span>
              </h4>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <label className="text-slate-300">Dawka tygodniowa:</label>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    {singleWeeklyDose} {singleProfile.unit} / tydz.
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={1500}
                  step={singleProfile.unit === 'IU' ? 50 : 25}
                  value={singleWeeklyDose}
                  onChange={(e) => setSingleWeeklyDose(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Częstotliwość Iniekcji:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Codziennie (ED)', days: 1.0 },
                    { label: 'Co 2 dni (EOD)', days: 2.0 },
                    { label: 'Co 3.5 dnia (2x/tyg)', days: 3.5 },
                    { label: 'Co 4 dni', days: 4.0 },
                    { label: 'Co 5 dni', days: 5.0 },
                    { label: 'Co 7 dni (1x/tyg)', days: 7.0 }
                  ].map((item) => {
                    const isActive = Math.abs(singleIntervalDays - item.days) < 0.1;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setSingleIntervalDays(item.days)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Pojedyncza iniekcja:</span>
                <span className="font-mono font-black text-white text-sm">
                  {singleDosePerShot} {singleProfile.unit} / strzał
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAddSingleToStack(singleProfile.id, singleWeeklyDose, singleIntervalDays)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                id="btn-add-single-to-stack"
              >
                <GitMerge className="w-4 h-4 text-emerald-400" />
                <span>Połącz tę substancję z innymi w Stacku</span>
              </button>
            </div>

            {/* KPI Stat Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Szczyt (Peak)</span>
                <div className="text-2xl font-black text-white font-mono my-1">
                  {singleActiveComparison.peak}
                </div>
                <span className="text-[11px] text-slate-400">Maks. stężenie</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Dołek (Trough)</span>
                <div className="text-2xl font-black text-sky-400 font-mono my-1">
                  {singleActiveComparison.trough}
                </div>
                <span className="text-[11px] text-slate-400">Poziom tuż przed iniekcją</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Szczyt / Dołek</span>
                <div className="text-2xl font-black text-amber-400 font-mono my-1">
                  {singleActiveComparison.peakToTroughRatio}×
                </div>
                <span className="text-[11px] text-slate-400">
                  Wahanie: +{singleActiveComparison.fluctuationPct}%
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Ocena Stabilności</span>
                <div className={`text-lg font-black font-mono my-1 ${singleActiveComparison.scoreColor}`}>
                  {singleActiveComparison.stabilityScore}
                </div>
                <span className="text-[11px] text-slate-400">Wskaźnik równowagi</span>
              </div>

              {/* Advice Box */}
              <div className="col-span-2 sm:col-span-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong>{singleProfile.name}:</strong> {singleProfile.description} {singleProfile.stabilityAdvice}
                </div>
              </div>
            </div>
          </div>

          {/* Single SVG Chart */}
          {singleSvgData && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Krzywa Stężenia: {singleProfile.name} ({singleWeeklyDose} {singleProfile.unit}/tydz.)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Przebieg nasycenia w stanie stacjonarnym przy interwale co {singleIntervalDays} dni.
                  </p>
                </div>

                {hoveredSingleIndex !== null && singleSvgData.scaled[hoveredSingleIndex] && (
                  <div className="text-xs bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-emerald-300 font-mono shadow-xs flex items-center gap-2">
                    <span>Dzień: <strong>{singleSvgData.scaled[hoveredSingleIndex].timeDays}d</strong></span>
                    <span>•</span>
                    <span>Poziom: <strong>{singleSvgData.scaled[hoveredSingleIndex].level}</strong></span>
                  </div>
                )}
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[550px] select-none">
                  <defs>
                    <linearGradient id="singleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const yVal = singleSvgData.rangeY * (1 - ratio);
                    const yPx = padTop + innerH * ratio;
                    return (
                      <g key={ratio}>
                        <line x1={padLeft} y1={yPx} x2={chartW - padRight} y2={yPx} stroke="#1e293b" strokeDasharray="3 3" />
                        <text x={padLeft - 8} y={yPx + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                          {Math.round(yVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Day Labels */}
                  {singleSvgData.scaled
                    .filter((_, idx) => idx % Math.max(1, Math.floor(singleSvgData.scaled.length / 8)) === 0)
                    .map((pt, i) => (
                      <text key={i} x={pt.x} y={chartH - 12} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        Dzień {Math.round(pt.timeDays)}
                      </text>
                    ))}

                  {/* Area & Line */}
                  <path
                    d={`${singleSvgData.pathD} L ${singleSvgData.scaled[singleSvgData.scaled.length - 1].x},${padTop + innerH} L ${singleSvgData.scaled[0].x},${padTop + innerH} Z`}
                    fill="url(#singleGrad)"
                  />
                  <path d={singleSvgData.pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Injections */}
                  {singleSvgData.scaled.map((pt, idx) => {
                    if (!pt.isInjection) return null;
                    return (
                      <circle key={idx} cx={pt.x} cy={pt.y} r="4.5" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
                    );
                  })}

                  {/* Hover Rectangles */}
                  {singleSvgData.scaled.map((pt, idx) => (
                    <rect
                      key={idx}
                      x={pt.x - innerW / (singleSvgData.scaled.length * 2)}
                      y={padTop}
                      width={innerW / singleSvgData.scaled.length}
                      height={innerH}
                      fill="transparent"
                      onMouseEnter={() => setHoveredSingleIndex(idx)}
                      className="cursor-crosshair"
                    />
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Porównanie Częstotliwości Iniekcji dla {singleProfile.name}</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Częstotliwość</th>
                    <th className="py-2.5 px-3">Dawka / iniekcję</th>
                    <th className="py-2.5 px-3">Szczyt</th>
                    <th className="py-2.5 px-3">Dołek</th>
                    <th className="py-2.5 px-3">Stosunek Szczyt/Dołek</th>
                    <th className="py-2.5 px-3">Wahanie</th>
                    <th className="py-2.5 px-3">Stabilność</th>
                    <th className="py-2.5 px-3 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {singleComparisons.map((c) => {
                    const isCurrent = Math.abs(c.frequencyDays - singleIntervalDays) < 0.1;
                    return (
                      <tr
                        key={c.frequencyLabel}
                        className={`transition-colors ${isCurrent ? 'bg-emerald-950/30 font-bold text-white' : 'hover:bg-slate-800/40'}`}
                      >
                        <td className="py-3 px-3 flex items-center gap-2">
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                          <span>{c.frequencyLabel}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">{c.dosePerInjection} {singleProfile.unit}</td>
                        <td className="py-3 px-3 font-mono text-slate-200">{c.peak}</td>
                        <td className="py-3 px-3 font-mono text-sky-400">{c.trough}</td>
                        <td className="py-3 px-3 font-mono text-amber-400">{c.peakToTroughRatio}×</td>
                        <td className="py-3 px-3 font-mono text-slate-400">+{c.fluctuationPct}%</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                            c.stabilityScore === 'DOSKONAŁA' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            c.stabilityScore === 'DOBRA' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30' :
                            c.stabilityScore === 'ŚREDNIA' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {c.stabilityScore}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSingleIntervalDays(c.frequencyDays)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              isCurrent ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {isCurrent ? 'Wybrana' : 'Wybierz'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REAL LOG MODE: MULTI-SUBSTANCE ACTUAL PROTOCOL CURVE */}
      {/* ========================================================================= */}
      {mode === 'real_log' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Substancje Zarejestrowane w Kalendarzu Dawek</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wybierz, które z zarejestrowanych w kalendarzu środków chcesz nałożyć na wspólny wykres stężeń.
                </p>
              </div>
            </div>

            {/* Checkboxes for logged substances */}
            {distinctLoggedSubstances.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Brak zarejestrowanych dawek w kalendarzu. Dodaj wpisy w zakładce „Kalendarz & Cykl”.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                {distinctLoggedSubstances.map((sub) => {
                  const isChecked = selectedLoggedSubstances.includes(sub.name);
                  return (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedLoggedSubstances(selectedLoggedSubstances.filter((s) => s !== sub.name));
                        } else {
                          setSelectedLoggedSubstances([...selectedLoggedSubstances, sub.name]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        isChecked
                          ? 'bg-slate-950 border-slate-700 text-white shadow-xs'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span>{sub.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                        {sub.count} wpisów
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real Log Multi-Curve Chart */}
          {realLogSvgData && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Rzeczywista Krzywa Nasycenia z Dziennika Iniekcji</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Przebieg stężeń wyliczony na podstawie Twoich autentycznych wpisów w kalendarzu.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={showTotalRealLogCurve}
                      onChange={(e) => setShowTotalRealLogCurve(e.target.checked)}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>Pokaż Łączne Stężenie (Total)</span>
                  </label>

                  {hoveredLogIndex !== null && realLogSvgData.scaled[hoveredLogIndex] && (
                    <div className="text-xs bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-emerald-300 font-mono shadow-xs flex items-center gap-2">
                      <span>Data: <strong>{realLogSvgData.scaled[hoveredLogIndex].dateStr}</strong></span>
                      {showTotalRealLogCurve && (
                        <span>• Łącznie: <strong>{realLogSvgData.scaled[hoveredLogIndex].totalLogLevel} mg</strong></span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[550px] select-none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const yVal = realLogSvgData.rangeY * (1 - ratio);
                    const yPx = padTop + innerH * ratio;
                    return (
                      <g key={ratio}>
                        <line x1={padLeft} y1={yPx} x2={chartW - padRight} y2={yPx} stroke="#1e293b" strokeDasharray="3 3" />
                        <text x={padLeft - 8} y={yPx + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                          {Math.round(yVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Day labels */}
                  {realLogSvgData.scaled
                    .filter((_, idx) => idx % Math.max(1, Math.floor(realLogSvgData.scaled.length / 8)) === 0)
                    .map((pt, i) => (
                      <text key={i} x={pt.x} y={chartH - 12} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {pt.dateStr.slice(5)}
                      </text>
                    ))}

                  {/* Total Cumulative Line */}
                  {showTotalRealLogCurve && realLogSvgData.scaled.length > 1 && (
                    <path
                      d={realLogSvgData.totalPath}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      opacity="0.85"
                    />
                  )}

                  {/* Lines per substance */}
                  {realLogMultiCurve.substances.map((subName) => {
                    const path = realLogSvgData.paths[subName];
                    const meta = distinctLoggedSubstances.find((s) => s.name === subName);
                    const color = meta?.color || '#10b981';
                    if (!path) return null;
                    return (
                      <path
                        key={subName}
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}

                  {/* Injections dots */}
                  {realLogSvgData.scaled.map((pt, idx) => {
                    return realLogMultiCurve.substances
                      .filter((subName) => pt.injections[subName])
                      .map((subName) => {
                        const meta = distinctLoggedSubstances.find((s) => s.name === subName);
                        return (
                          <circle
                            key={`${idx}-${subName}`}
                            cx={pt.x}
                            cy={pt.ys[subName]}
                            r="4.5"
                            fill={meta?.color || '#10b981'}
                            stroke="#0f172a"
                            strokeWidth="2"
                          />
                        );
                      });
                  })}

                  {/* Hover Rectangles */}
                  {realLogSvgData.scaled.map((pt, idx) => (
                    <rect
                      key={idx}
                      x={pt.x - innerW / (realLogSvgData.scaled.length * 2)}
                      y={padTop}
                      width={innerW / realLogSvgData.scaled.length}
                      height={innerH}
                      fill="transparent"
                      onMouseEnter={() => setHoveredLogIndex(idx)}
                      className="cursor-crosshair"
                    />
                  ))}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-800 text-xs">
                {realLogMultiCurve.substances.map((subName) => {
                  const meta = distinctLoggedSubstances.find((s) => s.name === subName);
                  return (
                    <div key={subName} className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta?.color || '#10b981' }} />
                      <span>{subName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
