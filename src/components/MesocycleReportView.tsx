import React, { useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Dumbbell, 
  Scale, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Activity,
  Flame
} from 'lucide-react';
import { TrainingWeek, BodyWeightEntry } from '../types';
import { calculate1RM, calculateVolume } from '../utils/calculations';

interface MesocycleReportViewProps {
  weeks: TrainingWeek[];
  bodyWeights?: BodyWeightEntry[];
  unit: 'kg' | 'lbs';
}

interface MainLiftSummary {
  name: string;
  category?: string;
  startWeight: number;
  endWeight: number;
  weightGain: number;
  weightGainPct: number;
  startReps: number;
  endReps: number;
  start1RM: number;
  end1RM: number;
  gain1RM: number;
  isMainCompound: boolean;
}

export const MesocycleReportView: React.FC<MesocycleReportViewProps> = ({
  weeks = [],
  bodyWeights = [],
  unit = 'kg'
}) => {
  // 1. Overall Volume & Tonnage Analysis
  const totalVolumeKg = useMemo(() => {
    return weeks.reduce((wAcc, w) => {
      return (
        wAcc +
        w.days.reduce((dAcc, d) => {
          return (
            dAcc +
            d.exercises.reduce((eAcc, e) => {
              return eAcc + calculateVolume(e.sets, e.reps, e.weight);
            }, 0)
          );
        }, 0)
      );
    }, 0);
  }, [weeks]);

  // Volume by Week
  const weeklyTonnage = useMemo(() => {
    return weeks.map((w, idx) => {
      const vol = w.days.reduce((dAcc, d) => {
        return (
          dAcc +
          d.exercises.reduce((eAcc, e) => {
            return eAcc + calculateVolume(e.sets, e.reps, e.weight);
          }, 0)
        );
      }, 0);

      const totalDays = w.days.length;
      const completedDays = w.days.filter((d) => d.completed).length;

      return {
        weekNumber: w.number || idx + 1,
        weekName: w.name,
        startDate: w.startDate,
        volume: vol,
        totalDays,
        completedDays,
        isCompleted: totalDays > 0 && completedDays === totalDays
      };
    });
  }, [weeks]);

  const maxWeeklyVol = useMemo(() => {
    const vols = weeklyTonnage.map((w) => w.volume);
    return vols.length > 0 ? Math.max(...vols, 1000) : 1000;
  }, [weeklyTonnage]);

  // 2. Training Adherence / Frequency Metrics
  const { totalWorkouts, completedWorkouts, totalSetsCount, totalRepsCount } = useMemo(() => {
    let tWorkouts = 0;
    let cWorkouts = 0;
    let setsCount = 0;
    let repsCount = 0;

    weeks.forEach((w) => {
      tWorkouts += w.days.length;
      cWorkouts += w.days.filter((d) => d.completed).length;
      w.days.forEach((d) => {
        d.exercises.forEach((e) => {
          setsCount += e.sets;
          repsCount += e.sets * e.reps;
        });
      });
    });

    return {
      totalWorkouts: tWorkouts,
      completedWorkouts: cWorkouts,
      totalSetsCount: setsCount,
      totalRepsCount: repsCount
    };
  }, [weeks]);

  const adherencePct = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  // 3. Body Weight Progression over Cycle
  const weightProgression = useMemo(() => {
    if (!bodyWeights || bodyWeights.length === 0) return null;

    const sorted = [...bodyWeights].sort((a, b) => a.date.localeCompare(b.date));
    const firstEntry = sorted[0];
    const lastEntry = sorted[sorted.length - 1];

    const startWeight = firstEntry.weight;
    const endWeight = lastEntry.weight;
    const diff = Math.round((endWeight - startWeight) * 10) / 10;
    const diffPct = startWeight > 0 ? Math.round((diff / startWeight) * 1000) / 10 : 0;

    // Approximate duration in weeks
    const firstD = new Date(firstEntry.date);
    const lastD = new Date(lastEntry.date);
    const diffDays = Math.max(1, Math.round((lastD.getTime() - firstD.getTime()) / (1000 * 3600 * 24)));
    const durationWeeks = Math.max(1, Math.round((diffDays / 7) * 10) / 10);
    const ratePerWeek = Math.round((diff / durationWeeks) * 100) / 100;

    return {
      startDate: firstEntry.date,
      endDate: lastEntry.date,
      startWeight,
      endWeight,
      diff,
      diffPct,
      durationWeeks,
      ratePerWeek
    };
  }, [bodyWeights]);

  // 4. Main Compound Lifts Progression (Tydzień 1 vs Ostatni Tydzień)
  const mainLifts = useMemo(() => {
    if (weeks.length === 0) return [];

    const firstWeek = weeks[0];
    const lastWeek = weeks[weeks.length - 1];

    // Collect all exercises from all weeks by normalized name
    const liftNamesSet = new Set<string>();
    weeks.forEach((w) => {
      w.days.forEach((d) => {
        d.exercises.forEach((e) => {
          liftNamesSet.add(e.name.trim());
        });
      });
    });

    const isCompoundName = (n: string) => {
      const lower = n.toLowerCase();
      return (
        lower.includes('wyciskanie') ||
        lower.includes('przysiad') ||
        lower.includes('martwy') ||
        lower.includes('ohp') ||
        lower.includes('żołnierskie') ||
        lower.includes('podciąganie') ||
        lower.includes('wiosłowanie') ||
        lower.includes('bench') ||
        lower.includes('squat') ||
        lower.includes('deadlift') ||
        lower.includes('press') ||
        lower.includes('row')
      );
    };

    const summaries: MainLiftSummary[] = [];

    liftNamesSet.forEach((liftName) => {
      // Find start occurrence (preferably in week 1, or first week it appears)
      let startEx = null;
      for (const w of weeks) {
        for (const d of w.days) {
          const match = d.exercises.find((e) => e.name.trim().toLowerCase() === liftName.toLowerCase());
          if (match) {
            startEx = match;
            break;
          }
        }
        if (startEx) break;
      }

      // Find end occurrence (preferably in last week, or last week it appears)
      let endEx = null;
      for (let i = weeks.length - 1; i >= 0; i--) {
        const w = weeks[i];
        for (const d of w.days) {
          const match = d.exercises.find((e) => e.name.trim().toLowerCase() === liftName.toLowerCase());
          if (match) {
            endEx = match;
            break;
          }
        }
        if (endEx) break;
      }

      if (startEx && endEx) {
        const sWeight = startEx.weight;
        const eWeight = endEx.weight;
        const sReps = startEx.reps;
        const eReps = endEx.reps;
        const s1RM = calculate1RM(sWeight, sReps);
        const e1RM = calculate1RM(eWeight, eReps);

        const wGain = Math.round((eWeight - sWeight) * 10) / 10;
        const wGainPct = sWeight > 0 ? Math.round((wGain / sWeight) * 1000) / 10 : 0;
        const gain1RM = Math.round((e1RM - s1RM) * 10) / 10;

        summaries.push({
          name: liftName,
          category: endEx.category || startEx.category,
          startWeight: sWeight,
          endWeight: eWeight,
          weightGain: wGain,
          weightGainPct: wGainPct,
          startReps: sReps,
          endReps: eReps,
          start1RM: s1RM,
          end1RM: e1RM,
          gain1RM,
          isMainCompound: isCompoundName(liftName)
        });
      }
    });

    // Sort: Compound lifts first, then by highest absolute progress
    return summaries.sort((a, b) => {
      if (a.isMainCompound && !b.isMainCompound) return -1;
      if (!a.isMainCompound && b.isMainCompound) return 1;
      return b.weightGain - a.weightGain;
    });
  }, [weeks]);

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="mesocycle-summary-report">
      {/* Top Banner with Print / Export Option */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Raport Końcowy Mezocyklu / Bloku Treningowego</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Podsumowanie Całego Cyklu Treningowego
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Kompleksowe zestawienie łącznego tonażu, zmian masy ciała oraz progresji w kluczowych bojach siłowych na przestrzeni {weeks.length} tygodni.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shadow-xs"
            id="btn-print-report"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Drukuj / Zapisz PDF</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Tonaż Całego Cyklu</span>
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalVolumeKg.toLocaleString('pl-PL')} <span className="text-sm font-normal text-slate-400">{unit}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Łącznie podniesiony ciężar w {weeks.length} tyg.
          </span>
        </div>

        {/* Bodyweight Delta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Masa Ciała (Cykl)</span>
            <Scale className="w-4 h-4 text-sky-400" />
          </div>
          {weightProgression ? (
            <>
              <div className="text-2xl font-black font-mono flex items-center gap-2">
                <span className={weightProgression.diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {weightProgression.diff >= 0 ? `+${weightProgression.diff}` : weightProgression.diff} {unit}
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  ({weightProgression.diffPct >= 0 ? `+${weightProgression.diffPct}` : weightProgression.diffPct}%)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                Start: {weightProgression.startWeight} {unit} → Koniec: {weightProgression.endWeight} {unit}
              </span>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-slate-500 font-mono my-2">Brak wpisów wagi</div>
              <span className="text-[11px] text-slate-500">Zapisz wagę w Dzienniku Wagi</span>
            </>
          )}
        </div>

        {/* Attendance & Completion */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Frekwencja & Realizacja</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {adherencePct}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {completedWorkouts} z {totalWorkouts} dni treningowych zaliczonych
          </span>
        </div>

        {/* Total Sets & Reps */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Objętość Pracy</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {totalSetsCount} <span className="text-sm font-normal text-slate-400">serii</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Łącznie {totalRepsCount.toLocaleString('pl-PL')} wykonanych powtórzeń
          </span>
        </div>
      </div>

      {/* Weekly Tonnage Progression Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Progresja Tonażu Tydzień po Tygodniu (Periodyzacja Objętości)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Wizualizacja tonażu w kolejnych tygodniach mezocyklu. Wzrost oznacza progresywne przeładowanie (Overload).
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {weeklyTonnage.map((w) => {
            const pctOfMax = Math.round((w.volume / maxWeeklyVol) * 100);
            return (
              <div key={w.weekName} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{w.weekName}</span>
                    {w.startDate && (
                      <span className="text-[11px] font-mono text-slate-500">({w.startDate})</span>
                    )}
                    {w.isCompleted ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        100% Zaliczone
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                        {w.completedDays}/{w.totalDays} dni
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-emerald-400 text-xs">
                    {w.volume.toLocaleString('pl-PL')} {unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800/80">
                  <div
                    className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, pctOfMax)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Compound Lifts Progression Table (Główne Boje) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Progresja Siłowa w Głównych Bojach (Tydzień 1 vs Ostatni Tydzień)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Zestawienie wyników na początku mezocyklu z aktualnymi rekordami w bojach wielostawowych i akcesoriach.
          </p>
        </div>

        {mainLifts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            Brak ćwiczeń w planie treningowym do wygenerowania tabeli progresu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Ćwiczenie</th>
                  <th className="py-2.5 px-3">Kategoria</th>
                  <th className="py-2.5 px-3">Tydzień 1 (Start)</th>
                  <th className="py-2.5 px-3">Finał (Aktualny)</th>
                  <th className="py-2.5 px-3">Przyrost Ciężaru</th>
                  <th className="py-2.5 px-3">1RM Start → Finał</th>
                  <th className="py-2.5 px-3 text-right">Status Progresu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {mainLifts.map((lift) => {
                  const isPositive = lift.weightGain > 0;
                  const isNegative = lift.weightGain < 0;

                  return (
                    <tr key={lift.name} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {lift.isMainCompound && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Bój wielostawowy" />
                          )}
                          <span className="font-extrabold text-white text-xs">{lift.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {lift.category ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700/60">
                            {lift.category}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="text-slate-200">{lift.startWeight} {unit}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({lift.startReps} powt.)</span>
                      </td>

                      <td className="py-3 px-3 font-mono font-black text-white">
                        <span>{lift.endWeight} {unit}</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({lift.endReps} powt.)</span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          {isPositive ? (
                            <span className="text-emerald-400 font-black flex items-center gap-0.5">
                              <ArrowUp className="w-3.5 h-3.5" />
                              +{lift.weightGain} {unit}
                            </span>
                          ) : isNegative ? (
                            <span className="text-rose-400 font-black flex items-center gap-0.5">
                              <ArrowDown className="w-3.5 h-3.5" />
                              {lift.weightGain} {unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <Minus className="w-3.5 h-3.5" />
                              0 {unit}
                            </span>
                          )}

                          {isPositive && (
                            <span className="text-[10px] text-emerald-400/90 font-sans">
                              (+{lift.weightGainPct}%)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="text-slate-400">{lift.start1RM}</span>
                        <span className="text-slate-600 mx-1">→</span>
                        <span className="font-bold text-amber-400">{lift.end1RM} {unit}</span>
                        {lift.gain1RM > 0 && (
                          <span className="text-[10px] text-emerald-400 font-bold ml-1.5">
                            (+{lift.gain1RM})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isNegative
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        }`}>
                          {isPositive ? '✓ Progres' : isNegative ? 'Deload' : '= Utrzymanie'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coach & Periodization Recommendations */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
        <div className="space-y-1.5 text-xs text-slate-300">
          <h4 className="font-extrabold text-white text-sm">
            Wnioski Periodyzacji i Zalecenia Regeneracyjne
          </h4>
          <p className="leading-relaxed text-slate-300">
            Mezocykl zrealizowany na poziomie <strong>{adherencePct}% frekwencji</strong> z łącznym tonażem <strong>{totalVolumeKg.toLocaleString('pl-PL')} {unit}</strong>.
            {weeks.length >= 6 ? (
              <span> Po {weeks.length} tygodniach intensywnej akumulacji obciążenia zaleca się zaplanowanie <strong>1 tygodnia deloadu (odciążenia)</strong> z redukcją objętości o 40-50% przy zachowaniu ciężaru roboczego, aby umożliwić pełną superkompensację układu nerwowego, więzadeł i stawów przed kolejnym blokiem siłowo-hipertroficznym.</span>
            ) : (
              <span> Blok w trakcie akumulacji. Utrzymuj progresywne przeładowanie (Overload) dodając 1.25 - 2.5 kg lub 1 powtórzenie w głównych seriach roboczych co tydzień.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
