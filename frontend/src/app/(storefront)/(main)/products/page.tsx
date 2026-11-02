import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { buildBrowsePageMetadata } from "@/lib/seo";
import { getStorefrontContent } from "@/lib/content/server";
import { loadListingView } from "@/lib/listing/load";
import { listingProviderFor } from "@/lib/listing/registry";
import { templates } from "@/config/templates";
import { CategoryHero, PlpListingClient } from "@/ui/components/plp";
import { buildStorefrontPath } from "@/lib/storefront-path";
import { getStorefrontChannelSlug, getStorefrontLocaleSlug } from "@/lib/storefront-scope";

// Prefetch: default (auto) under global `partialPrefetching` — App Shell only.
// Do not put `prefetch={true}` on header chrome or homepage CTAs (`eslint` bans it).

export async function generateMetadata(): Promise<Metadata> {
	const locale = getStorefrontLocaleSlug();
	const channel = getStorefrontChannelSlug();
	const { surfaces } = await getStorefrontContent(channel, locale);

	return buildBrowsePageMetadata({
		title: surfaces.products.title,
		description: surfaces.products.description,
		locale,
		channel,
		pathSuffix: "/products",
	});
}

/**
 * Canonical `/products` is cached-first-page only, no `searchParams`.
 * Filters / sort / cursor swap the grid via `/api/listing` on the client.
 */
export default async function Page() {
	const locale = getStorefrontLocaleSlug();
	const channel = getStorefrontChannelSlug();
	const [{ surfaces }, tListing, tNav] = await Promise.all([
		getStorefrontContent(channel, locale),
		getTranslations({ locale, namespace: "productsListing" }),
		getTranslations({ locale, namespace: "nav" }),
	]);
	const productsCopy = surfaces.products;

	const breadcrumbs = [
		{ label: tListing("breadcrumbHome"), href: buildStorefrontPath(locale, channel) },
		{
			label: tListing("breadcrumbProducts"),
			href: buildStorefrontPath(locale, channel, "/products"),
		},
	];

	return (
		<templates.plp.Layout
			surface={{ kind: "all", title: productsCopy.title, description: productsCopy.description }}
			slots={{
				header: (
					<CategoryHero
						title={productsCopy.title}
						description={productsCopy.description}
						breadcrumbs={breadcrumbs}
						breadcrumbAriaLabel={tNav("breadcrumbAriaLabel")}
					/>
				),
				results: (
					<Suspense fallback={<templates.plp.Skeleton />}>
						<ProductsContent />
					</Suspense>
				),
				empty: null,
			}}
		/>
	);
}

async function ProductsContent() {
	const locale = getStorefrontLocaleSlug();
	const channel = getStorefrontChannelSlug();
	const payload = await loadListingView({
		surface: "all",
		locale,
		channel,
		view: {},
	});

	if (!payload) {
		notFound();
	}

	return (
		<PlpListingClient
			surface="all"
			locale={locale}
			channel={channel}
			products={payload.products}
			pageInfo={payload.pageInfo}
			totalCount={payload.totalCount}
			enableCategoryFilter
			facetsPlacement={templates.plp.facets}
			providerId={listingProviderFor("all").id}
			sorts={payload.sorts}
		/>
	);
}
