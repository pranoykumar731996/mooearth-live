// ============================================================
// MooEarth Live — Country Quiz Service
// ============================================================
// Retrieves authentic Play Earth questions for sovereign nations.
// Never fabricates fake questions.

import { getQuestionsForCountry } from '@/data/questions';
import { EarthQuestion } from '@/types';

export interface CountryQuizData {
  questions: EarthQuestion[];
  countryName: string;
}

/**
 * Retrieve real Play Earth questions for a specified sovereign country.
 * Gathers questions across geography, trivia, and history.
 */
export function fetchQuizForCountry(countryName: string): CountryQuizData {
  if (!countryName) {
    return { questions: [], countryName: '' };
  }

  // Query geography questions first, then general trivia
  const geoQuestions = getQuestionsForCountry(countryName, 'geography', [], 5);
  const triviaQuestions = getQuestionsForCountry(countryName, 'trivia', geoQuestions.map(q => q.id), 5);

  const seen = new Set<string>();
  const combined: EarthQuestion[] = [];

  for (const q of [...geoQuestions, ...triviaQuestions]) {
    if (!seen.has(q.id) && q.choices && q.choices.length >= 2 && typeof q.correctIndex === 'number' && q.choices[q.correctIndex]) {
      seen.add(q.id);
      combined.push(q);
    }
  }

  return {
    questions: combined,
    countryName,
  };
}
