import React, { useState } from 'react';
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { BodyWeightEntry } from '../types';
import { getTodayDateString } from '../utils/calculations';

interface BodyWeightViewProps {
  bodyWeights: BodyWeightEntry[];
  onAddBodyWeight: (entry: Omit<BodyWeightEntry, 'id'>) => void;
  onDeleteBodyWeight: (id: string) => void;
  unit: 'kg' | 'lbs';
}

export const BodyWeightView: React.FC<BodyWeightViewProps> = ({
  bodyWeights,
  onAddBodyWeight,
  onDeleteBodyWeight,
  unit
}) => {
  const [date, setDate] = useState(getTodayDateString());
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const sortedEntries = [...bodyWeights].sort((a, b) => a.date.localeCompare(b.date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight.replace(',', '.'));
    if (isNaN(w) || w <= 0) return;

    onAddBodyWeight({
      date: date || getTodayDateString(),
      weight: Math.round(w * 10) / 10,
      notes: notes.trim()
    });

    setWeight('');
    setNotes('');
  };

  // Calculations
  const weights = sortedEntries.map((e) => e.weight);
  const currentWeight = weights.length > 0 ? weights[weights.length - 1] : 0;
  const initialWeight = weights.length > 0 ? weights[0] : 0;
  const totalChange = currentWeight && initialWeight ? Math.round((currentWeight - initialWeight) * 10) / 10 : 0;
  const averageWeight = weights.length > 0 ? Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10 : 0;

  // Simple SVG Line Chart for Body Weight
  const chartW = 600;
  const chartH = 200;
  const pL = 50;
  const pR = 25;
  const pT = 25;
  const pB = 35;
  const iW = chartW - pL - pR;
  const iH = chartH - pT - pB;

  const minBw = weights.length > 0 ? Math.max(0, Math.min(...weights) - 2) : 0;
  const maxBw = weights.length > 0 ? Math.max(...weights) + 2 : 100;
  const bwRange = maxBw - minBw || 1;

  const bwPoints = sortedEntries.map((item, idx) => {
    const x = sortedEntries.length > 1 ? pL + (idx / (sortedEntries.length - 1)) * iW : pL + iW / 2;
    const y = pT + iH - ((item.weight - minBw) / bwRange) * iH;
    return { ...item, x, y };
  });

  const bwPath = bwPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ''
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6" id="view-body-weight">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <span>Rejestr i Analiza Wagi Ciała</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Śledź regularne pomiary na czczo, aby kontrolować masę, redukcję lub rekompozycję.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Bieżąca Waga
          </span>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {currentWeight ? `${currentWeight} ${unit}` : '--'}
          </div>
          <span className="text-[11px] text-slate-500">Ostatni wpis</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Całkowita Zmiana
          </span>
          <div
            className={`text-xl font-extrabold font-mono flex items-center gap-1 ${
              totalChange < 0 ? 'text-emerald-400' : totalChange > 0 ? 'text-amber-400' : 'text-slate-200'
            }`}
          >
            {totalChange > 0 ? `+${totalChange}` : totalChange} {unit}
          </div>
          <span className="text-[11px] text-slate-500">W stosunku do startu</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Średnia Waga
          </span>
          <div className="text-xl font-extrabold text-slate-200 font-mono">
            {averageWeight ? `${averageWeight} ${unit}` : '--'}
          </div>
          <span className="text-[11px] text-slate-500">Średnia ze wszystkich pomiarów</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Liczba Pomiarów
          </span>
          <div className="text-xl font-extrabold text-slate-200 font-mono">
            {sortedEntries.length}
          </div>
          <span className="text-[11px] text-slate-500">Zarejestrowane dni</span>
        </div>
      </div>

      {/* Main Grid: Form + Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Entry Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Dodaj Nowy Pomiar</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Data:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-emerald-500"
                id="input-bw-date"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Waga ciała ({unit}):
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="np. 81.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-base font-bold focus:outline-hidden focus:border-emerald-500"
                id="input-bw-weight"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Pora dnia / Notatka:
              </label>
              <input
                type="text"
                placeholder="np. Rano na czczo po toalecie"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-emerald-500"
                id="input-bw-notes"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-colors text-xs"
              id="btn-submit-bw"
            >
              <Plus className="w-4 h-4" />
              <span>Zapisz pomiar wagi</span>
            </button>
          </form>
        </div>

        {/* Right Columns: Chart & Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Trend Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Wykres Trendu Wagi Ciała
            </h3>
            {sortedEntries.length < 2 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                Wprowadź co najmniej 2 pomiary wagi, aby zobaczyć linię trendu.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
                  {/* Grid */}
                  {[0, 0.5, 1].map((r) => {
                    const y = pT + iH * r;
                    const val = Math.round(maxBw - bwRange * r);
                    return (
                      <g key={r}>
                        <line x1={pL} y1={y} x2={chartW - pR} y2={y} stroke="#334155" strokeDasharray="3 3" />
                        <text x={pL - 6} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                          {val} {unit}
                        </text>
                      </g>
                    );
                  })}
                  {/* Line */}
                  <path d={bwPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
                  {/* Points */}
                  {bwPoints.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                      <text x={pt.x} y={pt.y - 8} fill="#f1f5f9" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {pt.weight}
                      </text>
                      <text x={pt.x} y={chartH - pB + 16} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        {pt.date.slice(5)}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-slate-800 bg-slate-950 font-bold text-xs text-slate-200">
              Historia Pomiarów
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Waga</th>
                    <th className="py-2.5 px-3">Zmiana</th>
                    <th className="py-2.5 px-3">Notatki</th>
                    <th className="py-2.5 px-3 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {sortedEntries.map((item, index) => {
                    const prev = index > 0 ? sortedEntries[index - 1].weight : null;
                    const delta = prev !== null ? Math.round((item.weight - prev) * 10) / 10 : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono">{item.date}</td>
                        <td className="py-2.5 px-3 font-bold font-mono text-emerald-400">
                          {item.weight} {unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {delta !== null ? (
                            <span className={delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-amber-400' : 'text-slate-400'}>
                              {delta > 0 ? `+${delta}` : delta} {unit}
                            </span>
                          ) : (
                            <span className="text-slate-500">--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[200px]">
                          {item.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteBodyWeight(item.id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
