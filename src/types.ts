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
  goalWeight?: number;
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

export const BODY_PARTS = ['biceps', 'triceps', 'klata', 'barki', 'nogi'] as const;
export type BodyPartType = (typeof BODY_PARTS)[number];

export interface BodyPartMeasurement {
  id: string;
  date: string;
  part: BodyPartType;
  value: number; // in cm, e.g. 38.5
  notes?: string;
}

export const CIRCUMFERENCE_BODY_PARTS = ['klatka', 'talia', 'biodra', 'udo', 'łydka', 'ramię'] as const;
export type CircumferenceBodyPart = (typeof CIRCUMFERENCE_BODY_PARTS)[number];
export type CircumferenceSide = 'left' | 'right' | null;
export type CircumferenceVariant = 'standard' | 'flexed' | 'relaxed';

export interface CircumferenceEntry {
  id: string;
  date: string;
  bodyPart: CircumferenceBodyPart;
  side: CircumferenceSide;
  variant: CircumferenceVariant;
  /** Stored as a positive integer to avoid floating-point drift. */
  millimeters: number;
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
  /** v1.1: analysis uses completed sessions by default to avoid planned-volume inflation. */
  analysisOnlyCompleted?: boolean;
  analysisHideEmptyGroups?: boolean;
  analysisIncludePartialHistory?: boolean;
  analysisStartWeek?: number;
  analysisEndWeek?: number;
  analysisDefaultMetric?: 'progressPct' | 'volume' | 'executedSets';
  analysisShowAlerts?: boolean;
  analysisShowBodyWeight?: boolean;
  analysisShow1RM?: boolean;
  analysisRoundValues?: boolean;
  analysisAutoRefresh?: boolean;
  analysisShowDataQualityWarnings?: boolean;
  analysisRequireHistoryForCompleted?: boolean;
  analysisMinExecutedSets?: number;
  analysisWarnMissingHistory?: boolean;
  analysisWarnVolumeJumpPct?: number;
  analysisTrendWindowWeeks?: number;
  confirmBeforeDelete?: boolean;
  startupView?: 'plan' | 'stats' | 'muscle' | 'weight' | 'cycles' | 'exercises' | 'settings' | 'python';
  rememberLastView?: boolean;
  reducedMotion?: boolean;
  analysisShowExecutionSummary?: boolean;
  /** v2.0: show the executed-work comparison table for two selected weeks. */
  analysisShowWeekComparison?: boolean;
  /** v2.2: allow hiding the weekly tonnage chart without changing analysis data. */
  analysisShowWeeklyTonnage?: boolean;
  /** v2.3: controls for transparent weekly metrics and exercise trend signals. */
  analysisShowWeeklyMetrics?: boolean;
  analysisShowExecutedDays?: boolean;
  analysisShowExecutedExercises?: boolean;
  analysisShowExecutedSets?: boolean;
  analysisShowExecutedReps?: boolean;
  analysisShowVolumeDelta?: boolean;
  analysisShowDataConfidence?: boolean;
  analysisShowBestE1RM?: boolean;
  analysisShowLatestResult?: boolean;
  analysisShowTrendLine?: boolean;
  /** v2.4: personal-record marker and stagnation controls. */
  analysisShowPRMarkers?: boolean;
  analysisPRMetric?: 'weight' | 'e1RM' | 'volume';
  analysisStagnationWindow?: number;
  analysisStagnationMinSessions?: number;
  /** v2.5: weekly regularity target and chart visibility. */
  analysisShowRegularity?: boolean;
  analysisRegularityTargetPct?: number;
  /** v2.6: show executed muscle-group frequency. */
  analysisShowMuscleFrequency?: boolean;
  /** v2.7: month-level execution comparison. */
  analysisShowMonthlyComparison?: boolean;
  analysisMonthlyMetric?: 'volume' | 'executedSets' | 'executedReps';
  /** v2.8: compare two executed training periods from real history. */
  analysisShowPeriodComparison?: boolean;
  analysisPeriodComparisonMetric?: 'volume' | 'executedSets' | 'executedReps' | 'executedDays';
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
  /** Optional for compatibility with JSON saved before circumference tracking. */
  circumferences?: CircumferenceEntry[];
  bodyPartMeasurements?: BodyPartMeasurement[];
  protocolEntries?: ProtocolEntry[];
}
