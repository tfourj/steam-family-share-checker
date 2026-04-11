import { useEffect, useMemo, useState } from 'react';
import { QuickCheckSection } from './components/QuickCheckSection';
import { SearchSection } from './components/SearchSection';
import { StatusSection } from './components/StatusSection';
import { getAuthKey, getServerStatus, getShareCheckResult, searchGamesByName } from './services/api';
import { DEFAULT_CHECK_MESSAGE, DISABLED_FAMILY_SHARE_APPS } from './utils/constants';
import { extractAppId, isRawAppId } from './utils/steam';
import type {
  AppResultState,
  AuthState,
  FamilyShareCheckResult,
  SearchGame,
  SearchResultState,
  ServerStatus,
} from './utils/types';

const initialResultState: AppResultState = {
  tone: 'neutral',
  message: DEFAULT_CHECK_MESSAGE,
  loading: false,
  statusIcon: null,
};

const initialSearchState: SearchResultState = {
  tone: 'neutral',
  message: '',
  loading: false,
};

function App() {
  const [appInput, setAppInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [authState, setAuthState] = useState<AuthState>({
    phase: 'idle',
    authKey: null,
    token: null,
    message: 'Complete the Turnstile challenge to enable search and checks.',
  });
  const [resultState, setResultState] = useState<AppResultState>(initialResultState);
  const [searchState, setSearchState] = useState<SearchResultState>(initialSearchState);
  const [searchResults, setSearchResults] = useState<SearchGame[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('pending');

  const controlsDisabled = authState.phase !== 'ready';

  useEffect(() => {
    let cancelled = false;

    void getServerStatus()
      .then((status) => {
        if (!cancelled) {
          setServerStatus(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerStatus('offline');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const authTone = useMemo(() => {
    if (authState.phase === 'ready') {
      return 'success';
    }

    if (authState.phase === 'error' || authState.phase === 'expired') {
      return 'error';
    }

    if (authState.phase === 'verifying') {
      return 'warning';
    }

    return 'neutral';
  }, [authState.phase]);

  async function handleTurnstileToken(token: string) {
    setAuthState({
      phase: 'verifying',
      authKey: null,
      token,
      message: 'Verifying Turnstile challenge...',
    });

    try {
      const authKey = await getAuthKey(token);
      setAuthState({
        phase: 'ready',
        authKey,
        token,
        message: 'Challenge complete. Search and quick check are enabled.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify Turnstile challenge.';
      setAuthState({
        phase: 'error',
        authKey: null,
        token: null,
        message,
      });
    }
  }

  function handleTurnstileExpired() {
    setAuthState({
      phase: 'expired',
      authKey: null,
      token: null,
      message: 'Turnstile session expired. Complete the challenge again to continue.',
    });
  }

  function handleTurnstileError() {
    setAuthState({
      phase: 'error',
      authKey: null,
      token: null,
      message: 'Turnstile encountered an error. Retry the challenge to continue.',
    });
  }

  function applyCheckResult(result: FamilyShareCheckResult) {
    setResultState({
      tone: result.tone,
      message: result.message,
      loading: false,
      statusIcon: result.statusIcon,
      gameName: result.gameName,
    });
  }

  async function handleCheck(inputOverride?: string) {
    if (!authState.authKey) {
      setResultState({
        tone: 'error',
        message: 'Complete the Turnstile challenge first.',
        loading: false,
        statusIcon: null,
      });
      return;
    }

    const sourceValue = (inputOverride ?? appInput).trim();
    const appId = isRawAppId(sourceValue) ? sourceValue : extractAppId(sourceValue);

    if (!appId) {
      setResultState({
        tone: 'error',
        message: 'Enter a valid Steam app link or app ID.',
        loading: false,
        statusIcon: null,
      });
      return;
    }

    setAppInput(sourceValue);
    setResultState({
      tone: 'neutral',
      message: 'Fetching game data...',
      loading: true,
      statusIcon: null,
    });

    try {
      const result = await getShareCheckResult(appId, authState.authKey, DISABLED_FAMILY_SHARE_APPS);
      applyCheckResult(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred while checking family sharing support.';

      setResultState({
        tone: 'error',
        message,
        loading: false,
        statusIcon: null,
      });
    }
  }

  function handleClearCheck() {
    setAppInput('');
    setResultState(initialResultState);
  }

  async function handleSearch(queryOverride?: string) {
    if (!authState.authKey) {
      setSearchState({
        tone: 'error',
        message: 'Complete the Turnstile challenge first.',
        loading: false,
      });
      return;
    }

    const query = (queryOverride ?? searchInput).trim();

    if (!query) {
      setSearchState({
        tone: 'error',
        message: 'Enter a game name to search.',
        loading: false,
      });
      return;
    }

    setSearchInput(query);
    setSearchState({
      tone: 'neutral',
      message: 'Fetching game data...',
      loading: true,
    });

    try {
      const result = await searchGamesByName(query, authState.authKey);

      if (result.games.length === 0) {
        setSearchResults([]);
        setSearchState({
          tone: 'error',
          message: result.suggestion
            ? `No results found. Try "${result.suggestion}" instead.`
            : 'No results found. Check the spelling and try again.',
          loading: false,
          suggestion: result.suggestion ?? undefined,
        });
        return;
      }

      setSearchResults(result.games);
      setSearchState({
        tone: 'success',
        message: `Found ${result.games.length} matching game${result.games.length === 1 ? '' : 's'}.`,
        loading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An error occurred while searching for games.';

      setSearchResults([]);
      setSearchState({
        tone: 'error',
        message,
        loading: false,
      });
    }
  }

  function handleSelectGame(game: SearchGame) {
    const url = `https://store.steampowered.com/app/${game.appId}/`;
    setAppInput(url);
    setSearchInput('');
    setSearchResults([]);
    setSearchState(initialSearchState);
    void handleCheck(url);
  }

  function handleClearSearch() {
    setSearchInput('');
    setSearchResults([]);
    setSearchState(initialSearchState);
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Steam utility</p>
        <h1>Steam Family Share Checker</h1>
        <p className="hero-copy">
          Search Steam titles or paste an app link to confirm whether the game can be shared through
          Family Sharing.
        </p>
      </header>

      <main className="layout">
        <QuickCheckSection
          value={appInput}
          onValueChange={setAppInput}
          onCheck={() => void handleCheck()}
          onClear={handleClearCheck}
          disabled={controlsDisabled}
          result={resultState}
        />

        <SearchSection
          value={searchInput}
          onValueChange={setSearchInput}
          onSearch={() => void handleSearch()}
          onClear={handleClearSearch}
          onSuggestionClick={(suggestion) => void handleSearch(suggestion)}
          onSelectGame={handleSelectGame}
          disabled={controlsDisabled}
          state={searchState}
          results={searchResults}
        />

        <StatusSection
          authMessage={authState.message}
          authTone={authTone}
          serverStatus={serverStatus}
          onSuccess={handleTurnstileToken}
          onExpired={handleTurnstileExpired}
          onError={handleTurnstileError}
        />
      </main>

      <footer className="footer">
        <a href="https://github.com/tfourj" target="_blank" rel="noreferrer">
          Created by tfourj
        </a>
        <a
          href="https://github.com/tfourj/steam-family-share-checker"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Repository
        </a>
        <a href="https://status.steamshare.site" target="_blank" rel="noreferrer">
          Server Status
        </a>
      </footer>
    </div>
  );
}

export default App;
