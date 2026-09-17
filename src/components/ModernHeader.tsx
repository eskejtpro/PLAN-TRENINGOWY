import React from 'react';
import { 
  Menu, 
  Search, 
  Plus, 
  Calendar, 
  Download, 
  HardDrive, 
  ShieldCheck, 
  Sun, 
  Moon,
  Dumbbell
} from 'lucide-react';
import { AppSettings } from '../types';

interface ModernHeaderProps {
  activeView: string;
  onSelectView: (view: string) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  autoSaveStatus: string;
  onOpenAddExerciseModal?: () => void;
  onExportJson?: () => void;
  onCreateBackup?: () => void;
  onToggleMobileMenu?: () => void;
  currentWeekName?: string;
  currentDayName?: string;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  activeView,
  onSelectView,
  settings,
  onUpdateSettings,
  autoSaveStatus,
  onOpenAddExerciseModal,
  onExportJson,
  onCreateBackup,
  onToggleMobileMenu,
  currentWeekName,
  currentDayName
}) => {
  const isDark = settings.theme === 'dark';

  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    plan: {
      title: 'Plan Treningowy & Rejestr Serii',
      subtitle: `${currentWeekName || 'Tydzień 1'} • ${currentDayName || 'Bieżący Trening'}`
    },
    stats: {
      title: 'Analityka & Progres Siły',
      subtitle: 'Szacowane 1RM, objętość tonażowa i wykresy progresji'
    },
    muscle: {
      title: 'Rozkład Partii Mięśniowych',
      subtitle: 'Analiza objętości serii i balansu sylwetki'
    },
    weight: {
      title: 'Dziennik Masy Ciała',
      subtitle: 'Monitorowanie wagi, średnie kroczące i trendy'
    },
    profile: {
      title: 'Profil Zawodnika & Status Serwera',
      subtitle: 'Edycja danych, awatar, cele kaloryczne, galeria PR i synchronizacja Android ↔ Windows'
    },
    cycles: {
      title: 'Kalendarz Dawek & Historia Cykli',
      subtitle: 'Rejestr iniekcji, HCG, środków oraz historia ukończonych i pustych tygodni cyklu'
    },
    exercises: {
      title: 'Katalog & Baza Ćwiczeń',
      subtitle: 'Dodawanie, edycja parametrów oraz zarządzanie ćwiczeniami w planie'
    },
    settings: {
      title: 'Ustawienia & Auto-Backup JSON',
      subtitle: 'Kopie bezpieczeństwa, eksport i konfiguracja ścieżek Windows'
    },
    python: {
      title: 'Kompatybilność z Python Desktop (EXE)',
      subtitle: 'Czysty kod Python (Tkinter + JSON) gotowy do uruchomienia na Windows 10/11'
    }
  };

  const currentViewMeta = viewTitles[activeView] || {
    title: 'GymTracker Pro',
    subtitle: 'Nowoczesny system treningowy'
  };

  return (
    <header
      className={`border-b select-none px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 transition-colors z-10 ${
        isDark 
          ? 'bg-slate-950/80 backdrop-blur-md border-slate-800/80 text-slate-100' 
          : 'bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-900 shadow-xs'
      }`}
      id="modern-app-header"
    >
      {/* Left: Title & Subtitle */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
            <span>{currentViewMeta.title}</span>
            <span id="app-version-badge" className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${isDark ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-emerald-700 border-emerald-300 bg-emerald-50'}`}>
              v{__APP_VERSION__}
            </span>
          </h1>
          <p className={`text-xs font-medium truncate max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {currentViewMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Global Actions & Mobile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Pill on Desktop */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate max-w-[200px]">{autoSaveStatus}</span>
        </div>

        {/* Quick Add Exercise when in Plan View */}
        {activeView === 'plan' && onOpenAddExerciseModal && (
          <button
            type="button"
            onClick={onOpenAddExerciseModal}
            className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-950/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            id="btn-header-add-exercise"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Dodaj Ćwiczenie</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
        )}

        {/* Quick Backup Trigger */}
        {onCreateBackup && (
          <button
            type="button"
            onClick={onCreateBackup}
            className={`p-2 rounded-xl border transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-xs'
            }`}
            title="Utwórz natychmiastową kopię zapasową"
            id="btn-header-quick-backup"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">Szybki Backup</span>
          </button>
        )}

        {/* Export JSON Button */}
        {onExportJson && (
          <button
            type="button"
            onClick={onExportJson}
            className={`p-2 rounded-xl border transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
            }`}
            title="Pobierz plik danych workout_data.json"
            id="btn-header-export-json"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span className="hidden xl:inline">Eksport JSON</span>
          </button>
        )}

        {/* Mobile Menu Toggle (Right Side) */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className={`p-2 rounded-xl border md:hidden transition-colors ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
          title="Otwórz menu nawigacji"
          id="btn-mobile-menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
