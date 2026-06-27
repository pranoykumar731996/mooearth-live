// ============================================================
// MooEarth Live — Windows-Friendly Country Flag Component
// ============================================================

import React, { useState } from 'react';
import Image from 'next/image';

export interface CountryFlagProps {
  flag?: string; // Emoji flag string
  countryCode?: string; // Raw 2-letter ISO code
  className?: string;
  alt?: string;
}

/**
 * Extracts the 2-letter ISO country code from an emoji flag character.
 * Regional Indicator Symbols range from U+1F1E6 (🇦) to U+1F1FF (🇿).
 */
export function getFlagCode(flag: string): string | null {
  if (!flag) return null;
  const chars = Array.from(flag);
  if (chars.length < 2) return null;
  
  const cp0 = chars[0].codePointAt(0);
  const cp1 = chars[1].codePointAt(0);
  
  if (cp0 === undefined || cp1 === undefined) return null;
  
  // Regional Indicator symbols are in U+1F1E6 .. U+1F1FF
  if (cp0 >= 0x1F1E6 && cp0 <= 0x1F1FF && cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF) {
    const code0 = cp0 - 0x1F1E6 + 65;
    const code1 = cp1 - 0x1F1E6 + 65;
    return String.fromCharCode(code0, code1).toLowerCase();
  }
  
  return null;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  flag,
  countryCode,
  className = 'w-5 h-3.5 object-cover rounded-[2px]',
  alt = 'flag',
}) => {
  const [hasError, setHasError] = useState(false);

  let code = countryCode?.toLowerCase() || null;
  if (!code && flag) {
    code = getFlagCode(flag);
  }

  // Fallback to globe emoji (which Windows displays perfectly) if invalid/unsupported
  if (hasError || !code) {
    return <span className="inline-block text-[1.1em] leading-none select-none">🌍</span>;
  }

  return (
    <Image
      src={`https://flagcdn.com/w40/${code}.png`}
      width={20}
      height={14}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} inline-block align-middle shrink-0`}
      loading="lazy"
      unoptimized={false}
    />
  );
};

/**
 * Parses a string containing flag emojis and returns a mixture of text and CountryFlag components.
 * Prevents question mark [?] box rendering bugs on Windows.
 */
export function renderTextWithFlags(text: string): React.ReactNode {
  if (!text) return '';
  
  // Regex to match flag emojis (two regional indicator symbols)
  const flagRegex = /(\uD83C[\uDDE6-\uDDFF]\uD83C[\uDDE6-\uDDFF])/g;
  const parts = text.split(flagRegex);
  
  return parts.map((part, index) => {
    if (part.match(flagRegex)) {
      return (
        <CountryFlag 
          key={index} 
          flag={part} 
          className="w-4 h-3 mx-1 object-cover rounded-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] inline-block" 
        />
      );
    }
    return part;
  });
}
