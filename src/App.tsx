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
  
  // State untuk menyimpan hasil sesi terakhir dalam bentuk objek.
  const [lastSessionStats, setLastSessionStats] = useState({
    wpm: '0' as number | string,
    accuracy: '0' as number | string,
    totalChars: 0,
    correctChars: 0,
    totalErrors: 0,
    duration: 0, // dalam detik
  });

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
      const durationInSeconds = (endTime - startTime) / 1000;
      const durationInMinutes = durationInSeconds / 60;

      const correctChars = Math.max(0, totalCharsTyped - totalErrors);
      const wpm = durationInMinutes > 0 ? (correctChars / 5) / durationInMinutes : 0;
      const accuracy = totalCharsTyped > 0 ? (correctChars / totalCharsTyped) * 100 : 0;

      // Simpan semua data sesi ke dalam state untuk digunakan oleh tooltip dinamis.
      setLastSessionStats({
        wpm: Math.round(wpm),
        accuracy: Math.round(Math.max(0, Math.min(100, accuracy))),
        totalChars: totalCharsTyped,
        correctChars: correctChars,
        totalErrors: totalErrors,
        duration: parseFloat(durationInSeconds.toFixed(2)),
      });
    }

    setWordsToType(generateWords());
    setActiveWordIndex(0);
    setUserInput('');
    setIsError(false);
    setErrorCount(0);
    setStartTime(null);
    setTotalCharsTyped(0);
    setTotalErrors(0);
    setMistakes({});
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
          logMistake(activeWordIndex, userInput.length);
          setIsError(true);
          setErrorCount(c => c + 1);
        }
        return;
      }

      // Fungsi Backspace dinonaktifkan sesuai permintaan.

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
        <div 
          className="stat-item"
          data-tooltip-id="stats-tooltip"
          data-tooltip-type="wpm"
        >
          <div className="stat-value">{lastSessionStats.wpm}</div>
          <div className="stat-label">WPM</div>
        </div>
        <div 
          className="stat-item"
          data-tooltip-id="stats-tooltip"
          data-tooltip-type="accuracy"
        >
          <div className="stat-value">
            {typeof lastSessionStats.accuracy === 'number' 
              ? `${lastSessionStats.accuracy}%` 
              : lastSessionStats.accuracy
            }
          </div>
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
      
      {/* Komponen Tooltip untuk menangani tooltip di seluruh aplikasi. */}
      <Tooltip id="speaker-tooltip" />
      <Tooltip 
        id="stats-tooltip"
        style={{ padding: '8px' }}
        render={({ activeAnchor }) => {
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
            if (lastSessionStats.duration === 0) {
              return "Selesaikan satu sesi untuk melihat detail.";
            }
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0 8px', alignItems: 'center' }}>
                <span>Total</span>
                <span>: {lastSessionStats.totalChars}</span>
                <span>Correct</span>
                <span>: {lastSessionStats.correctChars}</span>
                <span>Incorrect</span>
                <span>: {lastSessionStats.totalErrors}</span>
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
