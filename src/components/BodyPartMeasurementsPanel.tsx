import React, { useState, useMemo } from 'react';
import {
  BodyPartMeasurement,
  BodyPartType,
  BODY_PARTS
} from '../types';
import {
  BODY_PART_CONFIG,
  parseBodyMeasurementValue,
  sortBodyMeasurements,
  calculatePartProgressionStats,
  formatCm,
  formatSignedCm
} from '../utils/bodyMeasurements';
import {
  Ruler,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface BodyPartMeasurementsPanelProps {
  measurements: BodyPartMeasurement[];
  onAddMeasurement: (entry: Omit<BodyPartMeasurement, 'id'>) => void;
  onDeleteMeasurement: (id: string) => void;
  selectedPart?: BodyPartType;
  onSelectPart?: (part: BodyPartType) => void;
}

export const BodyPartMeasurementsPanel: React.FC<BodyPartMeasurementsPanelProps> = ({
  measurements,
  onAddMeasurement,
  onDeleteMeasurement,
  selectedPart: controlledPart,
  onSelectPart: controlledOnSelect
}) => {
  const [internalPart, setInternalPart] = useState<BodyPartType>('biceps');
  const selectedPart = controlledPart ?? internalPart;
  const setSelectedPart = (part: BodyPartType) => {
    if (controlledOnSelect) {
      controlledOnSelect(part);
    } else {
      setInternalPart(part);
    }
  };
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formValue, setFormValue] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate statistics for all parts
  const statsMap = useMemo(() => {
    const map: Record<BodyPartType, ReturnType<typeof calculatePartProgressionStats>> = {
      biceps: calculatePartProgressionStats(measurements, 'biceps'),
      triceps: calculatePartProgressionStats(measurements, 'triceps'),
      klata: calculatePartProgressionStats(measurements, 'klata'),
      barki: calculatePartProgressionStats(measurements, 'barki'),
      nogi: calculatePartProgressionStats(measurements, 'nogi')
    };
    return map;
  }, [measurements]);

  const activeStats = statsMap[selectedPart];
  const activeConfig = BODY_PART_CONFIG[selectedPart];

  // Filtered & sorted entries for current part
  const partEntries = useMemo(() => {
    return sortBodyMeasurements(measurements.filter((m) => m.part === selectedPart));
  }, [measurements, selectedPart]);

  // Handle simple submit: only date + value (cm)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const val = parseBodyMeasurementValue(formValue);
    if (val === null) {
      setFormError('Wpisz poprawny wymiar (np. 38.5 cm)');
      return;
    }

    if (!formDate) {
      setFormError('Wybierz datę pomiaru');
      return;
    }

    onAddMeasurement({
      date: formDate,
      part: selectedPart,
      value: val
    });

    setFormValue('');
    setFormSuccess(`Zapisano pomiar: ${activeConfig.label} ${val} cm`);
    setTimeout(() => setFormSuccess(null), 3000);
  };

  // Modern SVG Line / Area Chart calculations
  const chartW = 680;
  const chartH = 220;
  const pL = 55;
  const pR = 30;
  const pT = 30;
  const pB = 40;
  const innerW = chartW - pL - pR;
  const innerH = chartH - pT - pB;

  const values = partEntries.map((e) => e.value);
  const rawMin = values.length > 0 ? Math.min(...values) : 30;
  const rawMax = values.length > 0 ? Math.max(...values) : 40;
  const spread = rawMax - rawMin;
  const paddingMargin = spread < 2 ? 1 : Math.ceil(spread * 0.25);
  const chartMin = Math.max(0, Math.floor(rawMin - paddingMargin));
  const chartMax = Math.ceil(rawMax + paddingMargin);
  const chartRange = chartMax - chartMin || 1;

  const points = partEntries.map((item, idx) => {
    const x = partEntries.length > 1 ? pL + (idx / (partEntries.length - 1)) * innerW : pL + innerW / 2;
    const y = pT + innerH - ((item.value - chartMin) / chartRange) * innerH;
    return { ...item, x, y };
  });

  const linePath = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x},${pT + innerH} L ${points[0].x},${pT + innerH} Z`
      : '';

  return (
    <div
      id="panel-body-part-measurements"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 backdrop-blur-xs"
    >
      {/* 1. Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Ruler className="w-5 h-5" />
            </span>
            <span>Pomiary Partii Ciała & Analiza Progresu</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nowoczesny rejestr: wpisujesz tylko datę i obwód w cm. Wykres i analiza progresu wyliczają się automatycznie.
          </p>
        </div>

        {/* Quick status badge */}
        {activeStats.currentValue !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400">{activeConfig.label}:</span>
            <span className="font-bold text-emerald-400 text-sm">{formatCm(activeStats.currentValue)}</span>
            {activeStats.totalChange !== 0 && (
              <span
                className={`font-semibold ${
                  activeStats.totalChange > 0
                    ? 'text-emerald-400'
                    : activeStats.totalChange < 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                ({formatSignedCm(activeStats.totalChange)})
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Sleek Selector for Body Parts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="tablist">
        {BODY_PARTS.map((part) => {
          const cfg = BODY_PART_CONFIG[part];
          const st = statsMap[part];
          const isSelected = selectedPart === part;

          return (
            <button
              key={part}
              id={`btn-part-${part}`}
              type="button"
              onClick={() => {
                setSelectedPart(part);
                setFormError(null);
                setFormSuccess(null);
              }}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/60 shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                  {cfg.label}
                </span>
                {st.totalChange !== 0 && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      st.totalChange > 0
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {formatSignedCm(st.totalChange)}
                  </span>
                )}
              </div>

              <div className="text-base font-extrabold font-mono text-slate-200">
                {st.currentValue !== null ? formatCm(st.currentValue) : '--'}
              </div>

              <div className="text-[10px] text-slate-500 mt-0.5">
                {st.count === 0
                  ? 'Brak pomiarów'
                  : st.count === 1
                  ? '1 pomiar'
                  : `${st.count} pomiary`}
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Simple & Modern Input Strip: Data + Pomiar cm */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 sm:p-4 flex flex-wrap items-end gap-3 shadow-inner"
      >
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="input-body-part-date" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Data</span>
          </label>
          <input
            id="input-body-part-date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="w-36 min-w-[120px]">
          <label htmlFor="select-body-part" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            <span>Partia</span>
          </label>
          <select
            id="select-body-part"
            value={selectedPart}
            onChange={(e) => setSelectedPart(e.target.value as BodyPartType)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            {BODY_PARTS.map((p) => (
              <option key={p} value={p}>
                {BODY_PART_CONFIG[p].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label htmlFor="input-body-part-value" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pomiar (cm)</span>
          </label>
          <div className="relative">
            <input
              id="input-body-part-value"
              type="text"
              inputMode="decimal"
              placeholder={activeConfig.placeholder}
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">cm</span>
          </div>
        </div>

        <button
          id="btn-submit-body-measurement"
          type="submit"
          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-2 h-[35px]"
        >
          <Plus className="w-4 h-4" />
          <span>Zapisz pomiar</span>
        </button>

        {/* Feedback notices */}
        {formError && (
          <div className="w-full text-xs text-rose-400 flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="w-full text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}
      </form>

      {/* 4. Analysis Cards: Aktualny, Progres z datami, Analiza tempa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Aktualny wymiar */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Aktualny {activeConfig.label}
          </span>
          <div className="my-1">
            <span className="text-2xl font-extrabold font-mono text-slate-100">
              {activeStats.currentValue !== null ? formatCm(activeStats.currentValue) : '--'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {activeStats.latest ? `Data: ${activeStats.latest.date}` : 'Brak danych'}
          </span>
        </div>

        {/* Całkowity progres */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Progres od startu
          </span>
          <div className="my-1 flex items-center gap-1.5">
            <span
              className={`text-2xl font-extrabold font-mono flex items-center ${
                activeStats.totalChange > 0
                  ? 'text-emerald-400'
                  : activeStats.totalChange < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {activeStats.totalChange > 0 && <ArrowUpRight className="w-5 h-5 mr-0.5 inline" />}
              {activeStats.totalChange < 0 && <ArrowDownRight className="w-5 h-5 mr-0.5 inline" />}
              {activeStats.totalChange === 0 && <Minus className="w-4 h-4 mr-1 inline" />}
              {activeStats.totalChange !== 0 ? formatSignedCm(activeStats.totalChange) : '0.0 cm'}
            </span>
            {activeStats.totalChangePct !== 0 && (
              <span className="text-xs font-mono font-medium text-slate-400">
                ({activeStats.totalChangePct > 0 ? `+${activeStats.totalChangePct}%` : `${activeStats.totalChangePct}%`})
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            {activeStats.first ? `Baza: ${formatCm(activeStats.first.value)} (${activeStats.first.date})` : '--'}
          </span>
        </div>

        {/* Ostatnia zmiana */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Ostatnia zmiana
          </span>
          <div className="my-1">
            <span
              className={`text-2xl font-extrabold font-mono ${
                activeStats.changeFromPrevious === null
                  ? 'text-slate-500'
                  : activeStats.changeFromPrevious > 0
                  ? 'text-emerald-400'
                  : activeStats.changeFromPrevious < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {activeStats.changeFromPrevious !== null
                ? formatSignedCm(activeStats.changeFromPrevious)
                : '--'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {activeStats.previous
              ? `Względem ${activeStats.previous.date}`
              : activeStats.count === 1
              ? 'Pierwszy wpis w bazie'
              : '--'}
          </span>
        </div>

        {/* Analiza i tempo */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Analiza & Tempo</span>
          </span>
          <div className="my-1">
            <span className="text-sm font-bold text-slate-200 block truncate">
              {activeStats.trendLabel}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">
            {activeStats.monthlyRate !== null
              ? `${activeStats.monthlyRate > 0 ? `+${activeStats.monthlyRate}` : activeStats.monthlyRate} cm / miesiąc`
              : activeStats.daysElapsed > 0
              ? `${activeStats.daysElapsed} dni obserwacji`
              : 'Wymaga min. 2 pomiarów'}
          </span>
        </div>
      </div>

      {/* 5. Modern Chart & History with Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Modern SVG Area Chart (2 columns) */}
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Wykres Progresu: {activeConfig.fullLabel}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Oś X: Daty pomiarów • Oś Y: Centymetry (cm)
            </span>
          </div>

          {points.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-auto select-none min-w-[500px]"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis grid lines & labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const yVal = Math.round((chartMin + ratio * chartRange) * 10) / 10;
                  const yPos = pT + innerH - ratio * innerH;
                  return (
                    <g key={ratio}>
                      <line
                        x1={pL}
                        y1={yPos}
                        x2={chartW - pR}
                        y2={yPos}
                        stroke="#334155"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={pL - 8}
                        y={yPos + 4}
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {yVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                {points.length > 1 && <path d={areaPath} fill="url(#areaGradient)" />}

                {/* Main line */}
                {points.length > 1 && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points with Dates & Values */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  const prevPt = idx > 0 ? points[idx - 1] : null;
                  const delta = prevPt ? Math.round((pt.value - prevPt.value) * 10) / 10 : null;

                  return (
                    <g
                      key={pt.id}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Vertical guide line on hover */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={pT}
                          x2={pt.x}
                          y2={pT + innerH}
                          stroke="#10b981"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Outer pulse circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 7 : 4.5}
                        fill="#0f172a"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />

                      {/* Inner dot */}
                      <circle cx={pt.x} cy={pt.y} r={isHovered ? 3 : 2} fill="#34d399" />

                      {/* Value label above point */}
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        fill="#f8fafc"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {pt.value} cm
                      </text>

                      {/* Date label below axis */}
                      <text
                        x={pt.x}
                        y={pT + innerH + 18}
                        fill={isHovered ? '#34d399' : '#94a3b8'}
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {pt.date.slice(5).replace('-', '.')}
                      </text>

                      {/* Hover Tooltip Card */}
                      {isHovered && (
                        <g>
                          <rect
                            x={Math.max(10, Math.min(chartW - 140, pt.x - 65))}
                            y={pT + 5}
                            width="130"
                            height="42"
                            rx="6"
                            fill="#020617"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x={Math.max(10, Math.min(chartW - 140, pt.x - 65)) + 65}
                            y={pT + 22}
                            fill="#94a3b8"
                            fontSize="10"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {pt.date}
                          </text>
                          <text
                            x={Math.max(10, Math.min(chartW - 140, pt.x - 65)) + 65}
                            y={pT + 37}
                            fill="#34d399"
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {pt.value} cm {delta !== null ? `(${delta > 0 ? `+${delta}` : delta})` : '(start)'}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Ruler className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
              <p className="text-xs font-medium">Brak pomiarów dla partii: {activeConfig.label}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Użyj formularza powyżej, wpisz datę i obwód w cm, aby rozpocząć wykres.
              </p>
            </div>
          )}
        </div>

        {/* 6. Progres z datami: Tabela / Oś Czasu (1 column) */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Historia i Daty ({activeConfig.label})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {partEntries.length} {partEntries.length === 1 ? 'wpis' : 'wpisów'}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[230px] divide-y divide-slate-800/50">
            {partEntries.length > 0 ? (
              <table id="table-body-part-history" className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase font-semibold tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Wymiar</th>
                    <th className="py-2 px-3">Zmiana</th>
                    <th className="py-2 px-2 text-right">Usuń</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {partEntries
                    .slice()
                    .reverse()
                    .map((item, rIdx) => {
                      // Original chronological index
                      const origIdx = partEntries.length - 1 - rIdx;
                      const prevItem = origIdx > 0 ? partEntries[origIdx - 1] : null;
                      const delta = prevItem ? Math.round((item.value - prevItem.value) * 10) / 10 : null;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/30 transition-colors"
                          onMouseEnter={() => setHoveredIndex(origIdx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {item.date}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-100">
                            {item.value} cm
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px]">
                            {delta !== null ? (
                              <span
                                className={`font-semibold ${
                                  delta > 0
                                    ? 'text-emerald-400'
                                    : delta < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-500'
                                }`}
                              >
                                {delta > 0 ? `+${delta}` : delta} cm
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">start</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteMeasurement(item.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              title="Usuń wpis"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                Brak zapisanych pomiarów dla tej partii.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
