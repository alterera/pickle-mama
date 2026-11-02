import { type NextRequest, NextResponse } from "next/server";
import { getStaticStorefrontChannelSlugs, isAllowedStorefrontChannel } from "@/config/channels";
import { isLocaleSlug } from "@/config/locale";

const RESERVED_ROOT_SEGMENTS = new Set([
	"api",
	"checkout",
	"order",
	"_next",
	"favicon.ico",
	"robots.txt",
	"sitemap.xml",
]);

function isChannelSlug(segment: string): boolean {
	const allowed = getStaticStorefrontChannelSlugs();
	return isAllowedStorefrontChannel(segment, allowed);
}

/** Strip a leading segment list down to a single leading-slash path (`"/"` when empty). */
function toPath(segments: readonly string[]): string {
	const suffix = segments.filter(Boolean).join("/");
	return suffix ? `/${suffix}` : "/";
}

/**
 * Legacy URL support for a flat storefront (ADR 0008).
 *
 * Browse routes no longer carry `/{locale}/{channel}` segments, so the only job left here
 * is permanently redirecting indexed URLs from the old (and pre-locale) shapes to their
 * flat equivalents. Everything else falls through to the App Router untouched.
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		pathname.includes(".") // static files
	) {
		return NextResponse.next();
	}

	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) {
		return NextResponse.next();
	}

	const [first, second, ...rest] = segments;

	if (RESERVED_ROOT_SEGMENTS.has(first)) {
		return NextResponse.next();
	}

	// Legacy `/{locale}/{channel}/…` (including disabled locales) → `/…`
	if (isLocaleSlug(first) && second && isChannelSlug(second)) {
		const url = request.nextUrl.clone();
		url.pathname = toPath(rest);
		return NextResponse.redirect(url, 308);
	}

	// Legacy `/{channel}/…` (pre-ADR-0001) → `/…`
	if (isChannelSlug(first)) {
		const url = request.nextUrl.clone();
		url.pathname = toPath([second, ...rest]);
		return NextResponse.redirect(url, 308);
	}

	return NextResponse.next();
}

export const config = {
	/**
	 * Vercel bills an Edge Middleware invocation for every matched request, including the
	 * ones this function immediately no-ops on. Excluding them here means they are never
	 * invoked at all: API routes, the checkout surface, all `_next` internals, and any
	 * path ending in a file extension (public/ assets, fonts, icons — this also covers
	 * favicon.ico, robots.txt and sitemap.xml).
	 *
	 * Prefixes are anchored with `/` or `$` so they exclude `/api/…` without also
	 * excluding a channel or locale slug that merely starts with those letters.
	 *
	 * The equivalent guards at the top of `middleware()` stay as a backstop for runtimes
	 * that apply the matcher differently (self-hosted, `next start`).
	 */
	matcher: ["/((?!api/|api$|checkout/|checkout$|order/|order$|_next/|.*\\.[\\w]+$).*)"],
};
