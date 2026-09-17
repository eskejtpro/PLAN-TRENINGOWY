# SERVER-CONTRACT: Kontrakt Serwerowy i Interfejs Integracyjny

Niniejszy dokument precyzuje stan backendu oraz przygotowane punkty stykowe dla GymTracker Pro v2.24.0.

---

## 1. Stan Aktualny (Co już istnieje w `server.ts`)
Obecny plik `server.ts` jest w pełni funkcjonalnym serwerem Express.js wspierającym tryb deweloperski (Vite SPA Middleware) oraz produkcyjny. Zawiera działające REST API wspierające aktualizacje aplikacji:

- `GET /api/health` — Sprawdzanie stanu serwera i wersji aplikacji (`version: "2.24.0"`).
- `GET /api/update/check?currentVersion=2.24.0&channel=stable` — Sprawdzanie dostępności aktualizacji w bazie wydań.
- `GET /api/update/download/:version` — Strumieniowanie binarnej paczki aktualizacyjnej z nagłówkami sumy kontrolnej SHA-256.
- `POST /api/update/apply` — Rejestracja pomyślnej instalacji aktualizacji i restartu.
- `POST /api/update/rollback` — Instrukcja przywrócenia poprzedniej wersji.
- `GET /api/update/history` — Pobieranie listy wydań i historii zmian (Changelog).

---

## 2. Elementy Przygotowane w Interfejsie UI (Mock / Stub)
W interfejsie użytkownika zainstalowano komponenty gotowe do podłączenia produkcyjnego backendu:
- **Centrum Synchronizacji w Profilu Zawodnika (`UserProfileView.tsx`)**: Przyciski testu połączenia z serwerem, wskaźniki pingu w czasie rzeczywistym oraz konfiguracja URL serwera synchronizacji.
- **Wskaźnik Połączenia w Sidebarze (`ModernSidebar.tsx`)**: Dioda stanu serwera (Zieleń = Połączono / Bursztyn = Tryb Lokalny) z podglądem opóźnienia ms.
- **Panel Aktualizacji Serwerowych (`AppUpdateServerPanel.tsx`)**: Pełny interfejs obsługi sprawdzania i instalacji wydań serwerowych.

---

## 3. Czego Jeszcze Nie Ma (Zakres Przyszły)
W wersji 2.24.0 **NIE MA** i nie powinno być wdrażane przed przekazaniem projektu:
- Produkcyjnej bazy danych chmury (np. PostgreSQL / Firestore).
- Systemu uwierzytelniania użytkowników, tokenów JWT ani kont OAuth.
- Silnika płatności ani subskrypcji.
- Dedykowanej aplikacji mobilnej na system Android (Kotlin / Compose).

---

## 4. Przyszły Model Synchronizacji i Statusu
- **Tryb Offline-First (Gwarancja Suwerenności Danych)**: Aplikacja MUSI działać w 100% lokalnie bez połączenia z siecią, opierając się na pliku `workout_data.json`.
- **Przyszła Synchronizacja P2P / Server Sync**:
  Podczas nawiązania połączenia z serwerem, klient wyśle skrót SHA-256 lokalnego dokumentu danych. W przypadku różnic nastąpi dwukierunkowe scalanie (Merge Engine) z rozstrzyganiem znaczników czasu (`updatedAt`).

---

## 5. Architektura Przyszłego Agenta AI
- Obecny silnik porad treningowych (`aiAgentEngine.ts`) działa w 100% lokalnie w przeglądarce/rendererze bez wywoływań sieciowych.
- Przyszły agent AI po podłączeniu serwera będzie przekazywał zapytania użytkownika przez bezpieczny proxy endpoint w `server.ts` (np. `/api/ai/recommendations`) zachowując ukryte klucze API po stronie serwera.
