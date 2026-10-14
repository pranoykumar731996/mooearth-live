// ============================================================
// MooEarth Live — Multilingual Game & Question Engine
// ============================================================
// Guarantees:
// 1. Question IDs remain canonical and language-independent.
// 2. correctIndex is 100% invariant across all languages.
// 3. Choices are translated 1-to-1 preserving array length and position.
// 4. Scoring, streaks, XP, anti-repeat buffers, and daily sync are identical.
// 5. Zero hallucination: verified geographic templates and dictionaries.

import { EarthQuestion } from '@/types';
import { SupportedLocale } from './types';
import { getLocalizedCountryName, getLocalizedContinentName } from './countryNames';

// ─── Localized Capital Cities ──────────────────────────────────────────────────
export const LOCALIZED_CAPITALS: Record<string, Partial<Record<SupportedLocale, string>>> = {
  'madrid': { en: 'Madrid', es: 'Madrid', fr: 'Madrid', pt: 'Madri', de: 'Madrid', ja: 'マドリード', hi: 'मैड्रिड', ar: 'مدريد', or: 'ମାଦ୍ରିଦ' },
  'brasília': { en: 'Brasília', es: 'Brasilia', fr: 'Brasília', pt: 'Brasília', de: 'Brasília', ja: 'ブラジリア', hi: 'ब्रासीलिया', ar: 'برازيليا', or: 'ବ୍ରାସିଲିଆ' },
  'brasilia': { en: 'Brasília', es: 'Brasilia', fr: 'Brasília', pt: 'Brasília', de: 'Brasília', ja: 'ブラジリア', hi: 'ब्रासीलिया', ar: 'برازيليا', or: 'ବ୍ରାସିଲିଆ' },
  'buenos aires': { en: 'Buenos Aires', es: 'Buenos Aires', fr: 'Buenos Aires', pt: 'Buenos Aires', de: 'Buenos Aires', ja: 'ブエノスアイレス', hi: 'ब्यूनस आयर्स', ar: 'بوينس آيرس', or: 'ବୁଏନସ ଆୟର୍ସ' },
  'london': { en: 'London', es: 'Londres', fr: 'Londres', pt: 'Londres', de: 'London', ja: 'ロンドン', hi: 'लंदन', ar: 'لندن', or: 'ଲଣ୍ଡନ' },
  'berlin': { en: 'Berlin', es: 'Berlín', fr: 'Berlin', pt: 'Berlim', de: 'Berlin', ja: 'ベルリン', hi: 'बर्लिन', ar: 'برلين', or: 'ବର୍ଲିନ' },
  'paris': { en: 'Paris', es: 'París', fr: 'Paris', pt: 'Paris', de: 'Paris', ja: 'パリ', hi: 'पेरिस', ar: 'باريس', or: 'ପ୍ୟାରିସ' },
  'rome': { en: 'Rome', es: 'Roma', fr: 'Rome', pt: 'Roma', de: 'Rom', ja: 'ローマ', hi: 'रोम', ar: 'روما', or: 'ରୋମ' },
  'lisbon': { en: 'Lisbon', es: 'Lisboa', fr: 'Lisbonne', pt: 'Lisboa', de: 'Lissabon', ja: 'リスボン', hi: 'लिस्बन', ar: 'لشبونة', or: 'ଲିସବନ' },
  'amsterdam': { en: 'Amsterdam', es: 'Ámsterdam', fr: 'Amsterdam', pt: 'Amsterdã', de: 'Amsterdam', ja: 'アムステルダム', hi: 'एम्स्टर्डम', ar: 'أمستردام', or: 'ଆମଷ୍ଟରଡାମ' },
  'brussels': { en: 'Brussels', es: 'Bruselas', fr: 'Bruxelles', pt: 'Bruxelas', de: 'Brüssel', ja: 'ブリュッセル', hi: 'ब्रुसेल्स', ar: 'بروكسل', or: 'ବ୍ରସେଲ୍ସ' },
  'tokyo': { en: 'Tokyo', es: 'Tokio', fr: 'Tokyo', pt: 'Tóquio', de: 'Tokio', ja: '東京', hi: 'टोक्यो', ar: 'طوكيو', or: 'ଟୋକିଓ' },
  'new delhi': { en: 'New Delhi', es: 'Nueva Delhi', fr: 'New Delhi', pt: 'Nova Déli', de: 'Neu-Delhi', ja: 'ニューデリー', hi: 'नई दिल्ली', ar: 'نيودلهي', or: 'ନୂଆଦିଲ୍ଲୀ' },
  'washington d.c.': { en: 'Washington D.C.', es: 'Washington D.C.', fr: 'Washington D.C.', pt: 'Washington D.C.', de: 'Washington D.C.', ja: 'ワシントンD.C.', hi: 'वाशिंगटन डी.सी.', ar: 'واشنطن العاصمة', or: 'ୱାଶିଂଟନ ଡି.ସି.' },
  'washington': { en: 'Washington D.C.', es: 'Washington D.C.', fr: 'Washington D.C.', pt: 'Washington D.C.', de: 'Washington D.C.', ja: 'ワシントンD.C.', hi: 'वाशिंगटन डी.सी.', ar: 'واشنطن العاصمة', or: 'ୱାଶିଂଟନ ଡି.ସି.' },
  'ottawa': { en: 'Ottawa', es: 'Ottawa', fr: 'Ottawa', pt: 'Ottawa', de: 'Ottawa', ja: 'オタワ', hi: 'ओटावा', ar: 'أوتاوا', or: 'ଓଟାୱା' },
  'canberra': { en: 'Canberra', es: 'Canberra', fr: 'Canberra', pt: 'Camberra', de: 'Canberra', ja: 'キャンベラ', hi: 'कैनबरा', ar: 'كانبرا', or: 'କାନବେରା' },
  'beijing': { en: 'Beijing', es: 'Pekín', fr: 'Pékin', pt: 'Pequim', de: 'Peking', ja: '北京', hi: 'बीजिंग', ar: 'بكين', or: 'ବେଜିଂ' },
  'cairo': { en: 'Cairo', es: 'El Cairo', fr: 'Le Caire', pt: 'Cairo', de: 'Kairo', ja: 'カイロ', hi: 'काहिरा', ar: 'القاهرة', or: 'କାଇରୋ' },
  'mexico city': { en: 'Mexico City', es: 'Ciudad de México', fr: 'Mexico', pt: 'Cidade do México', de: 'Mexiko-Stadt', ja: 'メキシコシティ', hi: 'मैक्सिको सिटी', ar: 'مدينة مكسيكو', or: 'ମେକ୍ସିକୋ ସିଟି' },
};

// ─── Question Pattern Templates ────────────────────────────────────────────────
interface QuestionTemplates {
  flag: (flag: string) => string;
  capital: (country: string) => string;
  border: (country: string) => string;
  landmark: (landmark: string) => string;
  continent: (country: string) => string;
}

const QUESTION_TEMPLATES: Record<SupportedLocale, QuestionTemplates> = {
  en: {
    flag: (flag) => `Which country flies this national flag?\n\n${flag}`,
    capital: (country) => `What is the capital of ${country}?`,
    border: (country) => `Which of these countries shares a land border with ${country}?`,
    landmark: (landmark) => `In which country is the famous landmark "${landmark}" located?`,
    continent: (country) => `On which continent is ${country} located?`,
  },
  es: {
    flag: (flag) => `¿Qué país tiene esta bandera nacional?\n\n${flag}`,
    capital: (country) => `¿Cuál es la capital de ${country}?`,
    border: (country) => `¿Cuál de estos países comparte frontera terrestre con ${country}?`,
    landmark: (landmark) => `¿En qué país se encuentra el monumento "${landmark}"?`,
    continent: (country) => `¿En qué continente se encuentra ${country}?`,
  },
  fr: {
    flag: (flag) => `Quel pays porte ce drapeau national ?\n\n${flag}`,
    capital: (country) => `Quelle est la capitale de ${country} ?`,
    border: (country) => `Lequel de ces pays partage une frontière terrestre avec ${country} ?`,
    landmark: (landmark) => `Dans quel pays se trouve le célèbre monument « ${landmark} » ?`,
    continent: (country) => `Sur quel continent se trouve ${country} ?`,
  },
  pt: {
    flag: (flag) => `Qual país ostenta esta bandeira nacional?\n\n${flag}`,
    capital: (country) => `Qual é a capital de ${country}?`,
    border: (country) => `Qual destes países faz fronteira terrestre com ${country}?`,
    landmark: (landmark) => `Em qual país fica o famoso ponto turístico "${landmark}"?`,
    continent: (country) => `Em qual continente fica ${country}?`,
  },
  de: {
    flag: (flag) => `Welches Land führt diese Nationalflagge?\n\n${flag}`,
    capital: (country) => `Was ist die Hauptstadt von ${country}?`,
    border: (country) => `Welches dieser Länder teilt eine Landgrenze mit ${country}?`,
    landmark: (landmark) => `In welchem Land befindet sich die berühmte Sehenswürdigkeit „${landmark}“?`,
    continent: (country) => `Auf welchem Kontinent liegt ${country}?`,
  },
  ja: {
    flag: (flag) => `この国旗を掲げる国はどこですか？\n\n${flag}`,
    capital: (country) => `${country}の首都はどこですか？`,
    border: (country) => `${country}と国境を接している国はどれですか？`,
    landmark: (landmark) => `有名な名所「${landmark}」はどの国にありますか？`,
    continent: (country) => `${country}はどの大陸にありますか？`,
  },
  hi: {
    flag: (flag) => `यह राष्ट्रीय ध्वज किस देश का है?\n\n${flag}`,
    capital: (country) => `${country} की राजधानी क्या है?`,
    border: (country) => `इनमें से कौन सा देश ${country} के साथ भूमि सीमा साझा करता है?`,
    landmark: (landmark) => `प्रसिद्ध ऐतिहासिक स्थल "${landmark}" किस देश में स्थित है?`,
    continent: (country) => `${country} किस महाद्वीप में स्थित है?`,
  },
  ar: {
    flag: (flag) => `أي بلد يرفع هذا العلم الوطني؟\n\n${flag}`,
    capital: (country) => `ما هي عاصمة ${country}؟`,
    border: (country) => `أي من هذه البلدان تشترك في حدود برية مع ${country}؟`,
    landmark: (landmark) => `في أي بلد يقع المعلم الشهير "${landmark}"؟`,
    continent: (country) => `في أي قارة تقع ${country}؟`,
  },
  or: {
    flag: (flag) => `ଏହି ଜାତୀୟ ପତାକା କେଉଁ ଦେଶର?\n\n${flag}`,
    capital: (country) => `${country} ର ରାଜଧାନୀ କଣ?`,
    border: (country) => `ଏହି ଦେଶଗୁଡ଼ିକ ମଧ୍ୟରୁ କେଉଁଟି ${country} ସହିତ ସୀମା ବାଣ୍ଟେ?`,
    landmark: (landmark) => `ପ୍ରସିଦ୍ଧ ସ୍ଥାନ "${landmark}" କେଉଁ ଦେଶରେ ଅବସ୍ଥିତ?`,
    continent: (country) => `${country} କେଉଁ ମହାଦେଶରେ ଅବସ୍ଥିତ?`,
  },
};

// ─── Curated / Static Questions Dictionary by ID ───────────────────────────────
export const CURATED_QUESTION_TRANSLATIONS: Record<string, Partial<Record<SupportedLocale, {
  question: string;
  choices: string[];
  funFact?: string;
}>>> = {
  'br-geo-1': {
    es: {
      question: '¿Cuál es la capital de Brasil?',
      choices: ['Río de Janeiro', 'São Paulo', 'Brasilia', 'Salvador'],
      funFact: 'Brasilia fue construida especialmente como capital en la década de 1960 y diseñada con forma de avión.',
    },
    fr: {
      question: 'Quelle est la capitale du Brésil ?',
      choices: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'],
      funFact: 'Brasília a été spécialement construite comme capitale dans les années 1960 avec un plan en forme d’avion.',
    },
    hi: {
      question: 'ब्राज़ील की राजधानी क्या है?',
      choices: ['रियो डी जेनेरो', 'साओ पाउलो', 'ब्रासीलिया', 'साल्वाडोर'],
      funFact: 'ब्रासीलिया को 1960 के दशक में विशेष रूप से राजधानी के रूप में हवाई जहाज के आकार में डिजाइन किया गया था।',
    },
    ar: {
      question: 'ما هي عاصمة البرازيل؟',
      choices: ['ريو دي جانيرو', 'ساو باولو', 'برازيليا', 'سلفادور'],
      funFact: 'تم بناء برازيليا خصيصاً كعاصمة في الستينيات وصُممت على شكل طائرة.',
    },
  },
  'ar-geo-1': {
    es: {
      question: '¿Cuál es la capital de Argentina?',
      choices: ['Córdoba', 'Mendoza', 'Rosario', 'Buenos Aires'],
      funFact: 'Buenos Aires significa "Buenos Vientos" en español.',
    },
    fr: {
      question: 'Quelle est la capitale de l’Argentine ?',
      choices: ['Córdoba', 'Mendoza', 'Rosario', 'Buenos Aires'],
      funFact: 'Buenos Aires signifie « Bons Vents » en espagnol.',
    },
    hi: {
      question: 'अर्जेंटीना की राजधानी क्या है?',
      choices: ['कोर्डोबा', 'मेंडोज़ा', 'रोसारियो', 'ब्यूनस आयर्स'],
      funFact: 'ब्यूनस आयर्स का स्पैनिश में अर्थ "अच्छी हवाएं" होता है।',
    },
    ar: {
      question: 'ما هي عاصمة الأرجنتين؟',
      choices: ['قرطبة', 'مندوزا', 'روزاريو', 'بوينس آيرس'],
      funFact: 'بوينس آيرس تعني "الرياح الطيبة" باللغة الإسبانية.',
    },
  },
  'us-geo-1': {
    es: {
      question: '¿Cuántos estados componen los Estados Unidos?',
      choices: ['48', '50', '51', '52'],
      funFact: 'Hawái y Alaska fueron los dos últimos estados admitidos en 1959.',
    },
    fr: {
      question: 'Combien d’États compte les États-Unis ?',
      choices: ['48', '50', '51', '52'],
      funFact: 'Hawaï et l’Alaska ont été les deux derniers États admis en 1959.',
    },
    hi: {
      question: 'संयुक्त राज्य अमेरिका में कितने राज्य हैं?',
      choices: ['48', '50', '51', '52'],
      funFact: 'हवाई और अलास्का 1959 में शामिल होने वाले अंतिम दो राज्य थे।',
    },
    ar: {
      question: 'كم عدد الولايات في الولايات المتحدة؟',
      choices: ['48', '50', '51', '52'],
      funFact: 'كانت هاواي وألاسكا آخر ولايتين انضمتا في عام 1959.',
    },
  },
};

/**
 * Localizes an answer choice string if it corresponds to a country, capital, or continent.
 */
export function getLocalizedChoice(choice: string, locale: SupportedLocale): string {
  if (locale === 'en' || !choice) return choice;

  // 1. Check Country Names
  const countryName = getLocalizedCountryName(choice, locale);
  if (countryName && countryName.toLowerCase() !== choice.toLowerCase()) {
    return countryName;
  }

  // 2. Check Continents
  const continentName = getLocalizedContinentName(choice, locale);
  if (continentName && continentName.toLowerCase() !== choice.toLowerCase()) {
    return continentName;
  }

  // 3. Check Capital Cities
  const capitalNorm = choice.toLowerCase().trim();
  const capEntry = LOCALIZED_CAPITALS[capitalNorm];
  if (capEntry && capEntry[locale]) {
    return capEntry[locale]!;
  }

  return choice;
}

/**
 * Translates an EarthQuestion into the target locale.
 * Strict Invariants:
 * - Returns a new object without mutating the source.
 * - question.id, question.country, question.correctIndex remain identical.
 * - choices.length remains identical.
 * - choices[correctIndex] correctly points to the translated right answer.
 */
export function getLocalizedQuestion(question: EarthQuestion, locale: SupportedLocale = 'en'): EarthQuestion {
  if (!question || locale === 'en') {
    return question;
  }

  try {
    // 1. Direct curated match by Question ID
    const curatedMatch = CURATED_QUESTION_TRANSLATIONS[question.id]?.[locale];
    if (curatedMatch && Array.isArray(curatedMatch.choices) && curatedMatch.choices.length === question.choices.length) {
      return {
        ...question,
        question: curatedMatch.question,
        choices: curatedMatch.choices,
        funFact: curatedMatch.funFact || question.funFact,
      };
    }

    const localizedCountry = getLocalizedCountryName(question.country, locale);
    const tmpl = QUESTION_TEMPLATES[locale] || QUESTION_TEMPLATES.en;
    let translatedQuestionText = question.question;

    // 2. Pattern Matching
    // A. Flag identification pattern
    if (/which country flies this national flag/i.test(question.question) || question.id.startsWith('disc-flag-')) {
      const flagMatch = question.question.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/);
      const flagEmoji = flagMatch ? flagMatch[0] : '';
      translatedQuestionText = tmpl.flag(flagEmoji);
    }
    // B. Capital city pattern
    else if (/what is the capital (city )?of/i.test(question.question) || question.id.startsWith('disc-cap-')) {
      translatedQuestionText = tmpl.capital(localizedCountry);
    }
    // C. Border neighbor pattern
    else if (/shares a (land )?border with/i.test(question.question) || question.id.startsWith('disc-border-')) {
      translatedQuestionText = tmpl.border(localizedCountry);
    }
    // D. Landmark pattern
    else if (/famous landmark/i.test(question.question) || question.id.startsWith('disc-landmark-')) {
      const landmarkMatch = question.question.match(/"([^"]+)"/);
      const landmarkName = landmarkMatch ? landmarkMatch[1] : '';
      translatedQuestionText = tmpl.landmark(landmarkName);
    }
    // E. Continent location pattern
    else if (/on which continent is/i.test(question.question) || question.id.startsWith('disc-continent-')) {
      translatedQuestionText = tmpl.continent(localizedCountry);
    }

    // 3. Localize Choices (1-to-1 mapped in the exact array positions)
    const translatedChoices = question.choices.map((choice) => getLocalizedChoice(choice, locale));

    // Validate choices integrity
    if (translatedChoices.length !== question.choices.length) {
      return question;
    }

    return {
      ...question,
      question: translatedQuestionText,
      choices: translatedChoices,
    };
  } catch (err) {
    console.warn(`[getLocalizedQuestion] Error localizing question ${question.id}:`, err);
    return question;
  }
}
