const MAX_REPORTS_PER_MINUTE = 5;

let installed = false;
const recent = new Map<string, number>();

function shouldReport(key: string): boolean {
  const now = Date.now();
  for (const [oldKey, timestamp] of recent) {
    if (now - timestamp > 60_000) recent.delete(oldKey);
  }
  if (recent.has(key) || recent.size >= MAX_REPORTS_PER_MINUTE) return false;
  recent.set(key, now);
  return true;
}

function report(message: string, stack?: string): void {
  if (typeof window === 'undefined' || !message) return;
  if (!shouldReport(`${message}:${stack?.slice(0, 120) || ''}`)) return;
  const body = JSON.stringify({
    message: message.slice(0, 2000),
    stack: (stack || '').slice(0, 8000),
    url: window.location.pathname,
    userAgent: navigator.userAgent,
  });
  try {
    void fetch('/api/v1/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Error reporting must never break the page.
  }
}

export function reportClientError(message: string, stack?: string): void {
  report(message, stack);
}

export function installErrorReporter(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (event) => {
    report(event.message || 'Unknown frontend error', event.error?.stack);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    report(
      reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection'),
      reason instanceof Error ? reason.stack : undefined
    );
  });
}
