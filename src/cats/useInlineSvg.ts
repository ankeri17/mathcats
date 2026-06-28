// ────────────────────────────────────────────────────────────────────────────
// useInlineSvg — fetch an SVG file and return its raw markup so it can be
// injected into the DOM. Inlining (rather than <img src>) is what exposes the
// .cat-paw / .cat-tail / .cat-ear / .cat-eyes groups for animation. Results are
// cached per-URL so swapping idle↔happy doesn't refetch.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

const svgCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

async function fetchSvg(url: string): Promise<string> {
  const cached = svgCache.get(url);
  if (cached !== undefined) return cached;

  let promise = inflight.get(url);
  if (!promise) {
    promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${url} → ${res.status}`);
        return res.text();
      })
      .then((text) => {
        svgCache.set(url, text);
        inflight.delete(url);
        return text;
      })
      .catch((err) => {
        inflight.delete(url);
        throw err;
      });
    inflight.set(url, promise);
  }
  return promise;
}

export interface InlineSvgState {
  markup: string | null;
  error: boolean;
  loading: boolean;
}

export function useInlineSvg(url: string | null): InlineSvgState {
  const [state, setState] = useState<InlineSvgState>(() => ({
    markup: url ? svgCache.get(url) ?? null : null,
    error: false,
    loading: Boolean(url) && !svgCache.has(url ?? ""),
  }));

  useEffect(() => {
    if (!url) {
      setState({ markup: null, error: false, loading: false });
      return;
    }

    const cached = svgCache.get(url);
    if (cached !== undefined) {
      setState({ markup: cached, error: false, loading: false });
      return;
    }

    let active = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    fetchSvg(url)
      .then((markup) => {
        if (active) setState({ markup, error: false, loading: false });
      })
      .catch(() => {
        if (active) setState({ markup: null, error: true, loading: false });
      });

    return () => {
      active = false;
    };
  }, [url]);

  return state;
}

/** Prime the cache for art we know we'll need (e.g. the happy state). */
export function preloadSvg(url: string): void {
  void fetchSvg(url).catch(() => {});
}
