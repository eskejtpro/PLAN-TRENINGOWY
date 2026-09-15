import React, { useState, useEffect, useRef } from 'react';
import { ModernSidebar } from './components/ModernSidebar';
import { ModernHeader } from './components/ModernHeader';
import { WorkoutPlanView } from './components/WorkoutPlanView';
import { StatsView } from './components/StatsView';
import { MuscleProgressView } from './components/MuscleProgressView';
import { BodyWeightView } from './components/BodyWeightView';
import { SettingsView } from './components/SettingsView';
import { PythonCodeView } from './components/PythonCodeView';
import { ExerciseManagerView } from './components/ExerciseManagerView';
import { CycleProtocolView } from './components/CycleProtocolView';
import { ExerciseModal } from './components/ExerciseModal';
import { ExerciseHistoryModal } from './components/ExerciseHistoryModal';
import { GymData, TrainingWeek, TrainingDay, Exercise, ExerciseHistoryPoint, BodyWeightEntry, AppSettings, LoggedSet, BackupEntry, ProtocolEntry } from './types';
import { initialGymData } from './data/initialData';
import { PYTHON_SOURCE_CODE, BAT_SCRIPT_CODE, REQUIREMENTS_TXT, INSTALL_BAT_CODE } from './data/pythonSource';
import { getTodayDateString } from './utils/calculations';

const STORAGE_KEY = 'gymtracker_windows_data_v1';
const BACKUPS_STORAGE_KEY = 'gymtracker_autobackups_v1';

export default function App() {
  const [data, setData] = useState<GymData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.weeks) return parsed;
      }
    } catch (e) {
      console.warn('Could not load from localStorage, using initial data');
    }
    return initialGymData;
  });

  const [activeView, setActiveView] = useState<string>('plan');
  const [selectedWeekId, setSelectedWeekId] = useState<string>(data.weeks[0]?.id || 'week-1');
  const [selectedDayId, setSelectedDayId] = useState<string>(data.weeks[0]?.days[0]?.id || 'w1-d1');
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Zapisano w JSON');

  // Modern UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Backups state
  const [backups, setBackups] = useState<BackupEntry[]>(() => {
    try {
      const saved = localStorage.getItem(BACKUPS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load backups from localStorage');
    }
    return [];
  });

  // Modals state
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyExercise, setHistoryExercise] = useState<Exercise | null>(null);

  // Helper function to perform auto-backup
  const lastBackupStringRef = useRef<string>('');
  const createAutoBackup = (targetData: GymData, triggerReason: string = 'auto') => {
    try {
      const jsonStr = JSON.stringify(targetData);
      if (jsonStr === lastBackupStringRef.current) return; // Skip duplicate backup of identical data
      lastBackupStringRef.current = jsonStr;

      const now = new Date();
      const dateTag = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeTag = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const formattedTimestamp = `${now.toLocaleDateString('pl-PL')} ${now.toLocaleTimeString('pl-PL')}`;
      const fileName = `workout_backup_${dateTag}_${timeTag}.json`;
      const sizeBytes = new Blob([jsonStr]).size;

      const newBackup: BackupEntry = {
        id: `backup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: formattedTimestamp,
        fileName,
        sizeBytes,
        weeksCount: targetData.weeks.length,
        data: JSON.parse(jsonStr)
      };

      const maxCount = targetData.settings.maxBackupFiles || 15;
      const updatedBackups = [newBackup, ...backups].slice(0, maxCount);
      setBackups(updatedBackups);
      localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(updatedBackups));

      // Update last backup time setting
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          lastBackupTime: formattedTimestamp
        }
      }));
    } catch (err) {
      console.error('Failed to create auto backup', err);
    }
  };

  // Persistence to localStorage & Auto-Backup on Save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setAutoSaveStatus(`Zapisano w JSON (${new Date().toLocaleTimeString()})`);

      // Trigger Auto Backup on Save if enabled
      if (data.settings.autoBackupEnabled !== false && data.settings.backupOnSave !== false) {
        createAutoBackup(data, 'save');
      }
    } catch (e) {
      setAutoSaveStatus('Błąd zapisu');
    }
  }, [data]);

  // Automatic Backup on App Close (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (data.settings.autoBackupEnabled !== false && data.settings.backupOnClose !== false) {
        try {
          const jsonStr = JSON.stringify(data);
          const now = new Date();
          const dateTag = now.toISOString().slice(0, 10).replace(/-/g, '');
          const timeTag = now.toTimeString().slice(0, 8).replace(/:/g, '');
          const fileName = `workout_backup_exit_${dateTag}_${timeTag}.json`;
          const sizeBytes = new Blob([jsonStr]).size;

          const exitBackup: BackupEntry = {
            id: `backup-exit-${Date.now()}`,
            timestamp: `${now.toLocaleDateString('pl-PL')} ${now.toLocaleTimeString('pl-PL')} (Zamknięcie)`,
            fileName,
            sizeBytes,
            weeksCount: data.weeks.length,
            data
          };

          const existingBackups: BackupEntry[] = JSON.parse(localStorage.getItem(BACKUPS_STORAGE_KEY) || '[]');
          const updated = [exitBackup, ...existingBackups].slice(0, data.settings.maxBackupFiles || 15);
          localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Error creating exit backup', e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data]);

  // Backup actions
  const handleCreateManualBackup = () => {
    createAutoBackup(data, 'manual');
    alert('Kopia zapasowa została pomyślnie utworzona i zapisana!');
  };

  const handleRestoreBackup = (backup: BackupEntry) => {
    if (backup && backup.data && Array.isArray(backup.data.weeks)) {
      setData(backup.data);
      if (backup.data.weeks.length > 0) {
        setSelectedWeekId(backup.data.weeks[0].id);
        setSelectedDayId(backup.data.weeks[0].days[0]?.id || '');
      }
      alert(`Pomyślnie przywrócono dane z kopii z dnia ${backup.timestamp}`);
    }
  };

  const handleDownloadBackup = (backup: BackupEntry) => {
    const jsonStr = JSON.stringify(backup.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteBackup = (backupId: string) => {
    const updated = backups.filter((b) => b.id !== backupId);
    setBackups(updated);
    localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(updated));
  };

  // Ensure selected week/day are valid
  useEffect(() => {
    const weekExists = data.weeks.some((w) => w.id === selectedWeekId);
    if (!weekExists && data.weeks.length > 0) {
      setSelectedWeekId(data.weeks[0].id);
      setSelectedDayId(data.weeks[0].days[0]?.id || '');
    } else {
      const currentWeek = data.weeks.find((w) => w.id === selectedWeekId);
      const dayExists = currentWeek?.days.some((d) => d.id === selectedDayId);
      if (!dayExists && currentWeek?.days && currentWeek.days.length > 0) {
        setSelectedDayId(currentWeek.days[0].id);
      }
    }
  }, [data.weeks, selectedWeekId, selectedDayId]);

  // Theme toggle
  const handleToggleTheme = () => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === 'dark' ? 'light' : 'dark'
      }
    }));
  };

  // Weeks management
  const handleAddWeek = () => {
    const newNum = data.weeks.length + 1;
    const newWeekId = `week-${Date.now()}`;
    const newWeek: TrainingWeek = {
      id: newWeekId,
      number: newNum,
      name: `Tydzień ${newNum} - Cykl Progresji`,
      days: [
        {
          id: `${newWeekId}-d1`,
          name: 'Poniedziałek - Push (Klatka / Barki)',
          completed: false,
          exercises: []
        },
        {
          id: `${newWeekId}-d2`,
          name: 'Środa - Pull (Plecy / Biceps)',
          completed: false,
          exercises: []
        },
        {
          id: `${newWeekId}-d3`,
          name: 'Piątek - Legs (Przysiad / Nogi)',
          completed: false,
          exercises: []
        }
      ]
    };

    setData((prev) => ({
      ...prev,
      weeks: [...prev.weeks, newWeek]
    }));
    setSelectedWeekId(newWeekId);
    setSelectedDayId(`${newWeekId}-d1`);
  };

  const handleDuplicateWeek = (weekId: string) => {
    const sourceWeek = data.weeks.find((w) => w.id === weekId);
    if (!sourceWeek) return;

    const newNum = data.weeks.length + 1;
    const newWeekId = `week-${Date.now()}`;
    const duplicatedWeek: TrainingWeek = {
      id: newWeekId,
      number: newNum,
      name: `Tydzień ${newNum} (+2.5kg progres)`,
      days: sourceWeek.days.map((d, dIdx) => ({
        id: `${newWeekId}-d${dIdx + 1}`,
        name: d.name,
        completed: false,
        exercises: d.exercises.map((ex) => {
          const updatedWeight = Math.round((ex.weight + 2.5) * 10) / 10;
          return {
            ...ex,
            id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            weight: updatedWeight,
            history: [
              ...(ex.history || []),
              {
                date: getTodayDateString(),
                weight: updatedWeight,
                reps: ex.reps,
                sets: ex.sets
              }
            ]
          };
        })
      }))
    };

    setData((prev) => ({
      ...prev,
      weeks: [...prev.weeks, duplicatedWeek]
    }));
    setSelectedWeekId(newWeekId);
    setSelectedDayId(duplicatedWeek.days[0]?.id || '');
  };

  const handleDeleteWeek = (weekId: string) => {
    if (data.weeks.length <= 1) return;
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.filter((w) => w.id !== weekId)
    }));
  };

  // Days management
  const handleAddDay = (weekId: string) => {
    const week = data.weeks.find((w) => w.id === weekId);
    if (!week) return;
    const dayNum = week.days.length + 1;
    const newDayId = `day-${Date.now()}`;
    const newDay: TrainingDay = {
      id: newDayId,
      name: `Dzień ${dayNum} - Dodatkowy Trening`,
      completed: false,
      exercises: []
    };

    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.id === weekId ? { ...w, days: [...w.days, newDay] } : w
      )
    }));
    setSelectedDayId(newDayId);
  };

  const handleDeleteDay = (weekId: string, dayId: string) => {
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.id === weekId ? { ...w, days: w.days.filter((d) => d.id !== dayId) } : w
      )
    }));
  };

  const handleToggleDayCompleted = (weekId: string, dayId: string) => {
    const today = getTodayDateString();
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;
            const newCompleted = !d.completed;
            let updatedExercises = d.exercises;
            if (newCompleted) {
              // Auto log history for each exercise if not logged today yet
              updatedExercises = d.exercises.map((ex) => {
                const hasTodayLog = ex.history?.some((h) => h.date === today);
                if (hasTodayLog) return ex;
                const newPoint: ExerciseHistoryPoint = {
                  date: today,
                  weight: ex.weight,
                  reps: ex.reps,
                  sets: ex.sets,
                  rpe: ex.rpe,
                  loggedSets: ex.loggedSets
                };
                return {
                  ...ex,
                  history: [...(ex.history || []), newPoint]
                };
              });
            }
            return {
              ...d,
              completed: newCompleted,
              exercises: updatedExercises
            };
          })
        };
      })
    }));
  };

  const handleUpdateDayNotes = (weekId: string, dayId: string, notes: string) => {
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return {
          ...w,
          days: w.days.map((d) => (d.id === dayId ? { ...d, notes } : d))
        };
      })
    }));
  };

  // Exercise Performance Save (Sets, Reps, Weight + Logged Sets)
  const handleSaveExercisePerformance = (
    weekId: string,
    dayId: string,
    exerciseId: string,
    sets: number,
    reps: number,
    weight: number,
    loggedSets?: LoggedSet[]
  ) => {
    const today = getTodayDateString();
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              exercises: d.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                const newPoint: ExerciseHistoryPoint = {
                  date: today,
                  weight,
                  reps,
                  sets,
                  rpe: ex.rpe,
                  loggedSets
                };
                return {
                  ...ex,
                  sets,
                  reps,
                  weight,
                  loggedSets: loggedSets ?? ex.loggedSets,
                  history: [...(ex.history || []), newPoint]
                };
              })
            };
          })
        };
      })
    }));
  };

  // Exercise Weight Adjustment (+2.5 kg, -2.5 kg, etc.)
  const handleUpdateExerciseWeight = (
    weekId: string,
    dayId: string,
    exerciseId: string,
    newWeight: number
  ) => {
    const today = getTodayDateString();
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return w as any;
            return {
              ...d,
              exercises: d.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                const newPoint: ExerciseHistoryPoint = {
                  date: today,
                  weight: newWeight,
                  reps: ex.reps,
                  sets: ex.sets,
                  rpe: ex.rpe
                };
                return {
                  ...ex,
                  weight: newWeight,
                  history: [...(ex.history || []), newPoint]
                };
              })
            };
          })
        };
      })
    }));
  };

  // Exercise Rename (Quick Inline or Modal)
  const handleRenameExercise = (
    weekId: string,
    dayId: string,
    exerciseId: string,
    newName: string
  ) => {
    if (!newName.trim()) return;
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              exercises: d.exercises.map((ex) =>
                ex.id === exerciseId ? { ...ex, name: newName.trim() } : ex
              )
            };
          })
        };
      })
    }));
  };

  // Exercise Add / Edit
  const handleSaveExercise = (exerciseData: Omit<Exercise, 'id'>, exerciseId?: string) => {
    const currentWeek = data.weeks.find((w) => w.id === selectedWeekId);
    const currentDay = currentWeek?.days.find((d) => d.id === selectedDayId);
    if (!currentWeek || !currentDay) return;

    if (exerciseId) {
      // Edit existing
      setData((prev) => ({
        ...prev,
        weeks: prev.weeks.map((w) => {
          if (w.id !== currentWeek.id) return w;
          return {
            ...w,
            days: w.days.map((d) => {
              if (d.id !== currentDay.id) return d;
              return {
                ...d,
                exercises: d.exercises.map((ex) =>
                  ex.id === exerciseId ? { ...exerciseData, id: exerciseId } : ex
                )
              };
            })
          };
        })
      }));
    } else {
      // Add new
      const newEx: Exercise = {
        ...exerciseData,
        id: `ex-${Date.now()}`
      };
      setData((prev) => ({
        ...prev,
        weeks: prev.weeks.map((w) => {
          if (w.id !== currentWeek.id) return w;
          return {
            ...w,
            days: w.days.map((d) => {
              if (d.id !== currentDay.id) return d;
              return {
                ...d,
                exercises: [...d.exercises, newEx]
              };
            })
          };
        })
      }));
    }
  };

  const handleDeleteExercise = (weekId: string, dayId: string, exerciseId: string) => {
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              exercises: d.exercises.filter((ex) => ex.id !== exerciseId)
            };
          })
        };
      })
    }));
  };

  const handleUpdateExerciseHistory = (exerciseId: string, newHistory: ExerciseHistoryPoint[]) => {
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => ({
          ...d,
          exercises: d.exercises.map((ex) => {
            if (ex.id === exerciseId) {
              const lastPoint = newHistory[newHistory.length - 1];
              return {
                ...ex,
                history: newHistory,
                weight: lastPoint ? lastPoint.weight : ex.weight
              };
            }
            return ex;
          })
        }))
      }))
    }));
    // Update active modal exercise reference
    if (historyExercise && historyExercise.id === exerciseId) {
      setHistoryExercise((prev) => (prev ? { ...prev, history: newHistory } : null));
    }
  };

  // Body weight entries
  const handleAddBodyWeight = (entry: Omit<BodyWeightEntry, 'id'>) => {
    const newEntry: BodyWeightEntry = {
      ...entry,
      id: `bw-${Date.now()}`
    };
    setData((prev) => ({
      ...prev,
      bodyWeights: [...prev.bodyWeights, newEntry]
    }));
  };

  const handleDeleteBodyWeight = (id: string) => {
    setData((prev) => ({
      ...prev,
      bodyWeights: prev.bodyWeights.filter((bw) => bw.id !== id)
    }));
  };

  // Protocol entries (Sterydy, HCG, itp.)
  const handleAddProtocolEntry = (entry: Omit<ProtocolEntry, 'id'>) => {
    const newEntry: ProtocolEntry = {
      ...entry,
      id: `proto-${Date.now()}`
    };
    setData((prev) => ({
      ...prev,
      protocolEntries: [...(prev.protocolEntries || []), newEntry]
    }));
  };

  const handleDeleteProtocolEntry = (id: string) => {
    setData((prev) => ({
      ...prev,
      protocolEntries: (prev.protocolEntries || []).filter((p) => p.id !== id)
    }));
  };

  const handleUpdateWeekStartDate = (weekId: string, startDate: string) => {
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => (w.id === weekId ? { ...w, startDate } : w))
    }));
  };

  const handleAddWeekFromGap = (startDate: string, weekNumber: number) => {
    const newWeek: TrainingWeek = {
      id: `week-${Date.now()}`,
      number: weekNumber,
      name: `Tydzień ${weekNumber} - Plan Treningowy`,
      startDate,
      days: [
        {
          id: `d-${Date.now()}-1`,
          name: 'Dzień 1 - Push / Klatka & Barki',
          completed: false,
          exercises: []
        },
        {
          id: `d-${Date.now()}-2`,
          name: 'Dzień 2 - Pull / Plecy & Biceps',
          completed: false,
          exercises: []
        },
        {
          id: `d-${Date.now()}-3`,
          name: 'Dzień 3 - Nogi / Siła & Hipertrofia',
          completed: false,
          exercises: []
        }
      ]
    };
    setData((prev) => ({
      ...prev,
      weeks: [...prev.weeks, newWeek].sort((a, b) => a.number - b.number)
    }));
  };

  // Settings & JSON
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings
      }
    }));
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (imported: GymData) => {
    setData(imported);
    if (imported.weeks.length > 0) {
      setSelectedWeekId(imported.weeks[0].id);
      setSelectedDayId(imported.weeks[0].days[0]?.id || '');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Czy na pewno chcesz przywrócić domyślny plan treningowy?')) {
      setData(initialGymData);
      setSelectedWeekId(initialGymData.weeks[0].id);
      setSelectedDayId(initialGymData.weeks[0].days[0].id);
    }
  };

  const isDark = data.settings.theme === 'dark';
  const currentWeek = data.weeks.find((w) => w.id === selectedWeekId) || data.weeks[0];
  const currentDay = currentWeek?.days.find((d) => d.id === selectedDayId) || currentWeek?.days[0];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex font-sans selection:bg-emerald-500 selection:text-white`}>
      {/* Modern Desktop Sidebar (Left Side) */}
      <div className="hidden md:flex shrink-0">
        <ModernSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          settings={data.settings}
          onUpdateSettings={handleUpdateSettings}
          autoSaveStatus={autoSaveStatus}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          weeksCount={data.weeks.length}
          position="left"
        />
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ModernHeader
          activeView={activeView}
          onSelectView={setActiveView}
          settings={data.settings}
          onUpdateSettings={handleUpdateSettings}
          autoSaveStatus={autoSaveStatus}
          onOpenAddExerciseModal={() => {
            setExerciseToEdit(null);
            setIsExerciseModalOpen(true);
          }}
          onExportJson={handleExportJson}
          onCreateBackup={handleCreateManualBackup}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          currentWeekName={currentWeek?.name}
          currentDayName={currentDay?.name}
        />

        {/* View Switcher Container */}
        <main className={`flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {activeView === 'plan' && (
            <WorkoutPlanView
              weeks={data.weeks}
              selectedWeekId={selectedWeekId}
              selectedDayId={selectedDayId}
              onSelectWeek={setSelectedWeekId}
              onSelectDay={setSelectedDayId}
              onAddWeek={handleAddWeek}
              onDeleteWeek={handleDeleteWeek}
              onDuplicateWeek={handleDuplicateWeek}
              onAddDay={handleAddDay}
              onDeleteDay={handleDeleteDay}
              onToggleDayCompleted={handleToggleDayCompleted}
              onUpdateDayNotes={handleUpdateDayNotes}
              onUpdateExerciseWeight={handleUpdateExerciseWeight}
              onSaveExercisePerformance={handleSaveExercisePerformance}
              onRenameExercise={handleRenameExercise}
              onOpenAddExerciseModal={() => {
                setExerciseToEdit(null);
                setIsExerciseModalOpen(true);
              }}
              onOpenEditExerciseModal={(ex) => {
                setExerciseToEdit(ex);
                setIsExerciseModalOpen(true);
              }}
              onOpenHistoryModal={(ex) => {
                setHistoryExercise(ex);
                setIsHistoryModalOpen(true);
              }}
              onDeleteExercise={handleDeleteExercise}
              unit={data.settings.unit}
            />
          )}

          {activeView === 'stats' && (
            <StatsView
              weeks={data.weeks}
              bodyWeights={data.bodyWeights || []}
              unit={data.settings.unit}
            />
          )}

          {activeView === 'muscle' && (
            <MuscleProgressView weeks={data.weeks} unit={data.settings.unit} />
          )}

          {activeView === 'weight' && (
            <BodyWeightView
              bodyWeights={data.bodyWeights}
              onAddBodyWeight={handleAddBodyWeight}
              onDeleteBodyWeight={handleDeleteBodyWeight}
              unit={data.settings.unit}
            />
          )}

          {activeView === 'cycles' && (
            <CycleProtocolView
              protocolEntries={data.protocolEntries || []}
              weeks={data.weeks}
              settings={data.settings}
              onAddProtocolEntry={handleAddProtocolEntry}
              onDeleteProtocolEntry={handleDeleteProtocolEntry}
              onUpdateWeekStartDate={handleUpdateWeekStartDate}
              onAddWeekFromGap={handleAddWeekFromGap}
            />
          )}

          {activeView === 'exercises' && (
            <ExerciseManagerView
              weeks={data.weeks}
              onOpenAddExerciseModal={() => {
                setExerciseToEdit(null);
                setIsExerciseModalOpen(true);
              }}
              onOpenEditExerciseModal={(ex) => {
                setExerciseToEdit(ex);
                setIsExerciseModalOpen(true);
              }}
              onDeleteExercise={handleDeleteExercise}
              unit={data.settings.unit}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              data={data}
              onUpdateSettings={handleUpdateSettings}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onResetData={handleResetData}
              backups={backups}
              onCreateBackup={handleCreateManualBackup}
              onRestoreBackup={handleRestoreBackup}
              onDownloadBackup={handleDownloadBackup}
              onDeleteBackup={handleDeleteBackup}
            />
          )}

          {activeView === 'python' && (
            <PythonCodeView
              pythonCode={PYTHON_SOURCE_CODE}
              batchScript={BAT_SCRIPT_CODE}
              requirementsTxt={REQUIREMENTS_TXT}
              installScript={INSTALL_BAT_CODE}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer Navigation (Left Side) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start md:hidden animate-fadeIn">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl">
            <ModernSidebar
              activeView={activeView}
              onSelectView={(v) => {
                setActiveView(v);
                setIsMobileMenuOpen(false);
              }}
              settings={data.settings}
              onUpdateSettings={handleUpdateSettings}
              autoSaveStatus={autoSaveStatus}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileMenuOpen(false)}
              weeksCount={data.weeks.length}
              position="left"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <ExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSave={handleSaveExercise}
        exerciseToEdit={exerciseToEdit}
        unit={data.settings.unit}
      />

      <ExerciseHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        exercise={historyExercise}
        onUpdateHistory={handleUpdateExerciseHistory}
        unit={data.settings.unit}
      />
    </div>
  );
}
