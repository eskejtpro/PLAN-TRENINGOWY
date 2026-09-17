import React, { useMemo, useState } from 'react';
import { TrendingUp, Award, Flame, BarChart3, Calendar, Layers, FileSpreadsheet } from 'lucide-react';
import { TrainingWeek, ExerciseHistoryPoint, BodyWeightEntry } from '../types';
import { calculate1RM } from '../utils/calculations';
import { MesocycleReportView } from './MesocycleReportView';
import { AnalysisExecutionOptions, analysisOptionsForWeek, bestHistoryPoint, dedupeHistory, detectStagnation, executedSets, historyForAnalysis, includeExerciseInAnalysis, latestHistoryPoint, personalRecordIndices, progressionStatus, scopeAnalysisWeeks, trendSlope, PersonalRecordMetric } from '../utils/analysis';

interface StatsViewProps {
  weeks: TrainingWeek[];
  bodyWeights?: BodyWeightEntry[];
  unit: 'kg' | 'lbs';
  analysisOnlyCompleted?: boolean;
  analysisHideEmptyGroups?: boolean;
  analysisIncludePartialHistory?: boolean;
  analysisStartWeek?: number;
  analysisEndWeek?: number;
  analysisDefaultMetric?: 'progressPct' | 'volume' | 'executedSets';
  analysisShowDataQualityWarnings?: boolean;
  analysisRequireHistoryForCompleted?: boolean;
  analysisMinExecutedSets?: number;
  analysisWarnMissingHistory?: boolean;
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
  analysisShowBestE1RM?: boolean;
  analysisShowLatestResult?: boolean;
  analysisShowTrendLine?: boolean;
  analysisShowPRMarkers?: boolean;
  analysisPRMetric?: PersonalRecordMetric;
  analysisStagnationWindow?: number;
  analysisStagnationMinSessions?: number;
  analysisShowRegularity?: boolean;
  analysisRegularityTargetPct?: number;
  analysisShowMonthlyComparison?: boolean;
  analysisMonthlyMetric?: 'volume' | 'executedSets' | 'executedReps';
  analysisShowPeriodComparison?: boolean;
  analysisPeriodComparisonMetric?: 'volume' | 'executedSets' | 'executedReps' | 'executedDays';
  analysisShowRollingVolume?: boolean;
  analysisWarnVolumeJumpPct?: number;
  analysisReportLayout?: 'bento_left' | 'compact_dashboard' | 'split_preview' | 'executive_strip';
  analysisShowLayoutSwitcher?: boolean;
  analysisShowAiAgent?: boolean;
  aiAgentMode?: 'heuristic_local' | 'server_endpoint';
  aiAgentServerUrl?: string;
  aiAgentApiKey?: string;
  aiAgentPersona?: 'coach_hardcore' | 'sports_scientist' | 'regenerative' | 'balanced';
  aiAgentFocus?: 'all_muscles' | 'hypertrophy_volume' | 'strength_progression' | 'fatigue_management';
  aiAgentResponseLength?: 'concise' | 'detailed' | 'bullet_points';
}

export const StatsView: React.FC<StatsViewProps> = ({ 
  weeks, 
  bodyWeights = [], 
  unit, 
  analysisOnlyCompleted = true, 
  analysisStartWeek = 1, 
  analysisEndWeek = 999, 
  analysisIncludePartialHistory = false, 
  analysisRequireHistoryForCompleted = false, 
  analysisMinExecutedSets = 1, 
  analysisShowExecutionSummary = true, 
  analysisShowWeekComparison = true, 
  analysisShowWeeklyTonnage = false, 
  analysisShowWeeklyMetrics = false, 
  analysisShowExecutedDays = true, 
  analysisShowExecutedExercises = true, 
  analysisShowExecutedSets = true, 
  analysisShowExecutedReps = true, 
  analysisShowVolumeDelta = true, 
  analysisShowDataConfidence = true, 
  analysisShowBestE1RM = true, 
  analysisShowLatestResult = true, 
  analysisShowTrendLine = true, 
  analysisShowPRMarkers = true, 
  analysisPRMetric = 'e1RM', 
  analysisStagnationWindow = 4, 
  analysisStagnationMinSessions = 3, 
  analysisShowRegularity = false, 
  analysisRegularityTargetPct = 80, 
  analysisShowMonthlyComparison = false, 
  analysisMonthlyMetric = 'volume', 
  analysisShowPeriodComparison = false, 
  analysisPeriodComparisonMetric = 'volume', 
  analysisShowRollingVolume = false, 
  analysisWarnVolumeJumpPct = 30,
  analysisReportLayout,
  analysisShowLayoutSwitcher = false,
  analysisShowAiAgent = true,
  aiAgentMode,
  aiAgentServerUrl,
  aiAgentApiKey,
  aiAgentPersona,
  aiAgentFocus,
  aiAgentResponseLength
}) => {
  const [activeTab, setActiveTab] = useState<'mesocycle_report' | 'exercises_1rm'>('mesocycle_report');
  const scopedWeeks = useMemo(() => scopeAnalysisWeeks(weeks, analysisStartWeek, analysisEndWeek), [weeks, analysisStartWeek, analysisEndWeek]);
  const analysisOptions = useMemo<AnalysisExecutionOptions>(() => ({
    onlyCompleted: analysisOnlyCompleted,
    includePartialHistory: analysisIncludePartialHistory,
    requireHistoryForCompleted: analysisRequireHistoryForCompleted,
    minExecutedSets: analysisMinExecutedSets,
    startDate: scopedWeeks[0]?.startDate,
  }), [analysisOnlyCompleted, analysisIncludePartialHistory, analysisRequireHistoryForCompleted, analysisMinExecutedSets, scopedWeeks]);

  // Collect all distinct exercise names
  const exerciseNamesMap = new Map<string, { latestWeight: number; history: ExerciseHistoryPoint[]; goalWeight?: number }>();

  scopedWeeks.forEach((week, weekIndex) => {
    const weekOptions = analysisOptionsForWeek(week, analysisOptions, scopedWeeks[weekIndex + 1]?.startDate);
    week.days.forEach((day) => {
      day.exercises.forEach((ex) => {
        if (!includeExerciseInAnalysis(day, ex, weekOptions)) return;
        const existing = exerciseNamesMap.get(ex.name);
        const sortedHistory = dedupeHistory([...(existing?.history || []), ...historyForAnalysis(ex, weekOptions)], analysisOptions.startDate);

        exerciseNamesMap.set(ex.name, {
          latestWeight: Math.max(existing?.latestWeight || 0, ex.weight),
          history: sortedHistory,
          goalWeight: ex.goalWeight ?? existing?.goalWeight
        });
      });
    });
  });

  const availableExerciseNames = Array.from(exerciseNamesMap.keys());
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>(
    availableExerciseNames[0] || ''
  );

  const selectedData = selectedExerciseName ? exerciseNamesMap.get(selectedExerciseName) : null;
  const historyPoints = selectedData?.history || [];
  const goalWeight = selectedData?.goalWeight;

  // Metrics for selected exercise
  const maxWeight = historyPoints.length > 0 ? Math.max(...historyPoints.map((p) => p.weight)) : 0;
  const initialWeight = historyPoints.length > 0 ? historyPoints[0].weight : 0;
  const weightGain = Math.round((maxWeight - initialWeight) * 10) / 10;
  const weightGainPct = initialWeight > 0 ? Math.round((weightGain / initialWeight) * 100) : 0;
  const bestPoint = bestHistoryPoint(historyPoints);
  const latestPoint = latestHistoryPoint(historyPoints);
  const trend = trendSlope(historyPoints.map((point) => point.weight));
  const prIndices = personalRecordIndices(historyPoints, analysisPRMetric);
  const stagnation = detectStagnation(historyPoints, analysisPRMetric, analysisStagnationWindow, analysisStagnationMinSessions);
  const progression = progressionStatus(historyPoints, analysisPRMetric);
  const best1RM = bestPoint ? calculate1RM(bestPoint.weight, bestPoint.reps) : 0;

  // Total executed sets across all weeks from the start of the plan
  const totalSetsExecuted = scopedWeeks.reduce((acc, w, weekIndex) => {
    const weekOptions = analysisOptionsForWeek(w, analysisOptions, scopedWeeks[weekIndex + 1]?.startDate);
    return (
      acc +
      w.days.reduce((dAcc, d) => {
        return (
          dAcc +
          d.exercises.reduce((eAcc, e) => {
            return eAcc + executedSets(d, e, weekOptions);
          }, 0)
        );
      }, 0)
    );
  }, 0);

  // SVG Chart rendering
  const [hoveredPoint, setHoveredPoint] = useState<ExerciseHistoryPoint | null>(null);

  const chartWidth = 640;
  const chartHeight = 260;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const weights = historyPoints.map((p) => p.weight);
  const minW = weights.length > 0 ? Math.max(0, Math.min(...weights) - 5) : 0;
  const maxW = weights.length > 0 ? Math.max(...weights) + 5 : 100;
  const range = maxW - minW || 1;

  const points = historyPoints.map((p, i) => {
    const x = historyPoints.length > 1 ? padLeft + (i / (historyPoints.length - 1)) * innerW : padLeft + innerW / 2;
    const y = padTop + innerH - ((p.weight - minW) / range) * innerH;
    return { ...p, x, y };
  });

  const pathD =
    points.length > 0
      ? points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '')
      : '';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6" id="view-stats">
      {/* Top Tab Bar: Raport Mezocyklu vs Wykresy Ćwiczeń */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('mesocycle_report')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
            activeTab === 'mesocycle_report'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-xs'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
          }`}
          id="tab-btn-mesocycle-report"
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Raport Podsumowujący Cały Cykl / Mezocykl</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {weeks.length} tyg.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exercises_1rm')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
            activeTab === 'exercises_1rm'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-xs'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
          }`}
          id="tab-btn-exercises-1rm"
        >
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span>Wykresy i 1RM Ćwiczeń</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {availableExerciseNames.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RAPORT PODSUMOWUJĄCY CAŁY CYKL / MEZOCYKL */}
      {activeTab === 'mesocycle_report' && (
        <MesocycleReportView 
          weeks={weeks} 
          bodyWeights={bodyWeights} 
          unit={unit} 
          analysisOnlyCompleted={analysisOnlyCompleted} 
          analysisStartWeek={analysisStartWeek} 
          analysisEndWeek={analysisEndWeek} 
          analysisIncludePartialHistory={analysisIncludePartialHistory} 
          analysisRequireHistoryForCompleted={analysisRequireHistoryForCompleted} 
          analysisMinExecutedSets={analysisMinExecutedSets} 
          analysisShowExecutionSummary={analysisShowExecutionSummary} 
          analysisShowWeekComparison={analysisShowWeekComparison} 
          analysisShowWeeklyTonnage={analysisShowWeeklyTonnage} 
          analysisShowWeeklyMetrics={analysisShowWeeklyMetrics} 
          analysisShowExecutedDays={analysisShowExecutedDays} 
          analysisShowExecutedExercises={analysisShowExecutedExercises} 
          analysisShowExecutedSets={analysisShowExecutedSets} 
          analysisShowExecutedReps={analysisShowExecutedReps} 
          analysisShowVolumeDelta={analysisShowVolumeDelta} 
          analysisShowDataConfidence={analysisShowDataConfidence} 
          analysisShowRegularity={analysisShowRegularity} 
          analysisRegularityTargetPct={analysisRegularityTargetPct} 
          analysisShowMonthlyComparison={analysisShowMonthlyComparison} 
          analysisMonthlyMetric={analysisMonthlyMetric} 
          analysisShowPeriodComparison={analysisShowPeriodComparison} 
          analysisPeriodComparisonMetric={analysisPeriodComparisonMetric} 
          analysisShowRollingVolume={analysisShowRollingVolume} 
          analysisWarnVolumeJumpPct={analysisWarnVolumeJumpPct}
          analysisReportLayout={analysisReportLayout}
          analysisShowLayoutSwitcher={analysisShowLayoutSwitcher}
          analysisShowAiAgent={analysisShowAiAgent}
          aiAgentMode={aiAgentMode}
          aiAgentServerUrl={aiAgentServerUrl}
          aiAgentApiKey={aiAgentApiKey}
          aiAgentPersona={aiAgentPersona}
          aiAgentFocus={aiAgentFocus}
          aiAgentResponseLength={aiAgentResponseLength}
        />
      )}

      {/* TAB 2: ANALIZA POSZCZEGÓLNYCH ĆWICZEŃ & 1RM */}
      {activeTab === 'exercises_1rm' && (
        <div className="space-y-6">
          {/* Top Header & Exercise Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Analiza Progresu Siłowego i 1RM</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Wizualizacja postępów obciążenia dla wybranego ćwiczenia na przestrzeni cykli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Ćwiczenie:</label>
          <select
            value={selectedExerciseName}
            onChange={(e) => setSelectedExerciseName(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
            id="select-stats-exercise"
          >
            {availableExerciseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Maksymalny Ciężar</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono">
            {maxWeight} {unit}
          </div>
          <span className="text-[11px] text-slate-500">Najwyższy zanotowany wynik</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Szacowany 1RM</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono">
            {best1RM} {unit}
          </div>
          <span className="text-[11px] text-slate-500">Kalkulator Epleya (1 powt.)</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Przyrost Ciężaru</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            +{weightGain} {unit}
          </div>
          <span className="text-[11px] text-emerald-400/90 font-medium">+{weightGainPct}% progresu</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Wykonane Serie</span>
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-extrabold text-teal-300 font-mono">
            {totalSetsExecuted} serii
          </div>
          <span className="text-[11px] text-slate-500">Zaliczonych od początku planu</span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Wykres Progresji Ciężaru: {selectedExerciseName}</span>
          </h3>
          {hoveredPoint && (
            <div className="text-xs bg-slate-950 px-3 py-1 rounded-md border border-slate-800 text-emerald-300 font-mono">
              Data: <strong>{hoveredPoint.date}</strong> | Ciężar: <strong>{hoveredPoint.weight} {unit}</strong> ({hoveredPoint.sets}x{hoveredPoint.reps})
            </div>
          )}
        </div>
        {(analysisShowBestE1RM || analysisShowLatestResult || analysisShowTrendLine) && historyPoints.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400" id="exercise-analysis-signals">
            {analysisShowBestE1RM && bestPoint && <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">Najlepszy e1RM: <strong className="text-amber-300">{best1RM} {unit}</strong></span>}
            {analysisShowLatestResult && latestPoint && <span className="px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20">Ostatni: <strong className="text-sky-300">{latestPoint.weight} {unit}</strong> ({latestPoint.date})</span>}
            {analysisShowTrendLine && <span className={`px-2 py-1 rounded-md border ${trend > 0 ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' : trend < 0 ? 'text-amber-300 border-amber-500/20 bg-amber-500/10' : 'text-slate-300 border-slate-700 bg-slate-950'}`}>Trend: <strong>{trend > 0 ? 'wzrost' : trend < 0 ? 'spadek' : 'stabilny'}</strong> ({trend.toFixed(2)} {unit}/punkt)</span>}
            <span className={`px-2 py-1 rounded-md border ${stagnation === 'stagnating' ? 'text-amber-300 border-amber-500/20 bg-amber-500/10' : stagnation === 'progressing' ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-400 border-slate-700 bg-slate-950'}`} id="stagnation-status">Stagnacja: <strong>{stagnation === 'insufficient' ? 'brak wystarczających danych' : stagnation === 'stagnating' ? 'możliwa' : 'nie wykryto'}</strong></span>
            <span className={`px-2 py-1 rounded-md border ${progression === 'progressing' ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' : progression === 'regressing' ? 'text-rose-300 border-rose-500/20 bg-rose-500/10' : 'text-slate-400 border-slate-700 bg-slate-950'}`} id="progression-status">Cel progresji: <strong>{progression === 'insufficient' ? 'brak wystarczających danych' : progression === 'progressing' ? 'progres' : progression === 'regressing' ? 'regres' : 'stabilnie'}</strong></span>
            {goalWeight && latestPoint && <span className={`px-2 py-1 rounded-md border ${latestPoint.weight >= goalWeight ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' : 'text-sky-300 border-sky-500/20 bg-sky-500/10'}`} id="exercise-goal-status">Cel: <strong>{latestPoint.weight >= goalWeight ? 'osiągnięty' : `${latestPoint.weight}/${goalWeight} ${unit}`}</strong></span>}
          </div>
        )}

        {historyPoints.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
            Brak punktów pomiarowych dla tego ćwiczenia. Zmień ciężar w planie treningowym, aby utworzyć historię!
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[500px] select-none"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const yVal = minW + range * (1 - ratio);
                const yPx = padTop + innerH * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={yPx}
                      x2={chartWidth - padRight}
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
                      {Math.round(yVal)} {unit}
                    </text>
                  </g>
                );
              })}

              {/* Chart Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Gradient Area under curve */}
              {points.length > 1 && (
                <path
                  d={`${pathD} L ${points[points.length - 1].x},${padTop + innerH} L ${points[0].x},${padTop + innerH} Z`}
                  fill="rgba(16, 185, 129, 0.12)"
                />
              )}

              {/* Data Points */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill={analysisShowPRMarkers && prIndices.includes(i) ? '#fbbf24' : '#10b981'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {analysisShowPRMarkers && prIndices.includes(i) && <text x={pt.x} y={pt.y + 22} fill="#fbbf24" fontSize="9" textAnchor="middle" fontFamily="monospace">PR</text>}
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    fill="#e2e8f0"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {pt.weight}
                  </text>
                  <text
                    x={pt.x}
                    y={chartHeight - padBottom + 18}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {pt.date.slice(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  )}
</div>
  );
};
