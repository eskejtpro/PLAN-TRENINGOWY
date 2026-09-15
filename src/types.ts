export interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseHistoryPoint {
  date: string;
  weight: number;
  reps: number;
  sets: number;
  rpe?: number;
  loggedSets?: LoggedSet[];
}

export interface Exercise {
  id: string;
  name: string;
  category?: 'klatka' | 'plecy' | 'biceps' | 'triceps' | 'barki' | 'nogi';
  sets: number;
  reps: number;
  weight: number;
  rpe: number;
  notes: string;
  history: ExerciseHistoryPoint[];
  loggedSets?: LoggedSet[];
}

export interface TrainingDay {
  id: string;
  name: string;
  completed: boolean;
  notes?: string;
  exercises: Exercise[];
}

export interface TrainingWeek {
  id: string;
  number: number;
  name: string;
  startDate?: string;
  days: TrainingDay[];
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
  notes: string;
}

export interface BackupEntry {
  id: string;
  timestamp: string;
  fileName: string;
  sizeBytes: number;
  weeksCount: number;
  data: GymData;
}

export interface AppSettings {
  unit: 'kg' | 'lbs';
  theme: 'dark' | 'light';
  autoSave: boolean;
  athleteName: string;
  windowsPath: string;
  soundFeedback: boolean;
  autoBackupEnabled?: boolean;
  backupFolderPath?: string;
  backupOnSave?: boolean;
  backupOnClose?: boolean;
  maxBackupFiles?: number;
  lastBackupTime?: string;
}

export interface ProtocolEntry {
  id: string;
  date: string;
  time?: string;
  substance: string;
  dosage: number;
  unit: 'mg' | 'IU' | 'mcg' | 'ml' | 'tab';
  route: 'IM' | 'SC' | 'Oral';
  notes?: string;
}

export interface GymData {
  settings: AppSettings;
  weeks: TrainingWeek[];
  bodyWeights: BodyWeightEntry[];
  protocolEntries?: ProtocolEntry[];
}
