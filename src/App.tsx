// File: src/App.tsx

// -----------------------------------------------------------------------------
// 1. IMPOR DEPENDENSI
// -----------------------------------------------------------------------------
import React, { useState, useEffect, useRef } from 'react'; // Tambahkan useRef
import { content } from './data';
import { formatWordForDisplay } from './utils/formatter';
import { speak } from './utils/speech';
import { Tooltip } from 'react-tooltip';
import './App.css';

// Tipe data untuk mempermudah penggunaan kode bahasa dan kategori.
type LanguageCode = keyof typeof content.languages;
type CategoryCode = keyof typeof content.data.en.categories;

// -----------------------------------------------------------------------------
// 2. KOMPONEN BANTUAN (HELPER COMPONENT)
// -----------------------------------------------------------------------------

/**
 * Komponen kecil untuk menampilkan perubahan (delta) statistik.
 */
const StatDelta: React.FC<{ delta: number; isPlaceholder?: boolean }> = ({ delta, isPlaceholder = false }) => {
  const baseStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 'bold' };
  if (isPlaceholder) {
    return <span style={{ ...baseStyle, color: '#cbd5e1' }}>▲▼</span>;
  }
  if (delta === 0) {
    return (
      <span style={baseStyle}>
        <span style={{ ...baseStyle, color: '#22c55e' }}>▲</span>
        <span style={{ ...baseStyle, color: '#ef4444' }}>▼</span>
      </span>
    );
  }
  const isPositive = delta > 0;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const symbol = isPositive ? '▲' : '▼';
  return <span style={{ ...baseStyle, color }}>{symbol} {Math.abs(delta)}</span>;
};

// -----------------------------------------------------------------------------
// 3. DEFINISI KOMPONEN UTAMA: App
// -----------------------------------------------------------------------------
function App() {
  
  // ---------------------------------------------------------------------------
  // 4. DEKLARASI STATE & REFS
  // ---------------------------------------------------------------------------

  // Refs untuk interaksi langsung dengan DOM.
  const appContainerRef = useRef<HTMLDivElement>(null);

  // State untuk UI & Pengaturan.
  const [selectedLang] = useState<LanguageCode>('en');
  const [selectedCat, setSelectedCat] = useState<CategoryCode>('full');
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Untuk visibilitas awal dropdown.

  // State untuk logika inti latihan mengetik.
  const [wordsToType, setWordsToType] = useState<string[]>(() => generateWords(selectedLang, selectedCat));
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");

  // State untuk umpan balik visual dan error.
  const [isError, setIsError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // State untuk fitur terjemahan & suara.
  const [currentTranslation, setCurrentTranslation] = useState<string>("");
  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState(false);

  // State untuk statistik sesi.
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [lastSessionStats, setLastSessionStats] = useState({ wpm: '0' as number | string, accuracy: '0' as number | string, totalChars: 0, correctChars: 0, totalErrors: 0, duration: 0 });
  const [previousSessionStats, setPreviousSessionStats] = useState({ wpm: 0, accuracy: 0 });
  const [mistakes, setMistakes] = useState<Record<number, Set<number>>>({});

  // ---------------------------------------------------------------------------
  // 5. FUNGSI-FUNGSI BANTUAN (HELPER FUNCTIONS)
  // ---------------------------------------------------------------------------

  /**
   * Menghasilkan kata-kata acak berdasarkan bahasa dan kategori.
   */
  function generateWords(lang: LanguageCode, cat: CategoryCode) {
    const dictionary = content.data[lang].data[cat];
    const words = Object.keys(dictionary).map(key => key.toLowerCase());
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words.slice(0, 13);
  };

  /**
   * Mencatat posisi kesalahan untuk pewarnaan permanen.
   */
  const logMistake = (wordIdx: number, charIdx: number) => {
    setTotalErrors(prev => prev + 1);
    setMistakes(prevMistakes => {
      const newMistakes = { ...prevMistakes };
      const mistakesInWord = newMistakes[wordIdx] ? new Set(newMistakes[wordIdx]) : new Set<number>();
      mistakesInWord.add(charIdx);
      newMistakes[wordIdx] = mistakesInWord;
      return newMistakes;
    });
  };

  /**
   * Fungsi ini SEPENUHNYA me-reset state ke kondisi awal untuk sesi baru.
   */
  const startNewSession = (lang = selectedLang, cat = selectedCat) => {
    setWordsToType(generateWords(lang, cat));
    setActiveWordIndex(0);
    setUserInput('');
    setIsError(false);
    setErrorCount(0);
    setStartTime(null);
    setTotalCharsTyped(0);
    setTotalErrors(0);
    setMistakes({});
    appContainerRef.current?.focus(); // Pindahkan fokus untuk mencegah bug dropdown.
  };

  /**
   * Menghitung dan menyimpan hasil sesi, lalu memulai sesi baru.
   */
  const finishAndCalculateSession = () => {
    if (!startTime) return;
    if (typeof lastSessionStats.wpm === 'number' && typeof lastSessionStats.accuracy === 'number') {
      setPreviousSessionStats({ wpm: lastSessionStats.wpm, accuracy: lastSessionStats.accuracy });
    }
    const endTime = Date.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    const durationInMinutes = durationInSeconds / 60;
    const correctChars = Math.max(0, totalCharsTyped - totalErrors);
    const wpm = durationInMinutes > 0 ? (correctChars / 5) / durationInMinutes : 0;
    const accuracy = totalCharsTyped > 0 ? (correctChars / totalCharsTyped) * 100 : 0;
    setLastSessionStats({
      wpm: Math.round(wpm),
      accuracy: Math.round(Math.max(0, Math.min(100, accuracy))),
      totalChars: totalCharsTyped, correctChars: correctChars, totalErrors: totalErrors,
      duration: parseFloat(durationInSeconds.toFixed(2)),
    });
    startNewSession();
  };

  /**
   * Mengubah status aktif/nonaktif dari fitur voice over.
   */
  const toggleVoiceOver = () => setIsVoiceOverEnabled(prevState => !prevState);

  /**
   * Menangani perubahan pada dropdown kategori.
   */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as CategoryCode;
    setSelectedCat(newCategory);
    startNewSession(selectedLang, newCategory);
    setLastSessionStats({ wpm: '0', accuracy: '0', totalChars: 0, correctChars: 0, totalErrors: 0, duration: 0 });
    setPreviousSessionStats({ wpm: 0, accuracy: 0 });
  };

  // ---------------------------------------------------------------------------
  // 6. EFEK SAMPING (SIDE EFFECTS) DENGAN `useEffect`
  // ---------------------------------------------------------------------------

  /**
   * Efek untuk menangani visibilitas awal dropdown.
   */
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 300); // timer fade out
    return () => clearTimeout(timer);
  }, []);

  /**
   * Efek utama: Menangani semua input dari keyboard pengguna.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleVoiceOver();
        return;
      }
      if (!startTime && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setStartTime(Date.now());
      }
      const key = e.key;
      const currentWord = wordsToType[activeWordIndex];
      if (!currentWord) return;
      const displayWord = formatWordForDisplay(currentWord);
      if (key === ' ') {
        e.preventDefault();
        setTotalCharsTyped(prev => prev + 1);
        if (userInput === displayWord) {
          if (activeWordIndex === wordsToType.length - 1) {
            finishAndCalculateSession();
          } else {
            setActiveWordIndex(prevIndex => prevIndex + 1);
            setUserInput('');
            setIsError(false);
          }
        } else {
          setTotalErrors(prev => prev + 1);
          setIsError(true);
          setErrorCount(c => c + 1);
        }
        return;
      }
      if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setTotalCharsTyped(prev => prev + 1);
        if (userInput.length >= displayWord.length) {
          logMistake(activeWordIndex, userInput.length);
          setIsError(true);
          setErrorCount(c => c + 1);
          return;
        }
        setUserInput(currentInput => {
          const expectedChar = displayWord[currentInput.length];
          if (key === expectedChar) {
            setIsError(false);
            return currentInput + key;
          } else {
            logMistake(activeWordIndex, currentInput.length);
            setIsError(true);
            setErrorCount(c => c + 1);
            return currentInput;
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWordIndex, userInput, wordsToType, startTime]);

  /**
   * Efek samping: Memperbarui terjemahan.
   */
  useEffect(() => {
    const activeWord = wordsToType[activeWordIndex];
    if (activeWord) {
      const dictionary = content.data[selectedLang].data[selectedCat];
      const originalKey = Object.keys(dictionary).find(key => key.toLowerCase() === activeWord);
      if (originalKey) {
        const translation = (dictionary as Record<string, string>)[originalKey];
        setCurrentTranslation(translation || "");
      } else {
        setCurrentTranslation("");
      }
    }
  }, [activeWordIndex, wordsToType, selectedLang, selectedCat]);

  /**
   * Efek samping: Menangani fitur voice over.
   */
  useEffect(() => {
    if (!isVoiceOverEnabled) {
      window.speechSynthesis.cancel();
      return;
    }
    const activeWord = wordsToType[activeWordIndex];
    if (activeWord) {
      speak(activeWord);
    }
  }, [activeWordIndex, wordsToType, isVoiceOverEnabled]);

  // ---------------------------------------------------------------------------
  // 7. BLOK RENDER JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="app-container" ref={appContainerRef} tabIndex={-1}>
      <header>
        <div className={`header-group left ${isInitialLoad ? 'initial-visible' : ''}`}>
          <select className="language-select" value={selectedLang} disabled>
            {Object.entries(content.languages).map(([langCode, langName]) => (
              <option key={langCode} value={langCode}>{langName}</option>
            ))}
          </select>
          <select className="category-select" value={selectedCat} onChange={handleCategoryChange}>
            {Object.entries(content.data[selectedLang].categories).map(([catCode, catName]) => (
              <option key={catCode} value={catCode}>{catName}</option>
            ))}
          </select>
        </div>
        <div className="header-group center"><h1>Keyor</h1></div>
        <div className="header-group right">
          <label 
            className="switch-toggle"
            data-tooltip-id="speaker-tooltip"
            data-tooltip-content={`${isVoiceOverEnabled ? "Disable" : "Enable"} Voice Over (Ctrl + M)`}
          >
            <input type="checkbox" onChange={toggleVoiceOver} checked={isVoiceOverEnabled} />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-item" data-tooltip-id="stats-tooltip" data-tooltip-type="wpm">
          <div className="stat-value">{lastSessionStats.wpm}</div>
          <div className="stat-label">
            <span>WPM</span>
            {previousSessionStats.wpm > 0 && typeof lastSessionStats.wpm === 'number'
              ? <StatDelta delta={lastSessionStats.wpm - previousSessionStats.wpm} />
              : <StatDelta delta={0} isPlaceholder={true} />
            }
          </div>
        </div>
        <div className="stat-item" data-tooltip-id="stats-tooltip" data-tooltip-type="accuracy">
          <div className="stat-value">
            {typeof lastSessionStats.accuracy === 'number' ? `${lastSessionStats.accuracy}%` : lastSessionStats.accuracy}
          </div>
          <div className="stat-label">
            <span>Accuracy</span>
            {previousSessionStats.accuracy > 0 && typeof lastSessionStats.accuracy === 'number'
              ? <StatDelta delta={lastSessionStats.accuracy - previousSessionStats.accuracy} />
              : <StatDelta delta={0} isPlaceholder={true} />
            }
          </div>
        </div>
      </div>

      <div className="translation-container">{currentTranslation}</div>

      <main>
        <div className="word-container">
          {wordsToType.map((word, wordIndex) => {
            const isActiveWord = wordIndex === activeWordIndex;
            const displayWord = formatWordForDisplay(word);
            const isWordFinished = isActiveWord && userInput.length === displayWord.length;
            return (
              <React.Fragment key={wordIndex}>
                <span className="word">
                  {displayWord.split('').map((char, charIndex) => {
                    const isActiveChar = isActiveWord && charIndex === userInput.length;
                    let charClassName = "";
                    const wasMistake = mistakes[wordIndex]?.has(charIndex);
                    if (wordIndex < activeWordIndex) {
                      charClassName = wasMistake ? "incorrect" : "correct";
                    } else if (isActiveWord) {
                      if (charIndex < userInput.length) {
                        charClassName = wasMistake ? "incorrect" : "correct";
                      }
                      if (isActiveChar) {
                        charClassName = isError ? "active-char error incorrect" : "active-char";
                      }
                    }
                    return (
                      <span key={`${charIndex}-${isActiveChar ? errorCount : 0}`} className={charClassName}>
                        {char}
                      </span>
                    );
                  })}
                </span>
                {wordIndex < wordsToType.length - 1 && (
                  <span className={isWordFinished ? (isError ? "separator-error" : "separator-active") : "separator"}>
                    ●
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </main>
      
      <Tooltip id="speaker-tooltip" />
      <Tooltip id="stats-tooltip" style={{ padding: '8px' }} render={({ activeAnchor }) => {
          const type = activeAnchor?.getAttribute('data-tooltip-type');
          if (type === 'wpm') {
            return (
              <div style={{ textAlign: 'center' }}>
                <strong>{lastSessionStats.wpm}</strong>
                <div>Words Per Minute</div>
              </div>
            );
          }
          if (type === 'accuracy') {
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0 8px', alignItems: 'center' }}>
                <span>Total</span><span>: {lastSessionStats.totalChars}</span>
                <span>Correct</span><span>: {lastSessionStats.correctChars}</span>
                <span>Incorrect</span><span>: {lastSessionStats.totalErrors}</span>
              </div>
            );
          }
          return null;
        }}
      />
    </div>
  );
}

export default App;
