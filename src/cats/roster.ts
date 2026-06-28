// ────────────────────────────────────────────────────────────────────────────
// Roster — loads /cats/roster.json and derives per-cat metadata. The SVGs are
// self-contained (they define their own coat colors as inline CSS variables),
// so we never inject color into the art. We DO use each cat's colors to theme
// the matching UI bits (mastery ring, card accent, per-table tag).
// ────────────────────────────────────────────────────────────────────────────

export type CatMood = "idle" | "happy" | "locked";

/** Raw entry as it appears in roster.json. */
interface RosterEntryRaw {
  id: string;
  file: string;
  label: string;
  coat: string;
  shade: string;
  belly: string;
  mark?: string;
  markColor?: string;
  point?: boolean;
  tail?: string;
  eyes?: string;
  dark?: boolean;
  shimmer?: boolean;
}

/** Derived, ready-to-use cat metadata. */
export interface Cat {
  id: string;
  /** parseInt(id); null for milestone cats ("div"/"all"). */
  tableId: number | null;
  /** Display name, e.g. "Cream, the 7× cat". */
  name: string;
  /** Short name for tight UI (first word of the label). */
  shortName: string;
  coat: string;
  shade: string;
  belly: string;
  /** Color for theming UI bits that should match this cat. */
  accent: string;
  isMilestone: boolean;
  /** The all-stars prize cat gets a shimmer treatment. */
  shimmer: boolean;
  art: (mood: CatMood) => string;
}

function deriveCat(raw: RosterEntryRaw): Cat {
  const tableId = /^\d+$/.test(raw.id) ? parseInt(raw.id, 10) : null;
  return {
    id: raw.id,
    tableId,
    name: raw.label,
    shortName: raw.label.split(",")[0].trim(),
    coat: raw.coat,
    shade: raw.shade,
    belly: raw.belly,
    accent: raw.markColor ?? raw.shade ?? raw.coat,
    isMilestone: tableId === null,
    shimmer: Boolean(raw.shimmer),
    art: (mood: CatMood) => `/cats/${raw.file}_${mood}.svg`,
  };
}

let cache: Cat[] | null = null;

/** Load and cache the roster. Returns [] if the roster isn't present. */
export async function loadRoster(): Promise<Cat[]> {
  if (cache) return cache;
  try {
    const res = await fetch("/cats/roster.json");
    if (!res.ok) throw new Error(`roster.json ${res.status}`);
    const raw = (await res.json()) as RosterEntryRaw[];
    cache = raw.map(deriveCat);
    return cache;
  } catch (err) {
    console.warn("[mathcats] roster.json not found — using placeholder cat.", err);
    cache = [];
    return cache;
  }
}

export function findByTable(cats: Cat[], tableId: number): Cat | undefined {
  return cats.find((c) => c.tableId === tableId);
}

export function findById(cats: Cat[], id: string): Cat | undefined {
  return cats.find((c) => c.id === id);
}
