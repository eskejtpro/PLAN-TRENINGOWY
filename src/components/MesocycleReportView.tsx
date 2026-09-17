import React, { useMemo, useState } from 'react';
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
  Flame,
  BarChart3
} from 'lucide-react';
import { TrainingWeek, BodyWeightEntry } from '../types';
import { calculate1RM } from '../utils/calculations';
import { AnalysisExecutionOptions, analysisOptionsForWeek, detectVolumeJumps, executedReps, executedSets, executedVolume, historyForAnalysis, includeExerciseInAnalysis, regularityPercent, rollingAverage, scopeAnalysisWeeks, summarizeExecution, summarizeMonthlyExecution, summarizeWeekExercises, summarizeWeeklyExecution, volumeDeltaPercent, volumePerSet } from '../utils/analysis';

interface MesocycleReportViewProps {
  weeks: TrainingWeek[];
  bodyWeights?: BodyWeightEntry[];
  unit: 'kg' | 'lbs';
  analysisOnlyCompleted?: boolean;
  analysisStartWeek?: number;
  analysisEndWeek?: number;
  analysisIncludePartialHistory?: boolean;
  analysisRequireHistoryForCompleted?: boolean;
  analysisMinExecutedSets?: number;
  analysisShowExecutionSummary?: boolean;
  analysisShowWeekComparison?: boolean;
  analysisShowWeeklyTonnage?: boolean;
  analysisShowWeeklyMetrics?: boolean;
  analysisShowExecutedDays?: boolean;
  analysisShowExecutedExercises?: boolean;
  analysisShowExecutedSets?: boolean;
  analysisShowExecutedReps?: boolean;
  analysisShowVolumeDelta?: boolean;
  analysisShowDataConfidence?: boolean;
  analysisShowRegularity?: boolean;
  analysisRegularityTargetPct?: number;
  analysisShowMonthlyComparison?: boolean;
  analysisMonthlyMetric?: 'volume' | 'executedSets' | 'executedReps';
  analysisShowPeriodComparison?: boolean;
  analysisPeriodComparisonMetric?: 'volume' | 'executedSets' | 'executedReps' | 'executedDays';
  analysisWarnVolumeJumpPct?: number;
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
  weeks: sourceWeeks = [],
  bodyWeights = [],
  unit = 'kg', analysisOnlyCompleted = true, analysisStartWeek = 1, analysisEndWeek = 999, analysisIncludePartialHistory = false, analysisRequireHistoryForCompleted = false, analysisMinExecutedSets = 1, analysisShowExecutionSummary = true, analysisShowWeekComparison = true, analysisShowWeeklyTonnage = true, analysisShowWeeklyMetrics = true, analysisShowExecutedDays = true, analysisShowExecutedExercises = true, analysisShowExecutedSets = true, analysisShowExecutedReps = true, analysisShowVolumeDelta = true, analysisShowDataConfidence = true, analysisShowRegularity = true, analysisRegularityTargetPct = 80, analysisShowMonthlyComparison = true, analysisMonthlyMetric = 'volume', analysisShowPeriodComparison = true, analysisPeriodComparisonMetric = 'volume', analysisWarnVolumeJumpPct = 30
}) => {
  const weeks = useMemo(() => scopeAnalysisWeeks(sourceWeeks, analysisStartWeek, analysisEndWeek), [sourceWeeks, analysisStartWeek, analysisEndWeek]);
  const analysisOptions = useMemo<AnalysisExecutionOptions>(() => ({
    onlyCompleted: analysisOnlyCompleted,
    includePartialHistory: analysisIncludePartialHistory,
    requireHistoryForCompleted: analysisRequireHistoryForCompleted,
    minExecutedSets: analysisMinExecutedSets,
    startDate: weeks[0]?.startDate,
  }), [analysisOnlyCompleted, analysisIncludePartialHistory, analysisRequireHistoryForCompleted, analysisMinExecutedSets, weeks]);
  const executionSummary = useMemo(() => summarizeExecution(weeks, analysisOptions), [weeks, analysisOptions]);
  const weeklyMetrics = useMemo(() => summarizeWeeklyExecution(weeks, analysisOptions), [weeks, analysisOptions]);
  const rollingVolume = useMemo(() => rollingAverage(weeklyMetrics.map((m) => m.volume), 4), [weeklyMetrics]);
  const volumeJumpAlerts = useMemo(() => detectVolumeJumps(weeklyMetrics, analysisWarnVolumeJumpPct), [weeklyMetrics, analysisWarnVolumeJumpPct]);
  const monthlyMetrics = useMemo(() => summarizeMonthlyExecution(weeks, analysisOptions), [weeks, analysisOptions]);
  const periodComparison = useMemo(() => {
    const half = Math.ceil(weeklyMetrics.length / 2);
    const first = weeklyMetrics.slice(0, half);
    const second = weeklyMetrics.slice(half);
    const sum = (items: typeof weeklyMetrics) => items.reduce((acc, item) => ({
      plannedDays: acc.plannedDays + item.plannedDays,
      executedDays: acc.executedDays + item.executedDays,
      executedExercises: acc.executedExercises + item.executedExercises,
      executedSets: acc.executedSets + item.executedSets,
      executedReps: acc.executedReps + item.executedReps,
      volume: acc.volume + item.volume,
    }), { plannedDays: 0, executedDays: 0, executedExercises: 0, executedSets: 0, executedReps: 0, volume: 0 });
    const firstSummary = sum(first);
    const secondSummary = sum(second);
    const metricValue = (summary: typeof firstSummary) => summary[analysisPeriodComparisonMetric];
    return {
      firstWeeks: first.map((item) => item.weekNumber).join(', '),
      secondWeeks: second.map((item) => item.weekNumber).join(', '),
      first: firstSummary,
      second: secondSummary,
      firstValue: metricValue(firstSummary),
      secondValue: metricValue(secondSummary),
      delta: metricValue(secondSummary) - metricValue(firstSummary),
      hasEnoughData: first.length > 0 && second.length > 0 && (firstSummary.executedDays > 0 || secondSummary.executedDays > 0),
    };
  }, [weeklyMetrics, analysisPeriodComparisonMetric]);
  const [compareWeekAId, setCompareWeekAId] = useState<string>('');
  const [compareWeekBId, setCompareWeekBId] = useState<string>('');
  const compareWeekA = weeks.find((week) => week.id === compareWeekAId) || weeks[0];
  const compareWeekB = weeks.find((week) => week.id === compareWeekBId) || weeks[weeks.length - 1];
  const comparisonRows = useMemo(() => {
    if (!compareWeekA || !compareWeekB || compareWeekA.id === compareWeekB.id) return [];
    const first = summarizeWeekExercises(compareWeekA, analysisOptions);
    const last = summarizeWeekExercises(compareWeekB, analysisOptions);
    const names = new Set([...first.map((item) => item.name), ...last.map((item) => item.name)]);
    return Array.from(names).map((name) => {
      const a = first.find((item) => item.name === name);
      const b = last.find((item) => item.name === name);
      const volumeDelta = (b?.volume || 0) - (a?.volume || 0);
      return {
        name,
        firstVolume: a?.volume || 0,
        lastVolume: b?.volume || 0,
        firstSets: a?.sets || 0,
        lastSets: b?.sets || 0,
        firstReps: a?.reps || 0,
        lastReps: b?.reps || 0,
        volumeDelta,
      };
    }).sort((a, b) => Math.abs(b.volumeDelta) - Math.abs(a.volumeDelta) || a.name.localeCompare(b.name));
  }, [compareWeekA, compareWeekB, analysisOptions]);
  // 1. Overall Volume & Tonnage Analysis
  const totalVolumeKg = useMemo(() => {
    return weeks.reduce((wAcc, w, weekIndex) => {
      const weekOptions = analysisOptionsForWeek(w, analysisOptions, weeks[weekIndex + 1]?.startDate);
      return (
        wAcc +
        w.days.reduce((dAcc, d) => {
          return (
            dAcc +
            d.exercises.reduce((eAcc, e) => {
              return eAcc + executedVolume(d, e, weekOptions);
            }, 0)
          );
        }, 0)
      );
    }, 0);
  }, [weeks, analysisOptions]);

  // Volume by Week
  const weeklyTonnage = useMemo(() => weeklyMetrics.map((metrics, idx) => ({
    ...metrics,
    weekName: weeks[idx]?.name || `Tydzień ${metrics.weekNumber}`,
    startDate: weeks[idx]?.startDate,
    totalDays: metrics.plannedDays,
    completedDays: metrics.executedDays,
    isCompleted: metrics.plannedDays > 0 && metrics.executedDays === metrics.plannedDays,
  })), [weeklyMetrics, weeks]);

  const maxWeeklyVol = useMemo(() => {
    const vols = weeklyTonnage.map((w) => w.volume);
    return vols.length > 0 ? Math.max(...vols, 1000) : 1000;
  }, [weeklyTonnage]);

  // 2. Training Adherence / Frequency Metrics
  const { plannedDays: totalWorkouts, executedDays: executedWorkouts, executedSets: totalSetsCount, executedReps: totalRepsCount } = executionSummary;

  const adherencePct = totalWorkouts > 0 ? Math.round((executedWorkouts / totalWorkouts) * 100) : 0;

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
    weeks.forEach((w, weekIndex) => {
      const weekOptions = analysisOptionsForWeek(w, analysisOptions, weeks[weekIndex + 1]?.startDate);
      w.days.forEach((d) => {
        d.exercises.forEach((e) => {
          if (includeExerciseInAnalysis(d, e, weekOptions)) liftNamesSet.add(e.name.trim());
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
      for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
        const w = weeks[weekIndex];
        const weekOptions = analysisOptionsForWeek(w, analysisOptions, weeks[weekIndex + 1]?.startDate);
        for (const d of w.days) {
          const match = d.exercises.find((e) => e.name.trim().toLowerCase() === liftName.toLowerCase() && includeExerciseInAnalysis(d, e, weekOptions));
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
        const weekOptions = analysisOptionsForWeek(w, analysisOptions, weeks[i + 1]?.startDate);
        for (const d of w.days) {
          const match = d.exercises.find((e) => e.name.trim().toLowerCase() === liftName.toLowerCase() && includeExerciseInAnalysis(d, e, weekOptions));
          if (match) {
            endEx = match;
            break;
          }
        }
        if (endEx) break;
      }

      if (startEx && endEx) {
        const startIndex = weeks.findIndex((week) => week.days.some((day) => day.exercises.includes(startEx!)));
        const endIndex = weeks.findIndex((week) => week.days.some((day) => day.exercises.includes(endEx!)));
        const startHistory = historyForAnalysis(startEx, analysisOptionsForWeek(weeks[startIndex], analysisOptions, weeks[startIndex + 1]?.startDate));
        const endHistory = historyForAnalysis(endEx, analysisOptionsForWeek(weeks[endIndex], analysisOptions, weeks[endIndex + 1]?.startDate));
        const startPoint = startHistory.length ? startHistory[0] : startEx;
        const endPoint = endHistory.length ? endHistory[endHistory.length - 1] : endEx;
        const sWeight = startPoint.weight;
        const eWeight = endPoint.weight;
        const sReps = startPoint.reps;
        const eReps = endPoint.reps;
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
  }, [weeks, analysisOptions]);

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
            {executedWorkouts} z {totalWorkouts} dni treningowych wykonanych
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

      {analysisShowExecutionSummary && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400" id="mesocycle-execution-summary">
          <span>Zakres: <strong className="text-slate-200">{weeks.length > 0 ? `tydzień ${weeks[0].number}–${weeks[weeks.length - 1].number}` : 'brak tygodni'}</strong></span>
          <span>Wykonane dni: <strong className="text-emerald-300">{executionSummary.executedDays}</strong></span>
          <span>Ćwiczenia: <strong className="text-emerald-300">{executionSummary.executedExercises}</strong></span>
          <span>Serie: <strong className="text-teal-300">{executionSummary.executedSets}</strong></span>
          <span>Powtórzenia: <strong className="text-teal-300">{executionSummary.executedReps.toLocaleString('pl-PL')}</strong></span>
        </div>
      )}

      {analysisShowWeekComparison && weeks.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="analysis-week-comparison">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Porównanie Wykonania Tygodni</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Porównaj wybrane tygodnie na podstawie faktycznie wykonanych ćwiczeń i serii.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <label className="text-slate-400" htmlFor="select-comparison-week-a">Od:</label>
              <select id="select-comparison-week-a" value={compareWeekA?.id || ''} onChange={(event) => setCompareWeekAId(event.target.value)} className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200">
                {weeks.map((week) => <option key={week.id} value={week.id}>{week.name}</option>)}
              </select>
              <label className="text-slate-400" htmlFor="select-comparison-week-b">Do:</label>
              <select id="select-comparison-week-b" value={compareWeekB?.id || ''} onChange={(event) => setCompareWeekBId(event.target.value)} className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200">
                {weeks.map((week) => <option key={week.id} value={week.id}>{week.name}</option>)}
              </select>
            </div>
          </div>

          {comparisonRows.length === 0 ? (
            <div className="px-3 py-4 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 text-xs text-slate-500">Wybierz dwa różne tygodnie z wykonanymi ćwiczeniami.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]" id="week-comparison-table">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <tr><th className="py-2 pr-3">Ćwiczenie</th><th className="py-2 px-3">Serie</th><th className="py-2 px-3">Powtórzenia</th><th className="py-2 px-3">Tonaż ({unit})</th><th className="py-2 pl-3">Zmiana</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {comparisonRows.map((row) => (
                    <tr key={row.name} data-exercise-name={row.name}>
                      <td className="py-2.5 pr-3 font-bold text-slate-200">{row.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{row.firstSets} → {row.lastSets}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{row.firstReps} → {row.lastReps}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{row.firstVolume.toLocaleString('pl-PL')} → {row.lastVolume.toLocaleString('pl-PL')}</td>
                      <td className={`py-2.5 pl-3 font-mono font-bold ${row.volumeDelta > 0 ? 'text-emerald-300' : row.volumeDelta < 0 ? 'text-amber-300' : 'text-slate-500'}`}>{row.volumeDelta > 0 ? '+' : ''}{row.volumeDelta.toLocaleString('pl-PL')} {unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {volumeJumpAlerts.length > 0 && <div id="analysis-volume-jumps" className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200">
        <strong>Skok tonażu tygodniowego:</strong> {volumeJumpAlerts.map((alert) => `tydz. ${alert.weekNumber} +${Math.round(alert.deltaPct)}%`).join(', ')}. To ostrzeżenie matematyczne na podstawie wykonanych danych.
      </div>}

      {/* Weekly Tonnage Progression Bar Chart */}
      {analysisShowWeeklyTonnage && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="analysis-weekly-tonnage">
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
              <div key={w.weekName} className="space-y-1" id={`weekly-tonnage-week-${w.weekNumber}`}>
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
      </div>}

      {analysisShowWeeklyMetrics && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="analysis-weekly-metrics">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2"><Activity className="w-4 h-4 text-teal-400" />Metryki wykonania tydzień po tygodniu</h3>
          <p className="text-xs text-slate-400 mt-0.5">Wartości pochodzą wyłącznie z wykonanych dni i zapisanych serii w zakresie danego tygodnia.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]" id="weekly-metrics-table">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800"><tr>
              <th className="py-2 pr-3">Tydzień</th>
              {analysisShowExecutedDays && <th className="py-2 px-3">Dni</th>}
              {analysisShowExecutedExercises && <th className="py-2 px-3">Ćwiczenia</th>}
              {analysisShowExecutedSets && <th className="py-2 px-3">Serie</th>}
              {analysisShowExecutedReps && <th className="py-2 px-3">Powtórzenia</th>}
              <th className="py-2 px-3">Tonaż</th><th className="py-2 px-3">Tonaż/serię</th>
              {analysisShowVolumeDelta && <th className="py-2 px-3">Zmiana</th>}
              {analysisShowDataConfidence && <th className="py-2 pl-3">Jakość</th>}
            </tr></thead>
            <tbody className="divide-y divide-slate-800/70">{weeklyTonnage.map((week, index) => {
              const previous = weeklyTonnage[index - 1]?.volume || 0;
              const delta = volumeDeltaPercent(week.volume, previous);
              return <tr key={week.weekNumber} data-week-metrics={week.weekNumber}>
                <td className="py-2.5 pr-3 font-bold text-slate-200">{week.weekName}</td>
                {analysisShowExecutedDays && <td className="py-2.5 px-3 font-mono text-slate-300">{week.executedDays}/{week.plannedDays}</td>}
                {analysisShowExecutedExercises && <td className="py-2.5 px-3 font-mono text-slate-300">{week.executedExercises}</td>}
                {analysisShowExecutedSets && <td className="py-2.5 px-3 font-mono text-teal-300">{week.executedSets}</td>}
                {analysisShowExecutedReps && <td className="py-2.5 px-3 font-mono text-teal-300">{week.executedReps.toLocaleString('pl-PL')}</td>}
                <td className="py-2.5 px-3 font-mono text-emerald-300">{week.volume.toLocaleString('pl-PL')} {unit}</td><td className="py-2.5 px-3 font-mono text-sky-300">{volumePerSet(week.volume, week.executedSets) == null ? '—' : `${volumePerSet(week.volume, week.executedSets)!.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} ${unit}`}</td>
                {analysisShowVolumeDelta && <td className={`py-2.5 px-3 font-mono font-bold ${delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-amber-300' : 'text-slate-500'}`}>{index === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta}%`}</td>}
                {analysisShowDataConfidence && <td className="py-2.5 pl-3 font-mono text-sky-300">{week.dataConfidencePct}%</td>}
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>}

      {analysisShowWeeklyMetrics && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="analysis-rolling-volume">
        <div><h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Średnia krocząca tonażu (4 tygodnie)</h3><p className="text-xs text-slate-400 mt-0.5">Średnia obejmuje wyłącznie wykonany tonaż z ostatnich 4 tygodni.</p></div>
        {weeklyMetrics.length < 4 ? <p className="text-xs text-amber-300">Brak wystarczających danych — potrzeba co najmniej 4 tygodni.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-[11px]"><thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800"><tr><th className="py-2 pr-3">Tydzień</th><th className="py-2 px-3">Tonaż</th><th className="py-2 pl-3">Średnia 4T</th></tr></thead><tbody className="divide-y divide-slate-800/70">{weeklyMetrics.map((week, i) => <tr key={week.weekNumber}><td className="py-2.5 pr-3 font-bold text-slate-200">Tydzień {week.weekNumber}</td><td className="py-2.5 px-3 font-mono text-emerald-300">{week.volume.toLocaleString('pl-PL')} {unit}</td><td className="py-2.5 pl-3 font-mono text-purple-300">{rollingVolume[i] == null ? '—' : `${rollingVolume[i]!.toLocaleString('pl-PL')} ${unit}`}</td></tr>)}</tbody></table></div>}
      </div>}

      {analysisShowRegularity && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="analysis-regularity">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-400" />Regularność realizacji planu</h3>
            <p className="text-xs text-slate-400 mt-0.5">Wykonane dni ÷ zaplanowane dni. Cel: {analysisRegularityTargetPct}%.</p>
          </div>
          <div className="space-y-3">
            {weeklyTonnage.map((week) => {
              const pct = regularityPercent(week.executedDays, week.plannedDays);
              const reached = pct >= analysisRegularityTargetPct;
              return (
                <div key={week.weekNumber} data-regularity-week={week.weekNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-200">{week.weekName}</span><span className={reached ? 'text-emerald-300 font-mono font-bold' : 'text-amber-300 font-mono font-bold'}>{pct}% ({week.executedDays}/{week.plannedDays})</span></div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80"><div className={reached ? 'bg-sky-400 h-full rounded-full' : 'bg-amber-400 h-full rounded-full'} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analysisShowMonthlyComparison && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="analysis-monthly-comparison">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400" />Porównanie miesięczne</h3>
            <p className="text-xs text-slate-400 mt-0.5">Agregacja zapisanych, wykonanych punktów historii według miesiąca kalendarzowego.</p>
          </div>
          {monthlyMetrics.length === 0 ? <div className="text-xs text-slate-500">Brak wystarczających danych miesięcznych.</div> : (
            <div className="overflow-x-auto"><table className="w-full text-left text-[11px]" id="monthly-comparison-table"><thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800"><tr><th className="py-2 pr-3">Miesiąc</th><th className="py-2 px-3">Sesje</th><th className="py-2 px-3">Serie</th><th className="py-2 px-3">Powtórzenia</th><th className="py-2 pl-3">{analysisMonthlyMetric === 'volume' ? `Tonaż (${unit})` : analysisMonthlyMetric === 'executedSets' ? 'Serie' : 'Powtórzenia'}</th></tr></thead><tbody className="divide-y divide-slate-800/70">{monthlyMetrics.map((month) => <tr key={month.month} data-month={month.month}><td className="py-2.5 pr-3 font-bold text-slate-200">{month.month}</td><td className="py-2.5 px-3 font-mono text-slate-300">{month.sessions}</td><td className="py-2.5 px-3 font-mono text-teal-300">{month.executedSets}</td><td className="py-2.5 px-3 font-mono text-teal-300">{month.executedReps}</td><td className="py-2.5 pl-3 font-mono text-purple-300">{(analysisMonthlyMetric === 'volume' ? month.volume : analysisMonthlyMetric === 'executedSets' ? month.executedSets : month.executedReps).toLocaleString('pl-PL')}{analysisMonthlyMetric === 'volume' ? ` ${unit}` : ''}</td></tr>)}</tbody></table></div>
          )}
        </div>
      )}

      {analysisShowPeriodComparison && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="analysis-period-comparison">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" />Porównanie okresów cyklu</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pierwsza połowa zakresu analizy vs druga połowa. Liczone tylko z wykonanych danych tygodniowych.</p>
          </div>
          {!periodComparison.hasEnoughData ? (
            <div className="text-xs text-slate-500">Brak wystarczających danych do porównania dwóch okresów.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]" id="period-comparison-table">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <tr><th className="py-2 pr-3">Okres</th><th className="py-2 px-3">Tygodnie</th><th className="py-2 px-3">Dni</th><th className="py-2 px-3">Ćwiczenia</th><th className="py-2 px-3">Serie</th><th className="py-2 px-3">Powtórzenia</th><th className="py-2 pl-3">Tonaż</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr data-period="first"><td className="py-2.5 pr-3 font-bold text-slate-200">Okres A</td><td className="py-2.5 px-3 font-mono text-slate-400">{periodComparison.firstWeeks}</td><td className="py-2.5 px-3 font-mono text-sky-300">{periodComparison.first.executedDays}/{periodComparison.first.plannedDays}</td><td className="py-2.5 px-3 font-mono text-slate-300">{periodComparison.first.executedExercises}</td><td className="py-2.5 px-3 font-mono text-teal-300">{periodComparison.first.executedSets}</td><td className="py-2.5 px-3 font-mono text-teal-300">{periodComparison.first.executedReps}</td><td className="py-2.5 pl-3 font-mono text-purple-300">{periodComparison.first.volume.toLocaleString('pl-PL')} {unit}</td></tr>
                  <tr data-period="second"><td className="py-2.5 pr-3 font-bold text-slate-200">Okres B</td><td className="py-2.5 px-3 font-mono text-slate-400">{periodComparison.secondWeeks}</td><td className="py-2.5 px-3 font-mono text-sky-300">{periodComparison.second.executedDays}/{periodComparison.second.plannedDays}</td><td className="py-2.5 px-3 font-mono text-slate-300">{periodComparison.second.executedExercises}</td><td className="py-2.5 px-3 font-mono text-teal-300">{periodComparison.second.executedSets}</td><td className="py-2.5 px-3 font-mono text-teal-300">{periodComparison.second.executedReps}</td><td className="py-2.5 pl-3 font-mono text-purple-300">{periodComparison.second.volume.toLocaleString('pl-PL')} {unit}</td></tr>
                </tbody>
              </table>
              <div id="period-comparison-delta" className="mt-3 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300">
                Zmiana wybranej metryki: <span className={periodComparison.delta >= 0 ? 'text-emerald-300 font-mono font-bold' : 'text-rose-300 font-mono font-bold'}>{periodComparison.delta >= 0 ? '+' : ''}{periodComparison.delta.toLocaleString('pl-PL')}{analysisPeriodComparisonMetric === 'volume' ? ` ${unit}` : ''}</span>
              </div>
            </div>
          )}
        </div>
      )}

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
