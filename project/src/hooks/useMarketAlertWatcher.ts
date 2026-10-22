import { useEffect } from 'react';
import { fetchMarketOverview } from '../lib/marketApi';
import { readLocal } from '../lib/localStore';
import { MARKET_KEYS, checkAlerts, type PriceAlert } from '../components/tools/marketTools';

const CHECK_MS = 120_000;

/** Checks Market price alerts every 2 minutes while SG16 is open — only when an alert is waiting. */
export function useMarketAlertWatcher() {
  useEffect(() => {
    const tick = async () => {
      const waiting = readLocal<PriceAlert[]>(MARKET_KEYS.alerts, []).some((a) => !a.triggeredAt);
      if (!waiting || document.hidden) return;
      try {
        checkAlerts(await fetchMarketOverview());
      } catch {
        /* try again next tick */
      }
    };
    const t = window.setInterval(() => void tick(), CHECK_MS);
    return () => window.clearInterval(t);
  }, []);
}
