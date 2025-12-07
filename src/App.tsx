// File: src/App.tsx

import { generateWords, dictionary } from './data/dictionary';
import React, { useState, useEffect } from 'react';
import './App.css'; // Kita akan gunakan ini nanti untuk styling

function App() {

  const [wordsToType, setWordsToType] = useState<string[]>(() => generateWords());
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [currentTranslation, setCurrentTranslation] = useState<string>("");

  const resetSession = () => {
    setWordsToType(generateWords()); // Dapatkan kata-kata baru
    setActiveWordIndex(0);
    setUserInput('');
    setIsError(false);
    setErrorCount(0);
    // Nanti kita juga akan reset statistik di sini
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const currentWord = wordsToType[activeWordIndex];

      // Cek jika sesi sudah selesai
      if (activeWordIndex === wordsToType.length) {
        // Mungkin tampilkan skor, lalu reset
        resetSession();
        return;
      }

      if (key === ' ') {
        e.preventDefault();
        if (userInput === currentWord) {
          // Cek apakah ini kata terakhir
          if (activeWordIndex === wordsToType.length - 1) {
            // Sesi selesai, panggil reset
            resetSession();
          } else {
            // Lanjutkan ke kata berikutnya
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
    // Jika kata sudah selesai, hanya spasi yang diterima (ditangani di atas)
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

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeWordIndex, userInput, wordsToType]);

useEffect(() => {
    const activeWord = wordsToType[activeWordIndex];
    if (activeWord) {
      const translation = dictionary[activeWord.toLowerCase()];
      setCurrentTranslation(translation || "");
    }
  }, [activeWordIndex, wordsToType]);



  return (
  <div className="app-container">
    <header>
      <h1>Keyor</h1>
    </header>

    {/* TAMPILKAN TERJEMAHAN DI SINI */}
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
              {/* 1. KATA */}
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

              {/* 2. LINGKARAN PEMISAH */}
              {wordIndex < wordsToType.length - 1 && (
              <span
                className={
                  isWordFinished
                    ? isError
                      ? "separator-error" // Kelas baru untuk error
                      : "separator-active" // Kelas baru untuk aktif
                    : "separator" // Kelas default
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
