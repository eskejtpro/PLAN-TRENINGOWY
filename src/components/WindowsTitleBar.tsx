import React from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Dumbbell, 
  Monitor, 
  ShieldCheck, 
  Laptop,
  Maximize2
} from 'lucide-react';
import { AppSettings } from '../types';

interface WindowsTitleBarProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  isDark?: boolean;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  settings,
  onUpdateSettings,
  isDark = true
}) => {
  const currentViewport = settings.windowsViewportMode || 'responsive';
  const viewportLabels: Record<string, string> = {
    responsive: '100% Responsywny',
    fhd_1080p: 'Full HD 1080p (1920×1080)',
    laptop_768p: 'Laptop HD (1366×768)',
    wqhd_1440p: 'WQHD 2K (2560×1440)',
    classic_1280x800: 'WXGA (1280×800)',
    window_simulation: 'Symulacja Okna'
  };

  return (
    <div 
      className={`h-8 border-b select-none flex items-center justify-between px-3 text-xs font-sans transition-colors z-50 ${
        isDark 
          ? 'bg-slate-950 border-slate-800 text-slate-300' 
          : 'bg-slate-100 border-slate-300 text-slate-700'
      }`}
      id="windows-native-titlebar"
    >
      {/* Left: Window Icon & Title */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center text-white text-[10px]">
          <Dumbbell className="w-2.5 h-2.5" />
        </div>
        <span className="font-semibold text-[11px] tracking-tight text-slate-200">
          GymTracker Pro – {settings.customAppName || 'Windows Desktop Edition'} [Windows 10/11 x64]
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono hidden sm:inline">
          {viewportLabels[currentViewport] || '1080p'}
        </span>
      </div>

      {/* Center: Quick DPI / Screen Size switcher */}
      <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-mono">
        <span>Ekran:</span>
        <select
          value={currentViewport}
          onChange={(e) => onUpdateSettings({ windowsViewportMode: e.target.value as any })}
          className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] cursor-pointer"
        >
          <option value="responsive">Pełny Ekran (100%)</option>
          <option value="fhd_1080p">Full HD (1920 × 1080)</option>
          <option value="laptop_768p">Laptop (1366 × 768)</option>
          <option value="wqhd_1440p">WQHD 2K (2560 × 1440)</option>
          <option value="classic_1280x800">Kompakt (1280 × 800)</option>
        </select>
      </div>

      {/* Right: Windows Window Controls (Minimize, Maximize, Close) */}
      <div className="flex items-center -mr-3">
        <button
          type="button"
          onClick={() => alert('Minimalizacja okna aplikacji')}
          className="w-11 h-8 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Minimalizuj"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onUpdateSettings({
            windowsViewportMode: currentViewport === 'responsive' ? 'fhd_1080p' : 'responsive'
          })}
          className="w-11 h-8 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Maksymalizuj / Przywróć rozmiar"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onUpdateSettings({ windowsShowDesktopFrame: false })}
          className="w-11 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
          title="Zamknij pasek okna Windows"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
