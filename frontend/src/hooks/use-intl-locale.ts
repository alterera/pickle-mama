"use client";

import { resolveLocaleFromSlug } from "@/config/locale";
import { getStorefrontLocaleSlug } from "@/lib/storefront-scope";

/**
 * Current locale as a BCP 47 tag for `Intl` formatting.
 *
 * The storefront serves a single locale (ADR 0008), so this is configuration rather than
 * URL state — no `useParams` read and no hydration mismatch window.
 */
export function useIntlLocale(): string {
	return resolveLocaleFromSlug(getStorefrontLocaleSlug()).bcp47;
}
