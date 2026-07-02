import type { PaddlePublicConfig } from './billingApi';

const PADDLE_SCRIPT = {
  sandbox: 'https://sandbox-cdn.paddle.com/paddle/v2/paddle.js',
  production: 'https://cdn.paddle.com/paddle/v2/paddle.js',
} as const;

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: 'sandbox' | 'production') => void };
      Initialize: (options: {
        token: string;
        eventCallback?: (event: { name?: string; data?: unknown }) => void;
      }) => void;
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customData?: Record<string, string>;
          customer?: { email?: string };
          settings?: { displayMode?: 'overlay' | 'inline' };
        }) => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;
let initializedToken: string | null = null;
let checkoutCompleteHandler: (() => void) | null = null;

function loadPaddleScript(environment: PaddlePublicConfig['environment']): Promise<void> {
  if (window.Paddle) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PADDLE_SCRIPT[environment];
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Failed to load Paddle.js'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

export async function initPaddle(config: PaddlePublicConfig, onCheckoutComplete?: () => void): Promise<void> {
  if (!config.enabled || !config.clientToken) {
    throw new Error('Paddle is not configured on this server.');
  }

  checkoutCompleteHandler = onCheckoutComplete ?? null;
  await loadPaddleScript(config.environment);

  if (!window.Paddle) {
    throw new Error('Paddle.js did not initialize.');
  }

  window.Paddle.Environment.set(config.environment);

  if (initializedToken === config.clientToken) return;

  window.Paddle.Initialize({
    token: config.clientToken,
    eventCallback(event) {
      if (event.name === 'checkout.completed') {
        checkoutCompleteHandler?.();
      }
    },
  });

  initializedToken = config.clientToken;
}

export async function openPaddleCheckout(options: {
  config: PaddlePublicConfig;
  priceId: string;
  googleSub: string;
  onComplete?: () => void;
}): Promise<void> {
  await initPaddle(options.config, options.onComplete);

  if (!window.Paddle) {
    throw new Error('Paddle checkout is unavailable.');
  }

  window.Paddle.Checkout.open({
    items: [{ priceId: options.priceId, quantity: 1 }],
    customData: { googleSub: options.googleSub },
    settings: { displayMode: 'overlay' },
  });
}
