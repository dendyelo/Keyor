// File: src/App.tsx

import React, { useState, useEffect } from 'react';
import { generateWords, dictionary } from './data/dictionary';
import { speak } from './utils/speech';
import './App.css';

function App() {
  // State untuk logika inti latihan mengetik
  const [wordsToType, setWordsToType] = useState<string[]>(() => generateWords());
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");

  // State untuk umpan balik visual dan error
  const [isError, setIsError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // State untuk fitur terjemahan
  const [currentTranslation, setCurrentTranslation] = useState<string>("");

  // State untuk kontrol fitur voice over oleh pengguna
  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState(false);

  // Fungsi untuk me-reset sesi dan memuat kata-kata baru
  const resetSession = () => {
    setWordsToType(generateWords());
    setActiveWordIndex(0);
    setUserInput('');
    setIsError(false);
    setErrorCount(0);
    // Tidak perlu me-reset isVoiceOverEnabled, biarkan pilihan pengguna tetap ada
  };

  // Fungsi untuk mengubah status voice over
  const toggleVoiceOver = () => {
    setIsVoiceOverEnabled(prevState => !prevState);
  };

  // Efek utama untuk menangani semua input keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const currentWord = wordsToType[activeWordIndex];

      if (!currentWord) return;

      if (key === ' ') {
        e.preventDefault();
        if (userInput === currentWord) {
          if (activeWordIndex === wordsToType.length - 1) {
            resetSession();
          } else {
            setActiveWordIndex(prevIndex => prevIndex + 1);
            setUserInput('');
            setIsError(false);
          }
        } else {
          setIsError(true);
          setErrorCount(c => c + 1);
        }
        return;
      }

      if (key === 'Backspace') {
        setUserInput(currentInput => currentInput.slice(0, -1));
        setIsError(false);
        return;
      }

      if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
        if (userInput.length >= currentWord.length) {
          setIsError(true);
          setErrorCount(c => c + 1);
          return;
        }
        setUserInput(currentInput => {
          const expectedChar = currentWord[currentInput.length];
          if (key === expectedChar) {
            setIsError(false);
            return currentInput + key;
          } else {
            setIsError(true);
            setErrorCount(c => c + 1);
            return currentInput;
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWordIndex, userInput, wordsToType]);

  // Efek terpisah untuk menangani terjemahan
  useEffect(() => {
    const activeWord = wordsToType[activeWordIndex];
    if (activeWord) {
      const translation = dictionary[activeWord.toLowerCase()];
      setCurrentTranslation(translation || "");
    }
  }, [activeWordIndex, wordsToType]);

  // Efek terpisah untuk menangani voice over
  useEffect(() => {
    // Jika fitur dinonaktifkan, hentikan suara apa pun yang sedang berjalan dan keluar.
    if (!isVoiceOverEnabled) {
      window.speechSynthesis.cancel();
      return;
    }

    // Jika fitur diaktifkan, lanjutkan seperti biasa.
    const activeWord = wordsToType[activeWordIndex];
    if (activeWord) {
      speak(activeWord);
    }
  }, [activeWordIndex, wordsToType, isVoiceOverEnabled]);

  // Blok rendering JSX
  return (
    <div className="app-container">
      <header>
        <h1>Keyor</h1>
        <button onClick={toggleVoiceOver} className="speaker-button" title={isVoiceOverEnabled ? "Disable Voice Over" : "Enable Voice Over"}>
          {isVoiceOverEnabled ? '🔊' : '🔇'}
        </button>
      </header>

      <div className="translation-container">
        {currentTranslation}
      </div>

      <main>
        <div className="word-container">
          {wordsToType.map((word, wordIndex) => {
            const isActiveWord = wordIndex === activeWordIndex;
            const isWordFinished = isActiveWord && userInput.length === word.length;

            return (
              <React.Fragment key={wordIndex}>
                <span className="word">
                  {word.split('').map((char, charIndex) => {
                    const isActiveChar = isActiveWord && charIndex === userInput.length;
                    let charClassName = "";

                    if (wordIndex < activeWordIndex) {
                      charClassName = "correct";
                    } else if (isActiveWord) {
                      if (charIndex < userInput.length) {
                        charClassName = "correct";
                      }
                      if (isActiveChar) {
                        charClassName = isError ? "incorrect error" : "active-char";
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
    </div>
  );
}

export default App;
