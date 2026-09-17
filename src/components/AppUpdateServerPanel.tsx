import React, { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Server, 
  History, 
  RotateCcw, 
  FileCode, 
  Sparkles, 
  ExternalLink,
  Cpu,
  Layers,
  Check,
  Radio
} from 'lucide-react';
import { AppSettings, AppUpdateInfo, AppUpdateHistoryEntry, AppUpdateState } from '../types';
import { AppUpdateService, CURRENT_APP_VERSION } from '../utils/appUpdateService';

interface AppUpdateServerPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const AppUpdateServerPanel: React.FC<AppUpdateServerPanelProps> = ({
  settings,
  onUpdateSettings
}) => {
  const currentVersion = settings.installedAppVersion || CURRENT_APP_VERSION;
  const channel = settings.updateChannel || 'stable';
  const serverUrl = settings.updateServerUrl || '';

  const [state, setState] = useState<AppUpdateState>({
    status: 'idle',
    progressPct: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
    availableUpdate: null,
    history: AppUpdateService.getUpdateHistory()
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Auto-check updates on mount if enabled
  useEffect(() => {
    if (settings.autoCheckUpdates) {
      handleCheckForUpdates(true);
    }
  }, []);

  const handleCheckForUpdates = async (silent: boolean = false) => {
    setState(prev => ({ ...prev, status: 'checking', errorMessage: undefined }));
    if (!silent) {
      setNotification({ type: 'info', text: 'Łączenie z serwerem aktualizacji...' });
    }

    try {
      const result = await AppUpdateService.checkForUpdates(serverUrl, channel, currentVersion);
      onUpdateSettings({ lastUpdateCheckAt: new Date().toLocaleTimeString() });

      if (result.updateAvailable && result.update) {
        setState(prev => ({
          ...prev,
          status: 'available',
          availableUpdate: result.update,
          lastCheckedAt: new Date().toLocaleTimeString()
        }));
        setNotification({
          type: 'success',
          text: `Znaleziono nowe wydanie serwerowe: v${result.update.version}!`
        });
      } else {
        setState(prev => ({
          ...prev,
          status: 'up_to_date',
          availableUpdate: null,
          lastCheckedAt: new Date().toLocaleTimeString()
        }));
        if (!silent) {
          setNotification({
            type: 'info',
            text: result.message || 'Twoja wersja GymTracker Pro jest aktualna.'
          });
        }
      }
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: e.message || 'Błąd komunikacji z serwerem wydań'
      }));
      setNotification({
        type: 'error',
        text: 'Nie udało się połączyć z serwerem aktualizacji.'
      });
    }
  };

  const handleStartUpdate = async () => {
    if (!state.availableUpdate) return;

    const update = state.availableUpdate;

    try {
      // Step 1: Download
      setState(prev => ({
        ...prev,
        status: 'downloading',
        progressPct: 0,
        bytesDownloaded: 0,
        totalBytes: update.fileSizeBytes
      }));

      await AppUpdateService.downloadUpdatePackage(update, (prog) => {
        setState(prev => ({
          ...prev,
          progressPct: prog.progressPct,
          bytesDownloaded: prog.bytesDownloaded,
          totalBytes: prog.totalBytes,
          downloadSpeedMbps: prog.speedMbps
        }));
      });

      // Step 2: Verification
      setState(prev => ({
        ...prev,
        status: 'verifying',
        progressPct: 100
      }));

      const isVerified = await AppUpdateService.verifyChecksum(update);
      if (!isVerified) {
        throw new Error('Suma kontrolna SHA-256 paczki nie zgadza się z sygnaturą serwera.');
      }

      // Step 3: Installing & applying via server
      setState(prev => ({
        ...prev,
        status: 'installing'
      }));

      const applyRes = await AppUpdateService.applyUpdate(update, serverUrl);

      if (applyRes.success) {
        onUpdateSettings({ installedAppVersion: update.version });
        setState(prev => ({
          ...prev,
          status: 'ready_to_install',
          history: AppUpdateService.getUpdateHistory()
        }));
        setNotification({
          type: 'success',
          text: `Aplikacja zaktualizowana do wersji ${update.version}!`
        });
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Wystąpił błąd podczas procesu aktualizacji'
      }));
      setNotification({
        type: 'error',
        text: err.message || 'Błąd instalacji aktualizacji'
      });
    }
  };

  const handleRollback = async (targetVersion: string) => {
    if (!window.confirm(`Czy na pewno chcesz przywrócić wersję ${targetVersion}?`)) return;

    try {
      setNotification({ type: 'info', text: `Wycofywanie zmian i przywracanie ${targetVersion}...` });
      const res = await AppUpdateService.rollbackVersion(targetVersion, serverUrl);
      if (res.success) {
        onUpdateSettings({ installedAppVersion: targetVersion });
        setState(prev => ({
          ...prev,
          status: 'idle',
          availableUpdate: null,
          history: AppUpdateService.getUpdateHistory()
        }));
        setNotification({ type: 'success', text: res.message });
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: 'Błąd podczas przywracania wersji' });
    }
  };

  return (
    <div className="space-y-6" id="server-update-panel">
      {/* Header Info & Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Aktualizacja Aplikacji przez Serwer
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold">
                  v{currentVersion}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  channel === 'stable' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : channel === 'beta' 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                    : 'bg-purple-950 text-purple-300 border border-purple-800'
                }`}>
                  Kanał: {channel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zarządzanie wersjami, pobieranie paczek binarnych i automatyczny update całego systemu Windows/Web.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCheckForUpdates(false)}
            disabled={state.status === 'checking' || state.status === 'downloading' || state.status === 'installing'}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
            id="btn-check-server-updates"
          >
            <RefreshCw className={`w-4 h-4 ${state.status === 'checking' ? 'animate-spin' : ''}`} />
            <span>{state.status === 'checking' ? 'Sprawdzanie...' : 'Sprawdź aktualizacje'}</span>
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2.5 border ${
            notification.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' :
            notification.type === 'error' ? 'bg-red-950/60 border-red-800 text-red-200' :
            'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {notification.type === 'info' && <Server className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* State: Available Update Card */}
        {state.availableUpdate && state.status !== 'ready_to_install' && (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-100">
                    {state.availableUpdate.title}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Wydanie: {state.availableUpdate.releaseDate}</span>
                  <span>•</span>
                  <span>Rozmiar: {(state.availableUpdate.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  <span>•</span>
                  <span>Typ: {state.availableUpdate.packageType}</span>
                  <span>•</span>
                  <span>Autor: {state.availableUpdate.author}</span>
                </div>
              </div>

              {state.status === 'available' && (
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md transition-transform active:scale-95 shrink-0"
                  id="btn-install-server-update"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Pobierz i Zainstaluj</span>
                </button>
              )}
            </div>

            {/* Release Notes */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Dziennik zmian (Release Notes):
              </span>
              <ul className="space-y-1.5 pl-2">
                {state.availableUpdate.releaseNotes.map((note, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Checksum info */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>SHA-256: {state.availableUpdate.sha256Checksum}</span>
            </div>

            {/* Progress Bar when downloading or installing */}
            {(state.status === 'downloading' || state.status === 'verifying' || state.status === 'installing') && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {state.status === 'downloading' && `Pobieranie paczki aktualizacji... (${state.progressPct}%)`}
                    {state.status === 'verifying' && 'Weryfikacja integralności kryptograficznej SHA-256...'}
                    {state.status === 'installing' && 'Zastępowanie plików i przeładowanie konfiguracji...'}
                  </span>
                  {state.downloadSpeedMbps && (
                    <span className="text-slate-400">{state.downloadSpeedMbps} MB/s</span>
                  )}
                </div>

                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-200 rounded-full"
                    style={{ width: `${state.progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* State: Ready to Restart / Completed */}
        {state.status === 'ready_to_install' && (
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Aktualizacja zainstalowana pomyślnie!</h4>
                <p className="text-xs text-slate-400">
                  Wersja v{state.availableUpdate?.version || '2.25.0'} jest gotowa do użycia.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Zastosuj & Przeładuj aplikację</span>
            </button>
          </div>
        )}
      </div>

      {/* Configuration & Distribution Channel Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Server Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Konfiguracja Połączenia z Serwerem Aktualizacji</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adres Endpointu Serwera Aktualizacji (REST API)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => onUpdateSettings({ updateServerUrl: e.target.value })}
                  placeholder="np. http://localhost:3000 lub https://serwer.domena.pl"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Domyślnie używa wbudowanego serwera Express (/api/update/*) lub dedykowanego serwera aktualizacji.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Kanał Wydań (Distribution Channel)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'stable', label: 'Stabilny (Stable)', desc: 'Zalecany, przetestowane wydania' },
                  { id: 'beta', label: 'Beta (Testowy)', desc: 'Wcześniejszy dostęp do nowości' },
                  { id: 'nightly', label: 'Nightly (Deweloperski)', desc: 'Kompilacje codzienne' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onUpdateSettings({ updateChannel: c.id as any })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      channel === c.id
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{c.label}</span>
                      {channel === c.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-800">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoCheckUpdates !== false}
                  onChange={(e) => onUpdateSettings({ autoCheckUpdates: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                />
                <span>Automatycznie sprawdzaj aktualizacje przy uruchomieniu aplikacji</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoInstallPatches === true}
                  onChange={(e) => onUpdateSettings({ autoInstallPatches: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                />
                <span>Automatycznie instaluj krytyczne mikro-poprawki (Hotfix)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Update History & Rollback Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Historia Aktualizacji & Wycofanie (Rollback)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Ostatnie sprawdzenie: {settings.lastUpdateCheckAt || 'Brak'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {state.history && state.history.length > 0 ? (
              state.history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-slate-950 border border-slate-800/90 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-bold text-slate-200">
                      <span className="font-mono text-emerald-400">v{h.version}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {h.packageType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{h.notes}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{h.installedAt}</div>
                  </div>

                  {h.version !== currentVersion && (
                    <button
                      type="button"
                      onClick={() => handleRollback(h.version)}
                      className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition-colors shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Przywróć</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
                Brak zarejestrowanych wcześniejszych aktualizacji.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
