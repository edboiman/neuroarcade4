export function speakLocal(text, lang) {
  const api = window.speechSynthesis;
  if (!api || typeof window.SpeechSynthesisUtterance !== 'function') return false;
  const voice = api.getVoices().find(v => v.localService && v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  if (!voice) return false;
  api.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = voice; u.lang = voice.lang; u.rate = .8; api.speak(u); return true;
}
export function stopSpeech() { if (window.speechSynthesis) window.speechSynthesis.cancel(); }
