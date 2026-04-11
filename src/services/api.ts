import { appConfig } from '../utils/config';
import type { FamilyShareCheckResult, SearchGame, ServerStatus, SteamAppDetailsResponse } from '../utils/types';

async function fetchWithRetries(url: string, authKey?: string, responseType: 'json' | 'text' = 'text') {
  const maxTotalTime = 5000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxTotalTime) {
    try {
      const response = await fetch(url, {
        headers: authKey ? { 'x-auth-key': authKey } : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }

      return responseType === 'json' ? response.json() : response.text();
    } catch (error) {
      if (Date.now() - startTime >= maxTotalTime) {
        throw error;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
  }

  throw new Error('Unable to complete the request in time.');
}

export async function getAuthKey(token: string) {
  const response = await fetch(`${appConfig.apiDomain}/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange the Turnstile token for an auth key.');
  }

  const data = (await response.json()) as { authKey?: string };

  if (!data.authKey) {
    throw new Error('Challenge verification completed, but no auth key was returned.');
  }

  return data.authKey;
}

export async function getServerStatus(): Promise<ServerStatus> {
  const response = await fetch(appConfig.appStatusUrl);
  const text = await response.text();

  if (text.includes('Status') && text.includes('Up') && text.indexOf('Status') < text.indexOf('Up')) {
    return 'online';
  }

  if (text.includes('Status') && text.includes('Pending') && text.indexOf('Status') < text.indexOf('Pending')) {
    return 'pending';
  }

  return 'offline';
}

export async function searchGamesByName(
  query: string,
  authKey: string,
): Promise<{ games: SearchGame[]; suggestion: string | null }> {
  const url = `${appConfig.apiDomain}/raw?url=https://store.steampowered.com/search/results/?term=${encodeURIComponent(
    query,
  )}&count=10&l=english`;
  const html = (await fetchWithRetries(url, authKey, 'text')) as string;
  const documentParser = new DOMParser().parseFromString(html, 'text/html');
  const games = Array.from(documentParser.querySelectorAll('#search_resultsRows a'));

  if (games.length === 0) {
    const suggestionElement = documentParser.querySelector('.search_results_spellcheck_suggestion');
    const suggestionMatch = suggestionElement?.innerHTML.match(/ReplaceTerm\( &quot;(.+?)&quot; \)/);

    return {
      games: [],
      suggestion: suggestionMatch?.[1] ?? null,
    };
  }

  return {
    games: games.slice(0, 10).flatMap((game) => {
      const name = game.querySelector('.title')?.textContent?.trim();
      const appId = game.getAttribute('data-ds-appid');
      const logoUrl = game.querySelector<HTMLImageElement>('.search_capsule img')?.src;

      if (!name || !appId || !logoUrl) {
        return [];
      }

      const price = game.querySelector('.discount_final_price')?.textContent?.trim() ?? 'Price not available';

      return [
        {
          name,
          appId,
          logoUrl,
          price,
        },
      ];
    }),
    suggestion: null,
  };
}

export async function getShareCheckResult(
  appId: string,
  authKey: string,
  disabledApps: string[],
): Promise<FamilyShareCheckResult> {
  const url = `${appConfig.apiDomain}/raw?url=https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
  const data = (await fetchWithRetries(url, authKey, 'json')) as SteamAppDetailsResponse;
  const app = data[appId];

  if (!app || !app.success || !app.data) {
    throw new Error(`Game data not found for app ID ${appId}.`);
  }

  const gameData = app.data;
  const gameName = gameData.name;

  if (gameData.release_date?.coming_soon) {
    return {
      tone: 'warning',
      statusIcon: '⧗',
      message: `${gameName} is not released yet.`,
      gameName,
    };
  }

  if (gameData.is_free) {
    return {
      tone: 'neutral',
      statusIcon: null,
      message: `${gameName} is free to play.`,
      gameName,
    };
  }

  const hasFamilySharing = (gameData.categories ?? []).some(
    (category) => category.description === 'Family Sharing',
  );

  if (hasFamilySharing && disabledApps.includes(appId)) {
    return {
      tone: 'error',
      statusIcon: '✗',
      message: `${gameName} cannot be family shared because sharing is internally disabled.`,
      gameName,
    };
  }

  if (hasFamilySharing) {
    return {
      tone: 'success',
      statusIcon: '✓',
      message: `${gameName} can be shared via Family Sharing.`,
      gameName,
    };
  }

  return {
    tone: 'error',
    statusIcon: '✗',
    message: `${gameName} cannot be shared via Family Sharing.`,
    gameName,
  };
}
