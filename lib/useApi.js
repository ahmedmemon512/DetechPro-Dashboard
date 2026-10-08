"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(url, { refreshMs = 0 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const ctl = useRef(null);

  const load = useCallback(
    async (silent = false) => {
      ctl.current?.abort();
      const c = new AbortController();
      ctl.current = c;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(url, { cache: "no-store", signal: c.signal });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Request failed.");
        setData(json);
        setError("");
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Request failed.");
      } finally {
        if (ctl.current === c) setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    load();
    if (!refreshMs) return () => ctl.current?.abort();
    const t = setInterval(() => { if (!document.hidden) load(true); }, refreshMs);
    return () => { clearInterval(t); ctl.current?.abort(); };
  }, [load, refreshMs]);

  return { data, error, loading, reload: () => load() };
}
