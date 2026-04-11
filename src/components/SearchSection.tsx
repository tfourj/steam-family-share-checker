import type { KeyboardEvent } from 'react';
import type { SearchGame, SearchResultState } from '../utils/types';

type SearchSectionProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onSelectGame: (game: SearchGame) => void;
  disabled: boolean;
  state: SearchResultState;
  results: SearchGame[];
};

export function SearchSection({
  value,
  onValueChange,
  onSearch,
  onClear,
  onSuggestionClick,
  onSelectGame,
  disabled,
  state,
  results,
}: SearchSectionProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSearch();
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Search</p>
          <h2>Find a game first</h2>
        </div>
      </div>

      <div className="panel-body">
        <label className="field">
          <span>Game Name</span>
          <input
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a Steam game name"
            disabled={disabled}
          />
        </label>

        <div className="button-row">
          <button type="button" className="button button-primary" onClick={onSearch} disabled={disabled}>
            Search
          </button>
          <button type="button" className="button button-secondary" onClick={onClear} disabled={disabled}>
            Clear
          </button>
        </div>

        {state.message ? (
          <div className={`status-card tone-${state.tone}`}>
            <p>{state.message}</p>
            {state.suggestion ? (
              <button
                type="button"
                className="inline-link"
                onClick={() => onSuggestionClick(state.suggestion!)}
                disabled={disabled}
              >
                Search for {state.suggestion}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="game-grid">
          {results.map((game) => (
            <article key={`${game.appId}-${game.name}`} className="game-card">
              <img src={game.logoUrl} alt={game.name} className="game-image" />
              <div className="game-copy">
                <h3>{game.name}</h3>
                <p>App ID: {game.appId}</p>
                <p>{game.price}</p>
              </div>
              <button
                type="button"
                className="button button-primary"
                onClick={() => onSelectGame(game)}
                disabled={disabled}
              >
                Check Family Share
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
