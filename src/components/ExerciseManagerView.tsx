import React, { useState } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Target, 
  Layers, 
  Flame, 
  Calendar,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { TrainingWeek, Exercise } from '../types';
import { calculate1RM, calculateVolume } from '../utils/calculations';

interface ExerciseManagerViewProps {
  weeks: TrainingWeek[];
  onOpenAddExerciseModal: () => void;
  onOpenEditExerciseModal: (exercise: Exercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  unit: string;
}

export const ExerciseManagerView: React.FC<ExerciseManagerViewProps> = ({
  weeks,
  onOpenAddExerciseModal,
  onOpenEditExerciseModal,
  onDeleteExercise,
  unit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');

  // Extract all exercises with their week & day context
  const allExercisesWithContext: Array<{
    exercise: Exercise;
    weekName: string;
    dayName: string;
  }> = [];

  weeks.forEach((week) => {
    week.days.forEach((day) => {
      day.exercises.forEach((ex) => {
        allExercisesWithContext.push({
          exercise: ex,
          weekName: week.name,
          dayName: day.name
        });
      });
    });
  });

  const categories = [
    { id: 'all', label: 'Wszystkie partie' },
    { id: 'klatka', label: '🏋️ Klatka' },
    { id: 'plecy', label: '🦅 Plecy' },
    { id: 'barki', label: '🛡️ Barki' },
    { id: 'biceps', label: '🦾 Biceps' },
    { id: 'triceps', label: '⚡ Triceps' },
    { id: 'nogi', label: '🦵 Nogi' }
  ];

  const filtered = allExercisesWithContext.filter(({ exercise, weekName }) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.notes && exercise.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesWeek = selectedWeekFilter === 'all' || weekName.includes(selectedWeekFilter);
    return matchesSearch && matchesCategory && matchesWeek;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fadeIn" id="view-exercise-manager">
      
      {/* Top Action & KPI Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Katalog & Baza Ćwiczeń w Systemie</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                {allExercisesWithContext.length} ćwiczeń
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Przeglądaj, filtruj, edytuj parametry i dodawaj nowe pozycje do swoich planów treningowych.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddExerciseModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all shrink-0 cursor-pointer"
          id="btn-manager-add-exercise"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj Nowe Ćwiczenie</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj po nazwie ćwiczenia lub uwagach..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Week Filter */}
          <select
            value={selectedWeekFilter}
            onChange={(e) => setSelectedWeekFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Wszystkie tygodnie</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Table / Card Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Brak ćwiczeń spełniających kryteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Zmień filtry wyszukiwania lub użyj przycisku powyżej, aby dodać nowe ćwiczenie do wybranego dnia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map(({ exercise, weekName, dayName }) => {
            const e1rm = calculate1RM(exercise.weight, exercise.reps);
            const volume = calculateVolume(exercise.sets, exercise.reps, exercise.weight);

            return (
              <div
                key={exercise.id}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Context Header */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2">
                    <span className="truncate max-w-[170px]">{weekName}</span>
                    <span className="text-emerald-400 font-bold truncate max-w-[120px]">{dayName.split('-')[0]}</span>
                  </div>

                  {/* Title & Category */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {exercise.name}
                    </h4>
                    {exercise.category && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-mono font-bold shrink-0">
                        {exercise.category}
                      </span>
                    )}
                  </div>

                  {/* Parameters Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/70 mb-3 text-center">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block">SERIE</span>
                      <span className="font-mono font-black text-white text-xs">{exercise.sets}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block">POWT.</span>
                      <span className="font-mono font-black text-white text-xs">{exercise.reps}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block">CIĘŻAR</span>
                      <span className="font-mono font-black text-emerald-400 text-xs">
                        {exercise.weight} {unit}
                      </span>
                    </div>
                  </div>

                  {/* 1RM & Volume */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1 pb-2">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-emerald-400" />
                      <span>1RM: {e1rm} {unit}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-sky-400" />
                      <span>Tonaż: {volume} {unit}</span>
                    </span>
                  </div>

                  {/* Notes snippet if present */}
                  {exercise.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950/40 rounded-lg p-2 border border-slate-850 mb-2 truncate">
                      "{exercise.notes}"
                    </p>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onDeleteExercise(exercise.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Usuń ćwiczenie z planu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenEditExerciseModal(exercise)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edytuj</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
