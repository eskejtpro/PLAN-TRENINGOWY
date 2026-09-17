import React from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Dumbbell, 
  Activity, 
  Scale, 
  Settings, 
  Code2, 
  ShieldCheck, 
  User, 
  Moon, 
  Sun,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  HardDrive,
  Syringe
} from 'lucide-react';
import { AppSettings } from '../types';

interface ModernSidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  autoSaveStatus: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  weeksCount: number;
  position?: 'left' | 'right';
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  activeView,
  onSelectView,
  settings,
  onUpdateSettings,
  autoSaveStatus,
  isCollapsed,
  onToggleCollapse,
  weeksCount,
  position = 'left'
}) => {
  const isDark = settings.theme === 'dark';
  const isRight = position === 'right';

  const navItems = [
    {
      id: 'plan',
      label: 'Plan Treningowy',
      badge: `${weeksCount} tyg.`,
      icon: Calendar,
      description: 'Ćwiczenia, serie i progres ciężarów'
    },
    {
      id: 'stats',
      label: 'Progres & Wykresy',
      icon: TrendingUp,
      description: '1RM, objętość i wykresy siły'
    },
    {
      id: 'muscle',
      label: 'Analiza Partii',
      icon: Activity,
      description: 'Rozkład serii na grupy mięśniowe'
    },
    {
      id: 'weight',
      label: 'Waga Ciała',
      icon: Scale,
      description: 'Ważenie, trendy i bilans'
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
      badge: 'SYNC',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Zdjęcie, dane, cele i status serwera Android'
    }
  ];

  const systemItems = [
    {
      id: 'cycles',
      label: 'Kalendarz Dawek & Cykli',
      icon: Syringe,
      badge: 'Cykl',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Rejestr iniekcji, HCG i historia tygodni'
    },
    {
      id: 'exercises',
      label: 'Katalog & Edycja Ćwiczeń',
      icon: Dumbbell,
      badge: 'Baza',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Zarządzanie, dodawanie i edycja ćwiczeń'
    },
    {
      id: 'settings',
      label: 'Ustawienia & Backup',
      icon: Settings,
      description: 'Auto-Backup JSON i konfiguracja'
    },
    {
      id: 'python',
      label: 'Kod Pythona & EXE',
      icon: Code2,
      badge: 'Windows',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Tkinter desktop .exe generator'
    }
  ];

  return (
    <aside
      className={`relative flex flex-col transition-all duration-300 ease-in-out ${isRight ? 'border-l' : 'border-r'} z-20 select-none ${
        isDark 
          ? 'bg-slate-950/95 border-slate-800/80 text-slate-200' 
          : 'bg-white border-slate-200 text-slate-800 shadow-xs'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}
      id="modern-app-sidebar"
    >
      {/* Brand Header */}
      <div className={`p-4 border-b flex items-center ${isDark ? 'border-slate-800/80' : 'border-slate-100'} ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className={`font-extrabold text-sm tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  GYM<span className="text-emerald-400">TRACKER</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Workspace Treningowy
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle on desktop */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg border transition-colors hidden md:flex items-center justify-center ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
          title={isCollapsed ? 'Rozwiń panel boczny' : 'Zwiń panel boczny'}
          id="btn-toggle-sidebar-collapse"
        >
          {isRight ? (
            isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation Section */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Core Training Views */}
        <div>
          {!isCollapsed && (
            <h5 className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Trening & Analityka
            </h5>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs font-bold'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-600 text-white' 
                      : isDark ? 'bg-slate-900 text-slate-400 group-hover:text-slate-200' : 'bg-slate-100 text-slate-600 group-hover:text-slate-900'
                  }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 text-left flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          isActive 
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-200 text-emerald-800'
                            : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {isActive && (
                    <span className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 ${isRight ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System & Tools */}
        <div>
          {!isCollapsed && (
            <h5 className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              System & Kopia
            </h5>
          )}
          <nav className="space-y-1">
            {systemItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs font-bold'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-600 text-white' 
                      : isDark ? 'bg-slate-900 text-slate-400 group-hover:text-slate-200' : 'bg-slate-100 text-slate-600 group-hover:text-slate-900'
                  }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 text-left flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono border ${
                          item.badgeColor || (isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-200 text-slate-600 border-slate-300')
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {isActive && (
                    <span className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 ${isRight ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Athlete & Status Panel */}
      <div className={`p-3 border-t space-y-2.5 ${isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'}`}>
        {!isCollapsed ? (
          <>
            {/* Athlete Profile Badge */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div 
                onClick={() => onSelectView('profile')}
                className="flex items-center gap-2 overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                title="Przejdź do profilu zawodnika i synchronizacji"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className={`text-xs font-bold block truncate group-hover:text-emerald-400 transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {settings.athleteName || 'Zawodnik'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Profil &amp; Sync</span>
                  </span>
                </div>
              </div>

              {/* Unit Toggle kg/lbs */}
              <div className="flex items-center rounded-lg p-0.5 bg-slate-950/80 border border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ unit: 'kg' })}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    settings.unit === 'kg'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="btn-quick-unit-kg"
                >
                  KG
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ unit: 'lbs' })}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    settings.unit === 'lbs'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="btn-quick-unit-lbs"
                >
                  LBS
                </button>
              </div>
            </div>

            {/* Sync status & theme toggle */}
            <div className="flex items-center justify-between px-1 text-[11px]">
              <span className={`flex items-center gap-1.5 truncate max-w-[130px] font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`} title={autoSaveStatus}>
                <HardDrive className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{autoSaveStatus}</span>
              </span>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: isDark ? 'light' : 'dark' })}
                className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                  isDark 
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                }`}
                title={isDark ? 'Przełącz na motyw jasny' : 'Przełącz na motyw ciemny'}
                id="btn-sidebar-theme-toggle"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: isDark ? 'light' : 'dark' })}
              className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-200 text-slate-700 shadow-xs'
              }`}
              title={isDark ? 'Przełącz na jasny' : 'Przełącz na ciemny'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
