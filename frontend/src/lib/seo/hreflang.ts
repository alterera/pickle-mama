/** Same suffix for every locale, or a per-locale suffix map (translated catalog slugs). */
export type HreflangPathInput = string | Record<string, string>;

/**
 * hreflang alternates for browse URLs.
 *
 * Always empty on this storefront. Browse URLs are flat — `/products/hoodie`, with no
 * locale segment (ADR 0008) — so every configured locale would resolve to the *same* URL.
 * Emitting `en` → `/products/hoodie` alongside `pl` → `/products/hoodie` would tell
 * crawlers that two languages share one document, which is worse than no annotation:
 * a single canonical URL is already self-referencing.
 *
 * Restoring multi-language hreflang means reintroducing a locale URL segment first. The
 * signature is kept so `buildBrowsePageMetadata` (and the SEO seam) stay stable while
 * that decision is pending.
 */
export function buildLocaleHreflangAlternates(
	_channel: string,
	_pathSuffix: HreflangPathInput,
): Record<string, string> {
	return {};
}
