import { useEffect, useRef, useState } from 'react';
import { appConfig } from '../utils/config';

type UseTurnstileOptions = {
  onSuccess: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
};

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function ensureTurnstileScript() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    if (window.turnstile && existing) {
      resolve();
      return;
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load Turnstile.')), { once: true });
    document.head.appendChild(script);
  });
}

export function useTurnstile({ onSuccess, onExpired, onError }: UseTurnstileOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onSuccess, onExpired, onError });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onSuccess, onExpired, onError };
  }, [onError, onExpired, onSuccess]);

  useEffect(() => {
    let isCancelled = false;

    void ensureTurnstileScript()
      .then(() => {
        if (isCancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
          setIsLoaded(Boolean(window.turnstile));
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: appConfig.turnstileSiteKey,
          theme: 'dark',
          retry: 'never',
          callback: (token) => callbacksRef.current.onSuccess(token),
          'expired-callback': () => callbacksRef.current.onExpired(),
          'error-callback': () => callbacksRef.current.onError(),
        });

        setIsLoaded(true);
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoaded(false);
          callbacksRef.current.onError();
        }
      });

    return () => {
      isCancelled = true;

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  function reset() {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  return { containerRef, isLoaded, reset };
}
