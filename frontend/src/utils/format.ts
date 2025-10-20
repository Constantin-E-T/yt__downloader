const pad = (value: number) => String(value).padStart(2, '0');

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) {
    return '00:00';
  }
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${pad(minutes)}:${pad(remainder)}`;
};

export const formatTime = formatDuration;

export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }
  const now = Date.now();
  const diff = date.getTime() - now;
  const absoluteDiff = Math.abs(diff);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ];

  for (const [unit, millis] of units) {
    if (absoluteDiff >= millis || unit === 'second') {
      const value = Math.round(diff / millis);
      const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      return formatter.format(value, unit);
    }
  }
  return 'just now';
};

const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|.+\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&].*)?$/i;

export const isValidYouTubeUrl = (url: string): boolean => YOUTUBE_REGEX.test(url.trim());

export const extractVideoId = (url: string): string | null => {
  const match = url.trim().match(YOUTUBE_REGEX);
  return match ? (match[1] ?? null) : null;
};
