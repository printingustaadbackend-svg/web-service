import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

/**
 * Reusable CAPTCHA Widget component.
 * Supports Cloudflare Turnstile (default) and hCaptcha.
 * Automatically loads the vendor script and renders the widget.
 *
 * Props:
 * - onVerify: (token: string) => void
 * - onExpire: () => void
 * - onError: (err: any) => void
 * - theme: 'light' | 'dark' | 'auto'
 *
 * Ref methods:
 * - reset(): Resets the widget to acquire a fresh token
 */
const CaptchaWidget = forwardRef(({ onVerify, onExpire, onError, theme = 'light' }, ref) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [tokenReceived, setTokenReceived] = useState(false);
  const currentTokenRef = useRef(null);

  // Read site keys from environment variables
  const siteKey =
    import.meta.env.VITE_CAPTCHA_SITE_KEY ||
    import.meta.env.VITE_TURNSTILE_SITE_KEY ||
    import.meta.env.VITE_HCAPTCHA_SITE_KEY ||
    '';

  const provider = (
    import.meta.env.VITE_CAPTCHA_PROVIDER ||
    (import.meta.env.VITE_HCAPTCHA_SITE_KEY ? 'hcaptcha' : 'turnstile')
  ).toLowerCase();

  const isTurnstile = provider === 'turnstile';

  // Expose imperative methods to parent (e.g. reset(), getResponse())
  useImperativeHandle(ref, () => ({
    getResponse: () => {
      if (currentTokenRef.current) return currentTokenRef.current;
      try {
        if (isTurnstile && window.turnstile && widgetIdRef.current !== null) {
          const res = window.turnstile.getResponse(widgetIdRef.current);
          if (res) return res;
        } else if (!isTurnstile && window.hcaptcha && widgetIdRef.current !== null) {
          const res = window.hcaptcha.getResponse(widgetIdRef.current);
          if (res) return res;
        }
      } catch (e) {
        console.warn('CAPTCHA getResponse warning:', e);
      }
      return currentTokenRef.current;
    },
    reset: () => {
      currentTokenRef.current = null;
      setTokenReceived(false);
      try {
        if (isTurnstile && window.turnstile && widgetIdRef.current !== null) {
          window.turnstile.reset(widgetIdRef.current);
        } else if (!isTurnstile && window.hcaptcha && widgetIdRef.current !== null) {
          window.hcaptcha.reset(widgetIdRef.current);
        }
      } catch (e) {
        console.warn('CAPTCHA reset warning:', e);
      }
    },
    isReady: () => Boolean(siteKey && loaded),
  }));

  // Dynamically load the CAPTCHA script
  useEffect(() => {
    if (!siteKey) return;

    const scriptId = isTurnstile ? 'cf-turnstile-script' : 'hcaptcha-script';
    const scriptSrc = isTurnstile
      ? 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      : 'https://js.hcaptcha.com/1/api.js?render=explicit';

    let script = document.getElementById(scriptId);

    const onScriptLoaded = () => {
      setLoaded(true);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = onScriptLoaded;
      script.onerror = (e) => {
        console.error('Failed to load CAPTCHA script:', e);
        onError?.(e);
      };
      document.head.appendChild(script);
    } else {
      // Check if already ready on window
      if ((isTurnstile && window.turnstile) || (!isTurnstile && window.hcaptcha)) {
        setLoaded(true);
      } else {
        script.addEventListener('load', onScriptLoaded);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', onScriptLoaded);
      }
    };
  }, [siteKey, isTurnstile, onError]);

  // Render the widget once script and container are ready
  useEffect(() => {
    if (!siteKey || !loaded || !containerRef.current) return;

    let mounted = true;

    try {
      if (isTurnstile && window.turnstile) {
        // Clear previous widget if any
        if (widgetIdRef.current !== null) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme === 'auto' ? 'auto' : theme,
          callback: (token) => {
            currentTokenRef.current = token;
            if (mounted) {
              setTokenReceived(true);
              onVerify?.(token);
            }
          },
          'expired-callback': () => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onExpire?.();
            }
          },
          'error-callback': (err) => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onError?.(err);
            }
          },
        });

        widgetIdRef.current = id;
      } else if (!isTurnstile && window.hcaptcha) {
        if (widgetIdRef.current !== null) {
          try {
            window.hcaptcha.reset(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }

        const id = window.hcaptcha.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme === 'auto' ? 'light' : theme,
          callback: (token) => {
            currentTokenRef.current = token;
            if (mounted) {
              setTokenReceived(true);
              onVerify?.(token);
            }
          },
          'expired-callback': () => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onExpire?.();
            }
          },
          'error-callback': (err) => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onError?.(err);
            }
          },
        });

        widgetIdRef.current = id;
      }
    } catch (err) {
      console.error('Error rendering CAPTCHA widget:', err);
      onError?.(err);
    }

    return () => {
      mounted = false;
      if (widgetIdRef.current !== null) {
        try {
          if (isTurnstile && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
          }
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, loaded, isTurnstile, theme, onVerify, onExpire, onError]);

  // If no site key is configured, show a gentle note so local development runs smoothly
  if (!siteKey) {
    return (
      <div className="my-2 p-2.5 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/50 text-[11px] text-amber-800 text-center">
        <span className="font-semibold block mb-0.5">Bot Protection (CAPTCHA)</span>
        Add <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_CAPTCHA_SITE_KEY</code> to your{' '}
        <code className="font-mono">.env.local</code> to render Turnstile/hCaptcha widget.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-3 min-h-[66px]">
      <div ref={containerRef} className="flex justify-center" />
      {tokenReceived && (
        <span className="text-[10px] text-green-600 font-semibold mt-1 flex items-center gap-1">
          ✓ Verified human
        </span>
      )}
    </div>
  );
});

CaptchaWidget.displayName = 'CaptchaWidget';

export default CaptchaWidget;
