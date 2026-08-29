"use client";

import { useEffect, useState } from "react";

export interface AceConfig {
  demoMode: boolean;
  rushTradeConfigured: boolean;
  settlementAddress: string | null;
  paymentAddress: string | null;
  usdcAddress: string | null;
  rushTradeAddress: string | null;
  executorAddress: string | null;
  executorConfigured: boolean;
}

/** Fetch the public runtime config from the backend (no secrets). */
export function useAceConfig() {
  const [config, setConfig] = useState<AceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setConfig(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading };
}
