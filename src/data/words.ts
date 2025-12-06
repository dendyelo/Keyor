// File: src/data/words.ts

const commonWords = [
  // ... (daftar kata Anda yang panjang tetap di sini)
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "are", "was", "were", "has", "had", "does", "did", "said", "went",
  "made", "knew", "took", "saw", "came", "got", "thought", "told", "put", "read",
  "find", "long", "down", "day", "did", "get", "come", "made", "may", "part",
  "man", "out", "old", "see", "too", "way", "who", "boy", "did", "its",
  "let", "put", "say", "she", "too", "use", "dad", "mom", "end", "how",
  "not", "now", "our", "out", "see", "she", "the", "try", "two", "way",
  "why", "air", "all", "and", "any", "ask", "bad", "big", "boy", "but",
  "can", "car", "cat", "cow", "cut", "day", "did", "dog", "eat", "end",
  "far", "fat", "for", "fun", "get", "god", "had", "has", "her", "him"
];

const WORDS_PER_SESSION = 20;

// Fungsi baru untuk menghasilkan satu set kata
export const generateWords = () => {
  // Acak seluruh daftar kata setiap kali fungsi ini dipanggil
  const shuffled = commonWords.sort(() => Math.random() - 0.5);
  // Ambil 20 kata pertama dari daftar yang sudah diacak
  return shuffled.slice(0, WORDS_PER_SESSION);
};
