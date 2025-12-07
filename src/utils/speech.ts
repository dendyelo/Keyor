// File: src/utils/speech.ts

const synth = window.speechSynthesis;

// Fungsi ini sekarang sederhana dan langsung
export const speak = (text: string) => {
  if (!synth || !text) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();

  // Logika pemilihan suara (tetap penting)
  const preferredVoice = 
    voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google')) ||
    voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Microsoft')) ||
    voices.find(voice => voice.lang === 'en-US' && voice.default) ||
    voices.find(voice => voice.lang === 'en-US');

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  utterance.pitch = 1;

  synth.cancel();
  synth.speak(utterance);
};
