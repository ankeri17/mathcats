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

/**
 * The hook derives its result from the module cache during render; the effect
 * only kicks off the async fetch and records completion (never synchronous
 * setState, per the react-hooks effect rules).
 */
export function useInlineSvg(url: string | null): InlineSvgState {
  // Tracks the outcome of the most recent fetch, keyed by URL so a stale
  // result for a previous cat can never bleed into the current one.
  const [fetched, setFetched] = useState<{ url: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!url || svgCache.has(url)) return;
    let active = true;
    fetchSvg(url)
      .then(() => {
        if (active) setFetched({ url, error: false });
      })
      .catch(() => {
        if (active) setFetched({ url, error: true });
      });
    return () => {
      active = false;
    };
  }, [url]);

  if (!url) return { markup: null, error: false, loading: false };

  const cached = svgCache.get(url);
  if (cached !== undefined) return { markup: cached, error: false, loading: false };
  if (fetched?.url === url && fetched.error) {
    return { markup: null, error: true, loading: false };
  }
  return { markup: null, error: false, loading: true };
}

/** Prime the cache for art we know we'll need (e.g. the happy state). */
export function preloadSvg(url: string): void {
  void fetchSvg(url).catch(() => {});
}
