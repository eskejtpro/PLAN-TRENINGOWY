import { GymData } from '../types';

export const initialGymData: GymData = {
  settings: {
    unit: 'kg',
    theme: 'dark',
    autoSave: true,
    athleteName: 'Zawodnik',
    windowsPath: '%LOCALAPPDATA%\\GymTracker\\workout_data.json',
    soundFeedback: true,
    autoBackupEnabled: true,
    backupFolderPath: '%LOCALAPPDATA%\\GymTracker\\Backups',
    backupOnSave: true,
    backupOnClose: true,
    maxBackupFiles: 15,
    lastBackupTime: undefined
  },
  weeks: [
    {
      id: 'week-1',
      number: 1,
      name: 'Tydzień 1 - Rozpoczęcie Cyklu',
      startDate: '2026-09-01',
      days: [
        {
          id: 'w1-d1',
          name: 'Poniedziałek - Push (Klatka / Barki / Triceps)',
          completed: true,
          notes: 'Dobre czucie mięśniowe, mocne pobudzenie',
          exercises: [
            {
              id: 'ex-1',
              name: 'Wyciskanie sztangi leżąc (Bench Press)',
              sets: 4,
              reps: 8,
              weight: 85,
              rpe: 8,
              notes: 'Pauza na klatce, stabilne łopatki',
              history: [
                { date: '2026-08-18', weight: 80, reps: 8, sets: 4, rpe: 7.5 },
                { date: '2026-08-25', weight: 82.5, reps: 8, sets: 4, rpe: 8 },
                { date: '2026-09-01', weight: 85, reps: 8, sets: 4, rpe: 8 }
              ]
            },
            {
              id: 'ex-2',
              name: 'Wyciskanie hantli na skosie dodatnim',
              sets: 3,
              reps: 10,
              weight: 30,
              rpe: 8.5,
              notes: 'Kąt ławki 30 stopni',
              history: [
                { date: '2026-08-18', weight: 26, reps: 10, sets: 3 },
                { date: '2026-08-25', weight: 28, reps: 10, sets: 3 },
                { date: '2026-09-01', weight: 30, reps: 10, sets: 3 }
              ]
            },
            {
              id: 'ex-3',
              name: 'Wznosy hantli bokiem (barki)',
              sets: 4,
              reps: 12,
              weight: 12.5,
              rpe: 9,
              notes: 'Kontrolowana faza negatywna',
              history: [
                { date: '2026-08-18', weight: 10, reps: 12, sets: 4 },
                { date: '2026-08-25', weight: 12, reps: 12, sets: 4 },
                { date: '2026-09-01', weight: 12.5, reps: 12, sets: 4 }
              ]
            },
            {
              id: 'ex-4',
              name: 'Dipsy na poręczach (triceps)',
              sets: 3,
              reps: 10,
              weight: 10,
              rpe: 8,
              notes: 'Obciążenie na pasie',
              history: [
                { date: '2026-08-18', weight: 5, reps: 10, sets: 3 },
                { date: '2026-08-25', weight: 7.5, reps: 10, sets: 3 },
                { date: '2026-09-01', weight: 10, reps: 10, sets: 3 }
              ]
            }
          ]
        },
        {
          id: 'w1-d2',
          name: 'Środa - Pull (Plecy / Tył barku / Biceps)',
          completed: true,
          notes: 'Mocny grzbiet, chwyt wytrzymał',
          exercises: [
            {
              id: 'ex-5',
              name: 'Martwy ciąg klasyczny (Deadlift)',
              sets: 4,
              reps: 5,
              weight: 140,
              rpe: 8.5,
              notes: 'Pas zapięty od 3 serii',
              history: [
                { date: '2026-08-20', weight: 130, reps: 5, sets: 4 },
                { date: '2026-08-27', weight: 135, reps: 5, sets: 4 },
                { date: '2026-09-03', weight: 140, reps: 5, sets: 4 }
              ]
            },
            {
              id: 'ex-6',
              name: 'Podciąganie na drążku (nachwyt)',
              sets: 3,
              reps: 8,
              weight: 0,
              rpe: 8,
              notes: 'Pełen zakres ruchu do brody',
              history: [
                { date: '2026-08-20', weight: 0, reps: 6, sets: 3 },
                { date: '2026-08-27', weight: 0, reps: 7, sets: 3 },
                { date: '2026-09-03', weight: 0, reps: 8, sets: 3 }
              ]
            },
            {
              id: 'ex-7',
              name: 'Wiosłowanie hantlem w oparciu',
              sets: 3,
              reps: 10,
              weight: 36,
              rpe: 8,
              notes: 'Rozciągnięcie najszerszego',
              history: [
                { date: '2026-08-20', weight: 32, reps: 10, sets: 3 },
                { date: '2026-08-27', weight: 34, reps: 10, sets: 3 },
                { date: '2026-09-03', weight: 36, reps: 10, sets: 3 }
              ]
            },
            {
              id: 'ex-biceps-1',
              name: 'Uginanie przedramion ze sztangą (Biceps)',
              sets: 3,
              reps: 10,
              weight: 35,
              rpe: 8.5,
              notes: 'Czysta technika bez bujania tułowiem',
              history: [
                { date: '2026-08-20', weight: 30, reps: 10, sets: 3 },
                { date: '2026-08-27', weight: 32.5, reps: 10, sets: 3 },
                { date: '2026-09-03', weight: 35, reps: 10, sets: 3 }
              ]
            }
          ]
        },
        {
          id: 'w1-d3',
          name: 'Piątek - Legs (Przysiad / Dwugłowe / Łydki)',
          completed: false,
          notes: 'Plan na mocne tempo',
          exercises: [
            {
              id: 'ex-8',
              name: 'Przysiad ze sztangą (Back Squat)',
              sets: 4,
              reps: 6,
              weight: 115,
              rpe: 8,
              notes: 'Głębokość poniżej równoległości',
              history: [
                { date: '2026-08-22', weight: 105, reps: 6, sets: 4 },
                { date: '2026-08-29', weight: 110, reps: 6, sets: 4 },
                { date: '2026-09-05', weight: 115, reps: 6, sets: 4 }
              ]
            },
            {
              id: 'ex-9',
              name: 'Rumuński martwy ciąg (RDL)',
              sets: 3,
              reps: 10,
              weight: 85,
              rpe: 8,
              notes: 'Mocne spięcie pośladków na górze',
              history: [
                { date: '2026-08-22', weight: 75, reps: 10, sets: 3 },
                { date: '2026-08-29', weight: 80, reps: 10, sets: 3 },
                { date: '2026-09-05', weight: 85, reps: 10, sets: 3 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'week-2',
      number: 2,
      name: 'Tydzień 2 - Progresja Ciężaru (+2.5kg)',
      startDate: '2026-09-08',
      days: [
        {
          id: 'w2-d1',
          name: 'Poniedziałek - Push (Klatka / Barki / Triceps)',
          completed: true,
          notes: 'Dodane +2.5kg na klatę poszło gładko!',
          exercises: [
            {
              id: 'ex-10',
              name: 'Wyciskanie sztangi leżąc (Bench Press)',
              sets: 4,
              reps: 8,
              weight: 87.5,
              rpe: 8.5,
              notes: 'Pobity rekord z zeszłego tygodnia',
              history: [
                { date: '2026-08-25', weight: 82.5, reps: 8, sets: 4 },
                { date: '2026-09-01', weight: 85, reps: 8, sets: 4 },
                { date: '2026-09-08', weight: 87.5, reps: 8, sets: 4 }
              ]
            },
            {
              id: 'ex-11',
              name: 'Wyciskanie hantli na skosie dodatnim',
              sets: 3,
              reps: 10,
              weight: 32,
              rpe: 9,
              notes: 'Weszło 32kg',
              history: [
                { date: '2026-08-25', weight: 28, reps: 10, sets: 3 },
                { date: '2026-09-01', weight: 30, reps: 10, sets: 3 },
                { date: '2026-09-08', weight: 32, reps: 10, sets: 3 }
              ]
            }
          ]
        },
        {
          id: 'w2-d2',
          name: 'Środa - Pull (Plecy / Biceps)',
          completed: false,
          notes: 'Cel: 145kg na martwym ciągu',
          exercises: [
            {
              id: 'ex-12',
              name: 'Martwy ciąg klasyczny (Deadlift)',
              sets: 4,
              reps: 5,
              weight: 145,
              rpe: 9,
              notes: 'Cel: 145kg',
              history: [
                { date: '2026-08-27', weight: 135, reps: 5, sets: 4 },
                { date: '2026-09-03', weight: 140, reps: 5, sets: 4 },
                { date: '2026-09-10', weight: 145, reps: 5, sets: 4 }
              ]
            }
          ]
        }
      ]
    }
  ],
  bodyWeights: [
    { id: 'bw-1', date: '2026-08-15', weight: 82.0, notes: 'Początek pomiarów rano' },
    { id: 'bw-2', date: '2026-08-22', weight: 81.6, notes: 'Na czczo po cardio' },
    { id: 'bw-3', date: '2026-08-29', weight: 81.2, notes: 'Lekki spadek retencji wody' },
    { id: 'bw-4', date: '2026-09-05', weight: 80.8, notes: 'Świetna forma, lepsza definicja' },
    { id: 'bw-5', date: '2026-09-12', weight: 80.4, notes: 'Waga stabilna, siła w górę' }
  ],
  protocolEntries: [
    {
      id: 'proto-1',
      date: '2026-09-01',
      time: '08:00',
      substance: 'Testosteron Enanthat',
      dosage: 250,
      unit: 'mg',
      route: 'IM',
      notes: 'Prawy pośladek, brak dyskomfortu'
    },
    {
      id: 'proto-2',
      date: '2026-09-04',
      time: '09:30',
      substance: 'HCG',
      dosage: 500,
      unit: 'IU',
      route: 'SC',
      notes: 'Podskórnie fałd brzuszny'
    },
    {
      id: 'proto-3',
      date: '2026-09-08',
      time: '08:00',
      substance: 'Testosteron Enanthat',
      dosage: 250,
      unit: 'mg',
      route: 'IM',
      notes: 'Lewy pośladek'
    },
    {
      id: 'proto-4',
      date: '2026-09-11',
      time: '09:00',
      substance: 'HCG',
      dosage: 500,
      unit: 'IU',
      route: 'SC',
      notes: 'Podskórnie brzuch'
    },
    {
      id: 'proto-5',
      date: '2026-09-15',
      time: '08:30',
      substance: 'Testosteron Enanthat',
      dosage: 250,
      unit: 'mg',
      route: 'IM',
      notes: 'Prawy pośladek'
    }
  ]
};

export const commonExerciseLibrary = [
  'Wyciskanie sztangi leżąc (Bench Press)',
  'Wyciskanie hantli na skosie dodatnim',
  'Przysiad ze sztangą (Back Squat)',
  'Przysiad przedni (Front Squat)',
  'Martwy ciąg klasyczny (Deadlift)',
  'Rumuński martwy ciąg (RDL)',
  'Wyciskanie żołnierskie (OHP)',
  'Wiosłowanie sztangą w opadzie',
  'Wiosłowanie hantlem w oparciu',
  'Podciąganie na drążku (nachwyt)',
  'Podciąganie podchwytem (Chin-ups)',
  'Dipsy na poręczach',
  'Wznosy hantli bokiem (barki)',
  'Uginanie przedramion ze sztangą (biceps)',
  'Wyciskanie francuskie leżąc',
  'Wspięcia na palce (łydki)',
  'Wypychanie nóg na suwnicy (Leg Press)'
];
