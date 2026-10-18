import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

/**
 * Reusable CAPTCHA Widget component.
 * Supports Cloudflare Turnstile (default) and hCaptcha.
 * Automatically loads the vendor script with explicit render + onload callback.
 *
 * Props:
 * - onVerify: (token: string) => void
 * - onExpire: () => void
 * - onError: (err: any) => void
 * - theme: 'light' | 'dark' | 'auto'
 *
 * Ref methods:
 * - reset(): Resets the widget to acquire a fresh token
 * - getResponse(): Returns the active verification token
 * - isReady(): Returns true if the widget is ready
 */
const CaptchaWidget = forwardRef(({ onVerify, onExpire, onError, theme = 'light' }, ref) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [tokenReceived, setTokenReceived] = useState(false);
  const currentTokenRef = useRef(null);

  // Keep latest callback references so prop changes don't trigger re-renders of the widget
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

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

  // Dynamically load the CAPTCHA script with explicit onload handler
  useEffect(() => {
    if (!siteKey) return;

    if (isTurnstile) {
      if (window.turnstile) {
        setLoaded(true);
        return;
      }
      window.__onTurnstileLoaded = () => setLoaded(true);
      const scriptId = 'cf-turnstile-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__onTurnstileLoaded';
        script.async = true;
        script.defer = true;
        script.onerror = (e) => {
          console.error('Failed to load Turnstile script:', e);
          onErrorRef.current?.(e);
        };
        document.head.appendChild(script);
      }
    } else {
      // hCaptcha
      if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
        setLoaded(true);
        return;
      }
      window.__onHcaptchaLoaded = () => setLoaded(true);
      const scriptId = 'hcaptcha-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=__onHcaptchaLoaded';
        script.async = true;
        script.defer = true;
        script.onerror = (e) => {
          console.error('Failed to load hCaptcha script:', e);
          onErrorRef.current?.(e);
        };
        document.head.appendChild(script);
      } else {
        // In case script was already in DOM, check periodically until hcaptcha is attached
        const interval = setInterval(() => {
          if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
            clearInterval(interval);
            setLoaded(true);
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [siteKey, isTurnstile]);

  // Render the widget once script and container are ready
  useEffect(() => {
    if (!siteKey || !loaded || !containerRef.current) return;

    let mounted = true;
    const container = containerRef.current;

    // Clear previous children to prevent "Only one captcha is permitted per parent container"
    container.innerHTML = '';
    widgetIdRef.current = null;

    try {
      if (isTurnstile && window.turnstile) {
        const id = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: theme === 'auto' ? 'auto' : theme,
          callback: (token) => {
            currentTokenRef.current = token;
            if (mounted) {
              setTokenReceived(true);
              onVerifyRef.current?.(token);
            }
          },
          'expired-callback': () => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onExpireRef.current?.();
            }
          },
          'error-callback': (err) => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onErrorRef.current?.(err);
            }
          },
        });
        widgetIdRef.current = id;
      } else if (!isTurnstile && window.hcaptcha) {
        const id = window.hcaptcha.render(container, {
          sitekey: siteKey,
          theme: theme === 'auto' ? 'light' : theme,
          callback: (token) => {
            currentTokenRef.current = token;
            if (mounted) {
              setTokenReceived(true);
              onVerifyRef.current?.(token);
            }
          },
          'expired-callback': () => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onExpireRef.current?.();
            }
          },
          'error-callback': (err) => {
            currentTokenRef.current = null;
            if (mounted) {
              setTokenReceived(false);
              onErrorRef.current?.(err);
            }
          },
        });
        widgetIdRef.current = id;
      }
    } catch (err) {
      console.error('Error rendering CAPTCHA widget:', err);
      onErrorRef.current?.(err);
    }

    return () => {
      mounted = false;
      if (widgetIdRef.current !== null) {
        try {
          if (isTurnstile && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
          } else if (!isTurnstile && window.hcaptcha) {
            window.hcaptcha.reset(widgetIdRef.current);
          }
        } catch {}
        widgetIdRef.current = null;
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [siteKey, loaded, isTurnstile, theme]);

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
