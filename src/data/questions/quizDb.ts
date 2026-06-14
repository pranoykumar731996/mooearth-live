// ============================================================
// Play Earth — Lightweight JSON File Database Helper
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { EarthQuestion } from '@/types';

const DB_PATH = path.resolve(process.cwd(), 'src/data/questions/quizDb.json');

export interface UserProgress {
  answeredQuestionIds: string[];
  aiGeneratedHashes: string[];
  recentQuestions: string[];
}

export interface DbSchema {
  users: Record<string, UserProgress>;
  cachedAiQuestions: EarthQuestion[];
}

function initDb(): DbSchema {
  // Check directory
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const defaultDb: DbSchema = { users: {}, cachedAiQuestions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    const defaultDb: DbSchema = { users: {}, cachedAiQuestions: [] };
    return defaultDb;
  }
}

export function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save quiz DB:', e);
  }
}

export function getUserProgress(username: string): UserProgress {
  const db = initDb();
  if (!db.users[username]) {
    db.users[username] = {
      answeredQuestionIds: [],
      aiGeneratedHashes: [],
      recentQuestions: []
    };
    saveDb(db);
  }
  return db.users[username];
}

export function saveUserProgress(username: string, progress: UserProgress) {
  const db = initDb();
  db.users[username] = progress;
  saveDb(db);
}

export function getCachedAiQuestions(
  country: string,
  category: string,
  difficulty: string
): EarthQuestion[] {
  const db = initDb();
  return db.cachedAiQuestions.filter(
    q => q.country.toLowerCase() === country.toLowerCase() &&
         q.category === category &&
         q.difficulty === difficulty
  );
}

export function addCachedAiQuestion(question: EarthQuestion) {
  const db = initDb();
  const exists = db.cachedAiQuestions.some(
    q => q.question.toLowerCase().trim() === question.question.toLowerCase().trim()
  );
  if (!exists) {
    db.cachedAiQuestions.push(question);
    saveDb(db);
  }
}
