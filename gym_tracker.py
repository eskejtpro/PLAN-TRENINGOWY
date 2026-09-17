"""
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
                "name": "Tydzień 1 - Rozpoczęcie Cyklu (Push / Pull / Legs)",
                "days": [
                    {
                        "id": "w1-d1",
                        "name": "Poniedziałek – Plan A: Push (Klatka, Barki Przód/Bok, Triceps)",
                        "completed": True,
                        "notes": "Trening Push ukończony. Dobre czucie mięśniowe i stabilizacja.",
                        "exercises": [
                            {
                                "name": "Wyciskanie sztangi na ławce płaskiej",
                                "sets": 4, "reps": 8, "weight": 85.0, "rpe": 8.0,
                                "notes": "Pauza na klatce, stabilny mostek",
                                "history": [
                                    {"date": "2026-08-18", "weight": 80.0, "reps": 8, "sets": 4},
                                    {"date": "2026-08-25", "weight": 82.5, "reps": 8, "sets": 4},
                                    {"date": "2026-09-01", "weight": 85.0, "reps": 8, "sets": 4}
                                ]
                            },
                            {
                                "name": "Wyciskanie hantli na skosie dodatnim (30–45°)",
                                "sets": 3, "reps": 10, "weight": 30.0, "rpe": 8.5,
                                "notes": "Kąt 30 stopni, głębokie rozciągnięcie",
                                "history": [
                                    {"date": "2026-08-18", "weight": 26.0, "reps": 10, "sets": 3},
                                    {"date": "2026-08-25", "weight": 28.0, "reps": 10, "sets": 3},
                                    {"date": "2026-09-01", "weight": 30.0, "reps": 10, "sets": 3}
                                ]
                            },
                            {
                                "name": "Rozpiętki na bramce / wyciągu",
                                "sets": 3, "reps": 12, "weight": 15.0, "rpe": 8.0,
                                "notes": "Przytrzymanie w szczycie skurczu",
                                "history": [
                                    {"date": "2026-08-18", "weight": 12.5, "reps": 12, "sets": 3},
                                    {"date": "2026-08-25", "weight": 13.5, "reps": 12, "sets": 3},
                                    {"date": "2026-09-01", "weight": 15.0, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "OHP (Wyciskanie żołnierskie sztangi stojąc)",
                                "sets": 4, "reps": 6, "weight": 55.0, "rpe": 8.5,
                                "notes": "Napięty pośladek i brzuch",
                                "history": [
                                    {"date": "2026-08-18", "weight": 50.0, "reps": 6, "sets": 4},
                                    {"date": "2026-08-25", "weight": 52.5, "reps": 6, "sets": 4},
                                    {"date": "2026-09-01", "weight": 55.0, "reps": 6, "sets": 4}
                                ]
                            },
                            {
                                "name": "Wznosy bokiem z hantlami lub na wyciągu",
                                "sets": 4, "reps": 12, "weight": 12.5, "rpe": 9.0,
                                "notes": "Wolna faza negatywna",
                                "history": [
                                    {"date": "2026-08-18", "weight": 10.0, "reps": 12, "sets": 4},
                                    {"date": "2026-08-25", "weight": 11.5, "reps": 12, "sets": 4},
                                    {"date": "2026-09-01", "weight": 12.5, "reps": 12, "sets": 4}
                                ]
                            },
                            {
                                "name": "Prostowanie ramion z linką za głowy (French)",
                                "sets": 3, "reps": 12, "weight": 25.0, "rpe": 8.0,
                                "notes": "Długa głowa tricepsa",
                                "history": [
                                    {"date": "2026-08-18", "weight": 20.0, "reps": 12, "sets": 3},
                                    {"date": "2026-08-25", "weight": 22.5, "reps": 12, "sets": 3},
                                    {"date": "2026-09-01", "weight": 25.0, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "Prostowanie ramion na linkach wyciągu górnego",
                                "sets": 3, "reps": 12, "weight": 30.0, "rpe": 8.5,
                                "notes": "Rozchylenie linek w dole",
                                "history": [
                                    {"date": "2026-08-18", "weight": 25.0, "reps": 12, "sets": 3},
                                    {"date": "2026-08-25", "weight": 27.5, "reps": 12, "sets": 3},
                                    {"date": "2026-09-01", "weight": 30.0, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "Plank (Deska)",
                                "sets": 3, "reps": 60, "weight": 0.0, "rpe": 8.0,
                                "notes": "60 sekund izometrii",
                                "history": [
                                    {"date": "2026-08-18", "weight": 0.0, "reps": 45, "sets": 3},
                                    {"date": "2026-08-25", "weight": 0.0, "reps": 50, "sets": 3},
                                    {"date": "2026-09-01", "weight": 0.0, "reps": 60, "sets": 3}
                                ]
                            }
                        ]
                    },
                    {
                        "id": "w1-d2",
                        "name": "Wtorek – Plan B: Pull (Plecy, Tył Barku, Biceps)",
                        "completed": True,
                        "notes": "Mocny grzbiet i biceps przepracowany.",
                        "exercises": [
                            {
                                "name": "Podciąganie na drążku (Nachwyt / Podchwyt)",
                                "sets": 4, "reps": 8, "weight": 0.0, "rpe": 8.0,
                                "notes": "Pełen zakres ruchu do brody",
                                "history": [
                                    {"date": "2026-08-19", "weight": 0.0, "reps": 6, "sets": 4},
                                    {"date": "2026-08-26", "weight": 0.0, "reps": 7, "sets": 4},
                                    {"date": "2026-09-02", "weight": 0.0, "reps": 8, "sets": 4}
                                ]
                            },
                            {
                                "name": "Wiosłowanie sztangą w opadzie tułowia",
                                "sets": 4, "reps": 8, "weight": 75.0, "rpe": 8.0,
                                "notes": "Przyciąganie do pępka, opad 45°",
                                "history": [
                                    {"date": "2026-08-19", "weight": 70.0, "reps": 8, "sets": 4},
                                    {"date": "2026-08-26", "weight": 72.5, "reps": 8, "sets": 4},
                                    {"date": "2026-09-02", "weight": 75.0, "reps": 8, "sets": 4}
                                ]
                            },
                            {
                                "name": "Wiosłowanie jednorącz na wyciągu dolnym do biodra",
                                "sets": 3, "reps": 10, "weight": 35.0, "rpe": 8.0,
                                "notes": "Łokieć blisko biodra",
                                "history": [
                                    {"date": "2026-08-19", "weight": 30.0, "reps": 10, "sets": 3},
                                    {"date": "2026-08-26", "weight": 32.5, "reps": 10, "sets": 3},
                                    {"date": "2026-09-02", "weight": 35.0, "reps": 10, "sets": 3}
                                ]
                            },
                            {
                                "name": "Pull-over (Przenoszenie drążka na wyciągu)",
                                "sets": 3, "reps": 12, "weight": 27.5, "rpe": 8.0,
                                "notes": "Izolacja najszerszego",
                                "history": [
                                    {"date": "2026-08-19", "weight": 22.5, "reps": 12, "sets": 3},
                                    {"date": "2026-08-26", "weight": 25.0, "reps": 12, "sets": 3},
                                    {"date": "2026-09-02", "weight": 27.5, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "Face Pulls (Przyciąganie linki do twarzy)",
                                "sets": 4, "reps": 15, "weight": 20.0, "rpe": 8.5,
                                "notes": "Rotatory i tył barku",
                                "history": [
                                    {"date": "2026-08-19", "weight": 15.0, "reps": 15, "sets": 4},
                                    {"date": "2026-08-26", "weight": 17.5, "reps": 15, "sets": 4},
                                    {"date": "2026-09-02", "weight": 20.0, "reps": 15, "sets": 4}
                                ]
                            },
                            {
                                "name": "Wznosy hantli w opadzie leżąc przodem (30–45°)",
                                "sets": 3, "reps": 12, "weight": 10.0, "rpe": 8.5,
                                "notes": "Klatka na ławce",
                                "history": [
                                    {"date": "2026-08-19", "weight": 8.0, "reps": 12, "sets": 3},
                                    {"date": "2026-08-26", "weight": 9.0, "reps": 12, "sets": 3},
                                    {"date": "2026-09-02", "weight": 10.0, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "Uginanie ramion ze sztangą łamaną stojąc",
                                "sets": 3, "reps": 10, "weight": 35.0, "rpe": 8.5,
                                "notes": "Czysta technika bez bujania",
                                "history": [
                                    {"date": "2026-08-19", "weight": 30.0, "reps": 10, "sets": 3},
                                    {"date": "2026-08-26", "weight": 32.5, "reps": 10, "sets": 3},
                                    {"date": "2026-09-02", "weight": 35.0, "reps": 10, "sets": 3}
                                ]
                            },
                            {
                                "name": "Uginanie hantli z supinacją na ławce skośnej",
                                "sets": 3, "reps": 10, "weight": 14.0, "rpe": 8.0,
                                "notes": "Pełna supinacja",
                                "history": [
                                    {"date": "2026-08-19", "weight": 12.0, "reps": 10, "sets": 3},
                                    {"date": "2026-08-26", "weight: 13.0, "reps": 10, "sets": 3},
                                    {"date": "2026-09-02", "weight": 14.0, "reps": 10, "sets": 3}
                                ]
                            },
                            {
                                "name": "Uginanie młotkowe (Hantle / Linka)",
                                "sets": 3, "reps": 12, "weight": 16.0, "rpe": 8.5,
                                "notes": "Praca ramienno-promieniowego",
                                "history": [
                                    {"date": "2026-08-19", "weight": 12.0, "reps": 12, "sets": 3},
                                    {"date": "2026-08-26", "weight": 14.0, "reps": 12, "sets": 3},
                                    {"date": "2026-09-02", "weight": 16.0, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "Plank (Deska)",
                                "sets": 3, "reps": 60, "weight": 0.0, "rpe": 8.0,
                                "notes": "60 sekund izometrii",
                                "history": [
                                    {"date": "2026-08-19", "weight": 0.0, "reps": 50, "sets": 3},
                                    {"date": "2026-08-26", "weight": 0.0, "reps": 55, "sets": 3},
                                    {"date": "2026-09-02", "weight": 0.0, "reps": 60, "sets": 3}
                                ]
                            }
                        ]
                    },
                    {
                        "id": "w1-d3",
                        "name": "Środa – Plan C: Legs & Abs (Nogi, Brzuch)",
                        "completed": False,
                        "notes": "Mocny trening nóg i brzucha",
                        "exercises": [
                            {
                                "name": "Prostowanie nóg na maszynie siedząc",
                                "sets": 3, "reps": 12, "weight": 50.0, "rpe": 8.0,
                                "notes": "Wstępne zmęczenie czworogłowych",
                                "history": [
                                    {"date": "2026-08-20", "weight": 40.0, "reps": 12, "sets": 3},
                                    {"date": "2026-08-27", "weight": 45.0, "reps": 12, "sets": 3},
                                    {"date": "2026-09-03", "weight": 50.0, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "Przysiady ze sztangą na plecach (Back Squat)",
                                "sets": 4, "reps": 6, "weight": 115.0, "rpe": 8.5,
                                "notes": "Głębokość poniżej równoległości",
                                "history": [
                                    {"date": "2026-08-20", "weight": 105.0, "reps": 6, "sets": 4},
                                    {"date": "2026-08-27", "weight": 110.0, "reps": 6, "sets": 4},
                                    {"date": "2026-09-03", "weight": 115.0, "reps": 6, "sets": 4}
                                ]
                            },
                            {
                                "name": "RDL – Rumuński Martwy Ciąg ze sztangą",
                                "sets": 4, "reps": 8, "weight": 95.0, "rpe": 8.0,
                                "notes": "Biodra w tył, rozciągnięcie dwugłowych",
                                "history": [
                                    {"date": "2026-08-20", "weight": 85.0, "reps": 8, "sets": 4},
                                    {"date": "2026-08-27", "weight": 90.0, "reps": 8, "sets": 4},
                                    {"date": "2026-09-03", "weight": 95.0, "reps": 8, "sets": 4}
                                ]
                            },
                            {
                                "name": "Wykroki chodzone z hantlami",
                                "sets": 3, "reps": 10, "weight": 18.0, "rpe": 8.5,
                                "notes": "10 kroków na nogę",
                                "history": [
                                    {"date": "2026-08-20", "weight": 14.0, "reps": 10, "sets": 3},
                                    {"date": "2026-08-27", "weight": 16.0, "reps": 10, "sets": 3},
                                    {"date": "2026-09-03", "weight": 18.0, "reps": 10, "sets": 3}
                                ]
                            },
                            {
                                "name": "Wspięcia na palce stojąc",
                                "sets": 4, "reps": 15, "weight": 60.0, "rpe": 9.0,
                                "notes": "Przytrzymanie 2 sekundy na górze",
                                "history": [
                                    {"date": "2026-08-20", "weight": 50.0, "reps": 15, "sets": 4},
                                    {"date": "2026-08-27", "weight": 55.0, "reps": 15, "sets": 4},
                                    {"date": "2026-09-03", "weight": 60.0, "reps": 15, "sets": 4}
                                ]
                            },
                            {
                                "name": "Unoszenie nóg w wiszeniu na drążku",
                                "sets": 3, "reps": 12, "weight": 0.0, "rpe": 8.5,
                                "notes": "Podwijanie miednicy do klatki",
                                "history": [
                                    {"date": "2026-08-20", "weight": 0.0, "reps": 10, "sets": 3},
                                    {"date": "2026-08-27", "weight": 0.0, "reps": 12, "sets": 3},
                                    {"date": "2026-09-03", "weight": 0.0, "reps": 12, "sets": 3}
                                ]
                            },
                            {
                                "name": "Allahy na bramce / wyciągu górnym",
                                "sets": 3, "reps": 15, "weight": 35.0, "rpe": 8.0,
                                "notes": "Spięcie brzucha na dole",
                                "history": [
                                    {"date": "2026-08-20", "weight": 27.5, "reps": 15, "sets": 3},
                                    {"date": "2026-08-27", "weight": 30.0, "reps": 15, "sets": 3},
                                    {"date": "2026-09-03", "weight": 35.0, "reps": 15, "sets": 3}
                                ]
                            },
                            {
                                "name": "Plank (Deska)",
                                "sets": 3, "reps": 60, "weight": 0.0, "rpe": 8.0,
                                "notes": "60 sekund izometrii",
                                "history": [
                                    {"date": "2026-08-20", "weight": 0.0, "reps": 50, "sets": 3},
                                    {"date": "2026-08-27", "weight": 0.0, "reps": 55, "sets": 3},
                                    {"date": "2026-09-03", "weight": 0.0, "reps": 60, "sets": 3}
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
            # Utwórz kopię uszkodzonego pliku i przywróć bezpieczne domyślne dane
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

    def save(self, data: dict) -> bool:
        """Bezpieczny, atomowy zapis pliku na dysku Windows."""
        temp_path = self.filepath + ".tmp"
        try:
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, self.filepath)
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

        # Usługa danych
        self.storage = StorageService()
        self.data = self.storage.load()

        # Stylizacja
        self.style = ttk.Style()
        self.style.theme_use("clam")
        self.setup_theme()

        # Budowa interfejsu
        self.create_widgets()
        self.load_week_options()
        self.refresh_plan_view()

    def setup_theme(self):
        """Konfiguracja nowoczesnej palety barw Windows Dark Mode (Slate & Emerald)."""
        self.bg_color = "#0f172a"       # Slate-900
        self.card_bg = "#1e293b"        # Slate-800
        self.accent_color = "#10b981"   # Emerald-500
        self.accent_hover = "#059669"   # Emerald-600
        self.text_color = "#f8fafc"     # Slate-50
        self.text_muted = "#94a3b8"     # Slate-400
        self.border_color = "#334155"   # Slate-700
        self.success_color = "#10b981"  # Emerald-500

        self.root.configure(bg=self.bg_color)
        
        # Konfiguracja styli ttk
        self.style.configure(".", background=self.bg_color, foreground=self.text_color, font=("Segoe UI", 10))
        self.style.configure("TNotebook", background=self.bg_color, borderwidth=0)
        self.style.configure("TNotebook.Tab", background=self.card_bg, foreground=self.text_color, padding=[14, 8], font=("Segoe UI", 10, "bold"))
        self.style.map("TNotebook.Tab", background=[("selected", self.accent_color)], foreground=[("selected", "#ffffff")])
        
        self.style.configure("Treeview", background=self.card_bg, foreground=self.text_color, fieldbackground=self.card_bg, rowheight=30, bordercolor=self.border_color)
        self.style.configure("Treeview.Heading", background="#334155", foreground="#ffffff", font=("Segoe UI", 10, "bold"))
        self.style.map("Treeview", background=[("selected", "#065f46")])

    def create_widgets(self):
        # Górny pasek nagłówka
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

        # Główne zakładki (Notebook)
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=14, pady=10)

        # Zakładka 1: Plan Treningowy & Progres Ciężaru
        self.tab_plan = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_plan, text="📅 Plan Treningowy & Ciężary")
        self.build_plan_tab()

        # Zakładka 2: Statystyki i Wykresy Progresu
        self.tab_stats = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_stats, text="📈 Analiza Progresu & 1RM")
        self.build_stats_tab()

        # Zakładka 3: Waga Ciała
        self.tab_weight = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_weight, text="⚖️ Rejestr Wagi Ciała")
        self.build_weight_tab()

        # Zakładka 4: Ustawienia & Plik JSON
        self.tab_settings = tk.Frame(self.notebook, bg=self.bg_color)
        self.notebook.add(self.tab_settings, text="⚙️ Ustawienia & Ścieżka Windows")
        self.build_settings_tab()

        # Dolny pasek statusu
        self.status_bar = tk.Label(self.root, text=f"Ścieżka danych: {self.storage.filepath} | Gotowy do treningu", 
                                   bd=1, relief="sunken", anchor="w", bg=self.card_bg, fg=self.text_muted, font=("Segoe UI", 9))
        self.status_bar.pack(side="bottom", fill="x")

    # ================= ZAKŁADKA PLAN TRENINGOWY =================
    def build_plan_tab(self):
        # Panel wyboru Tygodnia i Dnia
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

        # Panel główny: Tabela ćwiczeń i panel szybkiej edycji ciężaru
        main_content = tk.Frame(self.tab_plan, bg=self.bg_color)
        main_content.pack(fill="both", expand=True)

        # Tabela (Treeview)
        table_frame = tk.Frame(main_content, bg=self.card_bg, highlightthickness=1, highlightbackground=self.border_color)
        table_frame.pack(side="left", fill="both", expand=True, padx=(0, 8))

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

        # Panel boczny: Zmiana i Progres Ciężaru
        action_frame = tk.Frame(main_content, bg=self.card_bg, width=280, padx=14, pady=12, highlightthickness=1, highlightbackground=self.border_color)
        action_frame.pack(side="right", fill="y")
        action_frame.pack_propagate(False)

        tk.Label(action_frame, text="⚡ Szybka Zmiana Ciężaru", font=("Segoe UI", 11, "bold"), fg=self.accent_color, bg=self.card_bg).pack(anchor="w", pady=(0, 8))
        
        self.lbl_selected_ex = tk.Label(action_frame, text="Wybierz ćwiczenie z tabeli", font=("Segoe UI", 9, "italic"), fg=self.text_muted, bg=self.card_bg, wraplength=250)
        self.lbl_selected_ex.pack(anchor="w", pady=(0, 10))

        # Przyciski szybkiej zmiany progresji
        quick_grid = tk.Frame(action_frame, bg=self.card_bg)
        quick_grid.pack(fill="x", pady=4)
        
        tk.Button(quick_grid, text="+2.5 kg", bg="#2563eb", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", width=9, pady=4, command=lambda: self.adjust_weight(2.5)).grid(row=0, column=0, padx=2, pady=2)
        tk.Button(quick_grid, text="-2.5 kg", bg="#4b5563", fg="#ffffff", font=("Segoe UI", 9), relief="flat", width=9, pady=4, command=lambda: self.adjust_weight(-2.5)).grid(row=0, column=1, padx=2, pady=2)
        tk.Button(quick_grid, text="+5.0 kg", bg="#1d4ed8", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", width=9, pady=4, command=lambda: self.adjust_weight(5.0)).grid(row=1, column=0, padx=2, pady=2)
        tk.Button(quick_grid, text="-5.0 kg", bg="#4b5563", fg="#ffffff", font=("Segoe UI", 9), relief="flat", width=9, pady=4, command=lambda: self.adjust_weight(-5.0)).grid(row=1, column=1, padx=2, pady=2)

        # Dokładne wpisywanie wartości
        tk.Label(action_frame, text="Wprowadź ciężar [kg]:", font=("Segoe UI", 9), fg=self.text_color, bg=self.card_bg).pack(anchor="w", pady=(12, 2))
        self.entry_weight = tk.Entry(action_frame, font=("Segoe UI", 11), bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_weight.pack(fill="x", pady=2)

        btn_apply_weight = tk.Button(action_frame, text="Zastosuj ciężar", bg=self.success_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=4, command=self.apply_custom_weight)
        btn_apply_weight.pack(fill="x", pady=(4, 12))

        # Przyciski zarządzania ćwiczeniem
        tk.Frame(action_frame, height=1, bg=self.border_color).pack(fill="x", pady=8)
        
        btn_new_ex = tk.Button(action_frame, text="+ Dodaj Nowe Ćwiczenie", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=5, command=self.open_add_exercise_dialog)
        btn_new_ex.pack(fill="x", pady=2)

        btn_edit_ex = tk.Button(action_frame, text="✏️ Edytuj Ćwiczenie", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", pady=4, command=self.open_edit_exercise_dialog)
        btn_edit_ex.pack(fill="x", pady=2)

        btn_del_ex = tk.Button(action_frame, text="🗑️ Usuń Ćwiczenie", bg="#ef4444", fg="#ffffff", font=("Segoe UI", 9), relief="flat", pady=4, command=self.delete_selected_exercise)
        btn_del_ex.pack(fill="x", pady=2)

    # ================= ZAKŁADKA STATYSTYKI & WYKRESY =================
    def build_stats_tab(self):
        ctrl = tk.Frame(self.tab_stats, bg=self.card_bg, padx=12, pady=10, highlightthickness=1, highlightbackground=self.border_color)
        ctrl.pack(fill="x", pady=(0, 10))

        tk.Label(ctrl, text="Wybierz ćwiczenie do analizy progresu:", font=("Segoe UI", 10, "bold"), fg=self.text_color, bg=self.card_bg).pack(side="left", padx=(0, 8))
        self.cb_stat_exercise = ttk.Combobox(ctrl, state="readonly", width=36)
        self.cb_stat_exercise.pack(side="left", padx=8)
        self.cb_stat_exercise.bind("<<ComboboxSelected>>", self.refresh_stats_chart)

        btn_refresh_chart = tk.Button(ctrl, text="🔄 Odśwież wykres", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9), relief="flat", padx=10, command=self.refresh_stats_chart)
        btn_refresh_chart.pack(side="left", padx=8)

        # Karty KPI nad wykresem
        kpi_frame = tk.Frame(self.tab_stats, bg=self.bg_color)
        kpi_frame.pack(fill="x", pady=(0, 10))

        self.card_max_weight = self.create_kpi_card(kpi_frame, "Aktualny Rekord (Max)", "-- kg")
        self.card_max_1rm = self.create_kpi_card(kpi_frame, "Szacowany 1RM", "-- kg")
        self.card_total_volume = self.create_kpi_card(kpi_frame, "Objętość Całkowita", "-- kg")
        self.card_progress_pct = self.create_kpi_card(kpi_frame, "Przyrost Siły", "-- %")

        # Obszar wykresu na Tkinter Canvas (zero bibliotek zewnętrznych!)
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

    # ================= ZAKŁADKA WAGA CIAŁA =================
    def build_weight_tab(self):
        container = tk.Frame(self.tab_weight, bg=self.bg_color)
        container.pack(fill="both", expand=True)

        # Formularz wpisu wagi po lewej
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

        # Tabela historii wagi po prawej
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

    # ================= ZAKŁADKA USTAWIENIA & JSON =================
    def build_settings_tab(self):
        container = tk.Frame(self.tab_settings, bg=self.card_bg, padx=16, pady=16, highlightthickness=1, highlightbackground=self.border_color)
        container.pack(fill="both", expand=True)

        tk.Label(container, text="⚙️ Konfiguracja Programu na Windows", font=("Segoe UI", 13, "bold"), fg=self.accent_color, bg=self.card_bg).pack(anchor="w", pady=(0, 12))

        # Ścieżka Windows %LOCALAPPDATA%
        tk.Label(container, text="Ścieżka do bazy JSON na Windows:", font=("Segoe UI", 10, "bold"), fg=self.text_color, bg=self.card_bg).pack(anchor="w")
        
        path_box = tk.Frame(container, bg=self.card_bg)
        path_box.pack(fill="x", pady=(4, 12))
        
        self.entry_path = tk.Entry(path_box, font=("Segoe UI", 10), bg="#18181b", fg="#ffffff", insertbackground="#ffffff")
        self.entry_path.insert(0, self.storage.filepath)
        self.entry_path.pack(side="left", fill="x", expand=True, padx=(0, 8))

        btn_browse = tk.Button(path_box, text="Wybierz plik...", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=10, command=self.browse_json_path)
        btn_browse.pack(side="right")

        # Przyciski akcji na pliku
        btn_row = tk.Frame(container, bg=self.card_bg)
        btn_row.pack(fill="x", pady=8)

        btn_export = tk.Button(btn_row, text="📤 Eksportuj kopię JSON", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=6, command=self.export_json_backup)
        btn_export.pack(side="left", padx=(0, 8))

        btn_import = tk.Button(btn_row, text="📥 Importuj plik JSON", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=12, pady=6, command=self.import_json_data)
        btn_import.pack(side="left", padx=8)

        btn_open_folder = tk.Button(btn_row, text="📂 Otwórz folder w Eksploratorze Windows", bg="#3f3f46", fg=self.text_color, font=("Segoe UI", 9), relief="flat", padx=12, pady=6, command=self.open_data_folder_windows)
        btn_open_folder.pack(side="left", padx=8)

        # Informacje dla Windows Desktop Engineer
        tk.Frame(container, height=1, bg=self.border_color).pack(fill="x", pady=16)
        
        info_text = (
            "📌 Architektura Windows 10/11 x64:\n"
            " • Dane są przechowywane bezpiecznie w %LOCALAPPDATA%\\GymTracker\\workout_data.json\n"
            " • Program jest w pełni autonomiczny i nie zależy od bieżącego katalogu roboczego (CWD)\n"
            " • Skompilowanie do pliku wykonywalnego .EXE za pomocą PyInstaller:\n"
            "   pyinstaller --noconsole --onefile gym_tracker.py\n"
            " • Obsługa DPI: Automatyczne skalowanie interfejsu (Shcore.dll / SetProcessDpiAwareness)"
        )
        tk.Label(container, text=info_text, justify="left", font=("Segoe UI", 9), fg=self.text_muted, bg="#18181b", padx=12, pady=10, relief="solid", bd=1).pack(fill="x", pady=8)

    # ================= LOGIKA BIZNESOWA I KONTROLERY =================
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
        # Wyczyść tabelę
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
            
            # 1RM (Epley formula)
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
        self.lbl_selected_ex.config(text=f"Wybrano: {name} ({weight} kg)")
        self.entry_weight.delete(0, tk.END)
        self.entry_weight.insert(0, str(weight))

    def adjust_weight(self, delta: float):
        selected = self.tree_exercises.selection()
        if not selected:
            messagebox.showwarning("Wybór", "Zaznacz ćwiczenie w tabeli, aby zmienić ciężar.")
            return
        idx = int(selected[0])
        day = self.get_current_day()
        if not day:
            return
        
        ex = day["exercises"][idx]
        current_w = float(ex.get("weight", 0.0))
        new_w = max(0.0, round(current_w + delta, 1))
        ex["weight"] = new_w

        # Dodaj wpis do historii
        today = datetime.now().strftime("%Y-%m-%d")
        if "history" not in ex:
            ex["history"] = []
        ex["history"].append({
            "date": today,
            "weight": new_w,
            "reps": ex.get("reps", 8),
            "sets": ex.get("sets", 3)
        })

        self.refresh_plan_view()
        self.tree_exercises.selection_set(str(idx))
        self.on_exercise_selected()
        if self.data["settings"].get("auto_save", True):
            self.storage.save(self.data)

    def apply_custom_weight(self):
        selected = self.tree_exercises.selection()
        if not selected:
            messagebox.showwarning("Wybór", "Zaznacz ćwiczenie w tabeli.")
            return
        try:
            val = float(self.entry_weight.get().replace(",", "."))
        except ValueError:
            messagebox.showerror("Błąd", "Wprowadź prawidłową liczbę dla ciężaru (np. 82.5).")
            return
        
        idx = int(selected[0])
        day = self.get_current_day()
        if not day:
            return
        
        ex = day["exercises"][idx]
        ex["weight"] = round(val, 1)

        today = datetime.now().strftime("%Y-%m-%d")
        if "history" not in ex:
            ex["history"] = []
        ex["history"].append({
            "date": today,
            "weight": round(val, 1),
            "reps": ex.get("reps", 8),
            "sets": ex.get("sets", 3)
        })

        self.refresh_plan_view()
        self.tree_exercises.selection_set(str(idx))
        self.on_exercise_selected()
        if self.data["settings"].get("auto_save", True):
            self.storage.save(self.data)

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
        dialog.title("Dodaj Nowe Ćwiczenie")
        dialog.geometry("380x360")
        dialog.configure(bg=self.card_bg)
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="Nazwa ćwiczenia:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(12, 2))
        ent_name = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_name.pack(fill="x", padx=16)

        tk.Label(dialog, text="Serie:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_sets = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_sets.insert(0, "4")
        ent_sets.pack(fill="x", padx=16)

        tk.Label(dialog, text="Powtórzenia:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_reps = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_reps.insert(0, "8")
        ent_reps.pack(fill="x", padx=16)

        tk.Label(dialog, text="Ciężar początkowy (kg):", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_weight = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_weight.insert(0, "60.0")
        ent_weight.pack(fill="x", padx=16)

        tk.Label(dialog, text="Notatki / Wskazówki:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
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
            new_ex = {
                "name": name,
                "sets": s,
                "reps": r,
                "weight": w,
                "rpe": 8.0,
                "notes": ent_notes.get().strip(),
                "history": [{"date": today, "weight": w, "reps": r, "sets": s}]
            }
            day.setdefault("exercises", []).append(new_ex)
            self.refresh_plan_view()
            self.save_data()
            dialog.destroy()

        tk.Button(dialog, text="Dodaj do planu", bg=self.success_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=6, command=save_new).pack(fill="x", padx=16, pady=16)

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
        dialog.title("Edycja Ćwiczenia")
        dialog.geometry("380x360")
        dialog.configure(bg=self.card_bg)
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="Nazwa ćwiczenia:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(12, 2))
        ent_name = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_name.insert(0, ex.get("name", ""))
        ent_name.pack(fill="x", padx=16)

        tk.Label(dialog, text="Serie:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_sets = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_sets.insert(0, str(ex.get("sets", 4)))
        ent_sets.pack(fill="x", padx=16)

        tk.Label(dialog, text="Powtórzenia:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_reps = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_reps.insert(0, str(ex.get("reps", 8)))
        ent_reps.pack(fill="x", padx=16)

        tk.Label(dialog, text="Ciężar (kg):", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
        ent_weight = tk.Entry(dialog, font=("Segoe UI", 10))
        ent_weight.insert(0, str(ex.get("weight", 0.0)))
        ent_weight.pack(fill="x", padx=16)

        tk.Label(dialog, text="Notatki:", fg=self.text_color, bg=self.card_bg).pack(anchor="w", padx=16, pady=(6, 2))
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
            
            ex["name"] = name
            ex["sets"] = s
            ex["reps"] = r
            ex["weight"] = w
            ex["notes"] = ent_notes.get().strip()
            self.refresh_plan_view()
            self.save_data()
            dialog.destroy()

        tk.Button(dialog, text="Zapisz zmiany", bg=self.accent_color, fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", pady=6, command=save_edit).pack(fill="x", padx=16, pady=16)

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

    # ================= WYKRES I STATYSTYKI =================
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
        
        # Zbierz punkty historii dla wybranego ćwiczenia
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
        
        # Posortuj po dacie
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
            # Pobierz punkty
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

        # Rysuj siatkę poziomą
        steps = 5
        for i in range(steps + 1):
            y_val = min_v + (max_v - min_v) * (i / steps)
            y_px = pad_top + chart_h - (i / steps) * chart_h
            self.canvas_stats.create_line(pad_left, y_px, width - pad_right, y_px, fill="#27272a", dash=(2, 4))
            self.canvas_stats.create_text(pad_left - 10, y_px, text=f"{y_val:.0f} kg", fill="#a1a1aa", anchor="e", font=("Segoe UI", 8))

        # Oblicz współrzędne punktów
        n = len(points)
        coords = []
        for i, p in enumerate(points):
            x_px = pad_left + (i / max(1, n - 1)) * chart_w if n > 1 else pad_left + chart_w / 2
            y_px = pad_top + chart_h - ((p[1] - min_v) / (max_v - min_v)) * chart_h
            coords.append((x_px, y_px, p[0], p[1]))

        # Linia łącząca punkty
        if len(coords) > 1:
            line_pts = []
            for c in coords:
                line_pts.extend([c[0], c[1]])
            self.canvas_stats.create_line(*line_pts, fill="#3b82f6", width=3, smooth=True)

        # Rysuj punkty i etykiety
        for c in coords:
            x, y, dt, w_val = c
            self.canvas_stats.create_oval(x - 5, y - 5, x + 5, y + 5, fill="#60a5fa", outline="#1d4ed8", width=2)
            self.canvas_stats.create_text(x, y - 14, text=f"{w_val:.1f} kg", fill="#ffffff", font=("Segoe UI", 9, "bold"))
            if dt:
                short_dt = dt[-5:] if len(dt) >= 5 else dt
                self.canvas_stats.create_text(x, height - pad_bottom + 14, text=short_dt, fill="#a1a1aa", font=("Segoe UI", 8))

    # ================= OBSŁUGA WAGI CIAŁA =================
    def refresh_weight_table(self):
        for row in self.tree_weight.get_children():
            self.tree_weight.delete(row)

        bws = self.data.get("body_weights", [])
        # Sortowanie po dacie
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

    # ================= ZAPIS / IMPORT / EKSPORT =================
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
                messagebox.showinfo("Eksport", f"Kopia zapasowa zapisana:\n{save_path}")
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

# --- Punkt Wejścia (Main) ---
def main():
    enable_windows_dpi_awareness()
    root = tk.Tk()
    app = GymTrackerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
