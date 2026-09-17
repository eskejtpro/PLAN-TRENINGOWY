@echo off
echo =====================================================================
echo    GymTracker Pro - Kompilator Windows 10/11 x64 do pliku EXE
echo =====================================================================
echo.

:: Sprawdzenie obecnosci Pythona
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [BLAD] Python nie jest zainstalowany lub nie jest dodany do PATH!
    echo Zainstaluj Python z https://www.python.org i zaznacz "Add Python to PATH".
    pause
    exit /b 1
)

echo [1/3] Sprawdzanie i instalacja wymaganych bibliotek z requirements.txt...
pip install -r requirements.txt --upgrade
if %errorlevel% neq 0 (
    echo [OSTRZEZENIE] Niektore biblioteki z requirements.txt nie mogly zostac pobrane. Proba instalacji PyInstaller...
    pip install --upgrade pyinstaller
)

echo.
echo [2/3] Kompilacja GymTracker do pojedynczego pliku .EXE...
:: Flagi:
:: --noconsole : Ukrywa czarne okno terminala cmd, pozostawiajac tylko czyste GUI
:: --onefile   : Pakuje caly program ze wszystkimi zasobami do jednego pliku .exe
:: --clean     : Czysci cache przed budowaniem
pyinstaller --noconsole --onefile --clean --name "GymTrackerPro" gym_tracker.py

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [SUKCES] Aplikacja zostala zbudowana pomyslnie!
    echo Plik wykonywalny znajduje sie w folderze:
    echo   dist\GymTrackerPro.exe
    echo =====================================================================
    echo.
    echo Mozesz teraz skopiowac plik GymTrackerPro.exe w dowolne miejsce na dysku.
    echo Dane beda automatycznie zapisywane w %%LOCALAPPDATA%%\GymTracker\workout_data.json
) else (
    echo.
    echo [BLAD] Wystapil blad podczas budowania pliku EXE.
)

pause
