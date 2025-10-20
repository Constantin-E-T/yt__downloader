export type LanguageOption = {
  value: string;
  label: string;
  flag: string;
};

export const LANGUAGES: LanguageOption[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'zh-Hans', label: 'Chinese (Simplified)', flag: '🇨🇳' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
];
