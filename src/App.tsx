// File: src/App.tsx

// -----------------------------------------------------------------------------
// 1. IMPOR DEPENDENSI
// -----------------------------------------------------------------------------
// Impor hook dasar dari React untuk state dan lifecycle.
import React, { useState, useEffect } from 'react';
// Impor fungsi untuk menghasilkan kata dan kamus dari file data kita.
import { generateWords, dictionary } from './data/dictionary';
// Impor fungsi utilitas untuk memformat kata ("i" -> "I").
import { formatWordForDisplay } from './utils/formatter';
// Impor fungsi utilitas untuk fitur voice over (Text-to-Speech).
import { speak } from './utils/speech';
// Impor file CSS utama untuk styling.
import './App.css';

// -----------------------------------------------------------------------------
// 2. DEFINISI KOMPONEN UTAMA: App
// -----------------------------------------------------------------------------
function App() {
  
  // ---------------------------------------------------------------------------
  // 3. DEKLARASI STATE
  // State adalah "memori" dari komponen ini.
  // ---------------------------------------------------------------------------

  // State untuk menyimpan daftar kata dalam sesi latihan saat ini.
  // Menggunakan fungsi di dalam useState untuk memastikan generateWords() hanya dipanggil sekali saat awal.
  const [wordsToType, setWordsToType] = useState<string[]>(() => generateWords());
  
  // State untuk melacak indeks dari kata yang sedang aktif diketik.
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  
  // State untuk menyimpan input teks dari pengguna saat ini.
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
    // Pilihan status voice over pengguna tidak di-reset agar tetap konsisten.
  };

  /**
   * Mengubah status aktif/nonaktif dari fitur voice over.
   */
  const toggleVoiceOver = () => {
    setIsVoiceOverEnabled(prevState => !prevState);
  };

  // ---------------------------------------------------------------------------
  // 5. EFEK SAMPING (SIDE EFFECTS) DENGAN `useEffect`
  // `useEffect` digunakan untuk menjalankan kode yang berinteraksi dengan
  // dunia luar (seperti browser API) sebagai respons terhadap perubahan state.
  // ---------------------------------------------------------------------------

  /**
   * Efek utama: Menangani semua input dari keyboard pengguna.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const currentWord = wordsToType[activeWordIndex];

      // Pengaman: Jika tidak ada kata aktif, jangan lakukan apa-apa.
      if (!currentWord) return;

      // Logika untuk tombol Spasi: menyelesaikan kata.
      if (key === ' ') {
        e.preventDefault(); // Mencegah halaman scroll ke bawah.
        if (userInput === currentWord) { // Jika kata diketik dengan benar.
          if (activeWordIndex === wordsToType.length - 1) {
            resetSession(); // Jika kata terakhir, reset sesi.
          } else {
            setActiveWordIndex(prevIndex => prevIndex + 1); // Pindah ke kata berikutnya.
            setUserInput(''); // Kosongkan input pengguna.
            setIsError(false);
          }
        } else { // Jika spasi ditekan saat kata belum selesai/salah.
          setIsError(true);
          setErrorCount(c => c + 1);
        }
        return; // Hentikan eksekusi lebih lanjut.
      }

      // Logika untuk tombol Backspace: menghapus karakter.
      if (key === 'Backspace') {
        setUserInput(currentInput => currentInput.slice(0, -1));
        setIsError(false); // Hapus status error saat menghapus.
        return;
      }

      // Logika untuk input karakter tunggal (huruf, angka, simbol).
      if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Jika kata sudah selesai diketik, input lain adalah error.
        if (userInput.length >= currentWord.length) {
          setIsError(true);
          setErrorCount(c => c + 1);
          return;
        }
        // Perbarui input pengguna berdasarkan validasi.
        setUserInput(currentInput => {
          const expectedChar = currentWord[currentInput.length];
          if (key === expectedChar) { // Jika input benar.
            setIsError(false);
            return currentInput + key;
          } else { // Jika input salah.
            setIsError(true);
            setErrorCount(c => c + 1);
            return currentInput; // Jangan tambahkan karakter yang salah.
          }
        });
      }
    };

    // Daftarkan event listener saat komponen dimuat.
    window.addEventListener('keydown', handleKeyDown);
    // Fungsi cleanup: Hapus event listener saat komponen dibongkar untuk mencegah kebocoran memori.
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWordIndex, userInput, wordsToType]); // Jalankan kembali efek ini jika salah satu dari state ini berubah.

  /**
   * Efek samping: Memperbarui terjemahan setiap kali kata aktif berubah.
   */
  useEffect(() => {
    const activeWord = wordsToType[activeWordIndex];
    if (activeWord) {
      // Cari kata di kamus (dalam huruf kecil) dan perbarui state terjemahan.
      const translation = dictionary[activeWord.toLowerCase()];
      setCurrentTranslation(translation || ""); // Jika tidak ditemukan, tampilkan string kosong.
    }
  }, [activeWordIndex, wordsToType]); // Jalankan kembali saat kata aktif atau daftar kata berubah.

  /**
   * Efek samping: Menangani fitur voice over.
   */
  useEffect(() => {
    // Jika fitur dinonaktifkan oleh pengguna, hentikan suara apa pun yang sedang berjalan.
    if (!isVoiceOverEnabled) {
      window.speechSynthesis.cancel();
      return;
    }

    // Jika fitur aktif, ucapkan kata yang sedang aktif.
    const activeWord = wordsToType[activeWordIndex];
    if (activeWord) {
      speak(activeWord);
    }
  }, [activeWordIndex, wordsToType, isVoiceOverEnabled]); // Jalankan kembali saat kata aktif atau status fitur berubah.

  // ---------------------------------------------------------------------------
  // 6. BLOK RENDER JSX
  // Bagian ini mendefinisikan struktur HTML yang akan ditampilkan di layar.
  // ---------------------------------------------------------------------------
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
          {/* Looping melalui daftar kata untuk ditampilkan */}
          {wordsToType.map((word, wordIndex) => {
            const isActiveWord = wordIndex === activeWordIndex;
            const isWordFinished = isActiveWord && userInput.length === word.length;
            // Gunakan formatter untuk mendapatkan versi kata yang akan ditampilkan (misal: "i" -> "I").
            const displayWord = formatWordForDisplay(word);

            return (
              <React.Fragment key={wordIndex}>
                {/* Render setiap kata sebagai kumpulan dari span karakter */}
                <span className="word">
                  {displayWord.split('').map((char, charIndex) => {
                    const isActiveChar = isActiveWord && charIndex === userInput.length;
                    let charClassName = "";

                    if (wordIndex < activeWordIndex) {
                      charClassName = "correct"; // Kata yang sudah lewat.
                    } else if (isActiveWord) {
                      if (charIndex < userInput.length) {
                        charClassName = "correct"; // Huruf yang sudah diketik benar.
                      }
                      if (isActiveChar) {
                        // Huruf yang sedang ditunggu: beri gaya aktif atau error.
                        charClassName = isError ? "incorrect error" : "active-char";
                      }
                    }

                    return (
                      <span
                        // Kunci unik, digabungkan dengan errorCount untuk memicu animasi ulang.
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
    </div>
  );
}

export default App;
