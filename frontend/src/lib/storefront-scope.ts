import { DefaultChannelSlug } from "@/app/config";
import { getStaticStorefrontChannelSlugs } from "@/config/channels";
import { getDefaultLocaleSlug, type LocaleSlug } from "@/config/locale";

/**
 * Single-market storefront scope (ADR 0008).
 *
 * Browse URLs carry neither a locale nor a channel segment —
 * `/categories/chicken-pickle`, not `/en/default-channel/categories/chicken-pickle`.
 * Channel and locale are still real values that every Saleor query, cache tag and
 * cart cookie depends on; they are resolved here instead of from `params`, so there
 * is exactly one source of truth for the whole storefront.
 *
 * Saleor-side behaviour is unchanged: queries still receive
 * `channel: getStorefrontChannelSlug()`.
 */

/**
 * Saleor channel slug backing the storefront — `NEXT_PUBLIC_DEFAULT_CHANNEL`,
 * falling back to the first allowlisted storefront channel.
 *
 * Empty string means the deployment is misconfigured; the homepage renders the
 * "Channel Not Configured" setup screen in that case instead of throwing.
 */
export function getStorefrontChannelSlug(): string {
	return DefaultChannelSlug ?? getStaticStorefrontChannelSlugs()[0] ?? "";
}

/** UI locale slug (`en`). Fixed, because there is no locale URL segment. */
export function getStorefrontLocaleSlug(): LocaleSlug {
	return getDefaultLocaleSlug();
}
