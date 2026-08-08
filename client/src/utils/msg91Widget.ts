import { getBaseUrl } from './apiConfig';

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
    sendOtp?: (phone: string, onSuccess: () => void, onFailure: (err: unknown) => void) => void;
    verifyOtp?: (
      otp: string,
      onSuccess: (data: { accessToken?: string; message?: string }) => void,
      onFailure: (err: unknown) => void,
    ) => void;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export async function initMsg91Widget() {
  try {
    const res = await fetch(`${getBaseUrl()}/auth/msg91-widget-config`);
    if (!res.ok) return;

    const { widgetId, tokenAuth } = await res.json();
    if (!widgetId || !tokenAuth) return;

    await loadScript('https://control.msg91.com/app/assets/otp-widget/lib/otp-auth.js');

    const configuration = {
      widgetId,
      tokenAuth,
      exposeMethods: true,
      success: () => undefined,
      failure: () => undefined,
    };

    window.initSendOTP?.(configuration);
  } catch (err) {
    console.warn('MSG91 widget init skipped:', err);
  }
}
