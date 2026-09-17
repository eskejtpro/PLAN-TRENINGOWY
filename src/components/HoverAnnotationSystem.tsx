import React, { useState, useEffect, useRef } from 'react';
import { Info, HelpCircle, X, Clock, ArrowRight, ShieldCheck, Dumbbell, Settings, Sliders, Activity } from 'lucide-react';

export interface AnnotationItem {
  title: string;
  description: string;
  category?: string;
  tip?: string;
  shortcut?: string;
}

interface HoverAnnotationSystemProps {
  enabled: boolean;
  onOpenSettings?: () => void;
  isDark?: boolean;
}

// Built-in comprehensive dictionary of elements and features in GymTracker Pro
export const FEATURE_DICTIONARY: Record<string, AnnotationItem> = {
  // Navigation
  'nav-plan': {
    title: 'Plan Treningowy & Rejestr Serii',
    description: 'Główny moduł roboczy programu. Pozwala na bieżąco odznaczać wykonane serie, wprowadzać ciężar, powtórzenia i RPE oraz śledzić szacowany 1RM w czasie rzeczywistym.',
    category: 'Nawigacja',
    tip: 'Możesz dodawać nowe ćwiczenia i płynnie przełączać się między dniami mezocyklu.',
  },
  'nav-stats': {
    title: 'Analityka & Progres Siły',
    description: 'Zaawansowane wykresy tonażu, szacowanego 1RM (wg formuły Epleya), wskaźniki stagnacji oraz markery rekordów życiowych (PR).',
    category: 'Analityka',
    tip: 'Pozwala ocenić czy periodyzacja przynosi pożądany wzrost siły i obciążenia.',
  },
  'nav-muscle': {
    title: 'Rozkład Partii Mięśniowych',
    description: 'Analiza proporcji serii roboczych przypadających na poszczególne grupy mięśniowe (klatka, plecy, nogi, barki, ramiona) oraz balans Push/Pull/Legs.',
    category: 'Analityka',
    tip: 'Pomaga wykryć dysproporcje objętościowe w planie treningowym.',
  },
  'nav-weight': {
    title: 'Dziennik Masy Ciała & Obwody',
    description: 'Rejestracja wagi porannej, wykresy średniej kroczącej (EMA) oraz precyzyjne pomiary obwodów z podziałem na stronę lewą i prawą.',
    category: 'Sylwetka',
    tip: 'Filtruje anomalie pomiarowe medianą z 3 ostatnich pomiarów.',
  },
  'nav-cycles': {
    title: 'Kalendarz Dawek & Protokoły',
    description: 'Dziennik podawanych środków, dawek (mg/IU), iniekcji domięśniowych/podskórnych oraz wykres szacowanego stężenia we krwi.',
    category: 'Zdrowie',
    tip: 'Zawiera kalkulator okresu półtrwania i stężenia substancji czynnej.',
  },
  'nav-exercises': {
    title: 'Katalog & Baza Ćwiczeń',
    description: 'Baza wszystkich ćwiczeń w programie wraz z przypisanymi partiami mięśniowymi, domyślnymi powtórzeniami i celami siłowymi.',
    category: 'Baza Ćwiczeń',
    tip: 'Możesz edytować parametry ćwiczeń i ich domyślne obciążenia.',
  },
  'nav-profile': {
    title: 'Centrum Synchronizacji & Badania Krwi',
    description: 'Węzeł lokalnej synchronizacji Windows 10 ↔ Android, dokładna instrukcja parowania, test połączenia (Ping) oraz rejestr dat badań krwi z notatkami i plikami JSON.',
    category: 'Synchronizacja & Badania',
    tip: 'Znajdziesz tu kod parowania, adres IP i komendę dla zapory Windows Defender.',
  },
  'nav-settings': {
    title: 'Ustawienia Programu & Kopie Zapasowe',
    description: 'Zarządzanie plikiem workout_data.json, kopiami zapasowymi (Auto-Backup), jednostkami (kg/lbs), opcjami analiz IBCA oraz interfejsem.',
    category: 'Ustawienia',
    tip: 'Tutaj możesz włączyć lub wyłączyć te podpowiedzi po najechaniu myszką.',
  },
  'nav-python': {
    title: 'Kod Python Desktop (EXE)',
    description: 'Podgląd i eksport kodu źródłowego w Pythonie (Tkinter + SQLite) dla Windows 10/11 z gotowym instalatorem PyInstaller.',
    category: 'Narzędzia',
    tip: 'Pozwala na natywne uruchamianie aplikacji w środowisku Windows bez przeglądarki.',
  },

  // Header Actions
  'btn-header-add-exercise': {
    title: 'Dodaj Nowe Ćwiczenie',
    description: 'Otwiera formularz dodawania nowego ćwiczenia do aktualnie wybranego dnia treningowego (nazwa, kategoria, serie, powtórzenia, ciężar bazowy).',
    category: 'Akcja Treningowa',
    shortcut: 'Kliknij aby otworzyć okno',
  },
  'btn-header-quick-backup': {
    title: 'Szybki Backup (Kopia Zapasowa)',
    description: 'Tworzy natychmiastową, zrzutową kopię bezpieczeństwa całego pliku workout_data.json ze stemplem daty i godziny.',
    category: 'Bezpieczeństwo Danych',
    tip: 'Kopia jest zapisywana w folderze Backups w %LOCALAPPDATA%.',
  },
  'btn-header-export-json': {
    title: 'Eksport Danych JSON',
    description: 'Pobiera plik workout_data.json ze wszystkimi wpisami, seriami i ustawieniami na dysk Twojego komputera.',
    category: 'Eksport',
    tip: 'Przydatne przed aktualizacją systemu lub formatowaniem dysku.',
  },
  'app-version-badge': {
    title: 'Wersja GymTracker Pro',
    description: 'Aktualnie uruchomiona wersja kompilacji aplikacji dla Windows 10 64-bit z modułem analizy IBCA i bezpieczną synchronizacją Android.',
    category: 'Informacja',
  },

  // Plan specifics
  'rpe-badge': {
    title: 'Wskaźnik RPE (Rate of Perceived Exertion)',
    description: 'Skala subiektywnego odczuwania wysiłku (od 6 do 10). RPE 10 oznacza absolutny maks (RIR 0), a RPE 8 to 2 powtórzenia w zapasie (RIR 2).',
    category: 'Metodyka Treningowa',
    tip: 'Pozwala precyzyjnie autoregulować ciężar w zależności od dyspozycji dnia.',
  },
  'e1rm-metric': {
    title: 'Szacowane 1RM (One Rep Max)',
    description: 'Maksymalny teoretyczny ciężar na 1 powtórzenie obliczany wzorem Epleya: Ciężar × (1 + Powtórzenia / 30).',
    category: 'Wskaźnik Siły',
    tip: 'Pozwala śledzić postęp bez konieczności niebezpiecznych sprawdzianów na 1 powtórzenie.',
  },
  'tonnage-metric': {
    title: 'Tonaż Objętościowy (Volume Load)',
    description: 'Suma wykonanej pracy mechanicznej: Ciężar × Powtórzenia dla wszystkich ukończonych serii danego ćwiczenia lub treningu.',
    category: 'Objętość',
    tip: 'Wzrost tonażu przy zachowaniu prawidłowej techniki jest kluczem do hipertrofii.',
  },
  'btn-save-set': {
    title: 'Zapisz / Oznacz Serię',
    description: 'Zaznacza serię jako poprawnie wykonaną i natychmiast przelicza tonaż oraz aktualizuje wykresy progresji.',
    category: 'Rejestracja',
  },
  'input-weight': {
    title: 'Pole Ciężaru Roboczego',
    description: 'Wprowadź ciężar użyty w danej serii w kilogramach (lub funtach zależnie od ustawień).',
    category: 'Parametr Serii',
  },
  'input-reps': {
    title: 'Pole Liczby Powtórzeń',
    description: 'Wprowadź liczbę poprawnie wykonanych powtórzeń w danej serii treningowej.',
    category: 'Parametr Serii',
  },
  'btn-exercise-history': {
    title: 'Historia Wykonania Ćwiczenia',
    description: 'Otwiera wykres i pełną listę wszystkich wcześniejszych sesji tego ćwiczenia, pokazując jak rósł Twój ciężar w czasie.',
    category: 'Analiza Progresu',
  },

  // IBCA & Analysis Settings (Detailed breakdown for each setting)
  'btn-reset-analysis-settings': {
    title: 'Przywróć Domyślne Ustawienia Analiz',
    description: 'Resetuje wszystkie przełączniki modułu analiz do zaleceń bazowych (tylko ukończone dni, alerty balansu włączone, domyślna metryka: postęp %).',
    category: 'Ustawienia Analiz IBCA',
    tip: 'Przydatne, jeśli omyłkowo wyłączyłeś kluczowe wykresy lub kolumny.',
  },
  'chk-analysis-only-completed': {
    title: 'Tylko Zatwierdzone Dni Treningowe',
    description: 'Wyklucza z wykresów i statystyk planowane, ale jeszcze nieodbyte treningi. Dzięki temu zaplanowana przyszła objętość nie zafałszowuje realnie wykonanego tonażu.',
    category: 'Jakość Danych Analizy',
    tip: 'Zalecane: Włączone, aby tonaż odzwierciedlał faktyczny pot wylany na siłowni.',
  },
  'chk-analysis-include-partial-history': {
    title: 'Uwzględniaj Częściowe Serie Po Odhaczeniu',
    description: 'Gdy trenujesz i odznaczysz tylko 2 z 4 serii, system natychmiast doliczy te 2 serie do statystyk dnia, nie czekając na zakończenie całego treningu.',
    category: 'Jakość Danych Analizy',
    tip: 'Przydatne przy przerwanych sesjach lub analizie w trakcie trwania treningu.',
  },
  'chk-analysis-hide-empty': {
    title: 'Ukrywaj Puste Partie Mięśniowe',
    description: 'Usuwa z zestawień i wykresów kołowych partie, dla których w danym okresie nie zarejestrowano żadnej wykonanej serii (np. 0 serii na łydki).',
    category: 'Przejrzystość Wykresów',
    tip: 'Zapobiega zaśmiecaniu wykresu zerowymi pozycjami.',
  },
  'chk-analysis-show-alerts': {
    title: 'Pokazuj Alerty Balansu Objętości',
    description: 'Weryfikuje proporcje Push vs. Pull oraz mięśni agonistycznych/antagonistycznych. Wyświetla ostrzeżenie w razie znacznej przewagi jednej partii.',
    category: 'Prewencja Kontuzji',
    tip: 'Pomaga chronić stawy barkowe i kręgosłup przed dysbalansem mięśniowym.',
  },
  'chk-analysis-show-bodyweight': {
    title: 'Pokazuj Zmianę Masy Ciała w Analizach',
    description: 'Nakłada wykres średniej wagi ciała na wykresy siłowe, pozwalając ocenić czy wzrost siły wynika ze wzrostu masy, czy czystej adaptacji nerwowej.',
    category: 'Korelacja Sylwetkowa',
    tip: 'Kluczowe przy kalkulacji wskaźnika siły względnej (ciężar / waga).',
  },
  'chk-analysis-show-1rm': {
    title: 'Pokazuj Szacowany 1RM (One Rep Max)',
    description: 'Włącza kolumnę i krzywą szacowanego rekordu maksymalnego obliczanego wzorem Epleya na podstawie najcięższej serii danego dnia.',
    category: 'Wskaźnik Siły',
    tip: 'Pozwala na bieżąco monitorować szczyt siły w każdym mezocyklu.',
  },
  'chk-analysis-round-values': {
    title: 'Zaokrąglaj Wartości Wyników',
    description: 'Zaokrągla ułamkowe wartości tonażu i procentów do liczb całkowitych lub jednego miejsca po przecinku, zwiększając czytelność raportów.',
    category: 'Formatowanie Wyników',
  },
  'chk-analysis-auto-refresh': {
    title: 'Automatyczne Odświeżanie Po Zmianie',
    description: 'Natychmiast po zapisaniu serii lub edycji ćwiczenia przelicza wszystkie wskaźniki analityczne w tle bez konieczności przeładowania widoku.',
    category: 'Wydajność & Płynność',
  },
  'input-analysis-start-week': {
    title: 'Od Tygodnia (Początek Zakresu Analizy)',
    description: 'Określa numer pierwszego tygodnia brany pod uwagę przy generowaniu wykresów i kalkulacji przyrostu siły.',
    category: 'Zakres Analizy',
    tip: 'Ustaw na początek aktualnego mezocyklu, aby wyizolować obecny blok treningowy.',
  },
  'input-analysis-end-week': {
    title: 'Do Tygodnia (Koniec Zakresu Analizy)',
    description: 'Określa numer końcowego tygodnia zakresu analitycznego (domyślnie 999 = wszystkie dostępne tygodnie).',
    category: 'Zakres Analizy',
  },
  'select-analysis-default-metric': {
    title: 'Domyślna Metryka Wykresu Głównego',
    description: 'Wybór wiodącego wskaźnika prezentowanego na głównym wykresie: Procent Progresu (%), Tonaż Objętościowy (kg) lub Liczba Wykonanych Serii.',
    category: 'Konfiguracja Prezentacji',
  },
  'chk-analysis-show-data-quality-warnings': {
    title: 'Ostrzeżenia Jakości i Spójności Danych',
    description: 'Wyświetla komunikaty diagnostyczne w razie wykrycia podejrzanych skoków ciężaru, brakujących wpisów w historii lub anomalii pomiarowych.',
    category: 'Diagnostyka Danych',
  },
  'chk-analysis-require-history-for-completed': {
    title: 'Wymagaj Historii dla Dnia Ukończonego',
    description: 'Dzień treningowy może zostać uznany za ukończony w analizie tylko wtedy, gdy zawiera faktycznie zarejestrowane serie w historii.',
    category: 'Walidacja Rekordów',
    tip: 'Zapobiega przypadkowemu oznaczaniu pustych dni jako odbyte.',
  },
  'chk-analysis-warn-missing-history': {
    title: 'Ostrzegaj o Brakującej Historii Ćwiczenia',
    description: 'Sygnalizuje ćwiczenia, które zaplanowano w treningu, ale nie wprowadzono dla nich żadnego zapisu serii roboczej.',
    category: 'Diagnostyka Danych',
  },
  'chk-analysis-show-execution-summary': {
    title: 'Podsumowanie Wykonania Mezocyklu',
    description: 'Pokazuje syntetyczną kartę podsumowującą łączną liczbę odbytych sesji, wykonanych serii, powtórzeń oraz średni czas trwania bloku.',
    category: 'Podsumowanie',
  },
  'chk-analysis-week-comparison': {
    title: 'Tabela Porównania Tygodni',
    description: 'Pozwala zestawić ze sobą dwa dowolne tygodnie (np. Tydzień 1 i Tydzień 4) i porównać różnicę w tonażu, powtórzeniach i ciężarach roboczych.',
    category: 'Porównania Okresowe',
    tip: 'Idealne narzędzie do weryfikacji progresywnego przeładowania przed deloadem.',
  },
  'chk-analysis-weekly-tonnage': {
    title: 'Wykres Tonażu Tygodniowego',
    description: 'Wizualizuje sumaryczny tonaż (kg podniesione w całym tygodniu) w formie słupków z linią trendu progresji objętości.',
    category: 'Wykresy Objętości',
  },
  'chk-analysis-weekly-metrics': {
    title: 'Metryki Tygodniowe (Dni, Ćwiczenia, Serie)',
    description: 'Włącza kafelki ze statystykami: liczba zrealizowanych jednostek treningowych, zróżnicowanie ćwiczeń oraz średnia objętość na sesję.',
    category: 'Wskaźniki Tygodniowe',
  },
  'chk-analysis-executed-days': {
    title: 'Kolumna: Wykonane Dni',
    description: 'Wyświetla w tabeli analitycznej liczbę ukończonych dni w danym tygodniu treningowym.',
    category: 'Kolumny Tabeli',
  },
  'chk-analysis-executed-exercises': {
    title: 'Kolumna: Liczba Ćwiczeń',
    description: 'Pokazuje w tabeli analitycznej liczbę unikalnych ćwiczeń faktycznie wykonanych w danym mikrocyklu.',
    category: 'Kolumny Tabeli',
  },
  'chk-analysis-executed-sets': {
    title: 'Kolumna: Wykonane Serie',
    description: 'Pokazuje w tabeli sumę zrealizowanych serii roboczych (Direct Sets) z wyłączeniem serii rozgrzewkowych.',
    category: 'Kolumny Tabeli',
  },
  'chk-analysis-executed-reps': {
    title: 'Kolumna: Wykonane Powtórzenia',
    description: 'Prezentuje łączną sumę poprawnie zaliczonych powtórzeń we wszystkich seriach roboczych w danym tygodniu.',
    category: 'Kolumny Tabeli',
  },
  'chk-analysis-volume-delta': {
    title: 'Zmiana Tonażu Tygodnia (Volume Delta Δ)',
    description: 'Oblicza bezwzględną oraz procentową różnicę tonażu w stosunku do poprzedniego tygodnia (+kg / -kg).',
    category: 'Wskaźnik Progresji',
    tip: 'Pozwala kontrolować bezpieczne tempo wzrostu objętości (optymalnie 5-15% na tydzień).',
  },
  'chk-analysis-data-confidence': {
    title: 'Wskaźnik Wiarygodności Danych',
    description: 'Ocenia kompletność wpisów w procentach (np. 95% = niemal wszystkie serie miały zapisany ciężar, powtórzenia i RPE).',
    category: 'Jakość Danych Analizy',
  },
  'chk-analysis-best-e1rm': {
    title: 'Najlepszy Szacowany e1RM w Zakresie',
    description: 'Prezentuje najwyższy zarejestrowany wynik siłowy 1RM w wybranym okresie dla każdego ćwiczenia.',
    category: 'Wskaźnik Siły',
  },
  'chk-analysis-latest-result': {
    title: 'Ostatni Wynik Roboczy',
    description: 'Pokazuje najświeższy wpis treningowy (ciężar × powtórzenia) z ostatniej odbytej sesji.',
    category: 'Podgląd Ostatniej Sesji',
  },
  'chk-analysis-trend-line': {
    title: 'Linia Trendu Siłowego (Regresja Liniowa)',
    description: 'Wykreśla matematyczną linię trendu progresji siły, wskazując czy forma rośnie, stabilizuje się czy wykazuje przemęczenie.',
    category: 'Matematyka Progresji',
  },
  'chk-analysis-pr-markers': {
    title: 'Markery Rekordów Życiowych (PR)',
    description: 'Wyróżnia na wykresach gwiazdkami lub punktami sesje, w których pobito dotychczasowy rekord życiowy w danym ćwiczeniu.',
    category: 'Motywacja & Osiągnięcia',
  },
  'select-analysis-pr-metric': {
    title: 'Kryterium Uznawania Rekordu (PR Metric)',
    description: 'Wybór czym jest rekord: Szacowany 1RM (e1RM), Bezwzględny Ciężar Maksymalny (kg) czy Tonaż Serii (Volume PR).',
    category: 'Kryteria Rekordów',
  },
  'input-analysis-stagnation-window': {
    title: 'Okno Detekcji Stagnacji (Tygodnie)',
    description: 'Liczba kolejnych tygodni bez progresu siłowego, po przekroczeniu której program zgłasza potrzebę deloadu lub zmiany bodźca.',
    category: 'Autoregulacja Mezocyklu',
    tip: 'Domyślnie: 4 tygodnie. Pozwala w porę zareagować na plateau.',
  },
  'input-analysis-stagnation-min': {
    title: 'Minimalna Liczba Sesji dla Stagnacji',
    description: 'Minimalna liczba odbytych treningów danego boju wymagana, aby program ocenił czy wystąpiła stagnacja.',
    category: 'Autoregulacja Mezocyklu',
  },
  'chk-analysis-regularity': {
    title: 'Wykres Regularności Treningowej',
    description: 'Monitoruje systematyczność treningów w ujęciu tygodniowym, sprawdzając czy trzymasz się zaplanowanego harmonogramu.',
    category: 'Dyscyplina Treningowa',
  },
  'input-analysis-regularity-target': {
    title: 'Docelowy Procent Regularności (%)',
    description: 'Poziom realizacji planu uważany za sukces (domyślnie 80% oznacza odbycie 4 z 5 zaplanowanych treningów).',
    category: 'Dyscyplina Treningowa',
  },
  'chk-analysis-muscle-frequency': {
    title: 'Częstotliwość Trenowania Partii (Dni/Tydzień)',
    description: 'Sprawdza ile razy w tygodniu każda grupa mięśniowa otrzymuje bodziec hipertroficzny (optymalnie 2-3 razy na partię).',
    category: 'Optymalizacja Hipertrofii',
  },
  'chk-analysis-monthly-comparison': {
    title: 'Zestawienie Miesięczne Objętości',
    description: 'Grupowanie wyników w ujęciu miesięcy kalendarzowych, ułatwiające długoterminową ewaluację makrocyklu.',
    category: 'Długoterminowa Analityka',
  },
  'select-analysis-monthly-metric': {
    title: 'Metryka Porównania Miesięcznego',
    description: 'Wskaźnik porównywany między miesiącami: łączny Tonaż (kg), liczba Serii czy suma Powtórzeń.',
    category: 'Długoterminowa Analityka',
  },
  'chk-analysis-period-comparison': {
    title: 'Porównanie Dowolnych Bloków Treningowych',
    description: 'Umożliwia zestawienie np. 6-tygodniowego bloku objętościowego z 4-tygodniowym blokiem intensyfikacji.',
    category: 'Periodyzacja',
  },
  'select-analysis-period-metric': {
    title: 'Metryka Porównania Bloków',
    description: 'Wskaźnik porównawczy dla bloków: Tonaż, Serie, Powtórzenia lub Dni Treningowe.',
    category: 'Periodyzacja',
  },
  'input-analysis-min-executed-sets': {
    title: 'Próg Minimalnej Liczby Serii',
    description: 'Minimalna liczba wykonanych serii w ćwiczeniu, aby sesja została zaliczona do wykresów progresji (odfiltrowuje serie próbne).',
    category: 'Filtracja Danych',
  },
  'input-analysis-warn-volume-jump-pct': {
    title: 'Próg Ostrzeżenia o Skoku Tonażu (%)',
    description: 'Ostrzega, gdy tonaż wzrośnie z tygodnia na tydzień o więcej niż zadany procent (np. +30%), co grozi przeciążeniem ścięgien i więzadeł.',
    category: 'Bezpieczeństwo & Zdrowie',
  },
  'input-analysis-trend-window-weeks': {
    title: 'Szerokość Okna Ruchomego Trendu (Tygodnie)',
    description: 'Liczba ostatnich tygodni wykorzystywana do wygładzania wahań i kalkulacji lokalnej średniej trendu siły.',
    category: 'Wygładzanie Statystyczne',
  },
  'chk-confirm-before-delete': {
    title: 'Wymagaj Potwierdzenia Przy Usuwaniu',
    description: 'Chroni przed przypadkowym usunięciem ćwiczenia, serii lub tygodnia treningowego poprzez wyświetlenie okna dialogowego.',
    category: 'Ochrona Danych',
  },
  'chk-hover-annotations': {
    title: 'Interaktywne Adnotacje po Najechaniu Myszką',
    description: 'Włącza lub wyłącza wyskakujące karty informacyjne przy najechaniu kursorem na dowolny element. Po 5 sekundach braku ruchu myszki karta znika automatycznie.',
    category: 'Ustawienia Interfejsu',
    tip: 'Możesz wyłączyć tę funkcję w każdej chwili, jeśli nie potrzebujesz podpowiedzi.',
  },
  'chk-remember-last-view': {
    title: 'Zapamiętaj Ostatni Otwarty Widok',
    description: 'Po ponownym uruchomieniu programu przywraca dokładnie ten ekran, na którym zakończyłeś pracę (np. Progres, Waga lub Profil).',
    category: 'Wygoda Użytkowania',
  },
  'select-startup-view': {
    title: 'Domyślny Widok Startowy Aplikacji',
    description: 'Ekran otwierany przy starcie programu, jeśli opcja zapamiętywania ostatniego widoku jest wyłączona.',
    category: 'Uruchamianie Programu',
  },
};

export const HoverAnnotationSystem: React.FC<HoverAnnotationSystemProps> = ({
  enabled,
  onOpenSettings,
  isDark = true,
}) => {
  const [activeAnnotation, setActiveAnnotation] = useState<{
    item: AnnotationItem;
    x: number;
    y: number;
    placement: 'top' | 'bottom';
  } | null>(null);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);
  const isOverPopoverRef = useRef(false);
  const activeAnnotationRef = useRef(activeAnnotation);

  // Keep ref synchronized
  useEffect(() => {
    activeAnnotationRef.current = activeAnnotation;
  }, [activeAnnotation]);

  // Starts or resets the 5-second inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // 5 seconds (5000ms) of mouse inactivity -> automatically close annotation
    inactivityTimerRef.current = setTimeout(() => {
      setActiveAnnotation(null);
      currentTargetRef.current = null;
    }, 5000);
  };

  // Helper to extract annotation info from an element
  const resolveAnnotation = (el: HTMLElement): AnnotationItem | null => {
    // 1. Explicit data attributes
    const explicitTitle = el.getAttribute('data-annotation-title');
    const explicitDesc = el.getAttribute('data-annotation-desc');
    if (explicitTitle && explicitDesc) {
      return {
        title: explicitTitle,
        description: explicitDesc,
        category: el.getAttribute('data-annotation-category') || 'Funkcja Programu',
        tip: el.getAttribute('data-annotation-tip') || undefined,
        shortcut: el.getAttribute('data-annotation-shortcut') || undefined,
      };
    }

    // 2. ID match in dictionary
    if (el.id && FEATURE_DICTIONARY[el.id]) {
      return FEATURE_DICTIONARY[el.id];
    }

    // 3. Known special attributes or classes
    const viewAttr = el.getAttribute('data-view');
    if (viewAttr && FEATURE_DICTIONARY[`nav-${viewAttr}`]) {
      return FEATURE_DICTIONARY[`nav-${viewAttr}`];
    }

    // Check parent tree up to 4 levels
    let parent = el.parentElement;
    for (let i = 0; i < 4 && parent; i++) {
      if (parent.id && FEATURE_DICTIONARY[parent.id]) {
        return FEATURE_DICTIONARY[parent.id];
      }
      const parentView = parent.getAttribute('data-view');
      if (parentView && FEATURE_DICTIONARY[`nav-${parentView}`]) {
        return FEATURE_DICTIONARY[`nav-${parentView}`];
      }
      const pTitle = parent.getAttribute('data-annotation-title');
      const pDesc = parent.getAttribute('data-annotation-desc');
      if (pTitle && pDesc) {
        return {
          title: pTitle,
          description: pDesc,
          category: parent.getAttribute('data-annotation-category') || 'Funkcja Programu',
          tip: parent.getAttribute('data-annotation-tip') || undefined,
          shortcut: parent.getAttribute('data-annotation-shortcut') || undefined,
        };
      }
      parent = parent.parentElement;
    }

    // 4. Standard title or aria-label attribute with meaningful text
    const titleAttr = el.getAttribute('title') || el.getAttribute('aria-label');
    if (titleAttr && titleAttr.trim().length > 3) {
      return {
        title: titleAttr,
        description: `Element interaktywny w aplikacji GymTracker Pro: ${titleAttr}.`,
        category: el.tagName === 'BUTTON' ? 'Przycisk' : el.tagName === 'INPUT' ? 'Pole Wprowadzania' : 'Interfejs',
      };
    }

    // 5. Detect interactive buttons or inputs with identifiable Polish labels
    const innerText = (el.innerText || '').trim();
    if (el.tagName === 'BUTTON' && innerText.length > 2 && innerText.length < 35) {
      if (innerText.includes('Dodaj Ćwiczenie')) return FEATURE_DICTIONARY['btn-header-add-exercise'];
      if (innerText.includes('Szybki Backup') || innerText.includes('Backup')) return FEATURE_DICTIONARY['btn-header-quick-backup'];
      if (innerText.includes('Eksport JSON')) return FEATURE_DICTIONARY['btn-header-export-json'];

      return {
        title: innerText,
        description: `Przycisk wykonujący akcję: "${innerText}" w bieżącym widoku.`,
        category: 'Przycisk Akcji',
      };
    }

    return null;
  };

  useEffect(() => {
    if (!enabled) {
      setActiveAnnotation(null);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    // Track mouse movement to reset the 5-second inactivity timer whenever mouse moves
    const handleGlobalMouseMove = () => {
      if (activeAnnotationRef.current) {
        resetInactivityTimer();
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (isOverPopoverRef.current) return;
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find closest interactive element
      const interactiveEl = target.closest<HTMLElement>(
        'button, a, input, select, label, [role="button"], [data-annotation-title], [data-view], [id^="nav-"], [id^="btn-"], [id^="chk-"], [id^="select-"], [id^="input-"], .interactive-target, #app-version-badge'
      ) || target;

      if (!interactiveEl) return;

      const annotation = resolveAnnotation(interactiveEl);
      if (!annotation) {
        // Clear if not over popover
        if (!isOverPopoverRef.current) {
          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            if (!isOverPopoverRef.current) {
              setActiveAnnotation(null);
              if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            }
          }, 150);
        }
        return;
      }

      currentTargetRef.current = interactiveEl;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

      // Short debounce (200ms) for snappy response
      hoverTimerRef.current = setTimeout(() => {
        if (!currentTargetRef.current) return;
        const rect = currentTargetRef.current.getBoundingClientRect();
        
        // Calculate coordinates
        const popoverWidth = 340;
        let x = rect.left + rect.width / 2 - popoverWidth / 2;
        // Clamp to screen boundaries
        if (x < 12) x = 12;
        if (x + popoverWidth > window.innerWidth - 12) {
          x = window.innerWidth - popoverWidth - 12;
        }

        // Check if top or bottom has more room
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const placement: 'top' | 'bottom' = spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom';
        const y = placement === 'bottom' ? rect.bottom + 8 : rect.top - 8;

        setActiveAnnotation({
          item: annotation,
          x,
          y,
          placement,
        });

        // Start the 5-second inactivity countdown immediately when displayed
        resetInactivityTimer();
      }, 200);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      // If moving into the popover itself, keep it open
      if (related && related.closest('#global-hover-annotation-card')) {
        return;
      }

      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        if (!isOverPopoverRef.current) {
          setActiveAnnotation(null);
          currentTargetRef.current = null;
          if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        }
      }, 250);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [enabled]);

  if (!enabled || !activeAnnotation) return null;

  const { item, x, y, placement } = activeAnnotation;

  return (
    <aside
      id="global-hover-annotation-card"
      aria-label="Podgląd adnotacji"
      onMouseEnter={() => {
        isOverPopoverRef.current = true;
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        resetInactivityTimer();
      }}
      onMouseLeave={() => {
        isOverPopoverRef.current = false;
        setActiveAnnotation(null);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      }}
      onMouseMove={resetInactivityTimer}
      style={{
        left: `${x}px`,
        top: placement === 'bottom' ? `${y}px` : undefined,
        bottom: placement === 'top' ? `${window.innerHeight - y}px` : undefined,
      }}
      className={`fixed z-50 w-84 max-w-[calc(100vw-24px)] rounded-2xl p-4 shadow-2xl border transition-all duration-150 animate-in fade-in zoom-in-95 pointer-events-auto select-none ${
        isDark
          ? 'bg-slate-900/95 backdrop-blur-xl border-slate-700/80 text-slate-100 shadow-slate-950/80'
          : 'bg-white/95 backdrop-blur-xl border-slate-300 text-slate-900 shadow-xl'
      }`}
    >
      {/* Header with Category & Close */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Info className="w-3.5 h-3.5" />
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {item.category || 'Do czego służy'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1" title="Adnotacja zniknie automatycznie po 5 sekundach bezruchu myszki">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>5s</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveAnnotation(null);
              if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            }}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title="Zamknij podpowiedź"
            id="btn-close-annotation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-extrabold tracking-tight mb-1 text-emerald-400">
        {item.title}
      </h4>

      {/* Description */}
      <p className={`text-xs leading-relaxed mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {item.description}
      </p>

      {/* Tip or shortcut if available */}
      {item.tip && (
        <div className={`p-2 rounded-xl mb-3 text-[11px] flex items-start gap-2 border ${
          isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>{item.tip}</span>
        </div>
      )}

      {/* Footer: Inactivity hint & Settings link */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 px-0.5">
        <span className="flex items-center gap-1 text-slate-400">
          <Clock className="w-2.5 h-2.5 text-emerald-400" />
          <span>Znika po 5s bezruchu</span>
        </span>
        {onOpenSettings && (
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              setActiveAnnotation(null);
            }}
            className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Ustawienia</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </aside>
  );
};
