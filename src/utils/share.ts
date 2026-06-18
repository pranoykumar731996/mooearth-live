// ============================================================
// MooEarth Live — Sharing & Virality Utilities
// ============================================================

export interface ShareDataPayload {
  title: string;
  text: string;
  url: string;
}

/**
 * Triggers native mobile sharing if supported, otherwise copies url to clipboard
 * @returns Promise<boolean> true if native share succeeded, false if copied to clipboard
 */
export async function shareContent(payload: ShareDataPayload): Promise<boolean> {
  const absoluteUrl = getAbsoluteUrl(payload.url);
  
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: absoluteUrl
      });
      return true;
    } catch (e: any) {
      // User cancelled share card or shared failed, fallback to copy if not AbortError
      if (e.name === 'AbortError') {
        return true;
      }
    }
  }

  // Clipboard copy fallback
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(absoluteUrl);
      return false;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  
  return false;
}

/** Formulates absolute URL based on relative path */
export function getAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  
  return `https://www.mooearth.live${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getWhatsAppShareUrl(text: string, url: string): string {
  const absUrl = getAbsoluteUrl(url);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + absUrl)}`;
}

export function getXShareUrl(text: string, url: string): string {
  const absUrl = getAbsoluteUrl(url);
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(absUrl)}`;
}

export function getFacebookShareUrl(url: string): string {
  const absUrl = getAbsoluteUrl(url);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absUrl)}`;
}

export function getTelegramShareUrl(text: string, url: string): string {
  const absUrl = getAbsoluteUrl(url);
  return `https://t.me/share/url?url=${encodeURIComponent(absUrl)}&text=${encodeURIComponent(text)}`;
}
