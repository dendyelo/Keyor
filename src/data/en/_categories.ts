import { fullDictionary } from './full';
import { hotelDictionary } from './hotel';
import { restaurantDictionary } from './restaurant';

// Definisikan struktur data untuk Bahasa Inggris.
export const en = {
  // Daftar nama kategori untuk ditampilkan di UI.
  categories: {
    full: "Full Vocabulary",
    hotel: "Hotel",
    restaurant: "Restaurant",
  },
  // Data kamus sebenarnya untuk setiap kategori.
  data: {
    full: fullDictionary, // <-- Menggunakan kamus utama
    hotel: hotelDictionary,
    restaurant: restaurantDictionary,
  }
};
