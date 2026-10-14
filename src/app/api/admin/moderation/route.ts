// ============================================================
// MooEarth Live — Server-Authorized Moderation API
// ============================================================
// Phase 10: Server-side authorization for collection review,
// approve, unpublish, remove actions, and audit logging.

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdminRequest } from '@/lib/auth/adminAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  limit,
  addDoc,
} from 'firebase/firestore';
import { CollectionReport, ModerationAuditLog, DiscoveryCollection } from '@/types/collections';

export async function GET(request: NextRequest) {
  // Server-side authorization check
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
  }

  const reports: CollectionReport[] = [];
  const flaggedCollections: DiscoveryCollection[] = [];
  const auditLogs: ModerationAuditLog[] = [];

  if (db) {
    try {
      // 1. Fetch reports
      const reportsSnap = await getDocs(query(collection(db, 'collection_reports'), limit(50)));
      reportsSnap.forEach((d) => reports.push({ id: d.id, ...d.data() } as CollectionReport));

      // 2. Fetch flagged/reported collections
      const collectionsSnap = await getDocs(query(collection(db, 'collections'), limit(50)));
      collectionsSnap.forEach((d) => {
        const col = d.data() as DiscoveryCollection;
        if ((col.reportsCount && col.reportsCount > 0) || col.status === 'flagged') {
          flaggedCollections.push(col);
        }
      });

      // 3. Fetch audit logs
      const logsSnap = await getDocs(query(collection(db, 'moderation_logs'), limit(30)));
      logsSnap.forEach((d) => auditLogs.push({ id: d.id, ...d.data() } as ModerationAuditLog));
    } catch (e: any) {
      console.warn('[ModerationAPI] Firestore query error:', e.message);
    }
  }

  return NextResponse.json({
    success: true,
    reports: reports.sort((a, b) => b.createdAt - a.createdAt),
    flaggedCollections,
    auditLogs: auditLogs.sort((a, b) => b.timestamp - a.timestamp),
  });
}

export async function POST(request: NextRequest) {
  // Server-side authorization check
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, collectionId, reportId, notes } = body as {
      action: 'approve' | 'unpublish' | 'remove' | 'dismiss_report';
      collectionId?: string;
      reportId?: string;
      notes?: string;
    };

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const timestamp = Date.now();

    if (db) {
      // 1. Target collection update
      if (collectionId) {
        const colRef = doc(db, 'collections', collectionId);
        const colSnap = await getDoc(colRef);

        if (colSnap.exists()) {
          if (action === 'approve') {
            await updateDoc(colRef, {
              status: 'published',
              moderationStatus: 'approved',
              reportsCount: 0,
              updatedAt: timestamp,
            });
          } else if (action === 'unpublish') {
            await updateDoc(colRef, {
              status: 'draft',
              moderationStatus: 'unpublish',
              updatedAt: timestamp,
            });
          } else if (action === 'remove') {
            await updateDoc(colRef, {
              status: 'archived',
              moderationStatus: 'removed',
              updatedAt: timestamp,
            });
          }
        }
      }

      // 2. Report resolution update
      if (reportId) {
        const repRef = doc(db, 'collection_reports', reportId);
        await updateDoc(repRef, {
          status: action === 'dismiss_report' ? 'dismissed' : 'reviewed',
          actionTaken: action,
        });
      }

      // 3. Record immutable audit log
      const auditLog: ModerationAuditLog = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: action === 'dismiss_report' ? 'dismiss' : action,
        targetCollectionId: collectionId || 'unknown',
        moderatorUid: 'admin_console',
        reason: notes || `Admin action: ${action}`,
        timestamp,
      };

      await addDoc(collection(db, 'moderation_logs'), auditLog);
    }

    return NextResponse.json({ success: true, action, timestamp });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
