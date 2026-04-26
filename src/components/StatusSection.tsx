import { useEffect, useState } from 'react';
import { useTurnstile } from '../hooks/useTurnstile';
import type { AuthState, StatusTone, ServerStatus } from '../utils/types';

type StatusSectionProps = {
  authPhase: AuthState['phase'];
  authMessage: string;
  authTone: StatusTone;
  serverStatus: ServerStatus;
  onSuccess: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
};

const serverStatusLabel: Record<ServerStatus, string> = {
  online: 'Online',
  pending: 'Pending',
  offline: 'Offline',
};

export function StatusSection({
  authPhase,
  authMessage,
  authTone,
  serverStatus,
  onSuccess,
  onExpired,
  onError,
}: StatusSectionProps) {
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);
  const { containerRef, isLoaded, reset } = useTurnstile({
    onSuccess,
    onExpired,
    onError,
  });
  const canDismissOverlay = authPhase === 'error' || authPhase === 'expired';
  const isBlockingOverlay = authPhase !== 'ready' && !isOverlayDismissed;
  const overlayTitle =
    authPhase === 'error'
      ? 'Verification failed'
      : authPhase === 'expired'
        ? 'Verification expired'
        : authPhase === 'verifying'
          ? 'Checking verification'
          : 'Verify to continue';

  useEffect(() => {
    if (!canDismissOverlay) {
      setIsOverlayDismissed(false);
    }
  }, [canDismissOverlay]);

  function handleRetry() {
    setIsOverlayDismissed(false);
    reset();
  }

  return (
    <>
      <section className="panel status-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Status & settings</p>
            <h2>Verification and API status</h2>
          </div>
        </div>

        <div className="panel-body">
          <div className={`status-card tone-${authTone}`}>
            <p>{authMessage}</p>
            {authPhase !== 'ready' ? (
              <button
                type="button"
                className="inline-link"
                onClick={() => setIsOverlayDismissed(false)}
              >
                Open verification
              </button>
            ) : null}
          </div>

          <div className="server-status">
            <span>Server Status</span>
            <strong className={`server-pill server-${serverStatus}`}>{serverStatusLabel[serverStatus]}</strong>
          </div>
        </div>
      </section>

      <div className={`turnstile-overlay${isBlockingOverlay ? ' is-visible' : ''}`} aria-hidden={!isBlockingOverlay}>
        <div className="turnstile-dialog" role="dialog" aria-modal="true" aria-labelledby="turnstile-title">
          <p className="panel-kicker">Security check</p>
          <h2 id="turnstile-title">{overlayTitle}</h2>
          <p className={`turnstile-message tone-${authTone}`}>{authMessage}</p>

          <div className="turnstile-shell">
            <div ref={containerRef} className="turnstile-slot" />
          </div>

          {canDismissOverlay ? (
            <div className="button-row turnstile-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleRetry}
                disabled={!isLoaded}
              >
                Retry
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setIsOverlayDismissed(true)}
              >
                Close
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
