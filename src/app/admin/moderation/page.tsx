// ============================================================
// MooEarth Live — Admin Moderation Console & Review Queue
// ============================================================
// Phase 10: Server-authorized review console for community reports,
// creator collections, approve, unpublish, and remove actions.

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CollectionReport, ModerationAuditLog, DiscoveryCollection } from '@/types/collections';

export default function AdminModerationPage() {
  const [reports, setReports] = useState<CollectionReport[]>([]);
  const [flaggedCollections, setFlaggedCollections] = useState<DiscoveryCollection[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchModerationData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mooearth_admin_token') : null;
      const res = await fetch('/api/admin/moderation', {
        headers: token ? { 'x-admin-key': token } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setFlaggedCollections(data.flaggedCollections || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e: any) {
      console.error('Failed to load moderation queue:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModerationData();
  }, [fetchModerationData]);

  const handleAction = async (
    action: 'approve' | 'unpublish' | 'remove' | 'dismiss_report',
    collectionId?: string,
    reportId?: string,
    notes?: string
  ) => {
    const key = reportId || collectionId || '';
    setProcessingId(key);
    setActionFeedback(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mooearth_admin_token') : null;
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-key': token } : {}),
        },
        body: JSON.stringify({ action, collectionId, reportId, notes }),
      });

      if (res.ok) {
        setActionFeedback(`Action "${action}" executed successfully.`);
        await fetchModerationData();
      } else {
        const err = await res.json();
        setActionFeedback(`Error: ${err.error || 'Failed to apply moderation action'}`);
      }
    } catch (e: any) {
      setActionFeedback(`Network error: ${e.message}`);
    } finally {
      setProcessingId(null);
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              🛡️
            </span>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Community Moderation & Trust Console
              </h1>
              <p className="text-xs text-white/50">
                Phase 10: Review user-reported discovery collections, educator notes, and creator attributions.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchModerationData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <span>↻</span>
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold animate-pulse">
          {actionFeedback}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Pending Reports
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">
            {pendingReports.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Flagged Collections
          </span>
          <span className="text-2xl font-black text-rose-400 mt-1 block">
            {flaggedCollections.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Audit Records Logged
          </span>
          <span className="text-2xl font-black text-cyan-400 mt-1 block">
            {auditLogs.length}
          </span>
        </div>
      </div>

      {/* Section 1: Community Reports Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            Pending User Reports ({pendingReports.length})
          </h2>
          <span className="text-[11px] font-mono text-white/40">SERVER-VERIFIED QUEUE</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-white/40 font-mono text-xs">
            Loading moderation queue...
          </div>
        ) : pendingReports.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-white/40 text-xs">
            ✓ No pending reports. All collections are currently in good standing.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
                        {rep.reason}
                      </span>
                      <span className="text-xs font-mono text-white/40">
                        {new Date(rep.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-white">
                      <strong>Collection ID:</strong>{' '}
                      <Link
                        href={`/collections/${encodeURIComponent(rep.collectionId)}`}
                        target="_blank"
                        className="text-cyan-400 underline hover:text-cyan-300"
                      >
                        {rep.collectionId} ↗
                      </Link>
                    </div>

                    {rep.details && (
                      <p className="mt-1 text-xs text-white/70 italic bg-white/5 p-2 rounded-lg border border-white/5">
                        &quot;{rep.details}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      disabled={processingId === rep.id}
                      onClick={() =>
                        handleAction('approve', rep.collectionId, rep.id, 'Moderator approved content')
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Approve & Keep
                    </button>

                    <button
                      disabled={processingId === rep.id}
                      onClick={() =>
                        handleAction('unpublish', rep.collectionId, rep.id, 'Moderator unpublished back to draft')
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Unpublish to Draft
                    </button>

                    <button
                      disabled={processingId === rep.id}
                      onClick={() =>
                        handleAction('remove', rep.collectionId, rep.id, 'Moderator removed violation')
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Remove Collection
                    </button>

                    <button
                      disabled={processingId === rep.id}
                      onClick={() =>
                        handleAction('dismiss_report', rep.collectionId, rep.id, 'Report dismissed by moderator')
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Moderation Audit Log */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            Moderation Action Audit Log ({auditLogs.length})
          </h2>
          <span className="text-[11px] font-mono text-white/40">IMMUTABLE AUDIT TRAIL</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
            No moderation actions recorded yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/60 font-mono text-[11px] border-b border-white/10">
                <tr>
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">ACTION</th>
                  <th className="p-3">COLLECTION ID</th>
                  <th className="p-3">REASON / NOTES</th>
                  <th className="p-3">ACTOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {auditLogs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-white/40">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-white/60">
                      {log.targetCollectionId || log.collectionId || '—'}
                    </td>
                    <td className="p-3">{log.reason || '—'}</td>
                    <td className="p-3 font-mono text-white/40">{log.moderatorUid || log.adminUid || 'admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
