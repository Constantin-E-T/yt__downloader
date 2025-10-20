import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names with Tailwind-aware deduplication.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
