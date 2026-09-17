import React, { useState } from 'react';
import { Settings, Save, Download, Upload, RotateCcw, Folder, Check, Copy, ShieldCheck, Archive, Clock, RefreshCw, Trash2, HardDrive } from 'lucide-react';
import { GymData, AppSettings, BackupEntry } from '../types';
import { initialGymData } from '../data/initialData';

interface SettingsViewProps {
  data: GymData;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onExportJson: () => void;
  onImportJson: (imported: GymData) => void;
  onResetData: () => void;
  backups?: BackupEntry[];
  onCreateBackup?: () => void;
  onRestoreBackup?: (backup: BackupEntry) => void;
  onDownloadBackup?: (backup: BackupEntry) => void;
  onDeleteBackup?: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onResetData,
  backups = [],
  onCreateBackup,
  onRestoreBackup,
  onDownloadBackup,
  onDeleteBackup
}) => {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');

  const jsonString = JSON.stringify(data, null, 2);
  const diagnostics = (() => {
    const weeks = Array.isArray(data.weeks) ? data.weeks : [];
    const days = weeks.flatMap(w => Array.isArray(w.days) ? w.days : []);
    const exercises = days.flatMap(d => Array.isArray(d.exercises) ? d.exercises : []);
    const missingIds = [...weeks, ...days, ...exercises].filter(item => !item?.id).length;
    let jsonValid = false;
    try { JSON.parse(jsonString); jsonValid = true; } catch { jsonValid = false; }
    return { weeks: weeks.length, days: days.length, exercises: exercises.length, missingIds, jsonValid };
  })();

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAnalysisSettings = () => {
    const defaults = initialGymData.settings;
    const keys = Object.keys(defaults).filter(key => key.startsWith('analysis')) as Array<keyof AppSettings>;
    onUpdateSettings(Object.fromEntries(keys.map(key => [key, defaults[key]])) as Partial<AppSettings>);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.weeks)) {
          onImportJson(parsed as GymData);
          setImportError('');
        } else {
          setImportError('Nieprawidłowy format pliku. Brak sekcji "weeks".');
        }
      } catch (err) {
        setImportError('Błąd parsowania pliku JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportSettings = () => {
    const blob = new Blob([JSON.stringify({ schema: 'gymtracker-settings-v1', settings: data.settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'gymtracker-settings.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSettingsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        if (!parsed.settings || typeof parsed.settings !== 'object' || Array.isArray(parsed.settings)) throw new Error('invalid');
        onUpdateSettings(parsed.settings as Partial<AppSettings>); setImportError('');
      } catch { setImportError('Błędny plik konfiguracji ustawień.'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6" id="view-settings">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Ustawienia Programu &amp; Zarządzanie Plikiem JSON</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Zarządzaj lokalną bazą danych Windows (%LOCALAPPDATA%), jednostkami i kopiami zapasowymi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: General Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
            Konfiguracja Środowiska Windows
          </h3>

          <div id="settings-diagnostics" className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-300"><HardDrive className="w-4 h-4" /> Diagnostyka danych</div>
            <div>Struktura JSON: <span className={diagnostics.jsonValid ? 'text-emerald-300' : 'text-red-300'}>{diagnostics.jsonValid ? 'poprawna' : 'błędna'}</span></div>
            <div>Zakres: {diagnostics.weeks} tyg. · {diagnostics.days} dni · {diagnostics.exercises} ćw.</div>
            {diagnostics.missingIds > 0 && <div className="text-amber-300">Ostrzeżenie: {diagnostics.missingIds} elementów bez identyfikatora.</div>}
            {diagnostics.missingIds === 0 && <div className="text-slate-500">Brak brakujących identyfikatorów.</div>}
          </div>

          <label className="flex items-center gap-3 text-xs font-semibold text-slate-300">
            <input type="checkbox" checked={data.settings.analysisOnlyCompleted !== false}
              onChange={(e) => onUpdateSettings({ analysisOnlyCompleted: e.target.checked })}
              className="accent-emerald-500" />
            Analiza tylko ukończonych treningów (zalecane)
          </label>
          <p className="text-[11px] text-slate-500 -mt-3">Wyłączenie uwzględnia także zaplanowane, niewykonane serie.</p>

          {/* Windows Local App Data Path */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Docelowa ścieżka pliku w systemie Windows:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={data.settings.windowsPath}
                onChange={(e) => onUpdateSettings({ windowsPath: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Domyślna lokalizacja na Windows 10/11: <code className="text-slate-400">%LOCALAPPDATA%\GymTracker\workout_data.json</code>
            </p>
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jednostka ciężaru (kg / lbs):
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ unit: 'kg' })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  data.settings.unit === 'kg'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                Kilogramy (kg)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ unit: 'lbs' })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  data.settings.unit === 'lbs'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                Funty (lbs)
              </button>
            </div>
          </div>

          {/* Athlete Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Imię / Pseudonim zawodnika:
            </label>
            <input
              type="text"
              value={data.settings.athleteName}
              onChange={(e) => onUpdateSettings({ athleteName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
            />
          </div>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Automatyczny zapis</span>
              <span className="text-[11px] text-slate-500">
                Zapisuje zmiany w czasie rzeczywistym przy każdej modyfikacji
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.settings.autoSave}
              onChange={(e) => onUpdateSettings({ autoSave: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-semibold text-slate-300"><input id="chk-reduced-motion" type="checkbox" checked={data.settings.reducedMotion === true} onChange={e=>onUpdateSettings({reducedMotion:e.target.checked})} className="accent-emerald-500" /> Ogranicz animacje i przejścia</label>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">Ustawienia analiz (v{__APP_VERSION__})</h4>
            <button type="button" id="btn-reset-analysis-settings" onClick={resetAnalysisSettings} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold hover:bg-slate-700"><RotateCcw className="w-3.5 h-3.5" /> Przywróć domyślne analizy</button>
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-slate-300 space-y-1">
              <p className="font-bold text-emerald-300">Jak działa analiza?</p>
              <p>1. Zlicza tylko zatwierdzone dni i zapisane serie.</p>
              <p>2. Liczy tonaż z ciężaru × powtórzeń × serii.</p>
              <p>3. Porównuje progres od pierwszego do ostatniego wykonanego tygodnia.</p>
              <p>4. Pomija partie i ćwiczenia bez wykonania.</p>
              <p>5. Pokazuje wykonane serie, 1RM, tonaż i balans Push/Pull/Legs.</p>
              <p>6. Odświeża wyniki po zapisaniu zmiany planu.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisOnlyCompleted !== false} onChange={e=>onUpdateSettings({analysisOnlyCompleted:e.target.checked})} className="accent-emerald-500" /> Tylko zatwierdzone dni</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisIncludePartialHistory === true} onChange={e=>onUpdateSettings({analysisIncludePartialHistory:e.target.checked})} className="accent-emerald-500" /> Uwzględniaj częściowe serie tylko po ich odhaczeniu</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisHideEmptyGroups !== false} onChange={e=>onUpdateSettings({analysisHideEmptyGroups:e.target.checked})} className="accent-emerald-500" /> Ukrywaj puste partie</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisShowAlerts !== false} onChange={e=>onUpdateSettings({analysisShowAlerts:e.target.checked})} className="accent-emerald-500" /> Pokazuj alerty balansu</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisShowBodyWeight !== false} onChange={e=>onUpdateSettings({analysisShowBodyWeight:e.target.checked})} className="accent-emerald-500" /> Pokazuj zmianę masy ciała</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisShow1RM !== false} onChange={e=>onUpdateSettings({analysisShow1RM:e.target.checked})} className="accent-emerald-500" /> Pokazuj szacowany 1RM</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisRoundValues !== false} onChange={e=>onUpdateSettings({analysisRoundValues:e.target.checked})} className="accent-emerald-500" /> Zaokrąglaj wartości</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisAutoRefresh !== false} onChange={e=>onUpdateSettings({analysisAutoRefresh:e.target.checked})} className="accent-emerald-500" /> Odświeżaj po zmianie danych</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Od tygodnia <input type="number" min="1" value={data.settings.analysisStartWeek || 1} onChange={e=>onUpdateSettings({analysisStartWeek:Math.max(1, Number(e.target.value)||1)})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Do tygodnia <input type="number" min="1" value={data.settings.analysisEndWeek || 999} onChange={e=>onUpdateSettings({analysisEndWeek:Math.max(1, Number(e.target.value)||999)})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /></label>
            </div>
            <label className="block text-[11px] text-slate-300">Domyślna metryka wykresu
              <select value={data.settings.analysisDefaultMetric || 'progressPct'} onChange={e=>onUpdateSettings({analysisDefaultMetric:e.target.value as AppSettings['analysisDefaultMetric']})} className="ml-2 px-2 py-1 rounded bg-slate-950 border border-slate-700"><option value="progressPct">Procent progresu</option><option value="volume">Tonaż</option><option value="executedSets">Wykonane serie</option></select>
            </label>
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisShowDataQualityWarnings !== false} onChange={e=>onUpdateSettings({analysisShowDataQualityWarnings:e.target.checked})} className="accent-emerald-500" /> Ostrzeżenia jakości danych</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisRequireHistoryForCompleted !== false} onChange={e=>onUpdateSettings({analysisRequireHistoryForCompleted:e.target.checked})} className="accent-emerald-500" /> Wymagaj historii dla dnia ukończonego</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisWarnMissingHistory !== false} onChange={e=>onUpdateSettings({analysisWarnMissingHistory:e.target.checked})} className="accent-emerald-500" /> Ostrzegaj o brakującej historii</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.analysisShowExecutionSummary !== false} onChange={e=>onUpdateSettings({analysisShowExecutionSummary:e.target.checked})} className="accent-emerald-500" /> Pokaż podsumowanie wykonania</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-week-comparison" type="checkbox" checked={data.settings.analysisShowWeekComparison !== false} onChange={e=>onUpdateSettings({analysisShowWeekComparison:e.target.checked})} className="accent-emerald-500" /> Pokaż porównanie tygodni</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-weekly-tonnage" type="checkbox" checked={data.settings.analysisShowWeeklyTonnage !== false} onChange={e=>onUpdateSettings({analysisShowWeeklyTonnage:e.target.checked})} className="accent-emerald-500" /> Pokaż tonaż tygodniowy</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-weekly-metrics" type="checkbox" checked={data.settings.analysisShowWeeklyMetrics !== false} onChange={e=>onUpdateSettings({analysisShowWeeklyMetrics:e.target.checked})} className="accent-emerald-500" /> Pokaż metryki tygodniowe</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-executed-days" type="checkbox" checked={data.settings.analysisShowExecutedDays !== false} onChange={e=>onUpdateSettings({analysisShowExecutedDays:e.target.checked})} className="accent-emerald-500" /> Kolumna wykonanych dni</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-executed-exercises" type="checkbox" checked={data.settings.analysisShowExecutedExercises !== false} onChange={e=>onUpdateSettings({analysisShowExecutedExercises:e.target.checked})} className="accent-emerald-500" /> Kolumna ćwiczeń</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-executed-sets" type="checkbox" checked={data.settings.analysisShowExecutedSets !== false} onChange={e=>onUpdateSettings({analysisShowExecutedSets:e.target.checked})} className="accent-emerald-500" /> Kolumna serii</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-executed-reps" type="checkbox" checked={data.settings.analysisShowExecutedReps !== false} onChange={e=>onUpdateSettings({analysisShowExecutedReps:e.target.checked})} className="accent-emerald-500" /> Kolumna powtórzeń</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-volume-delta" type="checkbox" checked={data.settings.analysisShowVolumeDelta !== false} onChange={e=>onUpdateSettings({analysisShowVolumeDelta:e.target.checked})} className="accent-emerald-500" /> Zmiana tonażu tygodnia</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-data-confidence" type="checkbox" checked={data.settings.analysisShowDataConfidence !== false} onChange={e=>onUpdateSettings({analysisShowDataConfidence:e.target.checked})} className="accent-emerald-500" /> Wiarygodność danych</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-best-e1rm" type="checkbox" checked={data.settings.analysisShowBestE1RM !== false} onChange={e=>onUpdateSettings({analysisShowBestE1RM:e.target.checked})} className="accent-emerald-500" /> Najlepszy e1RM</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-latest-result" type="checkbox" checked={data.settings.analysisShowLatestResult !== false} onChange={e=>onUpdateSettings({analysisShowLatestResult:e.target.checked})} className="accent-emerald-500" /> Ostatni wynik</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-trend-line" type="checkbox" checked={data.settings.analysisShowTrendLine !== false} onChange={e=>onUpdateSettings({analysisShowTrendLine:e.target.checked})} className="accent-emerald-500" /> Trend siły</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-pr-markers" type="checkbox" checked={data.settings.analysisShowPRMarkers !== false} onChange={e=>onUpdateSettings({analysisShowPRMarkers:e.target.checked})} className="accent-emerald-500" /> Markery rekordów PR</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Metryka PR <select id="select-analysis-pr-metric" value={data.settings.analysisPRMetric || 'e1RM'} onChange={e=>onUpdateSettings({analysisPRMetric:e.target.value as AppSettings['analysisPRMetric']})} className="px-1 py-1 rounded bg-slate-900 border border-slate-700"><option value="e1RM">Szacowany e1RM</option><option value="weight">Ciężar</option><option value="volume">Tonaż</option></select></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Okno stagnacji <input id="input-analysis-stagnation-window" type="number" min="2" max="52" value={data.settings.analysisStagnationWindow || 4} onChange={e=>onUpdateSettings({analysisStagnationWindow:Math.max(2,Math.min(52,Number(e.target.value)||4))})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /> tyg./pkt</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Min. sesji stagnacji <input id="input-analysis-stagnation-min" type="number" min="2" max="52" value={data.settings.analysisStagnationMinSessions || 3} onChange={e=>onUpdateSettings({analysisStagnationMinSessions:Math.max(2,Math.min(52,Number(e.target.value)||3))})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-regularity" type="checkbox" checked={data.settings.analysisShowRegularity !== false} onChange={e=>onUpdateSettings({analysisShowRegularity:e.target.checked})} className="accent-emerald-500" /> Wykres regularności tygodniowej</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Cel regularności (%) <input id="input-analysis-regularity-target" type="number" min="1" max="100" value={data.settings.analysisRegularityTargetPct || 80} onChange={e=>onUpdateSettings({analysisRegularityTargetPct:Math.max(1,Math.min(100,Number(e.target.value)||80))})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-muscle-frequency" type="checkbox" checked={data.settings.analysisShowMuscleFrequency !== false} onChange={e=>onUpdateSettings({analysisShowMuscleFrequency:e.target.checked})} className="accent-emerald-500" /> Częstotliwość partii mięśniowych</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-monthly-comparison" type="checkbox" checked={data.settings.analysisShowMonthlyComparison !== false} onChange={e=>onUpdateSettings({analysisShowMonthlyComparison:e.target.checked})} className="accent-emerald-500" /> Porównanie miesięczne</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Metryka miesięczna <select id="select-analysis-monthly-metric" value={data.settings.analysisMonthlyMetric || 'volume'} onChange={e=>onUpdateSettings({analysisMonthlyMetric:e.target.value as AppSettings['analysisMonthlyMetric']})} className="px-1 py-1 rounded bg-slate-900 border border-slate-700"><option value="volume">Tonaż</option><option value="executedSets">Serie</option><option value="executedReps">Powtórzenia</option></select></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input id="chk-analysis-period-comparison" type="checkbox" checked={data.settings.analysisShowPeriodComparison !== false} onChange={e=>onUpdateSettings({analysisShowPeriodComparison:e.target.checked})} className="accent-emerald-500" /> Porównanie okresów</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Metryka okresów <select id="select-analysis-period-metric" value={data.settings.analysisPeriodComparisonMetric || 'volume'} onChange={e=>onUpdateSettings({analysisPeriodComparisonMetric:e.target.value as AppSettings['analysisPeriodComparisonMetric']})} className="px-1 py-1 rounded bg-slate-900 border border-slate-700"><option value="volume">Tonaż</option><option value="executedSets">Serie</option><option value="executedReps">Powtórzenia</option><option value="executedDays">Dni</option></select></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Minimum serii <input type="number" min="1" max="100" value={data.settings.analysisMinExecutedSets || 1} onChange={e=>onUpdateSettings({analysisMinExecutedSets:Math.max(1,Math.min(100,Number(e.target.value)||1))})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Skok tonażu (%) <input type="number" min="1" max="500" value={data.settings.analysisWarnVolumeJumpPct || 30} onChange={e=>onUpdateSettings({analysisWarnVolumeJumpPct:Math.max(1,Math.min(500,Number(e.target.value)||30))})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Okno trendu (tyg.) <input type="number" min="1" max="52" value={data.settings.analysisTrendWindowWeeks || 4} onChange={e=>onUpdateSettings({analysisTrendWindowWeeks:Math.max(1,Math.min(52,Number(e.target.value)||4))})} className="w-14 px-1 py-1 rounded bg-slate-900 border border-slate-700" /></label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.confirmBeforeDelete !== false} onChange={e=>onUpdateSettings({confirmBeforeDelete:e.target.checked})} className="accent-emerald-500" /> Potwierdzaj usuwanie</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"><input type="checkbox" checked={data.settings.rememberLastView === true} onChange={e=>onUpdateSettings({rememberLastView:e.target.checked})} className="accent-emerald-500" /> Zapamiętaj ostatni widok</label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">Widok startowy <select value={data.settings.startupView || 'plan'} onChange={e=>onUpdateSettings({startupView:e.target.value as AppSettings['startupView']})} className="px-1 py-1 rounded bg-slate-900 border border-slate-700"><option value="plan">Plan</option><option value="stats">Progres</option><option value="muscle">Partie</option><option value="weight">Waga</option><option value="settings">Ustawienia</option></select></label>
            </div>
          </div>

          {/* 🛡️ AUTOMATIC BACKUP CONFIGURATION */}
          <div className="pt-3 border-t border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Automatyczna Kopia Zapasowa (Auto-Backup JSON)</span>
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] text-slate-400 font-medium">Aktywuj Auto-Backup:</span>
                <input
                  type="checkbox"
                  checked={data.settings.autoBackupEnabled ?? true}
                  onChange={(e) => onUpdateSettings({ autoBackupEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  id="chk-autobackup-enabled"
                />
              </label>
            </div>

            {/* Folder ścieżki kopii zapasowej */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>Folder docelowy kopii zapasowych:</span>
              </label>
              <input
                type="text"
                value={data.settings.backupFolderPath || '%LOCALAPPDATA%\\GymTracker\\Backups'}
                onChange={(e) => onUpdateSettings({ backupFolderPath: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                id="input-backup-folder"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Aplikacja utwórz tam podfolder i zapisze plik z datą np. <code className="text-slate-400">workout_backup_20260915_120000.json</code>.
              </p>
            </div>

            {/* Opcje wyzwalaczy backupu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={data.settings.backupOnSave ?? true}
                  onChange={(e) => onUpdateSettings({ backupOnSave: e.target.checked })}
                  className="w-3.5 h-3.5 accent-emerald-500"
                  id="chk-backup-onsave"
                />
                <span className="text-slate-300 text-[11px]">Kopia przy każdym zapisie</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={data.settings.backupOnClose ?? true}
                  onChange={(e) => onUpdateSettings({ backupOnClose: e.target.checked })}
                  className="w-3.5 h-3.5 accent-emerald-500"
                  id="chk-backup-onclose"
                />
                <span className="text-slate-300 text-[11px]">Kopia przy zamykaniu (WM_DELETE)</span>
              </label>
            </div>

            {/* Manual backup trigger button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onCreateBackup}
                className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                id="btn-create-backup-now"
              >
                <Archive className="w-4 h-4" />
                <span>Utwórz Kopię Zapasową Teraz (Backup NOW)</span>
              </button>
            </div>

            {data.settings.lastBackupTime && (
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Ostatnia kopia: {data.settings.lastBackupTime}</span>
              </p>
            )}
          </div>

          {/* Actions & Manual Operations */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300">Zarządzanie Plikiem Danych</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportJson}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                id="btn-export-json"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pobierz workout_data.json</span>
              </button>

              <label className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wczytaj plik JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button type="button" id="btn-export-settings" onClick={handleExportSettings} className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"><Download className="w-3.5 h-3.5 text-emerald-400" /> Eksportuj ustawienia</button>
              <label className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"><Upload className="w-3.5 h-3.5 text-emerald-400" /> Importuj ustawienia<input id="input-import-settings" type="file" accept=".json" onChange={handleSettingsUpload} className="hidden" /></label>

              <button
                type="button"
                onClick={onResetData}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                id="btn-reset-demo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Przywróć domyślny plan</span>
              </button>
            </div>
            {importError && (
              <p className="text-xs text-red-400">{importError}</p>
            )}
          </div>
        </div>

        {/* Right Column: Backup History Log & Raw JSON Viewer */}
        <div className="space-y-6">
          {/* Backup History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Historia Kopii Zapasowych Auto-Backup ({backups.length})</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Max 15 najnowszych kopii</span>
            </div>

            {backups.length === 0 ? (
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-lg text-center text-xs text-slate-500">
                Brak jeszcze automatycznych kopii. Kliknij "Utwórz Kopię Zapasową Teraz" lub dokonaj edycji planu.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono text-slate-200 font-semibold text-[11px] flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{b.fileName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                        <span>{b.timestamp}</span>
                        <span>•</span>
                        <span>{b.weeksCount} tyg.</span>
                        <span>•</span>
                        <span>{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onDownloadBackup && (
                        <button
                          type="button"
                          onClick={() => onDownloadBackup(b)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700"
                          title="Pobierz ten plik backupu"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Pobierz</span>
                        </button>
                      )}
                      {onRestoreBackup && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Czy na pewno chcesz przywrócić kopię zapasową z ${b.timestamp}?`)) {
                              onRestoreBackup(b);
                            }
                          }}
                          className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-800/60"
                          title="Przywróć stan z tej kopii"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Przywróć</span>
                        </button>
                      )}
                      {onDeleteBackup && (
                        <button
                          type="button"
                          onClick={() => onDeleteBackup(b.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 transition-colors border border-slate-700"
                          title="Usuń wpis kopii"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw JSON Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Podgląd aktualnej struktury JSON</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {data.weeks.length} tygodni, {data.bodyWeights.length} wpisów wagi
                </span>
              </h3>
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 font-medium border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Skopiowano!' : 'Kopiuj JSON'}</span>
              </button>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-auto max-h-[300px] font-mono text-[11px] text-slate-300 leading-relaxed">
              <pre>{jsonString}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
