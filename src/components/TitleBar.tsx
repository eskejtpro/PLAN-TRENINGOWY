import React from 'react';
import { Minus, Square, X, Dumbbell, ShieldCheck, Monitor } from 'lucide-react';

interface TitleBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeView: string;
  onSelectView: (view: string) => void;
  autoSaveStatus: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  theme,
  onToggleTheme,
  activeView,
  onSelectView,
  autoSaveStatus
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur select-none" id="desktop-titlebar">
      {/* Native Windows Titlebar */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-emerald-600 text-white">
            <Dumbbell className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-200">GymTracker Pro</span>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">Windows 10/11 x64 (Tkinter / JSON / %LOCALAPPDATA%)</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono text-[10px]">
            DPI: 100% 1920x1080
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {autoSaveStatus}
          </span>
          <div className="flex items-center">
            <button
              type="button"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Minimalizuj"
              id="btn-win-min"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Maksymalizuj"
              id="btn-win-max"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-red-600 rounded text-slate-400 hover:text-white"
              title="Zamknij"
              id="btn-win-close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs styled like modern Windows Fluent / PySide6 App */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar" id="nav-tabs">
          <button
            type="button"
            id="tab-plan"
            onClick={() => onSelectView('plan')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'plan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span>📅 Plan &amp; Ciężary</span>
          </button>

          <button
            type="button"
            id="tab-stats"
            onClick={() => onSelectView('stats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'stats'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span>📈 Progres &amp; Wykresy</span>
          </button>

          <button
            type="button"
            id="tab-muscle"
            onClick={() => onSelectView('muscle')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'muscle'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span>💪 Analiza Partii</span>
          </button>

          <button
            type="button"
            id="tab-weight"
            onClick={() => onSelectView('weight')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'weight'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span>⚖️ Waga Ciała</span>
          </button>

          <button
            type="button"
            id="tab-settings"
            onClick={() => onSelectView('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'settings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span>⚙️ Ustawienia JSON</span>
          </button>

          <button
            type="button"
            id="tab-python"
            onClick={() => onSelectView('python')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all border ${
              activeView === 'python'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50 hover:text-white'
            }`}
          >
            <span>🐍 Kod Pythona &amp; EXE</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="px-2 py-1 text-xs rounded border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            title="Przełącz motyw interfejsu"
            id="btn-theme-toggle"
          >
            {theme === 'dark' ? '🌙 Ciemny' : '☀️ Jasny'}
          </button>
        </div>
      </div>
    </header>
  );
};
