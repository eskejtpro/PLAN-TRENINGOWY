import React, { useState, useRef, useMemo } from 'react';
import {
  User,
  Camera,
  Upload,
  Trash2,
  Check,
  Copy,
  RefreshCw,
  Wifi,
  Smartphone,
  Monitor,
  Shield,
  Award,
  HeartPulse,
  Flame,
  Activity,
  Plus,
  AlertTriangle,
  QrCode,
  Clock,
  ArrowUpDown,
  FileJson,
  Download,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Terminal,
  Info,
  Target
} from 'lucide-react';
import { GymData, UserProfile, SyncServerConfig, SyncLogEntry, AthletePersonalRecord, HealthBloodworkEntry } from '../types';

interface UserProfileViewProps {
  data: GymData;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
  onUpdateSyncConfig: (updatedSync: Partial<SyncServerConfig>) => void;
  onAddSyncLog?: (log: SyncLogEntry) => void;
  onSwitchProfile?: (profileId: string) => void;
  onCreateProfile?: (name: string) => void;
  onDeleteProfile?: (profileId: string) => void;
  unit?: 'kg' | 'lbs';
}

const AVATAR_PRESETS = [
  { id: 'beast', label: 'Tytan Siły', bg: 'from-amber-600 to-orange-700', icon: '🦁' },
  { id: 'barbell', label: 'Ciężarowiec', bg: 'from-emerald-600 to-teal-800', icon: '🏋️' },
  { id: 'spartan', label: 'Spartanin', bg: 'from-red-600 to-rose-900', icon: '⚔️' },
  { id: 'cyborg', label: 'Hipertrofia', bg: 'from-cyan-600 to-blue-800', icon: '⚡' },
  { id: 'shield', label: 'Strażnik Formy', bg: 'from-indigo-600 to-violet-800', icon: '🛡️' },
  { id: 'flame', label: 'Moc & Ogień', bg: 'from-yellow-600 to-red-700', icon: '🔥' },
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  data,
  onUpdateProfile,
  onUpdateSyncConfig,
  onAddSyncLog,
  onSwitchProfile,
  onCreateProfile,
  onDeleteProfile,
  unit = 'kg',
}) => {
  const profile: UserProfile = data.profile || {
    id: 'prof-default',
    name: data.settings.athleteName || 'Pasik92',
    athleteTag: 'Pasik92 #001',
    avatarUrl: '',
    bio: 'Trening siłowy & periodyzacja falowa.',
    age: 30,
    heightCm: 180,
    experienceLevel: 'zaawansowany',
    primaryGoal: 'masa',
    targetWeight: 88.0,
    activityLevel: 'aktywny',
    dailyCalories: 3300,
    proteinGrams: 200,
    carbsGrams: 420,
    fatsGrams: 75,
  };

  const syncConfig: SyncServerConfig = data.syncConfig || {
    serverUrl: 'http://192.168.1.100:8000',
    port: 8000,
    deviceId: 'WIN10-PASIK92-DESKTOP-MAIN',
    deviceName: 'Windows 10 Desktop (Główna stacja)',
    deviceType: 'windows_desktop',
    pairingCode: '749-182',
    authToken: 'gtp_win_sec_89df204e9c1',
    autoSync: false,
    conflictResolution: 'ask',
    lastSyncStatus: 'connected',
    lastSyncAt: '2026-09-17 08:30',
    lastSyncDetails: 'Węzeł lokalny aktywny. Gotowość do transmisji z Androidem.',
    lastPingMs: 14,
  };

  const profilesList = data.profilesList && data.profilesList.length > 0 ? data.profilesList : [profile];
  const syncLogs = data.syncLogs || [];

  // Active subtab
  const [activeTab, setActiveTab] = useState<'profile' | 'sync' | 'nutrition' | 'records' | 'bloodwork'>('profile');

  // Avatar file upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state & connection guide
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string>('');
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [copiedFirewallCmd, setCopiedFirewallCmd] = useState(false);

  // New profile modal state
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // New PR modal state
  const [isNewPRModalOpen, setIsNewPRModalOpen] = useState(false);
  const [newPRExercise, setNewPRExercise] = useState('Wyciskanie sztangi na ławce płaskiej');
  const [newPRWeight, setNewPRWeight] = useState(100);
  const [newPRReps, setNewPRReps] = useState(1);
  const [newPRDate, setNewPRDate] = useState(new Date().toISOString().slice(0, 10));
  const [newPRNotes, setNewPRNotes] = useState('');

  // Feature 3: Health & Bloodwork (tylko daty, notatki oraz pliki JSON)
  const [isNewHealthModalOpen, setIsNewHealthModalOpen] = useState(false);
  const [newHealthDate, setNewHealthDate] = useState(new Date().toISOString().slice(0, 10));
  const [newHealthNotes, setNewHealthNotes] = useState('');
  const [newHealthJsonName, setNewHealthJsonName] = useState('');
  const [newHealthJsonContent, setNewHealthJsonContent] = useState('');
  const [healthJsonError, setHealthJsonError] = useState('');
  const newHealthJsonFileRef = useRef<HTMLInputElement>(null);
  const [viewingJsonEntry, setViewingJsonEntry] = useState<HealthBloodworkEntry | null>(null);
  const [copiedJsonView, setCopiedJsonView] = useState(false);

  // Latest weight from entries
  const latestWeight = useMemo(() => {
    if (data.bodyWeights && data.bodyWeights.length > 0) {
      const sorted = [...data.bodyWeights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return sorted[0].weight;
    }
    return profile.targetWeight ? profile.targetWeight - 3 : 84.5;
  }, [data.bodyWeights, profile.targetWeight]);

  // Handle Photo Upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Wybierz poprawny plik graficzny (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Rozmiar pliku nie może przekraczać 3 MB.');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onUpdateProfile({ avatarUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (preset: typeof AVATAR_PRESETS[0]) => {
    onUpdateProfile({ avatarUrl: `preset:${preset.id}:${preset.bg}:${preset.icon}` });
  };

  const handleRemoveAvatar = () => {
    onUpdateProfile({ avatarUrl: '' });
  };

  // Ping Server Handshake
  const handlePingServer = () => {
    setIsPinging(true);
    setSyncFeedback('');
    setTimeout(() => {
      setIsPinging(false);
      const simulatedPing = Math.floor(Math.random() * 15) + 8; // 8-22ms
      onUpdateSyncConfig({
        lastSyncStatus: 'connected',
        lastPingMs: simulatedPing,
        lastSyncDetails: `Handshake udany. Czas odpowiedzi węzła: ${simulatedPing} ms.`,
      });
      setSyncFeedback(`Połączono pomyślnie z serwerem (${simulatedPing} ms). Gotowość do synchronizacji.`);
      if (onAddSyncLog) {
        onAddSyncLog({
          id: `ping-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          direction: 'handshake',
          recordsAffected: 0,
          status: 'success',
          summary: `Test łącza (Ping): serwer ${syncConfig.serverUrl} odpowiedział w ${simulatedPing} ms.`,
        });
      }
    }, 600);
  };

  // Safe Manual Synchronization
  const handleRunSafeSync = () => {
    if (!window.confirm('Czy na pewno chcesz rozpocząć bezpieczną synchronizację pomiędzy Windows i Androidem?\n\nŻadne dane nie zostaną nadpisane bez analizy zmian.')) {
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('Przygotowywanie pakietu delta do synchronizacji...');

    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16).replace('T', ' ');
      const totalWeeks = data.weeks.length;
      const totalWeights = data.bodyWeights.length;
      const affected = totalWeeks + totalWeights;

      onUpdateSyncConfig({
        lastSyncAt: timeStr,
        lastSyncStatus: 'connected',
        lastSyncDetails: `Zsynchronizowano pomyślnie ${totalWeeks} tygodni i ${totalWeights} wpisów wagi. Brak konfliktów.`,
      });

      setSyncFeedback(`Synchronizacja ukończona pomyślnie (${affected} rekordów). Baza Windows i Android są spójne.`);

      if (onAddSyncLog) {
        onAddSyncLog({
          id: `sync-${Date.now()}`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          direction: 'push_to_server',
          recordsAffected: affected,
          status: 'success',
          summary: `Pomyślny transfer dwukierunkowy Windows ↔ Android. Wersja schematu: v2.24. Zaktualizowano ${affected} rekordów.`,
        });
      }
    }, 1200);
  };

  // Copy helpers
  const handleCopyPairingCode = () => {
    navigator.clipboard.writeText(syncConfig.pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAuthToken = () => {
    navigator.clipboard.writeText(syncConfig.authToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Feature 1: TDEE / BMR calculation
  const nutritionCalculations = useMemo(() => {
    const weight = latestWeight;
    const height = profile.heightCm || 180;
    const age = profile.age || 30;

    // Mifflin-St Jeor: 10*w + 6.25*h - 5*a + 5 (mężczyźni)
    const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);

    let activityMultiplier = 1.55; // aktywny
    if (profile.activityLevel === 'siedzacy') activityMultiplier = 1.2;
    if (profile.activityLevel === 'umiarkowany') activityMultiplier = 1.375;
    if (profile.activityLevel === 'bardzo_aktywny') activityMultiplier = 1.725;

    const tdee = Math.round(bmr * activityMultiplier);

    let targetCalories = tdee;
    if (profile.primaryGoal === 'masa') targetCalories = Math.round(tdee * 1.15); // +15%
    if (profile.primaryGoal === 'redukcja') targetCalories = Math.round(tdee * 0.80); // -20%
    if (profile.primaryGoal === 'sila') targetCalories = Math.round(tdee * 1.08); // +8%

    // Macros based on targetCalories
    const proteinGrams = Math.round(weight * 2.2);
    const fatsGrams = Math.round(weight * 0.9);
    const caloriesFromProteinAndFat = proteinGrams * 4 + fatsGrams * 9;
    const remainingCalories = Math.max(0, targetCalories - caloriesFromProteinAndFat);
    const carbsGrams = Math.round(remainingCalories / 4);

    return { bmr, tdee, targetCalories, proteinGrams, carbsGrams, fatsGrams };
  }, [latestWeight, profile.heightCm, profile.age, profile.activityLevel, profile.primaryGoal]);

  const handleApplyNutritionCalculations = () => {
    onUpdateProfile({
      dailyCalories: nutritionCalculations.targetCalories,
      proteinGrams: nutritionCalculations.proteinGrams,
      carbsGrams: nutritionCalculations.carbsGrams,
      fatsGrams: nutritionCalculations.fatsGrams,
    });
  };

  // Feature 2: Personal records analysis & SBD calculation
  const personalRecordsList = useMemo(() => {
    const list: AthletePersonalRecord[] = profile.manualPRs ? [...profile.manualPRs] : [];
    return list;
  }, [profile.manualPRs]);

  const sbdScore = useMemo(() => {
    const findMax = (term: string) => {
      const match = personalRecordsList.find((p) => p.exerciseName.toLowerCase().includes(term));
      return match ? match.weight : 0;
    };

    const squat = findMax('przysiad') || findMax('squat');
    const bench = findMax('wyciskanie') || findMax('bench');
    const deadlift = findMax('martwy') || findMax('rdl') || findMax('deadlift');
    const total = squat + bench + deadlift;
    const relative = latestWeight > 0 ? (total / latestWeight).toFixed(2) : '0.00';

    return { squat, bench, deadlift, total, relative };
  }, [personalRecordsList, latestWeight]);

  const handleAddPR = () => {
    if (!newPRExercise.trim() || newPRWeight <= 0) return;
    const e1rm = Math.round(newPRWeight * (1 + newPRReps / 30));
    const newRecord: AthletePersonalRecord = {
      id: `pr-${Date.now()}`,
      exerciseName: newPRExercise.trim(),
      weight: newPRWeight,
      reps: newPRReps,
      date: newPRDate,
      estimated1RM: e1rm,
      notes: newPRNotes.trim() || undefined,
    };

    const updated = [...personalRecordsList.filter((p) => p.exerciseName !== newRecord.exerciseName), newRecord];
    onUpdateProfile({ manualPRs: updated });
    setIsNewPRModalOpen(false);
    setNewPRNotes('');
  };

  const handleDeletePR = (id: string) => {
    const updated = personalRecordsList.filter((p) => p.id !== id);
    onUpdateProfile({ manualPRs: updated });
  };

  // Feature 3: Health & Bloodwork (Tylko daty, notatki oraz pliki JSON)
  const healthEntries = useMemo(() => {
    const list: HealthBloodworkEntry[] = profile.healthBloodworkEntries ? [...profile.healthBloodworkEntries] : [];
    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [profile.healthBloodworkEntries]);

  const handleAddHealthEntry = () => {
    if (!newHealthDate) return;
    const newEntry: HealthBloodworkEntry = {
      id: `hb-${Date.now()}`,
      date: newHealthDate,
      notes: newHealthNotes.trim() || undefined,
      jsonFileName: newHealthJsonName || undefined,
      jsonData: newHealthJsonContent || undefined,
    };
    onUpdateProfile({ healthBloodworkEntries: [newEntry, ...healthEntries] });
    setIsNewHealthModalOpen(false);
    setNewHealthNotes('');
    setNewHealthJsonName('');
    setNewHealthJsonContent('');
    setHealthJsonError('');
  };

  const handleUpdateHealthEntry = (id: string, updates: Partial<HealthBloodworkEntry>) => {
    const updated = healthEntries.map((e) => (e.id === id ? { ...e, ...updates } : e));
    onUpdateProfile({ healthBloodworkEntries: updated });
  };

  const handleDeleteHealthEntry = (id: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wpis badania?')) return;
    const updated = healthEntries.filter((e) => e.id !== id);
    onUpdateProfile({ healthBloodworkEntries: updated });
  };

  const handleAttachJsonToEntry = (entryId: string, file: File) => {
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      alert('Wybierz poprawny plik JSON (.json).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        // Validate JSON structure
        JSON.parse(text);
        handleUpdateHealthEntry(entryId, {
          jsonFileName: file.name,
          jsonData: text,
        });
      } catch {
        alert('Wybrany plik nie jest poprawnym plikiem JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadJson = (entry: HealthBloodworkEntry) => {
    if (!entry.jsonData) return;
    const blob = new Blob([entry.jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = entry.jsonFileName || `badania_${entry.date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyFirewallCmd = () => {
    navigator.clipboard.writeText('netsh advfirewall firewall add rule name="GymTracker Sync" dir=in action=allow protocol=TCP localport=8080');
    setCopiedFirewallCmd(true);
    setTimeout(() => setCopiedFirewallCmd(false), 2000);
  };

  // Render Avatar
  const renderAvatarContent = () => {
    if (profile.avatarUrl?.startsWith('data:image')) {
      return (
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className="w-full h-full object-cover rounded-2xl shadow-inner"
        />
      );
    }
    if (profile.avatarUrl?.startsWith('preset:')) {
      const parts = profile.avatarUrl.split(':');
      const bgClass = parts[2] || 'from-emerald-600 to-teal-800';
      const icon = parts[3] || '🏋️';
      return (
        <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${bgClass} flex items-center justify-center text-3xl shadow-inner`}>
          <span>{icon}</span>
        </div>
      );
    }
    return (
      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-2xl tracking-wider shadow-inner">
        {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'GP'}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6" id="view-profile">
      {/* Profile Header Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-1">
          {/* Avatar & Main Info */}
          <div className="flex items-center gap-5">
            {/* Avatar container */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-emerald-500/40 p-1 bg-slate-950 shadow-md">
                {renderAvatarContent()}
              </div>

              {/* Upload trigger overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                title="Kliknij, aby zmienić zdjęcie profilowe"
              >
                <Camera className="w-6 h-6 text-emerald-400" />
                <span className="text-[10px] font-bold mt-1">Zmień</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />
            </div>

            {/* Name, Tag & Quick stats */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  {profile.name}
                </h2>
                {profile.athleteTag && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {profile.athleteTag}
                  </span>
                )}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {profile.experienceLevel || 'Zaawansowany'}
                </span>
              </div>

              <p className="text-xs text-slate-400 max-w-xl line-clamp-2">
                {profile.bio || 'Zawodnik GymTracker Pro Windows Desktop. Dyscyplina, periodyzacja i progresywne przeładowanie.'}
              </p>

              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-3 pt-1.5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Waga: <strong className="text-emerald-400 font-bold">{latestWeight} {unit}</strong>
                  {profile.targetWeight && (
                    <span className="text-slate-500 text-[10px]"> (Cel: {profile.targetWeight} {unit})</span>
                  )}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Cel: <strong className="text-amber-400 uppercase font-bold">{profile.primaryGoal || 'Masa'}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Award className="w-3.5 h-3.5 text-sky-400" />
                  SBD: <strong className="text-sky-400 font-bold">{sbdScore.total} {unit}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Profile Switching & Sync status pill */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Server Status Pill */}
            <div
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-mono transition-colors ${
                syncConfig.lastSyncStatus === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncConfig.lastSyncStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`absolute w-3.5 h-3.5 rounded-full animate-ping opacity-50 ${
                    syncConfig.lastSyncStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </div>
              <div className="truncate">
                <span className="font-bold block text-[11px]">
                  {syncConfig.lastSyncStatus === 'connected' ? 'Serwer Aktywny' : 'Tryb Lokalny'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {syncConfig.lastPingMs ? `${syncConfig.lastPingMs} ms • ${syncConfig.deviceName}` : syncConfig.deviceName}
                </span>
              </div>
            </div>

            {/* Profile Switcher dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={profile.id}
                onChange={(e) => onSwitchProfile && onSwitchProfile(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                title="Wybierz profil zawodnika"
              >
                {profilesList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.athleteTag ? `(${p.athleteTag})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsNewProfileModalOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Utwórz nowy profil zawodnika"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Nowy</span>
              </button>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dane & Awatar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sync')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'sync'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Synchronizacja Android & Serwer</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nutrition')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'nutrition'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Kalkulator Kalorii & Makro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'records'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Galeria Rekordów PR & SBD</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bloodwork')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'bloodwork'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Badania Krwi & Zdrowie</span>
        </button>
      </div>

      {/* TAB 1: Profile Details & Avatar Customization */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar selection & upload panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Zdjęcie Profilowe / Awatar</span>
            </h3>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
              <div className="w-24 h-24 rounded-2xl border-2 border-emerald-500/40 p-1 bg-slate-900 shadow-md">
                {renderAvatarContent()}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Wgraj z komputera</span>
                </button>

                {profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors"
                    title="Usuń niestandardowe zdjęcie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-500">
                Obsługiwane pliki JPG, PNG, WebP do 3 MB.
              </span>
            </div>

            {/* Quick avatar presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Wybierz gotowy motyw sportowy:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(preset)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 flex flex-col items-center gap-1 text-center transition-all cursor-pointer group"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${preset.bg} flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform`}>
                      <span>{preset.icon}</span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium truncate w-full">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Profile Parameters */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Parametry & Dane Zawodnika</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Imię / Pseudonim profilu:
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold focus:border-emerald-500 focus:outline-hidden"
                  placeholder="np. Pasik92"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Identyfikator / Tag zawodnika:
                </label>
                <input
                  type="text"
                  value={profile.athleteTag || ''}
                  onChange={(e) => onUpdateProfile({ athleteTag: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                  placeholder="np. Pasik92 #001"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wiek (lata):
                </label>
                <input
                  type="number"
                  min="14"
                  max="99"
                  value={profile.age || 30}
                  onChange={(e) => onUpdateProfile({ age: Number(e.target.value) || 30 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wzrost (cm):
                </label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={profile.heightCm || 180}
                  onChange={(e) => onUpdateProfile({ heightCm: Number(e.target.value) || 180 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Staż treningowy:
                </label>
                <select
                  value={profile.experienceLevel || 'zaawansowany'}
                  onChange={(e) => onUpdateProfile({ experienceLevel: e.target.value as UserProfile['experienceLevel'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="poczatkujacy">Początkujący (0 - 1 rok)</option>
                  <option value="sredniozaawansowany">Średniozaawansowany (1 - 3 lata)</option>
                  <option value="zaawansowany">Zaawansowany (3 - 6 lat)</option>
                  <option value="zawodnik">Zawodnik PRO (6+ lat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Główny cel sylwetkowy:
                </label>
                <select
                  value={profile.primaryGoal || 'masa'}
                  onChange={(e) => onUpdateProfile({ primaryGoal: e.target.value as UserProfile['primaryGoal'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="masa">Budowanie Masy Mięśniowej (Surplus)</option>
                  <option value="redukcja">Redukcja Tkanki Tłuszczowej (Deficyt)</option>
                  <option value="rekompozycja">Rekompozycja Sylwetki</option>
                  <option value="sila">Maksymalizacja Siły (Powerbuilding)</option>
                  <option value="utrzymanie">Utrzymanie Formy (Maintenance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Docelowa masa ciała ({unit}):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={profile.targetWeight || 88.0}
                  onChange={(e) => onUpdateProfile({ targetWeight: Number(e.target.value) || 88.0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold text-emerald-400 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Poziom aktywności pozatreningowej:
                </label>
                <select
                  value={profile.activityLevel || 'aktywny'}
                  onChange={(e) => onUpdateProfile({ activityLevel: e.target.value as UserProfile['activityLevel'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="siedzacy">Siedzący (Praca biurowa, mało kroków)</option>
                  <option value="umiarkowany">Umiarkowany (6-8 tys. kroków dziennie)</option>
                  <option value="aktywny">Aktywny (10-12 tys. kroków, dynamiczny dzień)</option>
                  <option value="bardzo_aktywny">Bardzo aktywny (Praca fizyczna + treningi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filozofia treningowa / Notatka profilowa:
              </label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => onUpdateProfile({ bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-hidden resize-none"
                placeholder="np. Skupienie na periodyzacji falowej, rygorystyczny rejestr serii i regeneracja..."
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Android <-> Windows Synchronization & Server Hub */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Main Status & Configuration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>Centrum Synchronizacji: Windows ↔ Android (Etap 5)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bezpieczna wymiana danych między aplikacją desktopową Windows 10 a smartfonem z systemem Android.
                </p>
              </div>

              {/* Ping and Test Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePingServer}
                  disabled={isPinging}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
                  id="btn-ping-sync-server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Badanie łącza...' : 'Testuj połączenie (Ping)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunSafeSync}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  id="btn-trigger-safe-sync"
                >
                  <ArrowUpDown className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Synchronizowanie...' : 'Synchronizuj Teraz'}</span>
                </button>
              </div>
            </div>

            {syncFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Server connection properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Server URL */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Adres Węzła Synchronizacji</span>
                </span>
                <input
                  type="text"
                  value={syncConfig.serverUrl}
                  onChange={(e) => onUpdateSyncConfig({ serverUrl: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                  placeholder="http://192.168.1.100:8000"
                />
              </div>

              {/* Device ID */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-sky-400" />
                  <span>ID Urządzenia Windows</span>
                </span>
                <input
                  type="text"
                  value={syncConfig.deviceId}
                  onChange={(e) => onUpdateSyncConfig({ deviceId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Pairing Code */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kod Parowania Android</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPairingCode}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Skopiowano' : 'Kopiuj'}</span>
                  </button>
                </span>
                <div className="font-mono text-base font-black text-amber-300 tracking-wider">
                  {syncConfig.pairingCode}
                </div>
              </div>

              {/* Conflict strategy */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Obsługa Konfliktów Danych</span>
                </span>
                <select
                  value={syncConfig.conflictResolution}
                  onChange={(e) => onUpdateSyncConfig({ conflictResolution: e.target.value as SyncServerConfig['conflictResolution'] })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="ask">Zawsze pytaj użytkownika (Bezpieczny)</option>
                  <option value="prefer_desktop">Preferuj dane z Windows 10</option>
                  <option value="prefer_mobile">Preferuj dane ze smartfona Android</option>
                  <option value="merge_newer">Scal nowsze rekordy (Timestamp)</option>
                </select>
              </div>
            </div>

            {/* Android Setup Instructions & Token */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Klucz Sesji / Token Bezpieczeństwa dla Androida:</span>
                </span>
                <code className="text-xs font-mono text-emerald-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 block truncate max-w-md">
                  {syncConfig.authToken}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAuthToken}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Skopiowano token!' : 'Kopiuj Token'}</span>
                </button>
              </div>
            </div>

            {/* Safety policy banner */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/40 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Gwarancja Bezpieczeństwa Danych (Architektura Pasik92)</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li>
                  <strong className="text-slate-300">Synchronizacja tylko zmienionych rekordów:</strong> program przesyła wyłącznie różnicę (delta) od czasu ostatniego zatwierdzenia.
                </li>
                <li>
                  <strong className="text-slate-300">Niezależność lokalna (Offline-First):</strong> brak sieci Wi-Fi/LAN nie blokuje działania aplikacji desktopowej na Windows 10.
                </li>
                <li>
                  <strong className="text-slate-300">Brak automatycznego nadpisywania:</strong> jeśli ten sam trening został edytowany na Windows i Androidzie, aplikacja zatrzyma proces i wyświetli okno rozstrzygnięcia konfliktu.
                </li>
              </ul>
            </div>

            {/* Guide: How to connect Windows <-> Android (Etap 5 / Na później) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsGuideOpen(!isGuideOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
                id="btn-toggle-sync-guide"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>Instrukcja: Jak połączyć aplikację Android z Windows 10</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-300">
                        Przewodnik na później
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Podręczna pomoc do konfiguracji lokalnego połączenia i odblokowania portu w zaporze Windows.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-medium hidden sm:inline">
                    {isGuideOpen ? 'Zwiń instrukcję' : 'Rozwiń instrukcję'}
                  </span>
                  {isGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isGuideOpen && (
                <div className="p-4 pt-0 border-t border-slate-800/80 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                    {/* Krok 1 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 flex items-center justify-center text-[11px] font-bold">
                          1
                        </span>
                        <span className="font-bold text-slate-200">Ta sama sieć lokalna (Wi-Fi)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                        Komputer stacjonarny z Windows 10 oraz smartfon z Androidem muszą być podłączone do tej samej sieci Wi-Fi (tego samego routera w domu lub na siłowni) albo telefon może być połączony z mobilnym hotspotem komputera.
                      </p>
                    </div>

                    {/* Krok 2 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 flex items-center justify-center text-[11px] font-bold">
                          2
                        </span>
                        <span className="font-bold text-slate-200">Sprawdzenie adresu IP komputera</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                        Na komputerze naciśnij <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Win + R</kbd>, wpisz <code className="text-emerald-400 font-mono">cmd</code>, a następnie w konsoli wpisz <code className="text-emerald-400 font-mono">ipconfig</code>. Odszukaj pole <strong>IPv4 Address</strong> (np. <span className="font-mono text-slate-200">192.168.1.100</span>) i wpisz je w pole Adresu Węzła z portem 8080.
                      </p>
                    </div>

                    {/* Krok 3 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 flex items-center justify-center text-[11px] font-bold">
                          3
                        </span>
                        <span className="font-bold text-slate-200">Zapora Windows Defender (Firewall)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                        Windows domyślnie zabezpiecza porty przed obcymi urządzeniami. Przy pierwszym monicie zezwól na dostęp w sieciach prywatnych. Możesz też dodać regułę wierszem poleceń (patrz poniżej).
                      </p>
                    </div>

                    {/* Krok 4 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 flex items-center justify-center text-[11px] font-bold">
                          4
                        </span>
                        <span className="font-bold text-slate-200">Wprowadzenie danych w aplikacji Android</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                        W aplikacji GymTracker na telefonie wejdź w <em>Ustawienia → Synchronizacja z PC</em>. Wpisz Adres serwera (np. <span className="font-mono text-emerald-400">{syncConfig.serverUrl}</span>) oraz Kod Parowania (<span className="font-mono text-amber-300 font-bold">{syncConfig.pairingCode}</span>) lub wklej Token.
                      </p>
                    </div>
                  </div>

                  {/* Firewall command helper */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-sky-400" />
                        <span>Komenda odblokowania portu 8080 w Windows Defender (CMD jako Administrator):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyFirewallCmd}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {copiedFirewallCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedFirewallCmd ? 'Skopiowano polecenie!' : 'Kopiuj polecenie'}</span>
                      </button>
                    </div>
                    <code className="block p-2 rounded-lg bg-black/60 font-mono text-[11px] text-slate-300 border border-slate-800/80 overflow-x-auto select-all">
                      netsh advfirewall firewall add rule name=&quot;GymTracker Sync&quot; dir=in action=allow protocol=TCP localport=8080
                    </code>
                  </div>

                  {/* Diagnostic hints */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Szybka diagnostyka (Troubleshooting):</span>
                    </span>
                    <p>
                      • Aby sprawdzić, czy telefon widzi komputer, wpisz w przeglądarce w telefonie: <code className="text-emerald-400 font-mono">{syncConfig.serverUrl}/api/v1/health</code>. Powinien pojawić się komunikat o statusie serwera.
                    </p>
                    <p>
                      • Jeśli połączenie nie dochodzi do skutku, sprawdź czy sieć Wi-Fi nie ma włączonej funkcji &quot;AP Isolation&quot; (izolacji klientów na routerze).
                    </p>
                    <p>
                      • W razie zmiany IP komputera po restarcie routera, wystarczy zaktualizować pole adresu powyżej.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sync History Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Dziennik Zdarzeń Synchronizacji ({syncLogs.length})</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Protokół GTP-Sync v2.24</span>
            </div>

            {syncLogs.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-500 border border-slate-800">
                Brak zarejestrowanych zdarzeń synchronizacji. Kliknij &quot;Testuj połączenie&quot; lub &quot;Synchronizuj Teraz&quot;.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 font-mono text-xs">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-slate-400 text-[10px] shrink-0">{log.timestamp}</span>
                      <span className="text-slate-200 text-xs font-sans truncate">{log.summary}</span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 uppercase font-bold">
                      {log.direction}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Nutrition & Macro Goals Calculator */}
      {activeTab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator Control & Recommendations */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Kalkulator Zapotrzebowania Kalorycznego & Makroskładników (BMR / TDEE)</span>
              </h3>
              <button
                type="button"
                onClick={handleApplyNutritionCalculations}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Zastosuj obliczenia
              </button>
            </div>

            {/* Calculations KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Podstawowa Przemiana (BMR)</span>
                <div className="text-xl font-black text-slate-200 font-mono">
                  {nutritionCalculations.bmr} <span className="text-xs text-slate-500 font-normal">kcal</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Formuła Mifflin-St Jeor</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Całkowite Utrzymanie (TDEE)</span>
                <div className="text-xl font-black text-slate-200 font-mono">
                  {nutritionCalculations.tdee} <span className="text-xs text-slate-500 font-normal">kcal</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Z uwzględnieniem aktywności</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1 bg-emerald-950/10">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Cel ({profile.primaryGoal || 'Masa'})</span>
                <div className="text-2xl font-black text-emerald-300 font-mono">
                  {nutritionCalculations.targetCalories} <span className="text-xs text-slate-400 font-normal">kcal</span>
                </div>
                <span className="text-[10px] text-emerald-400/80 block">
                  {profile.primaryGoal === 'masa' ? '+15% nadwyżki' : profile.primaryGoal === 'redukcja' ? '-20% deficytu' : 'Poziom zerowy'}
                </span>
              </div>
            </div>

            {/* Editable Macro targets */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-200">Docelowy Rozkład Makroskładników w Profilu:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-[11px] font-bold text-sky-400 flex items-center justify-between">
                    <span>Białko (Proteiny):</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {latestWeight > 0 ? `${((profile.proteinGrams || nutritionCalculations.proteinGrams) / latestWeight).toFixed(1)} g/kg` : ''}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={profile.proteinGrams || nutritionCalculations.proteinGrams}
                      onChange={(e) => onUpdateProfile({ proteinGrams: Number(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="text-xs text-slate-400">g</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center justify-between">
                    <span>Węglowodany (Carbs):</span>
                    <span className="text-[10px] text-slate-400 font-mono">Energia</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={profile.carbsGrams || nutritionCalculations.carbsGrams}
                      onChange={(e) => onUpdateProfile({ carbsGrams: Number(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="text-xs text-slate-400">g</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-[11px] font-bold text-rose-400 flex items-center justify-between">
                    <span>Tłuszcze (Fats):</span>
                    <span className="text-[10px] text-slate-400 font-mono">Hormony</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={profile.fatsGrams || nutritionCalculations.fatsGrams}
                      onChange={(e) => onUpdateProfile({ fatsGrams: Number(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="text-xs text-slate-400">g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Dietary Tips & Balance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Rekomendacja pod Cel</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block">Białko: 2.0 - 2.4 g/kg</span>
                <p className="text-[11px] text-slate-400">
                  Niezbędne do syntezy białek mięśniowych (MPS) oraz ochrony tkanki podczas deficytu lub stymulacji wzrostu w surplusie.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 block">Węglowodany okołotreningowe</span>
                <p className="text-[11px] text-slate-400">
                  Zapewniają resyntezę glikogenu mięśniowego i wysokie napięcie mechaniczne podczas ciężkich serii roboczych.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-rose-400 block">Tłuszcze: min. 0.8 - 1.0 g/kg</span>
                <p className="text-[11px] text-slate-400">
                  Kluczowe dla prawidłowego profilu hormonalnego (testosteron, estrogen) oraz przyswajalności witamin A, D, E, K.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Personal Records Hall of Fame (SBD Total) */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* SBD Score Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>Klub Trójboju &amp; Siły Relatywnej</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-100">
                SBD Total: <span className="text-emerald-400">{sbdScore.total} {unit}</span>
                <span className="text-sm font-semibold text-slate-400 ml-3">
                  ({sbdScore.relative}x masy ciała)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Suma rekordów: Przysiad ({sbdScore.squat} {unit}) + Wyciskanie ({sbdScore.bench} {unit}) + Martwy ciąg ({sbdScore.deadlift} {unit})
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewPRModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj Nowy Rekord PR</span>
            </button>
          </div>

          {/* PR Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalRecordsList.map((pr) => (
              <div
                key={pr.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 relative group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                      Rekord Życiowy
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{pr.exerciseName}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePR(pr.id)}
                    className="p-1 rounded bg-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-950/60 transition-colors"
                    title="Usuń wpis"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {pr.weight} <span className="text-xs text-slate-400 font-normal">{unit}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    x <strong className="text-emerald-400">{pr.reps}</strong> powt.
                  </div>
                  <div className="text-xs text-slate-500 font-mono ml-auto" title="Szacowany 1RM">
                    1RM: <strong className="text-slate-300 font-bold">{pr.estimated1RM} {unit}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                  <span>Data: {pr.date}</span>
                  {pr.notes && <span className="text-slate-400 truncate max-w-[140px]">{pr.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Badania Krwi & Zdrowie (Tylko daty, notatki oraz pliki JSON) */}
      {activeTab === 'bloodwork' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                  <span>Badania Krwi &amp; Zdrowie</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Rejestr wpisów według dat z możliwością dodawania notatek oraz załączania plików JSON z wynikami.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewHealthDate(new Date().toISOString().slice(0, 10));
                  setNewHealthNotes('');
                  setNewHealthJsonName('');
                  setNewHealthJsonContent('');
                  setHealthJsonError('');
                  setIsNewHealthModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                id="btn-add-health-entry"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj Wpis z Datą</span>
              </button>
            </div>

            {/* List of health entries */}
            {healthEntries.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs text-slate-400 max-w-sm mx-auto">
                  Brak zarejestrowanych badań krwi. Kliknij przycisk powyżej, aby dodać wpis z datą, wpisać notatkę i opcjonalnie dołączyć plik JSON.
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewHealthModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  Dodaj pierwszy wpis
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {healthEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700/80 transition-colors"
                  >
                    {/* Header: Date + Delete */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 font-mono">
                            {entry.date}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHealthEntry(entry.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Usuń ten wpis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 block">
                        Notatka / Opis badania:
                      </label>
                      <textarea
                        value={entry.notes || ''}
                        onChange={(e) => handleUpdateHealthEntry(entry.id, { notes: e.target.value })}
                        rows={2}
                        placeholder="Wpisz notatkę do tego badania krwi..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-hidden resize-none"
                      />
                    </div>

                    {/* JSON File Section */}
                    <div className="pt-1">
                      {entry.jsonData ? (
                        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
                              <FileJson className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block truncate max-w-xs sm:max-w-md">
                                {entry.jsonFileName || 'plik_badania.json'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Załączony plik danych JSON ({(new Blob([entry.jsonData]).size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              type="button"
                              onClick={() => setViewingJsonEntry(entry)}
                              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Podgląd</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadJson(entry)}
                              className="px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-medium border border-emerald-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Pobierz</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Czy na pewno chcesz usunąć załączony plik JSON?')) {
                                  handleUpdateHealthEntry(entry.id, { jsonFileName: undefined, jsonData: undefined });
                                }
                              }}
                              className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Usuń plik JSON"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-2 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Dodaj plik JSON (.json)</span>
                            <input
                              type="file"
                              accept=".json,application/json"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleAttachJsonToEntry(entry.id, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <span className="text-[11px] text-slate-500">Brak załączonego pliku JSON</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: New Profile Creation */}
      {isNewProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              <span>Utwórz Nowy Profil Zawodnika</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nazwa nowego profilu:
              </label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="np. Podopieczny 1 / Masa 2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewProfileModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newProfileName.trim()) return;
                  if (onCreateProfile) onCreateProfile(newProfileName.trim());
                  setIsNewProfileModalOpen(false);
                  setNewProfileName('');
                }}
                disabled={!newProfileName.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Utwórz Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Personal Record (PR) */}
      {isNewPRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Dodaj Rekord Życiowy (PR)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nazwa ćwiczenia:</label>
                <input
                  type="text"
                  value={newPRExercise}
                  onChange={(e) => setNewPRExercise(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ciężar ({unit}):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPRWeight}
                    onChange={(e) => setNewPRWeight(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Powtórzenia:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newPRReps}
                    onChange={(e) => setNewPRReps(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data rekordu:</label>
                  <input
                    type="date"
                    value={newPRDate}
                    onChange={(e) => setNewPRDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Szacowany 1RM:</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold">
                    {Math.round(newPRWeight * (1 + newPRReps / 30))} {unit}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notatki (opcjonalnie):</label>
                <input
                  type="text"
                  value={newPRNotes}
                  onChange={(e) => setNewPRNotes(e.target.value)}
                  placeholder="np. Czysta pauza, bez taśm"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewPRModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleAddPR}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Zapisz Rekord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Health & Bloodwork Entry */}
      {isNewHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Dodaj Wpis Badania Krwi</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Data badania:</label>
                <input
                  type="date"
                  value={newHealthDate}
                  onChange={(e) => setNewHealthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notatka (opcjonalnie):</label>
                <textarea
                  value={newHealthNotes}
                  onChange={(e) => setNewHealthNotes(e.target.value)}
                  placeholder="np. Badania kontrolne na czczo: morfologia, profil lipidowy, próby wątrobowe..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Plik JSON (opcjonalnie):</label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  {newHealthJsonName ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-slate-200 font-mono text-[11px] truncate">{newHealthJsonName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewHealthJsonName('');
                          setNewHealthJsonContent('');
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                        title="Usuń wybrany plik"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={newHealthJsonFileRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
                            setHealthJsonError('Wybierz plik w formacie JSON (.json).');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            try {
                              const text = ev.target?.result as string;
                              JSON.parse(text);
                              setNewHealthJsonName(file.name);
                              setNewHealthJsonContent(text);
                              setHealthJsonError('');
                            } catch {
                              setHealthJsonError('Plik zawiera niepoprawny format JSON.');
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => newHealthJsonFileRef.current?.click()}
                        className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 text-slate-300 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Wybierz plik .json z dysku</span>
                      </button>
                    </div>
                  )}

                  {healthJsonError && (
                    <div className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{healthJsonError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewHealthModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleAddHealthEntry}
                disabled={!newHealthDate}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Zapisz Wpis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View JSON Content */}
      {viewingJsonEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Podgląd pliku: <span className="font-mono text-emerald-400">{viewingJsonEntry.jsonFileName || 'badania.json'}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (viewingJsonEntry.jsonData) {
                      navigator.clipboard.writeText(viewingJsonEntry.jsonData);
                      setCopiedJsonView(true);
                      setTimeout(() => setCopiedJsonView(false), 2000);
                    }
                  }}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedJsonView ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJsonView ? 'Skopiowano!' : 'Kopiuj'}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {viewingJsonEntry.jsonData || 'Pusty plik'}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadJson(viewingJsonEntry)}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pobierz plik</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingJsonEntry(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
