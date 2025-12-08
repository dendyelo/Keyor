// File: src/utils/formatter.ts

/**
 * Mengambil sebuah kata dari data internal dan memformatnya
 * untuk ditampilkan di UI sesuai dengan aturan linguistik.
 * 
 * @param word Kata dalam format data (biasanya huruf kecil).
 * @returns Kata yang sudah diformat untuk ditampilkan.
 */
export const formatWordForDisplay = (word: string): string => {
  // Aturan 1: Kata ganti "I"
  // Jika kata adalah "i" dan hanya terdiri dari satu huruf, ubah menjadi "I".
  if (word === 'i' && word.length === 1) {
    return 'I';
  }

  // Aturan 2 (Contoh untuk masa depan): Nama Hari
  // const days = ['monday', 'tuesday', 'wednesday', ...];
  // if (days.includes(word)) {
  //   return word.charAt(0).toUpperCase() + word.slice(1); // Ubah huruf pertama menjadi kapital
  // }

  // Aturan 3 (Contoh untuk masa depan): Akronim
  // if (word === 'usa') {
  //   return 'USA';
  // }

  // Jika tidak ada aturan khusus yang cocok, kembalikan kata aslinya.
  return word;
};
