import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
  Format a date string to a 'x time ago' from current user time.
  takes in a 'new Date(prisma DateTime string)' object.
*/
export function formatTimeAgo(dateFromDb: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - dateFromDb.getTime();
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  // const years = Math.floor(months / 12);

  if (months > 0) return `${months} month${months !== 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'just now';
}

/*
  Uses String formatting and URL API to extract the page name from
  it's URL. 'https://example.com/home' --> 'Home'
*/
export function getPageName(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);

    // get pathname and clean it
    const path = url.pathname.replace(/^\/|$/g, '');

    // get last segment
    const segment = path.split('/').pop() || '';

    // readable title
    const name = segment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize first letter of each word
    if (name === '') return 'Home';
    return `${name}`;
  } catch {
    return null;
  }
}

/*
  Title Case a string
*/
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
