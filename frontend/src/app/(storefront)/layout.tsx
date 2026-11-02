import "../globals.css";
import { type ReactNode } from "react";
import { type Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { rootMetadata } from "@/lib/seo";
import { getDefaultTimeZone, resolveLocaleFromSlug } from "@/config/locale";
import { getStorefrontLocaleSlug } from "@/lib/storefront-scope";
import { getRootHtmlFontProps } from "@/lib/fonts";
import { saleorMediaPreconnectOrigin } from "@/lib/images";
import { speedInsightsSampleRate } from "@/lib/speed-insights";
import { webAnalyticsEnabled } from "@/lib/analytics/web-analytics";
import { AnalyticsMount } from "@/ui/components/analytics-mount";
import { WebAnalytics } from "@/ui/components/web-analytics";

const storefrontLocale = getStorefrontLocaleSlug();

/**
 * Root defaults + `og:locale` for the single storefront locale (ADR 0008). Static — the
 * locale is configuration, not URL data, so this no longer forces a dynamic segment.
 * Browse pages that build their own OpenGraph block (`buildBrowsePageMetadata`) replace
 * this wholesale; everything else (login, account, cart, …) inherits a locale-correct
 * default instead of a hardcoded `en_US`.
 */
export const metadata: Metadata = (() => {
	const definition = resolveLocaleFromSlug(storefrontLocale);
	if (!rootMetadata.openGraph) return rootMetadata;
	return {
		...rootMetadata,
		openGraph: { ...rootMetadata.openGraph, locale: definition.ogLocale },
	};
})();

/**
 * Storefront root layout — renders `<html lang>` server-side.
 *
 * The language comes from `getStorefrontLocaleSlug()` rather than a `[locale]` URL
 * segment (ADR 0008), so the shell stays static and the not-found boundary always has
 * an HTML shell.
 */
export default async function StorefrontRootLayout({ children }: { children: ReactNode }) {
	const htmlLang = resolveLocaleFromSlug(storefrontLocale).htmlLang;

	// Code-owned UI strings (next-intl). Locale is configuration (ADR 0008), not next-intl
	// routing. `setRequestLocale` seeds the request config from our constant so message
	// resolution stays static (no `headers()`) — preserves PPR / Cache Components.
	setRequestLocale(storefrontLocale);
	const messages = await getMessages();
	const htmlProps = getRootHtmlFontProps(htmlLang);
	const mediaOrigin = saleorMediaPreconnectOrigin();

	return (
		<html {...htmlProps}>
			{/* No crossOrigin: plain <img> fetches are not CORS, and a `crossorigin`
			    preconnect would warm a connection the image load cannot reuse. */}
			{mediaOrigin && <link rel="preconnect" href={mediaOrigin} />}
			<body className="min-h-dvh font-sans">
				<NextIntlClientProvider
					locale={storefrontLocale}
					messages={messages}
					timeZone={getDefaultTimeZone()}
				>
					{children}
					{/* Sampled — unsampled Speed Insights dominates the Vercel bill at scale. */}
					<SpeedInsights sampleRate={speedInsightsSampleRate()} />
					{/* Unsampled page views — the denominator; URLs are redacted in beforeSend. */}
					{webAnalyticsEnabled() && <WebAnalytics />}
				</NextIntlClientProvider>
				<AnalyticsMount />
			</body>
		</html>
	);
}
