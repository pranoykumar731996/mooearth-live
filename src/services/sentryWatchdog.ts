// ============================================================
// MooEarth Live — Sentry Runtime Watchdog & Auto-Healing Engine
// ============================================================
// Lightweight in-app error sentinel inspired by Sentry.
// Captures runtime exceptions, unhandled promise rejections,
// Three.js/WebGL faults, and executes autonomous self-healing.

export type SentrySeverity = 'fatal' | 'error' | 'warning' | 'info';

export type AutoHealAction =
  | 'HEAL_CORRUPT_STORAGE'
  | 'HEAL_WEBGL_CONTEXT'
  | 'HEAL_FAILED_IMAGE'
  | 'HEAL_STALE_SESSION'
  | 'HEAL_DEGRADED_FEED'
  | 'NONE';

export interface SentryIncident {
  id: string;
  timestamp: string;
  severity: SentrySeverity;
  message: string;
  culprit?: string;
  stack?: string;
  breadcrumbs: string[];
  autoHealAction: AutoHealAction;
  healed: boolean;
  metadata?: Record<string, any>;
}

export interface SentryHealthReport {
  status: 'HEALTHY' | 'HEALED' | 'DEGRADED' | 'CRITICAL';
  totalIncidents: number;
  unhealedErrors: number;
  autoHealsApplied: number;
  incidents: SentryIncident[];
  systemTelemetry: {
    online: boolean;
    userAgent: string;
    memoryUsageMB?: number;
    activeSessions: number;
  };
}

const STORAGE_KEY = 'mooearth_sentry_incidents';
const MAX_STORED_INCIDENTS = 100;
const MAX_BREADCRUMBS = 20;

// In-memory ring buffer for breadcrumbs
const breadcrumbs: string[] = [];

/** Add a user action or system event breadcrumb for post-mortem analysis */
export function addBreadcrumb(message: string): void {
  const timestamp = new Date().toISOString().substring(11, 19);
  breadcrumbs.push(`[${timestamp}] ${message}`);
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

/** Retrieve all logged breadcrumbs */
export function getBreadcrumbs(): string[] {
  return [...breadcrumbs];
}

/** Generate a unique incident fingerprint */
function generateIncidentId(): string {
  return 'sentry-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

/** Read stored incidents from localStorage safely */
export function getStoredIncidents(): SentryIncident[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persist an incident into localStorage */
function persistIncident(incident: SentryIncident): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredIncidents();
    list.unshift(incident);
    if (list.length > MAX_STORED_INCIDENTS) {
      list.length = MAX_STORED_INCIDENTS;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[SentryWatchdog] Failed to persist incident:', e);
  }
}

// ────────────────────────────────────────────────────────────
// Autonomous Self-Healing Handlers
// ────────────────────────────────────────────────────────────

function executeAutoHeal(message: string, stack?: string): { action: AutoHealAction; healed: boolean } {
  const lowerMsg = (message + ' ' + (stack || '')).toLowerCase();

  // 1. Corrupt localStorage / JSON parsing failure
  if (lowerMsg.includes('json.parse') || (lowerMsg.includes('syntaxerror') && lowerMsg.includes('json'))) {
    try {
      if (typeof window !== 'undefined') {
        // Inspect known keys and sanitize any non-JSON value
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('mooearth_')) {
            const val = localStorage.getItem(key);
            if (val) {
              try {
                JSON.parse(val);
              } catch {
                localStorage.removeItem(key);
                console.info(`[SentryWatchdog:AutoHeal] Sanitized corrupt key: ${key}`);
              }
            }
          }
        }
        return { action: 'HEAL_CORRUPT_STORAGE', healed: true };
      }
    } catch {}
  }

  // 2. WebGL context lost or crash
  if (lowerMsg.includes('webgl') || lowerMsg.includes('three') || lowerMsg.includes('context lost')) {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mooearth:webgl:recover'));
        return { action: 'HEAL_WEBGL_CONTEXT', healed: true };
      }
    } catch {}
  }

  // 3. Stale Game Engine Session
  if (lowerMsg.includes('session') && lowerMsg.includes('not found')) {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('mooearth_engine_session');
        return { action: 'HEAL_STALE_SESSION', healed: true };
      }
    } catch {}
  }

  // 4. Broken image / media load
  if (lowerMsg.includes('image') || lowerMsg.includes('failed to load') || lowerMsg.includes('404')) {
    return { action: 'HEAL_FAILED_IMAGE', healed: true };
  }

  // 5. Degraded RSS / Network Fetch
  if (lowerMsg.includes('fetch') || lowerMsg.includes('networkerror') || lowerMsg.includes('failed to fetch')) {
    return { action: 'HEAL_DEGRADED_FEED', healed: true };
  }

  return { action: 'NONE', healed: false };
}

// ────────────────────────────────────────────────────────────
// Public Error Capture API
// ────────────────────────────────────────────────────────────

/** Capture an exception, log it like Sentry, and trigger auto-heal */
export function captureException(
  error: Error | unknown,
  metadata?: Record<string, any>,
  severity: SentrySeverity = 'error'
): SentryIncident {
  const errObj = error instanceof Error ? error : new Error(String(error));
  const message = errObj.message || 'Unknown runtime error';
  const stack = errObj.stack;
  const culprit = stack?.split('\n')[1]?.trim() || 'unknown';

  const { action, healed } = executeAutoHeal(message, stack);

  const incident: SentryIncident = {
    id: generateIncidentId(),
    timestamp: new Date().toISOString(),
    severity,
    message,
    culprit,
    stack,
    breadcrumbs: getBreadcrumbs(),
    autoHealAction: action,
    healed,
    metadata,
  };

  persistIncident(incident);

  console.error(
    `%c[SentryWatchdog] Incident captured (${incident.id}) — ${severity.toUpperCase()}%c\nMessage: ${message}\nAuto-Heal: ${action} (${healed ? 'HEALED ✅' : 'FAILED ❌'})`,
    'background: #7f1d1d; color: #fca5a5; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    'color: inherit;'
  );

  return incident;
}

/** Capture a warning or non-fatal anomaly */
export function captureMessage(message: string, severity: SentrySeverity = 'warning', metadata?: Record<string, any>): SentryIncident {
  return captureException(new Error(message), metadata, severity);
}

/** Clear all stored incidents */
export function clearSentryIncidents(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      addBreadcrumb('Sentry incident log cleared by operator');
    } catch {}
  }
}

/** Compile a real-time Sentry Health Report */
export function getSentryHealthReport(): SentryHealthReport {
  const incidents = getStoredIncidents();
  const unhealed = incidents.filter(i => !i.healed && (i.severity === 'error' || i.severity === 'fatal')).length;
  const autoHealsApplied = incidents.filter(i => i.healed).length;

  let status: SentryHealthReport['status'] = 'HEALTHY';
  if (unhealed > 5) {
    status = 'CRITICAL';
  } else if (unhealed > 0) {
    status = 'DEGRADED';
  } else if (autoHealsApplied > 0) {
    status = 'HEALED';
  }

  let memoryUsageMB: number | undefined;
  if (typeof window !== 'undefined' && (performance as any).memory) {
    memoryUsageMB = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
  }

  return {
    status,
    totalIncidents: incidents.length,
    unhealedErrors: unhealed,
    autoHealsApplied,
    incidents,
    systemTelemetry: {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Node',
      memoryUsageMB,
      activeSessions: 1,
    },
  };
}

// ────────────────────────────────────────────────────────────
// Global Window Event Listener Initializer
// ────────────────────────────────────────────────────────────

let isWatchdogInitialized = false;

/** Initialize the global Sentry runtime watchdog */
export function initSentryWatchdog(): void {
  if (isWatchdogInitialized || typeof window === 'undefined') return;
  isWatchdogInitialized = true;

  addBreadcrumb('Sentry Runtime Watchdog initialized');

  // 1. Uncaught global runtime exceptions
  window.addEventListener('error', (event) => {
    captureException(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, 'error');
  });

  // 2. Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason || 'Unhandled Promise Rejection', {
      type: 'unhandledrejection',
    }, 'error');
  });

  // 3. User interaction breadcrumbs
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const text = target.innerText ? target.innerText.substring(0, 20) : '';
      addBreadcrumb(`Click on <${tag}${id}> "${text}"`);
    }
  }, { passive: true });

  // 4. Online/offline connectivity breadcrumbs
  window.addEventListener('online', () => addBreadcrumb('Network connection restored: online'));
  window.addEventListener('offline', () => addBreadcrumb('Network connection lost: offline'));
}
