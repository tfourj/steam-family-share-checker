function getEnvValue(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

export const appConfig = {
  apiDomain: getEnvValue(import.meta.env.VITE_API_DOMAIN, 'https://fetch.steamshare.site'),
  appStatusUrl: getEnvValue(
    import.meta.env.VITE_APP_STATUS_URL,
    'https://status.steamshare.site/api/badge/3/status?style=flat-square',
  ),
  turnstileSiteKey: getEnvValue(import.meta.env.VITE_TURNSTILE_SITE_KEY, '0x4AAAAAABUBL_8zEqDZwZfT'),
};
