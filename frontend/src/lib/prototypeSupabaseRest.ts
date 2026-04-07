type SupabaseFilterOperator = "eq" | "in";

interface SupabaseFilter {
  column: string;
  operator: SupabaseFilterOperator;
  value: string | number | Array<string | number>;
}

interface SupabaseOrderBy {
  column: string;
  ascending?: boolean;
}

interface SupabaseSelectOptions {
  filters?: SupabaseFilter[];
  optional?: boolean;
  orderBy?: SupabaseOrderBy;
  select?: string;
}

const DEFAULT_USER_ID = "sergio";
const LEGACY_PROTOTYPE_RESOURCES = [
  "profile",
  "daily_log",
  "meals",
  "food_items",
  "activities",
  "daily_totals",
  "meal_totals",
];

/**
 * Returns whether the frontend prototype Supabase configuration is present.
 */
export function isPrototypeSupabaseConfigured() {
  return Boolean(readSupabaseUrl() && readSupabaseAnonKey());
}

/**
 * Returns whether an error means the legacy Supabase prototype schema is absent.
 */
export function isPrototypeSchemaMismatchError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const referencesLegacyResource = LEGACY_PROTOTYPE_RESOURCES.some((resource) => message.includes(resource));
  const describesMissingResource =
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    (message.includes("unable to load supabase resource") &&
      (message.includes("(404)") || message.includes("(406)")));

  return referencesLegacyResource && describesMissingResource;
}

/**
 * Resolves the active prototype user ID from explicit input or env config.
 */
export function resolvePrototypeUserId(userIdOverride?: string) {
  return userIdOverride?.trim() || import.meta.env.VITE_SUPABASE_USER_ID?.trim() || DEFAULT_USER_ID;
}

/**
 * Selects multiple rows from a Supabase REST table or view.
 */
export async function selectFromSupabase<T>(table: string, options: SupabaseSelectOptions = {}) {
  if (!isPrototypeSupabaseConfigured()) {
    if (options.optional) {
      return [] as T[];
    }

    throw new Error("Supabase prototype is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  const url = buildSupabaseUrl(table, options);
  const response = await fetch(url, {
    headers: buildSupabaseHeaders(),
  });

  if (!response.ok) {
    if (options.optional && isMissingSupabaseResource(response.status)) {
      return [] as T[];
    }

    throw new Error(await buildSupabaseErrorMessage(response, table));
  }

  return (await response.json()) as T[];
}

/**
 * Selects the first row from a Supabase REST table or view.
 */
export async function selectFirstFromSupabase<T>(table: string, options: SupabaseSelectOptions = {}) {
  const rows = await selectFromSupabase<T>(table, options);
  return rows[0] ?? null;
}

/**
 * Builds the fully-qualified Supabase REST URL for a select query.
 */
function buildSupabaseUrl(table: string, options: SupabaseSelectOptions) {
  const supabaseUrl = readSupabaseUrl();

  if (!supabaseUrl) {
    throw new Error("Supabase prototype URL is not configured.");
  }

  const params = new URLSearchParams();
  params.set("select", options.select ?? "*");

  for (const filter of options.filters ?? []) {
    params.append(filter.column, serializeFilter(filter));
  }

  if (options.orderBy) {
    params.set("order", `${options.orderBy.column}.${options.orderBy.ascending === false ? "desc" : "asc"}`);
  }

  return `${supabaseUrl}/rest/v1/${table}?${params.toString()}`;
}

/**
 * Builds the headers required for Supabase REST reads.
 */
function buildSupabaseHeaders() {
  const anonKey = readSupabaseAnonKey();

  if (!anonKey) {
    throw new Error("Supabase prototype anon key is not configured.");
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Serializes a Supabase REST filter into PostgREST syntax.
 */
function serializeFilter(filter: SupabaseFilter) {
  if (filter.operator === "eq") {
    return `eq.${filter.value}`;
  }

  const values = Array.isArray(filter.value) ? filter.value : [filter.value];
  return `in.(${values.map((value) => serializeFilterValue(value)).join(",")})`;
}

/**
 * Escapes a filter value for use inside an `in.(...)` expression.
 */
function serializeFilterValue(value: string | number) {
  if (typeof value === "number") {
    return String(value);
  }

  return `"${value.replaceAll("\"", "\\\"")}"`;
}

/**
 * Builds a readable error message from a failed Supabase response.
 */
async function buildSupabaseErrorMessage(response: Response, table: string) {
  try {
    const payload = (await response.json()) as { message?: string; hint?: string; details?: string };
    const details = [payload.message, payload.hint, payload.details].filter(Boolean).join(" ");
    return details || `Unable to load Supabase resource "${table}" (${response.status}).`;
  } catch {
    return `Unable to load Supabase resource "${table}" (${response.status}).`;
  }
}

/**
 * Returns whether a Supabase status likely means the resource is absent.
 */
function isMissingSupabaseResource(status: number) {
  return status === 404 || status === 406;
}

/**
 * Reads and normalizes the configured Supabase URL.
 */
function readSupabaseUrl() {
  return (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
}

/**
 * Reads and normalizes the configured Supabase anon key.
 */
function readSupabaseAnonKey() {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
}
