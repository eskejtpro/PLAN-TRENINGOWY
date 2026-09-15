export const REQUIREMENTS_TXT = `# GymTracker Pro - Zaleznosci PIP dla nowoczesnego interfejsu (Windows 10/11 x64)
# Zapewnia nowoczesny ciemny motyw, zaokraglone karty, wykresy analityczne i wsparcie EXE

# Glowny silnik nowoczesnego GUI (ciemny motyw, zaokraglone karty, nowoczesne przyciski i okna)
customtkinter>=5.2.0

# Wykresy analityczne w wysokiej rozdzielczosci z wygladzeniem linii (progresja silowa, tonaz)
matplotlib>=3.8.0

# Obsluga grafiki, ikon wektorowych i wysokiego DPI
pillow>=10.0.0

# Kompilator calego programu do pojedynczego pliku wykonywalnego Windows (.EXE)
pyinstaller>=6.4.0
`;

export const INSTALL_BAT_CODE = `@echo off
chcp 65001 >nul
title GymTracker Pro - Instalator Srodowiska i Nowoczesnego GUI
echo =====================================================================
echo    GymTracker Pro - Automatyczny Instalator Bibliotek PIP
echo =====================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [BLAD] Python nie jest zainstalowany lub nie zostal dodany do zmiennej PATH!
    echo Zainstaluj Pythona ze strony: https://www.python.org/downloads/
    echo PAMIETAJ: zaznacz opcje "Add python.exe to PATH" podczas instalacji.
    pause
    exit /b 1
)

echo [1/3] Aktualizacja menedzera pakietow pip...
python -m pip install --upgrade pip

echo.
echo [2/3] Instalacja nowoczesnych bibliotek GUI z requirements.txt...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo [INFO] Proba bezposredniej instalacji kluczowych pakietow...
    pip install customtkinter matplotlib pillow pyinstaller
)

echo.
echo [3/3] Srodowisko gotowe! Uruchamianie GymTracker Pro z nowoczesnym GUI...
echo.
python gym_tracker.py

pause
`;

export const BAT_SCRIPT_CODE = `@echo off
chcp 65001 >nul
title GymTracker Pro - Kompilator EXE dla Windows 10/11 x64
echo =====================================================================
echo    GymTracker Pro - Kompilator do pojedynczego pliku (.EXE)
echo =====================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [BLAD] Python nie jest zainstalowany lub nie jest dodany do PATH!
    echo Zainstaluj Python z https://www.python.org i zaznacz "Add Python to PATH".
    pause
    exit /b 1
)

echo [1/3] Sprawdzanie i weryfikacja bibliotek PIP (requirements.txt)...
pip install -r requirements.txt

echo.
echo [2/3] Kompilacja GymTracker Pro do pojedynczego pliku .EXE...
:: --noconsole        : Ukrywa czarne okno terminala cmd, pozostawiajac tylko czyste GUI
:: --onefile          : Pakuje caly program ze wszystkimi zasobami do jednego pliku .exe
:: --clean            : Czysci cache przed budowaniem
:: --collect-all customtkinter : Zapewnia dolaczenie styli, fontow i zasobow customtkinter
pyinstaller --noconsole --onefile --clean --collect-all customtkinter --name "GymTrackerPro" gym_tracker.py

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [SUKCES] Aplikacja zostala zbudowana pomyslnie!
    echo Plik wykonywalny znajduje sie w folderze:
    echo   dist\\GymTrackerPro.exe
    echo =====================================================================
    echo.
    echo Mozesz teraz przeniesc plik GymTrackerPro.exe na Pulpit lub pendrive.
    echo Dane uzytkownika beda bezpiecznie zapisywane w %%LOCALAPPDATA%%\\GymTracker\\workout_data.json
) else (
    echo.
    echo [BLAD] Wystapil blad podczas budowania pliku EXE.
)

pause`;

export const PYTHON_SOURCE_CODE = `"""
GymTracker - Dziennik i Plan Treningowy dla Windows 10/11 x64
=============================================================
Aplikacja desktopowa w Pythonie (Tkinter + ttk + Canvas) do:
 - Zarządzania planem treningowym (tygodnie, dni tygodnia, ćwiczenia)
 - Edycji i śledzenia progresu ciężaru (+2.5 kg, +5 kg, kalkulator 1RM)
 - Analizy statystyk (objętość treningowa, wykres progresu na Canvas)
 - Śledzenia wagi ciała użytkownika z historią
 - Trwałego zapisu danych w pliku JSON w katalogu %LOCALAPPDATA%

Zgodność: Windows 10/11 x64, Python 3.8+
Brak zewnętrznych zależności pip (tylko biblioteka standardowa Python!)
Możliwość skompilowania do pliku EXE za pomocą PyInstaller.
"""

import os
import sys
import json
import math
import ctypes
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

# --- Windows 10/11 DPI Awareness ---
def enable_windows_dpi_awareness():
    """Włącza obsługę wysokiego DPI na Windows 10/11, zapobiegając rozmyciu czcionek."""
    if sys.platform == "win32":
        try:
            # Per-monitor DPI awareness (Windows 8.1+)
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            try:
                # Fallback dla starszych wersji Windows
                ctypes.windll.user32.SetProcessDPIAware()
            except Exception:
                pass

# --- Ścieżki systemowe Windows ---
def get_app_data_dir() -> str:
    """Zwraca bezpieczną ścieżkę do danych w %LOCALAPPDATA% na Windows lub fallback."""
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data and os.path.isdir(local_app_data):
        app_dir = os.path.join(local_app_data, "GymTracker")
    else:
        # Fallback do katalogu domowego
        home_dir = os.path.expanduser("~")
        app_dir = os.path.join(home_dir, ".gymtracker")
    
    os.makedirs(app_dir, exist_ok=True)
    return app_dir

def get_default_data_path() -> str:
    return os.path.join(get_app_data_dir(), "workout_data.json")

# --- Model i Domyślne Dane Treningowe ---
def create_default_data() -> dict:
    return {
        "settings": {
            "unit": "kg",
            "athlete_name": "Zawodnik",
            "auto_save": True,
            "theme": "dark"
        },
        "weeks": [
            {
                "id": "week-1",
                "number": 1,
                "name": "Tydzień 1 - Start Cyklu",
                "days": [
                    {
                        "id": "w1-d1",
                        "name": "Poniedziałek - Push (Klatka / Barki / Triceps)",
                        "completed": True,
                        "exercises": [
                            {
                                "name": "Wyciskanie sztangi leżąc",
                                "sets": 4,
                                "reps": 8,
                                "weight": 85.0,
                                "rpe": 8.0,
                                "notes": "Pauza na klatce",
                                "history": [
                                    {"date": "2026-08-18", "weight": 80.0, "reps": 8, "sets": 4},
                                    {"date": "2026-08-25", "weight": 82.5, "reps": 8, "sets": 4},
                                    {"date": "2026-09-01", "weight": 85.0, "reps": 8, "sets": 4}
                                ]
                            },
                            {
                                "name": "Wyciskanie hantli skos",
                                "sets": 3,
                                "reps": 10,
                                "weight": 30.0,
                                "rpe": 8.5,
                                "notes": "Kąt 30 stopni",
                                "history": [
                                    {"date": "2026-08-18", "weight": 26.0, "reps": 10, "sets": 3},
                                    {"date": "2026-08-25", "weight": 28.0, "reps": 10, "sets": 3},
                                    {"date": "2026-09-01", "weight": 30.0, "reps": 10, "sets": 3}
                                ]
                            },
                            {
                                "name": "Wznosy bokiem",
                                "sets": 4,
                                "reps": 12,
                                "weight": 12.5,
                                "rpe": 9.0,
                                "notes": "Bez bujania tułowiem",
                                "history": [
                                    {"date": "2026-08-18", "weight": 10.0, "reps": 12, "sets": 4},
                                    {"date": "2026-08-25", "weight": 12.0, "reps": 12, "sets": 4},
                                    {"date": "2026-09-01", "weight": 12.5, "reps": 12, "sets": 4}
                                ]
                            }
                        ]
                    },
                    {
                        "id": "w1-d2",
                        "name": "Środa - Pull (Plecy / Tył barku / Biceps)",
                        "completed": False,
                        "exercises": [
                            {
                                "name": "Martwy ciąg klasyczny",
                                "sets": 4,
                                "reps": 5,
                                "weight": 140.0,
                                "rpe": 8.5,
                                "notes": "Pasek i kreda",
                                "history": [
                                    {"date": "2026-08-20", "weight": 130.0, "reps": 5, "sets": 4},
                                    {"date": "2026-08-27", "weight": 135.0, "reps": 5, "sets": 4},
                                    {"date": "2026-09-03", "weight": 140.0, "reps": 5, "sets": 4}
                                ]
                            },
                            {
                                "name": "Podciąganie nachwytem",
                                "sets": 3,
                                "reps": 8,
                                "weight": 0.0,
                                "rpe": 8.0,
                                "notes": "Masa własna",
                                "history": [
                                    {"date": "2026-08-20", "weight": 0.0, "reps": 6, "sets": 3},
                                    {"date": "2026-08-27", "weight": 0.0, "reps": 7, "sets": 3},
                                    {"date": "2026-09-03", "weight": 0.0, "reps": 8, "sets": 3}
                                ]
                            }
                        ]
                    },
                    {
                        "id": "w1-d3",
                        "name": "Piątek - Legs (Przysiad / Dwugłowe / Łydki)",
                        "completed": False,
                        "exercises": [
                            {
                                "name": "Przysiad ze sztangą (Squat)",
                                "sets": 4,
                                "reps": 6,
                                "weight": 115.0,
                                "rpe": 8.0,
                                "notes": "Głęboki przysiad",
                                "history": [
                                    {"date": "2026-08-22", "weight": 105.0, "reps": 6, "sets": 4},
                                    {"date": "2026-08-29", "weight": 110.0, "reps": 6, "sets": 4},
                                    {"date": "2026-09-05", "weight": 115.0, "reps": 6, "sets": 4}
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "body_weights": [
            {"date": "2026-08-15", "weight": 82.0, "notes": "Na czczo rano"},
            {"date": "2026-08-22", "weight": 81.5, "notes": "Po cardio"},
            {"date": "2026-08-29", "weight": 81.0, "notes": "Stabilnie"},
            {"date": "2026-09-05", "weight": 80.6, "notes": "Lepsza definicja"},
            {"date": "2026-09-12", "weight": 80.2, "notes": "Waga optymalna"}
        ]
    }

# --- Zarządzanie Zapisem i Odczytem JSON (StorageService) ---
class StorageService:
    def __init__(self, filepath: str = None):
        self.filepath = filepath or get_default_data_path()

    def load(self) -> dict:
        """Bezpieczne wczytywanie danych z JSON z obsługą błędów i kopią zapasową."""
        if not os.path.exists(self.filepath):
            data = create_default_data()
            self.save(data)
            return data
        
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            backup_path = self.filepath + ".corrupted.bak"
            try:
                if os.path.exists(self.filepath):
                    os.replace(self.filepath, backup_path)
            except Exception:
                pass
            print(f"[Ostrzeżenie] Nie udało się wczytać JSON ({e}). Utworzono kopię zapasową: {backup_path}")
            data = create_default_data()
            self.save(data)
            return data

    def create_backup(self, data: dict, trigger: str = "auto") -> str:
        """Utwórz automatyczną kopię zapasową pliku JSON w wybranym folderze dyskowym."""
        try:
            settings = data.get("settings", {})
            backup_folder = settings.get("backup_folder_path")
            if not backup_folder:
                backup_folder = os.path.join(get_app_data_dir(), "Backups")
            
            os.makedirs(backup_folder, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"workout_backup_{trigger}_{timestamp}.json"
            backup_filepath = os.path.join(backup_folder, filename)
            
            temp_path = backup_filepath + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, backup_filepath)
            
            # Rotacja kopii zapasowych (max_backup_files)
            max_files = settings.get("max_backup_files", 15)
            try:
                files = [os.path.join(backup_folder, f) for f in os.listdir(backup_folder) if f.startswith("workout_backup_") and f.endswith(".json")]
                files.sort(key=os.path.getmtime)
                while len(files) > max_files:
                    oldest = files.pop(0)
                    os.remove(oldest)
            except Exception:
                pass
                
            print(f"[Auto-Backup] Pomyślnie utworzono kopię zapasową: {backup_filepath}")
            return backup_filepath
        except Exception as e:
            print(f"[Błąd Auto-Backup] Nie udało się utworzyć kopii zapasowej: {e}")
            return ""

    def save(self, data: dict) -> bool:
        """Bezpieczny, atomowy zapis pliku na dysku Windows."""
        temp_path = self.filepath + ".tmp"
        try:
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, self.filepath)

            # Automatyczne tworzenie kopii zapasowej przy każdym zapisie danych
            settings = data.get("settings", {})
            if settings.get("auto_backup_enabled", True) and settings.get("backup_on_save", True):
                self.create_backup(data, trigger="save")

            return True
        except Exception as e:
            print(f"[Błąd] Zapis nie powiódł się: {e}")
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
            return False

# --- Główny Interfejs Użytkownika Tkinter ---
class GymTrackerApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("GymTracker Pro - Dziennik & Plan Treningowy [Windows 10/11 x64]")
        self.root.geometry("1080x720")
        self.root.minsize(860, 560)

        # Rejestracja zdarzenia zamknięcia okna dla automatycznego backupu na wyjściu
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

        self.storage = StorageService()
        self.data = self.storage.load()

        self.style = ttk.Style()
        self.style.theme_use("clam")
        self.setup_theme()

        self.create_widgets()
        self.load_week_options()
        self.refresh_plan_view()

    def on_closing(self):
        """Obsługa zamknięcia okna aplikacji - automatyczna kopia zapasowa na wyjściu."""
        try:
            settings = self.data.get("settings", {})
            if settings.get("auto_backup_enabled", True) and settings.get("backup_on_close", True):
                self.storage.create_backup(self.data, trigger="exit")
        except Exception as e:
            print(f"[Błąd wyjścia] {e}")
        self.root.destroy()

    def setup_theme(self):
        """Konfiguracja nowoczesnej palety barw Windows Dark Mode."""
        self.bg_color = "#18181b"       # Zinc-900
        self.card_bg = "#27272a"        # Zinc-800
        self.accent_color = "#3b82f6"   # Blue-500
        self.accent_hover = "#2563eb"   # Blue-600
        self.text_color = "#f4f4f5"     # Zinc-100
        self.text_muted = "#a1a1aa"     # Zinc-400
        self.border_color = "#3f3f46"   # Zinc-700
        self.success_color = "#10b981"  # Emerald-500

        self.root.configure(bg=self.bg_color)
        
        self.style.configure(".", background=self.bg_color, foreground=self.text_color, font=("Segoe UI", 10))
        self.style.configure("TNotebook", background=self.bg_color, borderwidth=0)
        self.style.configure("TNotebook.Tab", background=self.card_bg, foreground=self.text_color, padding=[14, 8], font=("Segoe UI", 10, "bold"))
        self.style.map("TNotebook.Tab", background=[("selected", self.accent_color)], foreground=[("selected", "#ffffff")])
        
        self.style.configure("Treeview", background=self.card_bg, foreground=self.text_color, fieldbackground=self.card_bg, rowheight=30, bordercolor=self.border_color)
        self.style.configure("Treeview.Heading", background="#3f3f46", foreground="#ffffff", font=("Segoe UI", 10, "bold"))
        self.style.map("Treeview", background=[("selected", "#1e3a8a")])

    def create_widgets(self):
        header = tk.Frame(self.root, bg=self.card_bg, height=54, highlightthickness=1, highlightbackground=self.border_color)
        header.pack(fill="x", side="top")
        
        lbl_title = tk.Label(header, text="🏋️ GymTracker Pro", font=("Segoe UI", 14, "bold"), fg=self.text_color, bg=self.card_bg)
        lbl_title.pack(side="left", padx=16, pady=10)

        lbl_athlete = tk.Label(header, text=f"Zawodnik: {self.data['settings'].get('athlete_name', 'Użytkownik')} | Baza: {self.data['settings'].get('unit', 'kg')}", 
                               font=("Segoe UI", 9), fg=self.text_muted, bg=self.card_bg)
        lbl_athlete.pack(side="left", padx=8)

        btn_save = tk.Button(header, text="💾 Zapisz dane (Ctrl+S)", bg=self.accent_color, fg="#ffffff", activebackground=self.accent_hover,
                             font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=4, cursor="hand2", command=self.save_data)
        btn_save.pack(side="right", padx=16, pady=10)
        self.root.bind("<Control-s>", lambda e: self.save_data())

        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=14, pady=10)

        self.tab_plan = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_plan, text="📅 Plan Treningowy & Ciężary")
        self.build_plan_tab()

        self.tab_stats = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_stats, text="📈 Analiza Progresu & 1RM")
        self.build_stats_tab()

        self.tab_muscle = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_muscle, text="💪 Analiza Partii & Drążek")
        self.build_muscle_tab()

        self.tab_weight = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_weight, text="⚖️ Rejestr Wagi Ciała")
        self.build_weight_tab()

        self.tab_settings = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_settings, text="⚙️ Ustawienia & Ścieżka Windows")
        self.build_settings_tab()

        self.notebook.bind("<<NotebookTabChanged>>", lambda e: self.on_notebook_tab_changed())

        self.status_bar = tk.Label(self.root, text=f"Ścieżka danych: {self.storage.filepath} | Gotowy do treningu", 
                                   bd=1, relief="sunken", anchor="w", bg=self.card_bg, fg=self.text_muted, font=("Segoe UI", 9))
        self.status_bar.pack(side="bottom", fill="x")

    def build_plan_tab(self):
        ctrl_frame = tk.Frame(self.tab_plan, bg=self.card_bg, padx=12, pady=10, highlightthickness=1, highlightbackground=self.border_color)
        ctrl_frame.pack(fill="x", pady=(0, 10))

        tk.Label(ctrl_frame, text="Tydzień:", font=("Segoe UI", 10, "bold"), fg=self.text_color, bg=self.card_bg).pack(side="left", padx=(0, 6))
        self.cb_weeks = ttk.Combobox(ctrl_frame, state="readonly", width=26)
        self.cb_weeks.pack(side="left", padx=6)
        self.cb_weeks.bind("<<ComboboxSelected>>", self.on_week_selected)

        btn_add_week = tk.Button(ctrl_frame, text="+ Nowy Tydzień", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=8, pady=2, command=self.add_new_week)
        btn_add_week.pack(side="left", padx=6)

        tk.Label(ctrl_frame, text="Dzień:", font=("Segoe UI", 10, "bold"), fg=self.text_color, bg=self.card_bg).pack(side="left", padx=(16, 6))
        self.cb_days = ttk.Combobox(ctrl_frame, state="readonly", width=34)
        self.cb_days.pack(side="left", padx=6)
        self.cb_days.bind("<<ComboboxSelected>>", self.on_day_selected)

        btn_add_day = tk.Button(ctrl_frame, text="+ Dodaj Dzień", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=8, pady=2, command=self.add_new_day)
        btn_add_day.pack(side="left", padx=6)

        btn_finish_day_top = tk.Button(ctrl_frame, text="🎉 ZAKOŃCZ TRENING", bg="#10b981", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=2, command=self.finish_current_day)
        btn_finish_day_top.pack(side="right", padx=6)

        main_content = tk.Frame(self.tab_plan, bg=self.bg_color)
        main_content.pack(fill="both", expand=True)

        left_content = tk.Frame(main_content, bg=self.bg_color)
        left_content.pack(side="left", fill="both", expand=True, padx=(0, 8))

        table_frame = tk.Frame(left_content, bg=self.card_bg, highlightthickness=1, highlightbackground=self.border_color)
        table_frame.pack(fill="both", expand=True)

        columns = ("name", "sets", "reps", "weight", "1rm", "volume", "rpe", "notes")
        self.tree_exercises = ttk.Treeview(table_frame, columns=columns, show="headings", selectmode="browse")
        
        self.tree_exercises.heading("name", text="Ćwiczenie")
        self.tree_exercises.heading("sets", text="Serie")
        self.tree_exercises.heading("reps", text="Powtórzenia")
        self.tree_exercises.heading("weight", text="Ciężar (kg)")
        self.tree_exercises.heading("1rm", text="Szac. 1RM")
        self.tree_exercises.heading("volume", text="Objętość")
        self.tree_exercises.heading("rpe", text="RPE")
        self.tree_exercises.heading("notes", text="Notatki")

        self.tree_exercises.column("name", width=220)
        self.tree_exercises.column("sets", width=60, anchor="center")
        self.tree_exercises.column("reps", width=90, anchor="center")
        self.tree_exercises.column("weight", width=80, anchor="center")
        self.tree_exercises.column("1rm", width=80, anchor="center")
        self.tree_exercises.column("volume", width=80, anchor="center")
        self.tree_exercises.column("rpe", width=60, anchor="center")
        self.tree_exercises.column("notes", width=140)

        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree_exercises.yview)
        self.tree_exercises.configure(yscrollcommand=scrollbar.set)
        
        self.tree_exercises.pack(side="left", fill="both", expand=True, padx=4, pady=4)
        scrollbar.pack(side="right", fill="y", pady=4)
        self.tree_exercises.bind("<<TreeviewSelect>>", self.on_exercise_selected)
        self.tree_exercises.bind("<Double-1>", lambda e: self.open_edit_exercise_dialog())

        # Frame na Uwagi & Odczucia dnia
        day_notes_frame = tk.LabelFrame(left_content, text="📝 Subiektywne odczucia po treningu i uwagi techniczne", bg=self.card_bg, fg=self.accent_color, font=("Segoe UI", 9, "bold"), padx=8, pady=6, highlightthickness=1, highlightbackground=self.border_color)
        day_notes_frame.pack(fill="x", pady=(8, 0))

        self.txt_day_notes = tk.Text(day_notes_frame, height=3, font=("Segoe UI", 9), bg="#18181b", fg="#ffffff", insertbackground="#ffffff", wrap="word", relief="flat")
        self.txt_day_notes.pack(side="left", fill="both", expand=True, padx=(0, 6))

        btn_save_notes = tk.Button(day_notes_frame, text="💾 Zapisz", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 8, "bold"), relief="flat", padx=10, command=self.save_current_day_notes)
        btn_save_notes.pack(side="right")

        action_frame = tk.Frame(main_content, bg=self.card_bg, width=285, padx=14, pady=12, highlightthickness=1, highlightbackground=self.border_color)
        action_frame.pack(side="right", fill="y")
        action_frame.pack_propagate(False)

        # Prominent Finish Day button AT THE TOP of action frame
        btn_finish_day = tk.Button(action_frame, text="🎉 ZAKOŃCZ TRENING NA DZIŚ", bg="#10b981", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=6, command=self.finish_current_day)
        btn_finish_day.pack(fill="x", pady=(0, 8))

        tk.Frame(action_frame, height=1, bg=self.border_color).pack(fill="x", pady=4)

        tk.Label(action_frame, text="⚡ Rejestracja Wyniku", font=("Segoe UI", 11, "bold"), fg=self.accent_color, bg=self.card_bg).pack(anchor="w", pady=(0, 4))
        
        self.lbl_selected_ex = tk.Label(action_frame, text="Wybierz ćwiczenie z tabeli", font=("Segoe UI", 9, "italic"), fg=self.text_muted, bg=self.card_bg, wraplength=255)
        self.lbl_selected_ex.pack(anchor="w", pady=(0, 8))

        # Serie (Sets)
        tk.Label(action_frame, text="Wykonane Serie:", font=("Segoe UI", 9, "bold"), fg=self.text_color, bg=self.card_bg).pack(anchor="w", pady=(2, 1))
        f_sets = tk.Frame(action_frame, bg=self.card_bg)
        f_sets.pack(fill="x", pady=2)
        tk.Button(f_sets, text="-1", bg="#3f3f46", fg="#ffffff", font=("Segoe UI", 8, "bold"), width=3, relief="flat", command=lambda: self.adjust_sets_entry(-1)).pack(side="left")
        self.entry_sets = tk.Entry(f_sets, font=("Segoe UI", 10, "bold"), justify="center", bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_sets.pack(side="left", fill="x", expand=True, padx=4)
        self.entry_sets.insert(0, "4")
        tk.Button(f_sets, text="+1", bg="#3f3f46", fg="#ffffff", font=("Segoe UI", 8, "bold"), width=3, relief="flat", command=lambda: self.adjust_sets_entry(1)).pack(side="right")

        # Powtórzenia (Reps)
        tk.Label(action_frame, text="Powtórzenia w serii:", font=("Segoe UI", 9, "bold"), fg=self.text_color, bg=self.card_bg).pack(anchor="w", pady=(4, 1))
        f_reps = tk.Frame(action_frame, bg=self.card_bg)
        f_reps.pack(fill="x", pady=2)
        tk.Button(f_reps, text="-1", bg="#3f3f46", fg="#ffffff", font=("Segoe UI", 8, "bold"), width=3, relief="flat", command=lambda: self.adjust_reps_entry(-1)).pack(side="left")
        self.entry_reps = tk.Entry(f_reps, font=("Segoe UI", 10, "bold"), justify="center", bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_reps.pack(side="left", fill="x", expand=True, padx=4)
        self.entry_reps.insert(0, "8")
        tk.Button(f_reps, text="+1", bg="#3f3f46", fg="#ffffff", font=("Segoe UI", 8, "bold"), width=3, relief="flat", command=lambda: self.adjust_reps_entry(1)).pack(side="right")

        # Ciężar roboczy (Weight)
        tk.Label(action_frame, text="Ciężar roboczy [kg]:", font=("Segoe UI", 9, "bold"), fg=self.text_color, bg=self.card_bg).pack(anchor="w", pady=(4, 1))
        self.entry_weight = tk.Entry(action_frame, font=("Segoe UI", 11, "bold"), justify="center", bg="#18181b", fg="#60a5fa", insertbackground="#ffffff")
        self.entry_weight.pack(fill="x", pady=2)

        # Quick weight adjusters
        quick_grid = tk.Frame(action_frame, bg=self.card_bg)
        quick_grid.pack(fill="x", pady=3)
        tk.Button(quick_grid, text="+2.5", bg="#2563eb", fg="#ffffff", font=("Segoe UI", 8, "bold"), relief="flat", width=6, command=lambda: self.adjust_weight(2.5)).grid(row=0, column=0, padx=1, pady=1)
        tk.Button(quick_grid, text="-2.5", bg="#4b5563", fg="#ffffff", font=("Segoe UI", 8), relief="flat", width=6, command=lambda: self.adjust_weight(-2.5)).grid(row=0, column=1, padx=1, pady=1)
        tk.Button(quick_grid, text="+5.0", bg="#1d4ed8", fg="#ffffff", font=("Segoe UI", 8, "bold"), relief="flat", width=6, command=lambda: self.adjust_weight(5.0)).grid(row=0, column=2, padx=1, pady=1)
        tk.Button(quick_grid, text="-5.0", bg="#4b5563", fg="#ffffff", font=("Segoe UI", 8), relief="flat", width=6, command=lambda: self.adjust_weight(-5.0)).grid(row=0, column=3, padx=1, pady=1)

        # Prominent Save Performance Button
        btn_save_perf = tk.Button(action_frame, text="💾 Zapisz serie, powt. i ciężar", bg=self.success_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=6, command=self.save_exercise_performance)
        btn_save_perf.pack(fill="x", pady=(6, 8))

        tk.Frame(action_frame, height=1, bg=self.border_color).pack(fill="x", pady=4)
        
        btn_new_ex = tk.Button(action_frame, text="+ Dodaj Nowe Ćwiczenie", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=4, command=self.open_add_exercise_dialog)
        btn_new_ex.pack(fill="x", pady=2)

        btn_edit_ex = tk.Button(action_frame, text="✏️ Edytuj Ćwiczenie", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", pady=3, command=self.open_edit_exercise_dialog)
        btn_edit_ex.pack(fill="x", pady=2)

        btn_del_ex = tk.Button(action_frame, text="🗑️ Usuń Ćwiczenie", bg="#ef4444", fg="#ffffff", font=("Segoe UI", 9), relief="flat", pady=3, command=self.delete_selected_exercise)
        btn_del_ex.pack(fill="x", pady=2)

        tk.Frame(action_frame, height=1, bg=self.border_color).pack(fill="x", pady=4)

        btn_finish_day = tk.Button(action_frame, text="🎉 ZAKOŃCZ TRENING NA DZIŚ", bg="#10b981", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=6, command=self.finish_current_day)
        btn_finish_day.pack(fill="x", pady=2)

    def build_stats_tab(self):
        ctrl = tk.Frame(self.tab_stats, bg=self.card_bg, padx=12, pady=10, highlightthickness=1, highlightbackground=self.border_color)
        ctrl.pack(fill="x", pady=(0, 10))

        tk.Label(ctrl, text="Wybierz ćwiczenie do analizy progresu:", font=("Segoe UI", 10, "bold"), fg=self.text_color, bg=self.card_bg).pack(side="left", padx=(0, 8))
        self.cb_stat_exercise = ttk.Combobox(ctrl, state="readonly", width=36)
        self.cb_stat_exercise.pack(side="left", padx=8)
        self.cb_stat_exercise.bind("<<ComboboxSelected>>", self.refresh_stats_chart)

        btn_refresh_chart = tk.Button(ctrl, text="🔄 Odśwież wykres", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9), relief="flat", padx=10, command=self.refresh_stats_chart)
        btn_refresh_chart.pack(side="left", padx=8)

        kpi_frame = tk.Frame(self.tab_stats, bg=self.bg_color)
        kpi_frame.pack(fill="x", pady=(0, 10))

        self.card_max_weight = self.create_kpi_card(kpi_frame, "Aktualny Rekord (Max)", "-- kg")
        self.card_max_1rm = self.create_kpi_card(kpi_frame, "Szacowany 1RM", "-- kg")
        self.card_total_volume = self.create_kpi_card(kpi_frame, "Objętość Całkowita", "-- kg")
        self.card_progress_pct = self.create_kpi_card(kpi_frame, "Przyrost Siły", "-- %")

        chart_container = tk.Frame(self.tab_stats, bg=self.card_bg, highlightthickness=1, highlightbackground=self.border_color)
        chart_container.pack(fill="both", expand=True)

        self.canvas_stats = tk.Canvas(chart_container, bg="#1e1e24", highlightthickness=0)
        self.canvas_stats.pack(fill="both", expand=True, padx=10, pady=10)
        self.canvas_stats.bind("<Configure>", lambda e: self.draw_chart())

    def create_kpi_card(self, parent, title, val):
        card = tk.Frame(parent, bg=self.card_bg, padx=12, pady=8, highlightthickness=1, highlightbackground=self.border_color)
        card.pack(side="left", fill="both", expand=True, padx=4)
        lbl_t = tk.Label(card, text=title, font=("Segoe UI", 9), fg=self.text_muted, bg=self.card_bg)
        lbl_t.pack(anchor="w")
        lbl_v = tk.Label(card, text=val, font=("Segoe UI", 15, "bold"), fg=self.text_color, bg=self.card_bg)
        lbl_v.pack(anchor="w")
        return lbl_v

    def build_muscle_tab(self):
        container = tk.Frame(self.tab_muscle, bg=self.bg_color)
        container.pack(fill="both", expand=True)

        top_bar = tk.Frame(container, bg=self.card_bg, padx=12, pady=10, highlightthickness=1, highlightbackground=self.border_color)
        top_bar.pack(fill="x", pady=(0, 10))

        tk.Label(top_bar, text="Filtruj Partię Mięśniową:", font=("Segoe UI", 10, "bold"), fg=self.text_color, bg=self.card_bg).pack(side="left", padx=(0, 8))
        self.cb_muscle_group = ttk.Combobox(top_bar, state="readonly", width=28, values=[
            "Wszystkie Partie",
            "Klatka Piersiowa",
            "Plecy / Grzbiet",
            "Barki / Naramienne",
            "Biceps",
            "Triceps",
            "Nogi / Dolne partie"
        ])
        self.cb_muscle_group.current(0)
        self.cb_muscle_group.pack(side="left", padx=6)
        self.cb_muscle_group.bind("<<ComboboxSelected>>", lambda e: self.refresh_muscle_tab())

        # Pull-up highlight card
        self.frame_pullup_card = tk.LabelFrame(container, text="🎯 Specjalna Analiza: Podciąganie na drążku (Ciężar + Powtórzenia)", 
                                              bg=self.card_bg, fg=self.accent_color, font=("Segoe UI", 9, "bold"), padx=12, pady=6, highlightthickness=1, highlightbackground=self.border_color)
        self.frame_pullup_card.pack(fill="x", pady=(0, 6))

        self.lbl_pullup_info = tk.Label(self.frame_pullup_card, text="Ładowanie danych podciągania...", font=("Segoe UI", 9), fg=self.text_color, bg=self.card_bg, justify="left")
        self.lbl_pullup_info.pack(anchor="w")

        # Smart Structural Balance (Push vs Pull vs Legs) Card
        self.frame_balance_card = tk.LabelFrame(container, text="🧠 Inteligentna Analiza Balansu: Push / Pull / Legs",
                                                bg=self.card_bg, fg="#38bdf8", font=("Segoe UI", 9, "bold"), padx=12, pady=6, highlightthickness=1, highlightbackground=self.border_color)
        self.frame_balance_card.pack(fill="x", pady=(0, 8))

        self.lbl_balance_info = tk.Label(self.frame_balance_card, text="Analiza proporcji tonażu...", font=("Segoe UI", 9), fg=self.text_color, bg=self.card_bg, justify="left")
        self.lbl_balance_info.pack(anchor="w")

        # Treeview table for muscle progress
        table_box = tk.Frame(container, bg=self.card_bg, highlightthickness=1, highlightbackground=self.border_color)
        table_box.pack(fill="both", expand=True)

        cols = ("partia", "cwiczenie", "start_w", "max_w", "progres", "progres_pct", "szac_1rm", "wyk_serie", "reps")
        self.tree_muscle = ttk.Treeview(table_box, columns=cols, show="headings")
        self.tree_muscle.heading("partia", text="Partia")
        self.tree_muscle.heading("cwiczenie", text="Ćwiczenie")
        self.tree_muscle.heading("start_w", text="Start (kg)")
        self.tree_muscle.heading("max_w", text="Max (kg)")
        self.tree_muscle.heading("progres", text="Progres (kg)")
        self.tree_muscle.heading("progres_pct", text="Progres %")
        self.tree_muscle.heading("szac_1rm", text="Szac. 1RM")
        self.tree_muscle.heading("wyk_serie", text="Serie Wykonane")
        self.tree_muscle.heading("reps", text="Powtórzenia")

        self.tree_muscle.column("partia", width=140)
        self.tree_muscle.column("cwiczenie", width=220)
        self.tree_muscle.column("start_w", width=75, anchor="center")
        self.tree_muscle.column("max_w", width=75, anchor="center")
        self.tree_muscle.column("progres", width=85, anchor="center")
        self.tree_muscle.column("progres_pct", width=80, anchor="center")
        self.tree_muscle.column("szac_1rm", width=85, anchor="center")
        self.tree_muscle.column("wyk_serie", width=100, anchor="center")
        self.tree_muscle.column("reps", width=85, anchor="center")

        scroll = ttk.Scrollbar(table_box, orient="vertical", command=self.tree_muscle.yview)
        self.tree_muscle.configure(yscrollcommand=scroll.set)
        self.tree_muscle.pack(side="left", fill="both", expand=True, padx=4, pady=4)
        scroll.pack(side="right", fill="y", pady=4)

    def get_exercise_muscle_group(self, name, ex=None):
        if ex and ex.get("category"):
            cat_map = {
                "klatka": "Klatka Piersiowa",
                "plecy": "Plecy / Grzbiet",
                "barki": "Barki / Naramienne",
                "biceps": "Biceps",
                "triceps": "Triceps",
                "nogi": "Nogi / Dolne partie"
            }
            if ex.get("category") in cat_map:
                return cat_map[ex.get("category")]

        lower = name.lower()
        if any(k in lower for k in ["klatk", "wyciskan", "ław", "bench", "rozpiętk", "chest"]):
            return "Klatka Piersiowa"
        if any(k in lower for k in ["plec", "martwy", "wiosłow", "drążk", "podciągan", "pull-up", "chin-up", "ściągan", "back", "lat", "row", "deadlift"]):
            return "Plecy / Grzbiet"
        if any(k in lower for k in ["bark", "ohp", "żołnierskie", "wznos", "milit", "shoulder", "press", "face pull"]):
            return "Barki / Naramienne"
        if any(k in lower for k in ["bicep", "uginan", "modlitewnik", "curl", "ramion"]):
            return "Biceps"
        if any(k in lower for k in ["tricep", "francusk", "prostowan", "dipy", "dips", "czacha", "pushdown", "link"]):
            return "Triceps"
        if any(k in lower for k in ["nog", "przysiad", "squat", "suwnic", "wykrok", "rdl", "łydk", "leg", "czworo", "dwugłow"]):
            return "Nogi / Dolne partie"
        return "Klatka Piersiowa"

    def refresh_muscle_tab(self):
        if not hasattr(self, 'tree_muscle'):
            return
        for row in self.tree_muscle.get_children():
            self.tree_muscle.delete(row)

        filter_group = self.cb_muscle_group.get() if hasattr(self, 'cb_muscle_group') else "Wszystkie Partie"

        ex_map = {}
        pull_ups = []

        for week in self.data.get("weeks", []):
            for day in week.get("days", []):
                for ex in day.get("exercises", []):
                    name = ex.get("name", "Bez nazwy")
                    hist = ex.get("history", [])
                    if name not in ex_map:
                        ex_map[name] = {"ex": ex, "history": list(hist)}
                    else:
                        ex_map[name]["history"].extend(hist)
                    
                    lower = name.lower()
                    if any(k in lower for k in ["podciągan", "drążk", "pull-up", "chin-up"]):
                        pull_ups.append(ex)

        # Pull-up info
        if pull_ups:
            best_pu = pull_ups[-1]
            hist_pu = best_pu.get("history", [])
            reps_list = [h.get("reps", 0) for h in hist_pu] if hist_pu else [best_pu.get("reps", 0)]
            weight_list = [h.get("weight", 0) for h in hist_pu] if hist_pu else [best_pu.get("weight", 0)]
            init_r = reps_list[0] if reps_list else 0
            max_r = max(reps_list) if reps_list else 0
            init_w = weight_list[0] if weight_list else 0
            max_w = max(weight_list) if weight_list else 0
            delta_r = max_r - init_r
            delta_w = round(max_w - init_w, 1)

            text_pu = (f"Ćwiczenie: {best_pu.get('name')} | Progres Powtórzeń: {init_r} ➔ {max_r} powt. (+{delta_r} powt.) | "
                       f"Ciężar dodany: {init_w} ➔ {max_w} kg (+{delta_w} kg) | Ostatnia seria: {best_pu.get('sets', 3)}x{best_pu.get('reps', 8)} @ {best_pu.get('weight', 0)} kg")
            self.lbl_pullup_info.config(text=text_pu, fg=self.success_color)
        else:
            self.lbl_pullup_info.config(text="Brak ćwiczenia 'Podciąganie na drążku' w planie. Dodaj je w planie treningowym.", fg=self.text_muted)

        # Calculate Push / Pull / Legs tonnage
        push_vol = 0.0
        pull_vol = 0.0
        legs_vol = 0.0
        for name, item in ex_map.items():
            curr_ex = item["ex"]
            grp = self.get_exercise_muscle_group(name, curr_ex)
            v = curr_ex.get("sets", 3) * curr_ex.get("reps", 8) * curr_ex.get("weight", 0)
            if grp in ["Klatka Piersiowa", "Barki / Naramienne", "Triceps"]:
                push_vol += v
            elif grp in ["Plecy / Grzbiet", "Biceps"]:
                pull_vol += v
            elif grp in ["Nogi / Dolne partie"]:
                legs_vol += v

        total_v = push_vol + pull_vol + legs_vol
        if total_v > 0 and hasattr(self, 'lbl_balance_info'):
            p_push = round((push_vol / total_v) * 100)
            p_pull = round((pull_vol / total_v) * 100)
            p_legs = round((legs_vol / total_v) * 100)
            ratio = round(push_vol / pull_vol, 2) if pull_vol > 0 else 1.0
            stat_txt = "Optymalna równowaga Push:Pull" if 0.8 <= ratio <= 1.3 else ("Przewaga Push (zwiększ plecy)" if ratio > 1.3 else "Przewaga Pull")
            self.lbl_balance_info.config(
                text=f"Tonaż: Push {p_push}% ({int(push_vol):,} kg) | Pull {p_pull}% ({int(pull_vol):,} kg) | Nogi {p_legs}% ({int(legs_vol):,} kg) | Stosunek Push/Pull = {ratio} ({stat_txt})"
            )
        elif hasattr(self, 'lbl_balance_info'):
            self.lbl_balance_info.config(text="Brak zapisanego tonażu serii do obliczenia proporcji.")

        for name, item in ex_map.items():
            curr_ex = item["ex"]
            grp = self.get_exercise_muscle_group(name, curr_ex)
            if filter_group != "Wszystkie Partie" and grp != filter_group:
                continue

            hist = item["history"]
            weights = [h.get("weight", 0) for h in hist] if hist else [curr_ex.get("weight", 0)]
            start_w = weights[0] if weights else 0.0
            max_w = max(weights) if weights else 0.0
            diff = round(max_w - start_w, 1)
            pct = round((diff / start_w) * 100, 1) if start_w > 0 else 0.0
            reps = curr_ex.get("reps", 8)
            one_rm = round(max_w * (1 + reps / 30), 1) if reps > 1 else max_w
            exec_sets = sum([h.get("sets", curr_ex.get("sets", 3)) for h in hist]) if hist else (curr_ex.get("sets", 3) if curr_ex.get("completed") else 0)

            self.tree_muscle.insert("", "end", values=(
                grp,
                name,
                f"{start_w:.1f}",
                f"{max_w:.1f}",
                f"+{diff:.1f}" if diff > 0 else f"{diff:.1f}",
                f"+{pct:.1f}%" if pct > 0 else f"{pct:.1f}%",
                f"{one_rm:.1f}",
                f"{exec_sets} serii",
                f"{reps} powt."
            ))

    def build_weight_tab(self):
        container = tk.Frame(self.tab_weight, bg=self.bg_color)
        container.pack(fill="both", expand=True)

        form = tk.Frame(container, bg=self.card_bg, width=320, padx=14, pady=12, highlightthickness=1, highlightbackground=self.border_color)
        form.pack(side="left", fill="y", padx=(0, 10))
        form.pack_propagate(False)

        tk.Label(form, text="⚖️ Nowy Pomiar Wagi", font=("Segoe UI", 12, "bold"), fg=self.accent_color, bg=self.card_bg).pack(anchor="w", pady=(0, 10))

        tk.Label(form, text="Data (YYYY-MM-DD):", font=("Segoe UI", 9), fg=self.text_color, bg=self.card_bg).pack(anchor="w", pady=(4, 2))
        self.entry_bw_date = tk.Entry(form, font=("Segoe UI", 10), bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_bw_date.insert(0, datetime.now().strftime("%Y-%m-%d"))
        self.entry_bw_date.pack(fill="x", pady=2)

        tk.Label(form, text="Waga ciała [kg]:", font=("Segoe UI", 9), fg=self.text_color, bg=self.card_bg).pack(anchor="w", pady=(8, 2))
        self.entry_bw_val = tk.Entry(form, font=("Segoe UI", 10), bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_bw_val.pack(fill="x", pady=2)

        tk.Label(form, text="Notatki (np. na czczo):", font=("Segoe UI", 9), fg=self.text_color, bg=self.card_bg).pack(anchor="w", pady=(8, 2))
        self.entry_bw_notes = tk.Entry(form, font=("Segoe UI", 10), bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_bw_notes.pack(fill="x", pady=2)

        btn_add_bw = tk.Button(form, text="+ Zapisz pomiar wagi", bg=self.success_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=6, command=self.add_body_weight_entry)
        btn_add_bw.pack(fill="x", pady=(14, 6))

        btn_del_bw = tk.Button(form, text="🗑️ Usuń zaznaczony wpis", bg="#ef4444", fg="#ffffff", font=("Segoe UI", 9), relief="flat", pady=4, command=self.delete_body_weight_entry)
        btn_del_bw.pack(fill="x", pady=4)

        table_box = tk.Frame(container, bg=self.card_bg, highlightthickness=1, highlightbackground=self.border_color)
        table_box.pack(side="right", fill="both", expand=True)

        cols = ("date", "weight", "change", "notes")
        self.tree_weight = ttk.Treeview(table_box, columns=cols, show="headings")
        self.tree_weight.heading("date", text="Data pomiaru")
        self.tree_weight.heading("weight", text="Waga (kg)")
        self.tree_weight.heading("change", text="Zmiana")
        self.tree_weight.heading("notes", text="Uwagi / Pora dnia")

        self.tree_weight.column("date", width=120, anchor="center")
        self.tree_weight.column("weight", width=100, anchor="center")
        self.tree_weight.column("change", width=100, anchor="center")
        self.tree_weight.column("notes", width=260)

        bw_scroll = ttk.Scrollbar(table_box, orient="vertical", command=self.tree_weight.yview)
        self.tree_weight.configure(yscrollcommand=bw_scroll.set)

        self.tree_weight.pack(side="left", fill="both", expand=True, padx=4, pady=4)
        bw_scroll.pack(side="right", fill="y", pady=4)
        self.refresh_weight_table()

    def build_settings_tab(self):
        container = tk.Frame(self.tab_settings, bg=self.card_bg, padx=16, pady=16, highlightthickness=1, highlightbackground=self.border_color)
        container.pack(fill="both", expand=True)

        tk.Label(container, text="⚙️ Konfiguracja Programu na Windows", font=("Segoe UI", 13, "bold"), fg=self.accent_color, bg=self.card_bg).pack(anchor="w", pady=(0, 12))

        tk.Label(container, text="Ścieżka do bazy JSON na Windows:", font=("Segoe UI", 10, "bold"), fg=self.text_color, bg=self.card_bg).pack(anchor="w")
        
        path_box = tk.Frame(container, bg=self.card_bg)
        path_box.pack(fill="x", pady=(4, 12))
        
        self.entry_path = tk.Entry(path_box, font=("Segoe UI", 10), bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_path.insert(0, self.storage.filepath)
        self.entry_path.pack(side="left", fill="x", expand=True, padx=(0, 8))

        btn_browse = tk.Button(path_box, text="Wybierz plik...", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=10, command=self.browse_json_path)
        btn_browse.pack(side="right")

        btn_row = tk.Frame(container, bg=self.card_bg)
        btn_row.pack(fill="x", pady=8)

        btn_export = tk.Button(btn_row, text="📤 Eksportuj kopię JSON", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=6, command=self.export_json_backup)
        btn_export.pack(side="left", padx=(0, 8))

        btn_import = tk.Button(btn_row, text="📥 Importuj plik JSON", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=12, pady=6, command=self.import_json_data)
        btn_import.pack(side="left", padx=8)

        btn_open_folder = tk.Button(btn_row, text="📂 Otwórz folder w Eksploratorze Windows", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=12, pady=6, command=self.open_data_folder_windows)
        btn_open_folder.pack(side="left", padx=8)

        tk.Frame(container, height=1, bg=self.border_color).pack(fill="x", pady=16)
        
        info_text = (
            "📌 Architektura Windows 10/11 x64:\\n"
            " • Dane są przechowywane bezpiecznie w %LOCALAPPDATA%\\\\GymTracker\\\\workout_data.json\\n"
            " • Program jest w pełni autonomiczny i nie zależy od bieżącego katalogu roboczego (CWD)\\n"
            " • Skompilowanie do pliku wykonywalnego .EXE za pomocą PyInstaller:\\n"
            "   pyinstaller --noconsole --onefile gym_tracker.py\\n"
            " • Obsługa DPI: Automatyczne skalowanie interfejsu (Shcore.dll / SetProcessDpiAwareness)"
        )
        tk.Label(container, text=info_text, justify="left", font=("Segoe UI", 9), fg=self.text_muted, bg="#18181b", padx=12, pady=10, relief="solid", bd=1).pack(fill="x", pady=8)

    def load_week_options(self):
        weeks = self.data.get("weeks", [])
        week_titles = [w.get("name", f"Tydzień {w.get('number', i+1)}") for i, w in enumerate(weeks)]
        self.cb_weeks["values"] = week_titles
        if week_titles:
            self.cb_weeks.current(0)
            self.on_week_selected()

    def on_week_selected(self, event=None):
        w_idx = self.cb_weeks.current()
        if w_idx < 0 or w_idx >= len(self.data["weeks"]):
            return
        
        week = self.data["weeks"][w_idx]
        days = week.get("days", [])
        day_titles = [d.get("name", f"Dzień {i+1}") for i, d in enumerate(days)]
        self.cb_days["values"] = day_titles
        if day_titles:
            self.cb_days.current(0)
        else:
            self.cb_days.set("")
        self.on_day_selected()

    def on_day_selected(self, event=None):
        self.refresh_plan_view()

    def get_current_day(self):
        w_idx = self.cb_weeks.current()
        d_idx = self.cb_days.current()
        if w_idx < 0 or d_idx < 0:
            return None
        try:
            return self.data["weeks"][w_idx]["days"][d_idx]
        except (IndexError, KeyError):
            return None

    def refresh_plan_view(self):
        for row in self.tree_exercises.get_children():
            self.tree_exercises.delete(row)

        day = self.get_current_day()
        if not day:
            return

        exercises = day.get("exercises", [])
        for i, ex in enumerate(exercises):
            w = float(ex.get("weight", 0))
            r = int(ex.get("reps", 0))
            s = int(ex.get("sets", 0))
            
            one_rm = round(w * (1 + r / 30), 1) if r > 1 else w
            volume = int(w * r * s)

            self.tree_exercises.insert("", "end", iid=str(i), values=(
                ex.get("name", "Bez nazwy"),
                s,
                r,
                f"{w:.1f}",
                f"{one_rm:.1f}",
                volume,
                ex.get("rpe", "-"),
                ex.get("notes", "")
            ))

        self.update_exercise_list_for_stats()
        self.refresh_muscle_tab()

        if hasattr(self, 'txt_day_notes'):
            self.txt_day_notes.delete("1.0", tk.END)
            self.txt_day_notes.insert("1.0", day.get("notes", ""))

    def on_notebook_tab_changed(self):
        self.refresh_muscle_tab()
        self.update_weight_tab()
        self.draw_chart()

    def save_current_day_notes(self):
        day = self.get_current_day()
        if not day or not hasattr(self, 'txt_day_notes'):
            return
        notes = self.txt_day_notes.get("1.0", "end-1c").strip()
        day["notes"] = notes
        self.save_data()
        self.status_bar.config(text=f"✓ Zapisano uwagi dla dnia: {day.get('name', '')}")

    def finish_current_day(self):
        day = self.get_current_day()
        if not day:
            messagebox.showwarning("Uwaga", "Brak wybranego dnia treningowego.")
            return
        day["completed"] = True
        self.save_current_day_notes()
        today = datetime.now().strftime("%Y-%m-%d")
        for ex in day.get("exercises", []):
            hist = ex.setdefault("history", [])
            has_today = any(h.get("date") == today for h in hist)
            if not has_today:
                hist.append({
                    "date": today,
                    "weight": ex.get("weight", 0),
                    "reps": ex.get("reps", 0),
                    "sets": ex.get("sets", 0)
                })
        self.save_data()
        self.refresh_plan_view()
        messagebox.showinfo("Sukces 🎉", f"Trening '{day.get('name', '')}' został oznaczony jako WYKONANY i zapisany w historii!")

    def on_exercise_selected(self, event=None):
        selected = self.tree_exercises.selection()
        if not selected:
            self.lbl_selected_ex.config(text="Wybierz ćwiczenie z tabeli")
            return
        
        idx = int(selected[0])
        day = self.get_current_day()
        if not day or idx >= len(day["exercises"]):
            return
        
        ex = day["exercises"][idx]
        name = ex.get("name", "")
        weight = ex.get("weight", 0.0)
        sets = ex.get("sets", 4)
        reps = ex.get("reps", 8)
        self.lbl_selected_ex.config(text=f"Wybrano: {name} ({sets}s x {reps}p @ {weight} kg)")
        
        self.entry_sets.delete(0, tk.END)
        self.entry_sets.insert(0, str(sets))

        self.entry_reps.delete(0, tk.END)
        self.entry_reps.insert(0, str(reps))

        self.entry_weight.delete(0, tk.END)
        self.entry_weight.insert(0, str(weight))

    def adjust_sets_entry(self, delta: int):
        try:
            curr = int(self.entry_sets.get())
        except ValueError:
            curr = 4
        new_val = max(1, min(30, curr + delta))
        self.entry_sets.delete(0, tk.END)
        self.entry_sets.insert(0, str(new_val))

    def adjust_reps_entry(self, delta: int):
        try:
            curr = int(self.entry_reps.get())
        except ValueError:
            curr = 8
        new_val = max(1, min(100, curr + delta))
        self.entry_reps.delete(0, tk.END)
        self.entry_reps.insert(0, str(new_val))

    def adjust_weight(self, delta: float):
        try:
            current_w = float(self.entry_weight.get().replace(",", "."))
        except ValueError:
            current_w = 60.0
        new_w = max(0.0, round(current_w + delta, 1))
        self.entry_weight.delete(0, tk.END)
        self.entry_weight.insert(0, str(new_w))

    def save_exercise_performance(self):
        selected = self.tree_exercises.selection()
        if not selected:
            messagebox.showwarning("Wybór", "Zaznacz ćwiczenie w tabeli, aby zapisać serie, powtórzenia i ciężar.")
            return
        
        try:
            s = int(self.entry_sets.get())
            r = int(self.entry_reps.get())
            w = float(self.entry_weight.get().replace(",", "."))
            if s <= 0 or r <= 0 or w < 0:
                raise ValueError("Wartości muszą być dodatnie")
        except ValueError:
            messagebox.showerror("Błąd", "Wprowadź prawidłowe liczby dla serii (>0), powtórzeń (>0) i ciężaru (>=0).")
            return
        
        idx = int(selected[0])
        day = self.get_current_day()
        if not day or idx >= len(day["exercises"]):
            return
        
        ex = day["exercises"][idx]
        ex["sets"] = s
        ex["reps"] = r
        ex["weight"] = round(w, 1)

        today = datetime.now().strftime("%Y-%m-%d")
        if "history" not in ex:
            ex["history"] = []
        ex["history"].append({
            "date": today,
            "weight": round(w, 1),
            "reps": r,
            "sets": s
        })

        self.refresh_plan_view()
        self.tree_exercises.selection_set(str(idx))
        self.on_exercise_selected()
        if self.data["settings"].get("auto_save", True):
            self.storage.save(self.data)

        self.status_bar.config(text=f"✓ Zapisano: {ex.get('name')} | {s} serii x {r} powt. @ {w:.1f} kg")

    def add_new_week(self):
        new_num = len(self.data["weeks"]) + 1
        name = f"Tydzień {new_num} - Cykl"
        new_week = {
            "id": f"week-{new_num}",
            "number": new_num,
            "name": name,
            "days": [
                {
                    "id": f"w{new_num}-d1",
                    "name": "Poniedziałek - Push",
                    "completed": False,
                    "exercises": []
                },
                {
                    "id": f"w{new_num}-d2",
                    "name": "Środa - Pull",
                    "completed": False,
                    "exercises": []
                },
                {
                    "id": f"w{new_num}-d3",
                    "name": "Piątek - Legs",
                    "completed": False,
                    "exercises": []
                }
            ]
        }
        self.data["weeks"].append(new_week)
        self.load_week_options()
        self.cb_weeks.current(len(self.data["weeks"]) - 1)
        self.on_week_selected()
        self.save_data()
        messagebox.showinfo("Dodano", f"Utworzono nowy {name} z dniami treningowymi!")

    def add_new_day(self):
        w_idx = self.cb_weeks.current()
        if w_idx < 0:
            return
        week = self.data["weeks"][w_idx]
        day_num = len(week.get("days", [])) + 1
        day_name = f"Dzień {day_num} - Trening"
        new_day = {
            "id": f"w{w_idx+1}-d{day_num}",
            "name": day_name,
            "completed": False,
            "exercises": []
        }
        week.setdefault("days", []).append(new_day)
        self.on_week_selected()
        self.cb_days.current(len(week["days"]) - 1)
        self.on_day_selected()
        self.save_data()

    def open_add_exercise_dialog(self):
        day = self.get_current_day()
        if not day:
            messagebox.showwarning("Dzień", "Najpierw wybierz lub dodaj dzień treningowy.")
            return

        dialog = tk.Toplevel(self.root)
        dialog.title("➕ Dodaj Nowe Ćwiczenie (Katalog & Parametry)")
        dialog.geometry("440x540")
        dialog.configure(bg=self.card_bg)
        dialog.transient(self.root)
        dialog.grab_set()

        # Preset Quick Selection Frame
        fr_presets = tk.LabelFrame(dialog, text="💡 Szybkie szablony z bazy ćwiczeń:", fg=self.accent_color, bg=self.card_bg, font=("Segoe UI", 8, "bold"))
        fr_presets.pack(fill="x", padx=16, pady=(10, 4))
        
        presets = [
            ("🏋️ Klatka: Wyciskanie", "Wyciskanie sztangi leżąc", 1, 4, 8, 80.0, "Pauza na klatce"),
            ("🦅 Plecy: Martwy ciąg", "Martwy ciąg klasyczny", 2, 4, 5, 130.0, "Proste plecy, spięty brzuch"),
            ("🦵 Nogi: Przysiad", "Przysiad ze sztangą", 6, 4, 6, 110.0, "Głębokość poniżej 90"),
            ("🛡️ Barki: OHP", "Wyciskanie żołnierskie OHP", 3, 4, 6, 55.0, "Blokada nad głową"),
            ("🦾 Biceps: Uginanie", "Uginanie ramion ze sztangą", 4, 3, 10, 35.0, "Brak bujania tułowiem"),
            ("⚡ Triceps: Dipsy", "Dipsy na poręczach", 5, 3, 10, 10.0, "Tułów pionowo"),
        ]

        def apply_preset(en, ci, ps, pr, pw, pn):
            ent_name.delete(0, tk.END)
            ent_name.insert(0, en)
            cb_cat.current(ci)
            ent_sets.delete(0, tk.END)
            ent_sets.insert(0, str(ps))
            ent_reps.delete(0, tk.END)
            ent_reps.insert(0, str(pr))
            ent_weight.delete(0, tk.END)
            ent_weight.insert(0, str(pw))
            ent_notes.delete(0, tk.END)
            ent_notes.insert(0, pn)

        for p_idx, (btn_lbl, ex_name, cat_idx, s, r, w, nts) in enumerate(presets):
            b = tk.Button(fr_presets, text=btn_lbl, font=("Segoe UI", 8), bg="#334155", fg="#f8fafc", relief="flat",
                          command=lambda en=ex_name, ci=cat_idx, ps=s, pr=r, pw=w, pn=nts: apply_preset(en, ci, ps, pr, pw, pn))
            b.grid(row=p_idx // 2, column=p_idx % 2, sticky="ew", padx=3, pady=2)
        fr_presets.grid_columnconfigure(0, weight=1)
        fr_presets.grid_columnconfigure(1, weight=1)

        tk.Label(dialog, text="Nazwa ćwiczenia:", fg=self.text_color, bg=self.card_bg, font=("Segoe UI", 9, "bold")).pack(anchor="w", padx=16, pady=(8, 2))
        ent_name = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_name.pack(fill="x", padx=16)

        tk.Label(dialog, text="Kategoria partii (do Analizy Partii):", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        cats = ["Wykrywaj automatycznie", "Klatka Piersiowa (klatka)", "Plecy / Grzbiet (plecy)", "Barki / Naramienne (barki)", "Biceps (biceps)", "Triceps (triceps)", "Nogi / Udowe (nogi)"]
        cb_cat = ttk.Combobox(dialog, state="readonly", values=cats)
        cb_cat.current(0)
        cb_cat.pack(fill="x", padx=16)

        param_fr = tk.Frame(dialog, bg=self.card_bg)
        param_fr.pack(fill="x", padx=16, pady=6)

        tk.Label(param_fr, text="Serie:", fg=self.text_color, bg=self.card_bg).grid(row=0, column=0, sticky="w")
        ent_sets = tk.Entry(param_fr, font=("Segoe UI", 10), width=8)
        ent_sets.insert(0, "4")
        ent_sets.grid(row=1, column=0, sticky="w", padx=(0, 10))

        tk.Label(param_fr, text="Powtórzenia:", fg=self.text_color, bg=self.card_bg).grid(row=0, column=1, sticky="w")
        ent_reps = tk.Entry(param_fr, font=("Segoe UI", 10), width=8)
        ent_reps.insert(0, "8")
        ent_reps.grid(row=1, column=1, sticky="w", padx=(0, 10))

        tk.Label(param_fr, text="Ciężar początkowy (kg):", fg=self.text_color, bg=self.card_bg).grid(row=0, column=2, sticky="w")
        ent_weight = tk.Entry(param_fr, font=("Segoe UI", 10), width=12)
        ent_weight.insert(0, "60.0")
        ent_weight.grid(row=1, column=2, sticky="w")

        tk.Label(dialog, text="Notatki / Wskazówki techniczne:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_notes = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_notes.pack(fill="x", padx=16)

        def save_new():
            name = ent_name.get().strip()
            if not name:
                messagebox.showerror("Błąd", "Wprowadź nazwę ćwiczenia.")
                return
            try:
                s = int(ent_sets.get())
                r = int(ent_reps.get())
                w = float(ent_weight.get().replace(",", "."))
            except ValueError:
                messagebox.showerror("Błąd", "Sprawdź poprawność serii, powtórzeń i ciężaru.")
                return
            
            today = datetime.now().strftime("%Y-%m-%d")
            cat_values = ["", "klatka", "plecy", "barki", "biceps", "triceps", "nogi"]
            selected_cat_idx = cb_cat.current()
            
            new_ex = {
                "name": name,
                "sets": s,
                "reps": r,
                "weight": w,
                "rpe": 8.0,
                "notes": ent_notes.get().strip(),
                "history": [{"date": today, "weight": w, "reps": r, "sets": s}]
            }
            if selected_cat_idx > 0 and selected_cat_idx < len(cat_values):
                new_ex["category"] = cat_values[selected_cat_idx]
            day.setdefault("exercises", []).append(new_ex)
            self.refresh_plan_view()
            self.save_data()
            dialog.destroy()

        tk.Button(dialog, text="✓ Dodaj ćwiczenie do planu", bg=self.success_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=8, command=save_new).pack(fill="x", padx=16, pady=14)

    def open_edit_exercise_dialog(self):
        selected = self.tree_exercises.selection()
        if not selected:
            messagebox.showwarning("Wybór", "Wybierz ćwiczenie do edycji.")
            return
        idx = int(selected[0])
        day = self.get_current_day()
        if not day or idx >= len(day["exercises"]):
            return
        ex = day["exercises"][idx]

        dialog = tk.Toplevel(self.root)
        dialog.title("✏️ Edycja & Zmiana Nazwy Ćwiczenia")
        dialog.geometry("400x440")
        dialog.configure(bg=self.card_bg)
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="Nazwa ćwiczenia (edytuj / zmień nazwę):", fg=self.accent_color, bg=self.card_bg, font=("Segoe UI", 9, "bold")).pack(anchor="w", padx=16, pady=(12, 2))
        ent_name = tk.Entry(dialog, font=("Segoe UI", 10, "bold"))
        ent_name.insert(0, ex.get("name", ""))
        ent_name.pack(fill="x", padx=16)

        tk.Label(dialog, text="Kategoria partii (do Analizy Partii):", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        cats = ["Wykrywaj automatycznie", "Klatka Piersiowa (klatka)", "Plecy / Grzbiet (plecy)", "Barki / Naramienne (barki)", "Biceps (biceps)", "Triceps (triceps)", "Nogi / Udowe (nogi)"]
        cb_cat = ttk.Combobox(dialog, state="readonly", values=cats)
        curr_cat = ex.get("category", "")
        cat_index_map = {"klatka": 1, "plecy": 2, "barki": 3, "biceps": 4, "triceps": 5, "nogi": 6}
        cb_cat.current(cat_index_map.get(curr_cat, 0))
        cb_cat.pack(fill="x", padx=16)

        tk.Label(dialog, text="Serie:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_sets = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_sets.insert(0, str(ex.get("sets", 4)))
        ent_sets.pack(fill="x", padx=16)

        tk.Label(dialog, text="Powtórzenia:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_reps = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_reps.insert(0, str(ex.get("reps", 8)))
        ent_reps.pack(fill="x", padx=16)

        tk.Label(dialog, text="Ciężar roboczy (kg):", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_weight = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_weight.insert(0, str(ex.get("weight", 0.0)))
        ent_weight.pack(fill="x", padx=16)

        tk.Label(dialog, text="Notatki / Wskazówki:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_notes = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_notes.insert(0, ex.get("notes", ""))
        ent_notes.pack(fill="x", padx=16)

        def save_edit():
            name = ent_name.get().strip()
            if not name:
                messagebox.showerror("Błąd", "Wprowadź nazwę ćwiczenia.")
                return
            try:
                s = int(ent_sets.get())
                r = int(ent_reps.get())
                w = float(ent_weight.get().replace(",", "."))
            except ValueError:
                messagebox.showerror("Błąd", "Sprawdź poprawność wprowadzonych liczb.")
                return
            
            cat_values = ["", "klatka", "plecy", "barki", "biceps", "triceps", "nogi"]
            selected_cat_idx = cb_cat.current()
            if selected_cat_idx > 0 and selected_cat_idx < len(cat_values):
                ex["category"] = cat_values[selected_cat_idx]
            elif "category" in ex and selected_cat_idx == 0:
                del ex["category"]

            ex["name"] = name
            ex["sets"] = s
            ex["reps"] = r
            ex["weight"] = w
            ex["notes"] = ent_notes.get().strip()
            self.refresh_plan_view()
            self.save_data()
            self.status_bar.config(text=f"✓ Zaktualizowano ćwiczenie: {name} ({s}x{r} @ {w:.1f} kg)")
            dialog.destroy()

        tk.Button(dialog, text="💾 Zapisz zmiany", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=6, command=save_edit).pack(fill="x", padx=16, pady=16)

    def delete_selected_exercise(self):
        selected = self.tree_exercises.selection()
        if not selected:
            messagebox.showwarning("Wybór", "Zaznacz ćwiczenie do usunięcia.")
            return
        idx = int(selected[0])
        day = self.get_current_day()
        if not day or idx >= len(day["exercises"]):
            return
        name = day["exercises"][idx].get("name", "ćwiczenie")
        if messagebox.askyesno("Potwierdzenie", f"Czy na pewno chcesz usunąć '{name}'?"):
            del day["exercises"][idx]
            self.refresh_plan_view()
            self.save_data()

    def update_exercise_list_for_stats(self):
        all_exercises = set()
        for w in self.data.get("weeks", []):
            for d in w.get("days", []):
                for e in d.get("exercises", []):
                    name = e.get("name")
                    if name:
                        all_exercises.add(name)
        
        sorted_names = sorted(list(all_exercises))
        self.cb_stat_exercise["values"] = sorted_names
        if sorted_names and not self.cb_stat_exercise.get():
            self.cb_stat_exercise.current(0)
            self.refresh_stats_chart()

    def refresh_stats_chart(self, event=None):
        ex_name = self.cb_stat_exercise.get()
        if not ex_name:
            return
        
        points = []
        for w in self.data.get("weeks", []):
            for d in w.get("days", []):
                for e in d.get("exercises", []):
                    if e.get("name") == ex_name:
                        hist = e.get("history", [])
                        if hist:
                            for h in hist:
                                points.append((h.get("date", ""), float(h.get("weight", 0)), int(h.get("reps", 1))))
                        else:
                            points.append(("", float(e.get("weight", 0)), int(e.get("reps", 1))))
        
        if not points:
            return
        
        weights = [p[1] for p in points if p[1] > 0]
        if not weights:
            return
        
        max_w = max(weights)
        last_point = points[-1]
        calc_1rm = round(last_point[1] * (1 + last_point[2] / 30), 1) if last_point[2] > 1 else last_point[1]
        
        first_w = weights[0]
        gain = max_w - first_w
        gain_pct = round((gain / first_w * 100), 1) if first_w > 0 else 0

        self.card_max_weight.config(text=f"{max_w:.1f} kg")
        self.card_max_1rm.config(text=f"{calc_1rm:.1f} kg")
        self.card_progress_pct.config(text=f"+{gain:.1f} kg (+{gain_pct}%)")
        self.card_total_volume.config(text=f"{int(max_w * 4 * 8)} kg")

        self.draw_chart(points)

    def draw_chart(self, points=None):
        self.canvas_stats.delete("all")
        width = self.canvas_stats.winfo_width()
        height = self.canvas_stats.winfo_height()
        if width < 50 or height < 50:
            return

        if not points:
            ex_name = self.cb_stat_exercise.get()
            if not ex_name:
                self.canvas_stats.create_text(width/2, height/2, text="Brak wybranego ćwiczenia", fill="#71717a", font=("Segoe UI", 12))
                return
            points = []
            for w in self.data.get("weeks", []):
                for d in w.get("days", []):
                    for e in d.get("exercises", []):
                        if e.get("name") == ex_name:
                            for h in e.get("history", []):
                                points.append((h.get("date", ""), float(h.get("weight", 0))))

        if len(points) < 1:
            self.canvas_stats.create_text(width/2, height/2, text="Zapisz więcej serii, aby zobaczyć wykres progresu!", fill="#71717a", font=("Segoe UI", 11))
            return

        pad_left = 60
        pad_right = 40
        pad_top = 40
        pad_bottom = 50

        chart_w = width - pad_left - pad_right
        chart_h = height - pad_top - pad_bottom

        vals = [p[1] for p in points]
        min_v = max(0, min(vals) - 10)
        max_v = max(vals) + 10
        if min_v == max_v:
            max_v += 10

        steps = 5
        for i in range(steps + 1):
            y_val = min_v + (max_v - min_v) * (i / steps)
            y_px = pad_top + chart_h - (i / steps) * chart_h
            self.canvas_stats.create_line(pad_left, y_px, width - pad_right, y_px, fill="#27272a", dash=(2, 4))
            self.canvas_stats.create_text(pad_left - 10, y_px, text=f"{y_val:.0f} kg", fill="#a1a1aa", anchor="e", font=("Segoe UI", 8))

        n = len(points)
        coords = []
        for i, p in enumerate(points):
            x_px = pad_left + (i / max(1, n - 1)) * chart_w if n > 1 else pad_left + chart_w / 2
            y_px = pad_top + chart_h - ((p[1] - min_v) / (max_v - min_v)) * chart_h
            coords.append((x_px, y_px, p[0], p[1]))

        if len(coords) > 1:
            line_pts = []
            for c in coords:
                line_pts.extend([c[0], c[1]])
            self.canvas_stats.create_line(*line_pts, fill="#3b82f6", width=3, smooth=True)

        for c in coords:
            x, y, dt, w_val = c
            self.canvas_stats.create_oval(x - 5, y - 5, x + 5, y + 5, fill="#60a5fa", outline="#1d4ed8", width=2)
            self.canvas_stats.create_text(x, y - 14, text=f"{w_val:.1f} kg", fill="#ffffff", font=("Segoe UI", 9, "bold"))
            if dt:
                short_dt = dt[-5:] if len(dt) >= 5 else dt
                self.canvas_stats.create_text(x, height - pad_bottom + 14, text=short_dt, fill="#a1a1aa", font=("Segoe UI", 8))

    def refresh_weight_table(self):
        for row in self.tree_weight.get_children():
            self.tree_weight.delete(row)

        bws = self.data.get("body_weights", [])
        sorted_bws = sorted(bws, key=lambda x: x.get("date", ""))
        
        prev_w = None
        for i, item in enumerate(sorted_bws):
            curr_w = float(item.get("weight", 0))
            if prev_w is not None:
                diff = curr_w - prev_w
                diff_str = f"{diff:+.1f} kg"
            else:
                diff_str = "--"
            prev_w = curr_w

            self.tree_weight.insert("", "end", iid=str(i), values=(
                item.get("date", ""),
                f"{curr_w:.1f} kg",
                diff_str,
                item.get("notes", "")
            ))

    def add_body_weight_entry(self):
        dt = self.entry_bw_date.get().strip()
        val_str = self.entry_bw_val.get().strip().replace(",", ".")
        notes = self.entry_bw_notes.get().strip()

        if not dt or not val_str:
            messagebox.showerror("Błąd", "Wprowadź datę i wagę ciała.")
            return

        try:
            w_num = float(val_str)
        except ValueError:
            messagebox.showerror("Błąd", "Waga musi być liczbą (np. 81.5).")
            return

        self.data.setdefault("body_weights", []).append({
            "id": f"bw-{int(datetime.now().timestamp())}",
            "date": dt,
            "weight": round(w_num, 1),
            "notes": notes
        })
        self.entry_bw_val.delete(0, tk.END)
        self.entry_bw_notes.delete(0, tk.END)
        self.refresh_weight_table()
        self.save_data()
        messagebox.showinfo("Zapisano", f"Dodano pomiar: {w_num:.1f} kg dla daty {dt}.")

    def delete_body_weight_entry(self):
        selected = self.tree_weight.selection()
        if not selected:
            messagebox.showwarning("Wybór", "Zaznacz wpis wagi do usunięcia.")
            return
        idx = int(selected[0])
        bws = self.data.get("body_weights", [])
        if idx < len(bws):
            del bws[idx]
            self.refresh_weight_table()
            self.save_data()

    def save_data(self):
        ok = self.storage.save(self.data)
        if ok:
            self.status_bar.config(text=f"✓ Dane zapisane pomyślnie [{datetime.now().strftime('%H:%M:%S')}] w {self.storage.filepath}")
        else:
            self.status_bar.config(text="⚠️ Błąd zapisu danych!")

    def browse_json_path(self):
        chosen = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("Pliki JSON", "*.json"), ("Wszystkie pliki", "*.*")],
            title="Wybierz lub utwórz plik bazy treningowej"
        )
        if chosen:
            self.storage.filepath = chosen
            self.entry_path.delete(0, tk.END)
            self.entry_path.insert(0, chosen)
            self.save_data()

    def export_json_backup(self):
        save_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            initialfile=f"gym_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            filetypes=[("Plik JSON", "*.json")]
        )
        if save_path:
            try:
                with open(save_path, "w", encoding="utf-8") as f:
                    json.dump(self.data, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Eksport", f"Kopia zapasowa zapisana:\\n{save_path}")
            except Exception as e:
                messagebox.showerror("Błąd", f"Nie udało się wyeksportować: {e}")

    def import_json_data(self):
        open_path = filedialog.askopenfilename(filetypes=[("Plik JSON", "*.json")])
        if open_path:
            try:
                with open(open_path, "r", encoding="utf-8") as f:
                    imported = json.load(f)
                if "weeks" in imported:
                    self.data = imported
                    self.save_data()
                    self.load_week_options()
                    self.refresh_plan_view()
                    self.refresh_weight_table()
                    messagebox.showinfo("Import", "Baza treningowa została pomyślnie zaimportowana!")
                else:
                    messagebox.showerror("Błąd", "Wybrany plik nie ma prawidłowej struktury GymTracker.")
            except Exception as e:
                messagebox.showerror("Błąd", f"Błąd wczytywania: {e}")

    def open_data_folder_windows(self):
        folder = os.path.dirname(self.storage.filepath)
        if sys.platform == "win32":
            os.startfile(folder)
        else:
            messagebox.showinfo("Folder", f"Katalog danych: {folder}")

def main():
    enable_windows_dpi_awareness()
    root = tk.Tk()
    app = GymTrackerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
`;
