import { useTurnstile } from '../hooks/useTurnstile';
import type { StatusTone, ServerStatus } from '../utils/types';

type StatusSectionProps = {
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
  authMessage,
  authTone,
  serverStatus,
  onSuccess,
  onExpired,
  onError,
}: StatusSectionProps) {
  const { containerRef, isLoaded, reset } = useTurnstile({
    onSuccess,
    onExpired,
    onError,
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Status & settings</p>
          <h2>Verification and API status</h2>
        </div>
      </div>

      <div className="panel-body">
        <div className={`status-card tone-${authTone}`}>
          <p>{authMessage}</p>
        </div>

        <div className="turnstile-shell">
          <div ref={containerRef} className="turnstile-slot" />
          <div className="button-row">
            <button
              type="button"
              className="button button-secondary"
              onClick={reset}
              disabled={!isLoaded}
            >
              Retry challenge
            </button>
          </div>
        </div>

        <div className="server-status">
          <span>Server Status</span>
          <strong className={`server-pill server-${serverStatus}`}>{serverStatusLabel[serverStatus]}</strong>
        </div>
      </div>
    </section>
  );
}
