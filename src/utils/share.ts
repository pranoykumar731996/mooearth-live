// ============================================================
// MooEarth Live — Challenge Share Utility
// ============================================================
// Provides share functionality via Web Share API, clipboard,
// and direct social media links (X, WhatsApp, Telegram, Facebook).

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Generate a challenge share URL.
 */
export function getChallengeShareUrl(
  mode: 'daily' | 'survival' | 'clock' | 'flag' | 'capital' | 'explorer',
  dateStr?: string
): string {
  const base = 'https://www.mooearth.live';
  if (mode === 'daily' && dateStr) {
    const dateSlug = dateStr.replace(/-/g, '');
    return `${base}/challenge/daily-${dateSlug}`;
  }
  return `${base}/challenge/${mode}-${Date.now().toString(36)}`;
}

/**
 * Generate share text for a game result.
 */
export function getShareText(params: {
  mode: string;
  score: number;
  correct: number;
  total: number;
  streak?: number;
  xp?: number;
}): string {
  const { mode, score, correct, total, streak, xp } = params;
  const modeLabel = {
    daily: 'Daily Earth Challenge',
    survival: 'Survival Mode',
    clock: 'Beat the Clock',
    flag: 'Flag Challenge',
    capital: 'Capital Challenge',
    explorer: 'Country Explorer',
  }[mode] || 'Earth Challenge';

  let text = `🌍 ${modeLabel}\n\n`;
  if (xp) {
    text += `Score: ${xp.toLocaleString()} XP\n`;
  } else if (score > 0) {
    text += `Score: ${score.toLocaleString()} pts\n`;
  }
  text += `${correct} / ${total} correct\n`;
  if (streak && streak > 1) text += `🔥 ${streak}-day streak\n`;
  text += `\nCan you beat me?\n`;

  return text;
}

/**
 * Share via Web Share API (native sharing on mobile/desktop).
 * Returns true if successful, false if not supported.
 */
export async function shareNative(data: ShareData): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.share) return false;

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    });
    return true;
  } catch {
    // User cancelled or error
    return false;
  }
}

/**
 * Copy a URL to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get social share URLs for various platforms.
 */
export function getSocialShareUrls(data: ShareData): Record<string, string> {
  const encodedText = encodeURIComponent(`${data.text}\n${data.url}`);
  const encodedUrl = encodeURIComponent(data.url);
  const encodedTitle = encodeURIComponent(data.title);

  return {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(data.text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
  };
}

/**
 * Check if Web Share API is available.
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

// ============================================================
// Backward-Compatible Exports (used by existing components)
// ============================================================

/**
 * Share content via Web Share API with clipboard fallback.
 * Returns true if native share was used, false if clipboard fallback was used.
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  // Try native share first
  const nativeSuccess = await shareNative(data);
  if (nativeSuccess) return true;

  // Fallback: copy to clipboard
  const fullText = `${data.text}\n${data.url}`;
  await copyToClipboard(fullText);
  return false;
}

/** Get WhatsApp share URL */
export function getWhatsAppShareUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

/** Get X (Twitter) share URL */
export function getXShareUrl(text: string, url: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/** Get Facebook share URL */
export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/** Get Telegram share URL */
export function getTelegramShareUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

