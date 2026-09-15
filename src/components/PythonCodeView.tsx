import React, { useState } from 'react';
import { 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Code2, 
  Play, 
  FileText, 
  CheckCircle2,
  PackageCheck,
  Sparkles,
  Zap,
  LayoutTemplate
} from 'lucide-react';

interface PythonCodeViewProps {
  pythonCode: string;
  batchScript: string;
  requirementsTxt: string;
  installScript: string;
}

export const PythonCodeView: React.FC<PythonCodeViewProps> = ({ 
  pythonCode, 
  batchScript,
  requirementsTxt,
  installScript 
}) => {
  const [activeTab, setActiveTab] = useState<'python' | 'req' | 'install' | 'bat' | 'arch'>('req');
  const [copied, setCopied] = useState(false);

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'python': return pythonCode;
      case 'req': return requirementsTxt;
      case 'install': return installScript;
      case 'bat': return batchScript;
      default: return pythonCode;
    }
  };

  const getCurrentFilename = () => {
    switch (activeTab) {
      case 'python': return 'gym_tracker.py';
      case 'req': return 'requirements.txt';
      case 'install': return 'install_and_run.bat';
      case 'bat': return 'build_exe.bat';
      default: return 'gym_tracker.py';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100" id="view-python-code">
      {/* Header with Quick Download Buttons */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
              <span>Pakiet Pythona i Instalator Windows (Nowoczesne GUI + PIP)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                customtkinter + matplotlib
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pobierz instalator jednym kliknięciem. Program na pulpicie będzie wyglądał nowocześnie jak wersja webowa!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadFile('install_and_run.bat', installScript, 'application/x-bat')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            id="btn-download-installer"
            title="Pobierz skrypt automatycznie instalujący biblioteki i uruchamiający program"
          >
            <Zap className="w-4 h-4" />
            <span>Pobierz Instalator .BAT</span>
          </button>

          <button
            type="button"
            onClick={() => downloadFile(getCurrentFilename(), getCurrentContent())}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-750 transition-colors cursor-pointer"
            id="btn-download-current"
          >
            <Download className="w-4 h-4" />
            <span>Pobierz ({getCurrentFilename()})</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            id="btn-copy-code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Skopiowano!' : 'Kopiuj'}</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 pt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('req')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'req'
              ? 'border-emerald-400 text-emerald-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-emerald-400" />
          <span>requirements.txt (Pakiety PIP)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('install')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'install'
              ? 'border-emerald-400 text-emerald-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>install_and_run.bat (Instalator 1-Klik)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('python')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'python'
              ? 'border-emerald-400 text-emerald-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4 text-sky-400" />
          <span>gym_tracker.py (Główny Kod Pythona)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bat')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'bat'
              ? 'border-emerald-400 text-emerald-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>build_exe.bat (Kompilator EXE)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('arch')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'arch'
              ? 'border-emerald-400 text-emerald-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Jak Uzyskać 1:1 Wygląd na Windowsie</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950">
        
        {/* Tab: requirements.txt */}
        {activeTab === 'req' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Dodane Biblioteki PIP – Dlaczego Właśnie Te?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standardowy Tkinter ma prosty, surowy wygląd. Aby program na pulpicie Windows wyglądał identycznie jak ta nowoczesna aplikacja internetowa (ciemny motyw slate, zaokrąglone karty, nowoczesne przyciski z podświetleniem, nowoczesne okna modalne i gładkie wykresy), dodaliśmy następujące sprawdzone biblioteki:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-xs mb-1">
                    <span>1. customtkinter &gt;= 5.2.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Nowoczesna nakładka na Tkinter z zaokrąglonymi rogami (<code className="text-slate-200">corner_radius=12</code>), pełnym ciemnym motywem, płynnymi suwakami, polami tekstowymi i oknami modalnymi.
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-300 font-mono font-bold text-xs mb-1">
                    <span>2. matplotlib &gt;= 3.8.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Profesjonalny silnik analityczny generujący wygładzone wykresy liniowe i słupkowe w ciemnej palecie barw, dopasowane do motywu aplikacji.
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs mb-1">
                    <span>3. pillow (PIL) &gt;= 10.0.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Obsługa skalowania wektorów, ikon oraz ostrego renderowania grafik na ekranach o wysokiej gęstości pikseli (High-DPI / 4K).
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-purple-300 font-mono font-bold text-xs mb-1">
                    <span>4. pyinstaller &gt;= 6.4.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pakuje Pythona, CustomTkinter i cały kod w jeden samodzielny plik <code className="text-slate-200">GymTrackerPro.exe</code> na Windows 10/11.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-mono font-bold text-slate-300">Zawartość pliku requirements.txt:</span>
                <button
                  type="button"
                  onClick={() => downloadFile('requirements.txt', requirementsTxt)}
                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz plik</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto select-text">
                <code>{requirementsTxt}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab: install_and_run.bat */}
        {activeTab === 'install' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instalator 1-Kliknięciem dla Windows 10/11 x64</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Umieść pliki <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">install_and_run.bat</code>, <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">requirements.txt</code> oraz <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">gym_tracker.py</code> w jednym folderze.
                Następnie po prostu kliknij dwukrotnie w <code className="text-amber-300">install_and_run.bat</code>.
              </p>
              <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1 pt-1">
                <li>Automatycznie sprawdza i aktualizuje menedżer <code className="text-slate-300">pip</code>.</li>
                <li>Pobiera i instaluje <code className="text-slate-300">customtkinter</code>, <code className="text-slate-300">matplotlib</code>, <code className="text-slate-300">pillow</code>.</li>
                <li>Natychmiast uruchamia program z nowoczesnym interfejsem!</li>
              </ul>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed overflow-x-auto select-text">
              <code>{installScript}</code>
            </pre>
          </div>
        )}

        {/* Tab: gym_tracker.py */}
        {activeTab === 'python' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Modułowy kod z obsługą CustomTkinter + bezpiecznym fallbackiem (Windows 10/11 x64)</span>
              </span>
              <span className="font-mono text-slate-500">{pythonCode.split('\n').length} linii kodu</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto select-text">
              <code>{pythonCode}</code>
            </pre>
          </div>
        )}

        {/* Tab: build_exe.bat */}
        {activeTab === 'bat' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="text-xs text-slate-300 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-sm text-purple-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>Tworzenie Samodzielnego Pliku Wykonywalnego .EXE</span>
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Skrypt <code className="text-purple-300 font-bold">build_exe.bat</code> kompiluje całe środowisko, w tym bibliotekę <strong>CustomTkinter</strong> (używając flagi <code className="bg-slate-950 px-1 py-0.5 rounded text-white">--collect-all customtkinter</code>), aby wygenerować pojedynczy plik <code className="text-white">dist\GymTrackerPro.exe</code>. Plik ten działa na każdym komputerze z Windows 10/11, nawet bez zainstalowanego Pythona!
              </p>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-purple-300 leading-relaxed overflow-x-auto select-text">
              <code>{batchScript}</code>
            </pre>
          </div>
        )}

        {/* Tab: Architektura */}
        {activeTab === 'arch' && (
          <div className="max-w-4xl mx-auto space-y-5 text-xs text-slate-300">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-emerald-400" />
                <span>Projekt Desktop zgodny z Wyglądem Aplikacji Webowej</span>
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Aby pulpitowa aplikacja Windows wyglądała jak nowoczesne studio treningowe:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li>
                  <strong className="text-white">Boczny pasek nawigacyjny (Studio Sidebar):</strong> Lewy panel w kolorze ciemnego łupka (<code className="text-slate-200">#0f172a</code>) z zaokrąglonymi przyciskami podświetlanymi na szmaragdowy akcent.
                </li>
                <li>
                  <strong className="text-white">Osobne okno modalne do dodawania i edycji ćwiczeń:</strong> Dedykowany dialog (<code className="text-slate-200">Toplevel</code>) z szybkim wyborem gotowych szablonów wg partii (Klatka, Plecy, Nogi, Barki, Biceps, Triceps) oraz natychmiastowym obliczaniem 1RM i tonażu.
                </li>
                <li>
                  <strong className="text-white">Dedykowany katalog bazy ćwiczeń:</strong> Przegląd wszystkich ćwiczeń z opcją szybkiego wyszukiwania, edycji parametrów i bezpiecznego usuwania.
                </li>
                <li>
                  <strong className="text-white">Bezpieczeństwo danych w Windows:</strong> Trwały zapis w <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-300">%LOCALAPPDATA%\GymTracker\workout_data.json</code> oraz automatyczne kopie zapasowe, niezależne od bieżącego folderu roboczego.
                </li>
                <li>
                  <strong className="text-white">Obsługa Windows High-DPI:</strong> Brak rozmycia tekstu na monitorach 1440p i 4K dzięki wywołaniu <code className="text-emerald-300">SetProcessDpiAwareness</code>.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
