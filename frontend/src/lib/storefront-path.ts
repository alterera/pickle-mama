/**
 * Browse URL helpers for a single-market storefront (ADR 0008).
 *
 * URLs are flat — `/categories/chicken-pickle`, `/products`, `/` — because the
 * storefront serves exactly one Saleor channel and one UI locale. Both values are
 * resolved from config (`src/lib/storefront-scope.ts`), never from the URL.
 */

/** Path after the storefront root, including the leading slash — `/products/foo`, or `` for the homepage. */
function normalizeSuffix(suffix: string): string {
	if (suffix === "" || suffix === "/") return "";
	return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

/** Canonical browse path builder — `storefrontHref("/products")` → `"/products"`. */
export function storefrontHref(suffix = ""): string {
	return normalizeSuffix(suffix) || "/";
}

/**
 * @deprecated Flat URLs have no `/{locale}/{channel}` prefix. Kept with its original
 * three-argument signature so the many call sites — including the core-locked data
 * layer in `src/lib/listing/` — keep working untouched. It now ignores the scope
 * arguments and returns the bare suffix.
 *
 * `buildStorefrontPath("en", "default-channel", "/products")` → `"/products"`
 */
export function buildStorefrontPath(_locale: string, _channel: string, suffix = ""): string {
	return storefrontHref(suffix);
}
