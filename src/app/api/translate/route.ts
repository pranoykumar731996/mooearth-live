import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { translateArticle } from '@/services/translate';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days in Milliseconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, targetLanguage, title, summary, fullContent } = body;

    if (!articleId || !targetLanguage || !title || !summary) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Define cache key and document ref
    // Sanitise ID just in case
    const sanitisedId = articleId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docId = `${sanitisedId}_${targetLanguage}`;
    let cachedData: any = null;

    try {
      console.log(`[TranslateAPI] Checking cache in Firestore for: ${docId}`);
      const docRef = doc(db, 'article_translations', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const age = Date.now() - (data.timestamp || 0);
        if (age < CACHE_TTL_MS) {
          console.log(`[TranslateAPI] Cache HIT for: ${docId}`);
          cachedData = {
            translatedTitle: data.translatedTitle,
            translatedSummary: data.translatedSummary,
            translatedContent: data.translatedContent,
            cached: true,
            modelUsed: data.modelUsed || 'cache'
          };
        } else {
          console.log(`[TranslateAPI] Cache EXPIRED for: ${docId}`);
        }
      } else {
        console.log(`[TranslateAPI] Cache MISS for: ${docId}`);
      }
    } catch (dbErr: any) {
      console.warn(`[TranslateAPI] Firestore read error (database may be unconfigured/offline):`, dbErr.message);
    }

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Call translation service
    const translation = await translateArticle(targetLanguage, title, summary, fullContent || '');

    // Write back to Firestore cache if database is reachable
    try {
      console.log(`[TranslateAPI] Writing new translation to Firestore for: ${docId}`);
      const docRef = doc(db, 'article_translations', docId);
      await setDoc(docRef, {
        articleId,
        language: targetLanguage,
        translatedTitle: translation.translatedTitle,
        translatedSummary: translation.translatedSummary,
        translatedContent: translation.translatedContent,
        modelUsed: translation.modelUsed,
        timestamp: Date.now()
      });
    } catch (dbErr: any) {
      console.warn(`[TranslateAPI] Firestore write error:`, dbErr.message);
    }

    return NextResponse.json({
      translatedTitle: translation.translatedTitle,
      translatedSummary: translation.translatedSummary,
      translatedContent: translation.translatedContent,
      cached: false,
      modelUsed: translation.modelUsed
    });

  } catch (error: any) {
    console.error('API /api/translate error:', error);
    return NextResponse.json(
      { error: 'Translation temporarily unavailable.' },
      { status: 500 }
    );
  }
}
