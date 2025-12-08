// File: src/App.tsx

// -----------------------------------------------------------------------------
// 1. IMPOR DEPENDENSI
// -----------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { generateWords, dictionary } from './data/dictionary';
import { formatWordForDisplay } from './utils/formatter';
import { Tooltip } from 'react-tooltip';
import { speak } from './utils/speech';
import './App.css';

// -----------------------------------------------------------------------------
// 2. DEFINISI KOMPONEN UTAMA: App
// -----------------------------------------------------------------------------
function App() {
  
  // ---------------------------------------------------------------------------
  // 3. DEKLARASI STATE
  // ---------------------------------------------------------------------------

  // State untuk menyimpan daftar kata internal (selalu huruf kecil).
  const [wordsToType, setWordsToType] = useState<string[]>(() => generateWords());
  
  // State untuk melacak indeks dari kata yang sedang aktif.
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  
  // State untuk menyimpan input teks dari pengguna (bisa huruf besar/kecil).
  const [userInput, setUserInput] = useState("");

  // State untuk menandai apakah input terakhir pengguna adalah kesalahan.
  const [isError, setIsError] = useState(false);
  
  // State untuk memicu animasi getar saat terjadi error.
  const [errorCount, setErrorCount] = useState(0);

  // State untuk menyimpan terjemahan dari kata yang sedang aktif.
  const [currentTranslation, setCurrentTranslation] = useState<string>("");

  // State untuk mengontrol apakah fitur voice over aktif atau tidak.
  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState(false);

  // ---------------------------------------------------------------------------
  // 4. FUNGSI-FUNGSI BANTUAN (HELPER FUNCTIONS)
  // ---------------------------------------------------------------------------

  /**
   * Me-reset sesi latihan ke kondisi awal, memuat kata-kata baru.
   */
  const resetSession = () => {
    setWordsToType(generateWords());
    setActiveWordIndex(0);
    setUserInput('');
    setIsError(false);
    setErrorCount(0);
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
        e.preventDefault(); // Mencegah perilaku default browser.
        toggleVoiceOver();  // Panggil fungsi kita untuk mengubah state.
        return; // Hentikan eksekusi agar tidak dianggap sebagai input mengetik.
      }
      const key = e.key;
      
      // Ambil kata dari data internal (misal: "i").
      const currentWord = wordsToType[activeWordIndex];
      if (!currentWord) return;

      // --- LOGIKA VALIDASI BARU ---
      // Dapatkan versi kata yang ditampilkan di layar (misal: "I").
      // Semua validasi sekarang dilakukan terhadap 'displayWord'.
      const displayWord = formatWordForDisplay(currentWord);

      // Logika untuk tombol Spasi: menyelesaikan kata.
      if (key === ' ') {
        e.preventDefault();
        // Bandingkan input pengguna (case-sensitive) dengan kata yang ditampilkan.
        if (userInput === displayWord) {
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

      // Logika untuk tombol Backspace: menghapus karakter.
      if (key === 'Backspace') {
        setUserInput(currentInput => currentInput.slice(0, -1));
        setIsError(false);
        return;
      }

      // Logika untuk input karakter tunggal.
      if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
        if (userInput.length >= displayWord.length) {
          setIsError(true);
          setErrorCount(c => c + 1);
          return;
        }
        setUserInput(currentInput => {
          // Dapatkan karakter yang diharapkan dari kata yang ditampilkan.
          const expectedChar = displayWord[currentInput.length];
          
          // Lakukan perbandingan case-sensitive.
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

  /**
   * Efek samping: Memperbarui terjemahan.
   * Logika ini tetap menggunakan kata dari data internal (huruf kecil)
   * untuk pencarian di kamus yang juga menggunakan kunci huruf kecil.
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
      // Ucapkan kata dari data internal. Pengucapan tidak terpengaruh huruf besar/kecil.
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
        <button 
          onClick={toggleVoiceOver} 
          className="speaker-button" 
          data-tooltip-id="speaker-tooltip"
          data-tooltip-content={`${isVoiceOverEnabled ? "Disable" : "Enable"} Voice Over (Ctrl + M)`}
        >
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
            const isWordFinished = isActiveWord && userInput.length === formatWordForDisplay(word).length;
            // Gunakan formatter untuk mendapatkan versi kata yang akan ditampilkan.
            const displayWord = formatWordForDisplay(word);

            return (
              <React.Fragment key={wordIndex}>
                <span className="word">
                  {/* Gunakan displayWord untuk dirender di layar. */}
                  {displayWord.split('').map((char, charIndex) => {
                    const isActiveChar = isActiveWord && charIndex === userInput.length;
                    let charClassName = "";

                    if (wordIndex < activeWordIndex) {
                      charClassName = "correct";
                    } else if (isActiveWord) {
                      if (charIndex < userInput.length) {
                        // Perbandingan di sini tidak perlu case-sensitive karena hanya untuk pewarnaan.
                        // Namun, untuk konsistensi, kita bisa biarkan seperti ini.
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

                {/* Render lingkaran pemisah antar kata */}
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
