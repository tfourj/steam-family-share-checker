export type StatusTone = 'neutral' | 'success' | 'warning' | 'error';
export type ServerStatus = 'online' | 'pending' | 'offline';

export type AuthState = {
  phase: 'idle' | 'verifying' | 'ready' | 'expired' | 'error';
  authKey: string | null;
  token: string | null;
  message: string;
};

export type AppResultState = {
  tone: StatusTone;
  message: string;
  loading: boolean;
  statusIcon: string | null;
  gameName?: string;
};

export type SearchResultState = {
  tone: StatusTone;
  message: string;
  loading: boolean;
  suggestion?: string;
};

export type SearchGame = {
  name: string;
  appId: string;
  price: string;
  logoUrl: string;
};

export type FamilyShareCheckResult = {
  tone: StatusTone;
  statusIcon: string | null;
  message: string;
  gameName: string;
};

export type SteamCategory = {
  description: string;
};

export type SteamAppData = {
  name: string;
  is_free?: boolean;
  categories?: SteamCategory[];
  release_date?: {
    coming_soon?: boolean;
  };
};

export type SteamAppDetailsResponse = Record<
  string,
  {
    success: boolean;
    data?: SteamAppData;
  }
>;
