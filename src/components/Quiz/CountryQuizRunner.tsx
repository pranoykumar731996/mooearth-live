'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EarthQuestion } from '@/types';

interface CountryQuizRunnerProps {
  questions: EarthQuestion[];
  countryName: string;
  countrySlug: string;
}

export default function CountryQuizRunner({
  questions,
  countryName,
  countrySlug,
}: CountryQuizRunnerProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const handleSelectOption = (questionId: string, option: string) => {
    if (revealed[questionId]) return; // locked once answered

    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
    setRevealed(prev => ({ ...prev, [questionId]: true }));
  };

  const answeredCount = Object.keys(revealed).length;
  const correctCount = questions.filter(
    q => userAnswers[q.id] === q.choices[q.correctIndex]
  ).length;

  return (
    <div className="space-y-8">
      {/* Quiz Progress & Score HUD */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
            Play Earth Interactive Knowledge Trial
          </span>
          <h2 className="text-xl font-bold text-white">
            {countryName} Knowledge Challenge
          </h2>
          <p className="text-xs text-white/50">
            {questions.length} authentic geography and culture questions curated from Play Earth.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-xl border border-white/5">
          <div className="text-center">
            <span className="text-[10px] text-white/40 font-mono uppercase block">Progress</span>
            <span className="text-lg font-bold text-white">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="text-center">
            <span className="text-[10px] text-white/40 font-mono uppercase block">Score</span>
            <span className="text-lg font-bold text-cyan-400">
              {correctCount}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="text-center">
            <span className="text-[10px] text-white/40 font-mono uppercase block">XP Earned</span>
            <span className="text-lg font-bold text-emerald-400">
              +{correctCount * 150}
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const isAnswered = revealed[q.id];
          const selectedOption = userAnswers[q.id];
          const correctAnswer = q.choices[q.correctIndex];
          const isCorrect = selectedOption === correctAnswer;

          return (
            <div
              key={q.id}
              className={`p-6 sm:p-8 rounded-2xl border transition-all ${
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-rose-500/40 bg-rose-950/10'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-mono text-white/40 uppercase">
                    {q.category || 'Geography'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/60">
                    Difficulty: {q.difficulty || 'medium'}
                  </span>
                  {isAnswered && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? '✓ Correct (+150 XP)' : '✗ Incorrect'}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-lg sm:text-xl font-bold text-white mb-6 leading-snug">
                {q.question}
              </h3>

              {/* Answer Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {q.choices.map((opt: string, optIdx: number) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isThisOptionSelected = selectedOption === opt;
                  const isThisOptionCorrect = opt === correctAnswer;

                  let btnStyle = 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white/90 hover:border-cyan-500/40';

                  if (isAnswered) {
                    if (isThisOptionCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-semibold';
                    } else if (isThisOptionSelected && !isCorrect) {
                      btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-200 line-through';
                    } else {
                      btnStyle = 'border-white/5 bg-white/[0.01] text-white/30 cursor-not-allowed';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-md bg-black/40 border border-white/10 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 text-white/60">
                        {letter}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation / Verification Details */}
              {isAnswered && (
                <div className="pt-4 border-t border-white/5 mt-4 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-white/90">
                    <span>💡</span>
                    <span>Correct Answer: {correctAnswer}</span>
                  </div>
                  {q.funFact && (
                    <p className="text-white/60 pl-5 leading-relaxed">
                      {q.funFact}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Banner & Play Earth Live Integration */}
      <div className="p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-purple-950/20 to-black flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
            <span>🌍</span>
            <span>Live Competitive Global Engine</span>
          </div>
          <h3 className="text-2xl font-bold text-white">
            Ready to Compete on the Global Leaderboard?
          </h3>
          <p className="text-sm text-white/70 max-w-lg">
            Take on timed speed challenges, flag recognition trials, and multiplayer country battles in Play Earth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/play-earth"
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20 hover:scale-105"
          >
            Launch Play Earth Game &rarr;
          </Link>
          <Link
            href="/games"
            className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all border border-white/10"
          >
            All Game Modes
          </Link>
        </div>
      </div>
    </div>
  );
}
