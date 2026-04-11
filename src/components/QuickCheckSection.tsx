import type { KeyboardEvent } from 'react';
import type { AppResultState } from '../utils/types';

type QuickCheckSectionProps = {
  value: string;
  onValueChange: (value: string) => void;
  onCheck: () => void;
  onClear: () => void;
  disabled: boolean;
  result: AppResultState;
};

export function QuickCheckSection({
  value,
  onValueChange,
  onCheck,
  onClear,
  disabled,
  result,
}: QuickCheckSectionProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCheck();
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Quick check</p>
          <h2>Steam app link or ID</h2>
        </div>
      </div>

      <div className="panel-body">
        <label className="field">
          <span>Steam App Link or ID</span>
          <input
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://store.steampowered.com/app/12345 or 12345"
            disabled={disabled}
          />
        </label>

        <div className="button-row">
          <button type="button" className="button button-primary" onClick={onCheck} disabled={disabled}>
            Check
          </button>
          <button type="button" className="button button-secondary" onClick={onClear} disabled={disabled}>
            Clear
          </button>
        </div>

        <div className={`status-card tone-${result.tone}`}>
          <p>{result.loading ? `${result.message}` : result.message}</p>
          {result.statusIcon ? (
            <div className="status-indicator">
              <span className="status-icon" aria-hidden="true">
                {result.statusIcon}
              </span>
              <span>Family Share Status</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
