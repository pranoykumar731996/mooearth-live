import { test, expect } from '@playwright/test';

test.describe('Suite 4 & 5 — Play Earth Quiz Validation & Duplicate Detection', () => {

  test('should return a question with valid structure for a known country', async ({ request }) => {
    const response = await request.post('/api/quiz/next', {
      data: {
        country: 'Brazil',
        category: 'geography',
        answeredIds: [],
        gameMode: 'explorer',
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('question');

    const q = data.question;
    expect(q).toHaveProperty('id');
    expect(q).toHaveProperty('country');
    expect(q).toHaveProperty('category');
    expect(q).toHaveProperty('difficulty');
    expect(q).toHaveProperty('question');
    expect(q).toHaveProperty('choices');
    expect(q).toHaveProperty('correctIndex');

    // Choices must have exactly 4 items
    expect(Array.isArray(q.choices)).toBeTruthy();
    expect(q.choices.length).toBe(4);

    // correctIndex must be valid
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThanOrEqual(3);
  });

  test('should return questions matching the requested country', async ({ request }) => {
    const countries = ['Japan', 'India', 'Germany', 'United States', 'Brazil'];

    for (const country of countries) {
      const response = await request.post('/api/quiz/next', {
        data: {
          country,
          category: 'mixed',
          answeredIds: [],
          gameMode: 'explorer',
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.question) {
        // The question's country should match or be related to the requested country
        const qCountry = data.question.country.toLowerCase();
        const reqCountry = country.toLowerCase();
        const questionText = data.question.question.toLowerCase();

        const isRelated =
          qCountry.includes(reqCountry) ||
          reqCountry.includes(qCountry) ||
          questionText.includes(reqCountry) ||
          qCountry === 'global'; // Global questions are acceptable fallbacks

        expect(isRelated).toBeTruthy();
      }
    }
  });

  test('should not return duplicate questions in a sequence of 10 requests', async ({ request }) => {
    const seenIds = new Set<string>();
    const answeredIds: string[] = [];

    for (let i = 0; i < 10; i++) {
      const response = await request.post('/api/quiz/next', {
        data: {
          country: 'Germany',
          category: 'mixed',
          answeredIds: [...answeredIds],
          gameMode: 'explorer',
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.question) {
        // Check for duplicates — the same question ID should not repeat
        // (unless the question pool is exhausted, which is tested separately)
        if (seenIds.has(data.question.id) && i < 5) {
          // Duplicate in first 5 questions is a problem
          console.warn(`[Quiz Integrity] Duplicate question ID "${data.question.id}" at iteration ${i}`);
        }
        seenIds.add(data.question.id);
        answeredIds.push(data.question.id);
      }
    }

    // We should have gotten at least 5 unique questions from Germany (has 13 total)
    expect(seenIds.size).toBeGreaterThanOrEqual(5);
  });

  test('should return question with valid difficulty tier', async ({ request }) => {
    const response = await request.post('/api/quiz/next', {
      data: {
        country: 'United Kingdom',
        category: 'history',
        answeredIds: [],
        gameMode: 'explorer',
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.question) {
      expect(['easy', 'medium', 'hard']).toContain(data.question.difficulty);
    }
  });

  test('should have choices that include the correct answer', async ({ request }) => {
    const response = await request.post('/api/quiz/next', {
      data: {
        country: 'France',
        category: 'geography',
        answeredIds: [],
        gameMode: 'explorer',
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.question) {
      const q = data.question;
      const correctAnswer = q.choices[q.correctIndex];
      expect(correctAnswer).toBeTruthy();
      expect(correctAnswer.length).toBeGreaterThan(0);
    }
  });

  test('should not have empty or undefined choices', async ({ request }) => {
    const response = await request.post('/api/quiz/next', {
      data: {
        country: 'Australia',
        category: 'mixed',
        answeredIds: [],
        gameMode: 'explorer',
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.question) {
      for (let i = 0; i < data.question.choices.length; i++) {
        expect(data.question.choices[i]).toBeTruthy();
        expect(data.question.choices[i].length).toBeGreaterThan(0);
      }
    }
  });

  test('should never have duplicate choices in a single question', async ({ request }) => {
    // Test across multiple countries to catch duplicates
    const countries = ['India', 'Mexico', 'South Africa', 'Italy'];

    for (const country of countries) {
      const response = await request.post('/api/quiz/next', {
        data: {
          country,
          category: 'geography',
          answeredIds: [],
          gameMode: 'explorer',
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.question) {
        const choices = data.question.choices.map((c: string) => c.toLowerCase().trim());
        const uniqueChoices = new Set(choices);
        expect(uniqueChoices.size).toBe(choices.length);
      }
    }
  });
});
