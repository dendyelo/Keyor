// File: src/App.tsx

// -----------------------------------------------------------------------------
// 1. IMPOR DEPENDENSI
// -----------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { generateWords, dictionary } from './data/dictionary';
import { formatWordForDisplay } from './utils/formatter';
import { speak } from './utils/speech';
import { Tooltip } from 'react-tooltip';
import './App.css';

// -----------------------------------------------------------------------------
// 2. DEFINISI KOMPONEN UTAMA: App
// -----------------------------------------------------------------------------
function App() {
  
  // ---------------------------------------------------------------------------
  // 3. DEKLARASI STATE
  // ---------------------------------------------------------------------------

  // State untuk logika inti latihan mengetik
  const [wordsToType, setWordsToType] = useState<string[]>(() => generateWords());
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");

  // State untuk umpan balik visual dan error
  const [isError, setIsError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // State untuk fitur terjemahan
  const [currentTranslation, setCurrentTranslation] = useState<string>("");

  // State untuk kontrol fitur voice over
  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState(false);

  // State untuk statistik
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [lastWPM, setLastWPM] = useState<number | string>('0');
  const [lastAccuracy, setLastAccuracy] = useState<number | string>('0%');

  // State untuk melacak posisi spesifik dari setiap kesalahan.
  const [mistakes, setMistakes] = useState<Record<number, Set<number>>>({});

  // ---------------------------------------------------------------------------
  // 4. FUNGSI-FUNGSI BANTUAN (HELPER FUNCTIONS)
  // ---------------------------------------------------------------------------

  /**
   * Fungsi untuk mencatat posisi kesalahan (indeks kata dan karakter).
   */
  const logMistake = (wordIdx: number, charIdx: number) => {
    setTotalErrors(prev => prev + 1);
    setMistakes(prevMistakes => {
      const newMistakes = { ...prevMistakes };
      // Perbaikan TypeScript: Tentukan tipe Set secara eksplisit saat membuat Set baru yang kosong.
      const mistakesInWord = newMistakes[wordIdx] ? new Set(newMistakes[wordIdx]) : new Set<number>();
      mistakesInWord.add(charIdx);
      newMistakes[wordIdx] = mistakesInWord;
      return newMistakes;
    });
  };

  /**
   * Menghitung statistik di akhir sesi, lalu me-reset sesi untuk memulai yang baru.
   */
  const resetSession = () => {
    if (startTime) {
      const endTime = Date.now();
      const durationInMinutes = (endTime - startTime) / 1000 / 60;
      // 1. Hitung karakter benar, pastikan tidak pernah kurang dari 0.
      const correctChars = Math.max(0, totalCharsTyped - totalErrors);

      // 2. Hitung WPM, dengan pengaman untuk durasi 0.
      const wpm = durationInMinutes > 0 ? (correctChars / 5) / durationInMinutes : 0;
      setLastWPM(Math.round(wpm));

      // 3. Hitung Akurasi, dengan pengaman untuk total ketukan 0.
      const accuracy = totalCharsTyped > 0 ? (correctChars / totalCharsTyped) * 100 : 0;
      // Pastikan akurasi selalu dalam rentang 0-100.
      setLastAccuracy(Math.round(Math.max(0, Math.min(100, accuracy))));
    }

    setWordsToType(generateWords());
    setActiveWordIndex(0);
    setUserInput('');
    setIsError(false);
    setErrorCount(0);
    setStartTime(null);
    setTotalCharsTyped(0);
    setTotalErrors(0);
    setMistakes({}); // Reset catatan kesalahan untuk sesi baru.
  };

  /**
   * Mengubah status aktif/nonaktif dari fitur voice over.
   */
  const toggleVoiceOver = () => {
    setIsVoiceOverEnabled(prevState => !prevState);
  };

  // ---------------------------------------------------------------------------
  // 5. EFEK SAMPING (SIDE EFFECTS) DENGAN `useEffect`
  // ---------------------------------------------------------------------------

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
        if (userInput === displayWord) {
          if (activeWordIndex === wordsToType.length - 1) {
            resetSession();
          } else {
            setActiveWordIndex(prevIndex => prevIndex + 1);
            setUserInput('');
            setIsError(false);
          }
        } else {
          // Tentukan di mana kesalahan terjadi.
          const mistakeIndex = userInput.length; 
          // Catat kesalahan pada posisi tersebut.
          logMistake(activeWordIndex, mistakeIndex); 

          setIsError(true);
          setErrorCount(c => c + 1);
        }
        return;
      }
      
      if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setTotalCharsTyped(prev => prev + 1);

        if (userInput.length >= displayWord.length) {
          setIsError(true);
          setErrorCount(c => c + 1);
          logMistake(activeWordIndex, userInput.length);
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
      const translation = dictionary[activeWord.toLowerCase()];
      setCurrentTranslation(translation || "");
    }
  }, [activeWordIndex, wordsToType]);

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
  // 6. BLOK RENDER JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="app-container">
      <header>
        <h1>Keyor</h1>
        <label 
          className="switch-toggle"
          data-tooltip-id="speaker-tooltip"
          data-tooltip-content={`${isVoiceOverEnabled ? "Disable" : "Enable"} Voice Over (Ctrl + M)`}
        >
          <input 
            type="checkbox" 
            onChange={toggleVoiceOver} 
            checked={isVoiceOverEnabled} 
          />
          <span className="slider"></span>
        </label>
      </header>

      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{lastWPM}</div>
          <div className="stat-label">WPM</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{typeof lastAccuracy === 'number' ? `${lastAccuracy}%` : lastAccuracy}</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      <div className="translation-container">
        {currentTranslation}
      </div>

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
                      <span
                        key={`${charIndex}-${isActiveChar ? errorCount : 0}`}
                        className={charClassName}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>

                {wordIndex < wordsToType.length - 1 && (
                  <span
                    className={
                      isWordFinished
                        ? isError
                          ? "separator-error"
                          : "separator-active"
                        : "separator"
                    }
                  >
                    ●
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </main>
      
      <Tooltip id="speaker-tooltip" />
    </div>
  );
}

export default App;
