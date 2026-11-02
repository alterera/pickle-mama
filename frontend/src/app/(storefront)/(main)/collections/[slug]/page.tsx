import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { catalogPathSuffix, redirectToCanonicalCatalogSlug } from "@/lib/catalog/canonical-slug";
import { CatalogIdentityBridge } from "@/lib/catalog/catalog-identity-bridge";
import { getCollectionData } from "@/lib/catalog/get-collection-data";
import { buildCatalogPathSuffixByLocale, buildLocaleSlugMap } from "@/lib/catalog/locale-slugs";
import { parseEditorJSToText } from "@/lib/editorjs";
import { buildBrowsePageMetadata } from "@/lib/seo";
import { loadListingView } from "@/lib/listing/load";
import { listingProviderFor } from "@/lib/listing/registry";
import { templates } from "@/config/templates";
import { CategoryHero, PlpListingClient } from "@/ui/components/plp";
import { buildStorefrontPath } from "@/lib/storefront-path";
import { getStorefrontChannelSlug, getStorefrontLocaleSlug } from "@/lib/storefront-scope";
import { pickTranslatedSlug } from "@/lib/saleor-translations";

// Prefetch: default (auto) under global `partialPrefetching` — App Shell only until a
// caller opts in with `prefetch={true}` (no collection-destination links do today).

type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		cursor?: string;
		direction?: string;
		sort?: string;
		price?: string;
		colors?: string;
		sizes?: string;
	}>;
};

export const generateMetadata = async (props: PageProps): Promise<Metadata> => {
	const { slug } = await props.params;
	const locale = getStorefrontLocaleSlug();
	const channel = getStorefrontChannelSlug();
	const collection = await getCollectionData(slug, channel, locale);
	const plainDescription = parseEditorJSToText(collection?.description);

	return buildBrowsePageMetadata({
		title: collection?.seoTitle || collection?.name || "Collection",
		description: collection?.seoDescription || plainDescription || collection?.name,
		locale,
		channel,
		pathSuffix: collection
			? catalogPathSuffix("collections", collection)
			: `/collections/${encodeURIComponent(slug)}`,
		pathSuffixByLocale: collection
			? buildCatalogPathSuffixByLocale("collections", buildLocaleSlugMap(collection))
			: undefined,
	});
};

/**
 * Cached hero + cached first-page grid (params only). Filters swap via `/api/listing`.
 * `searchParams` is awaited only on the rare non-canonical slug redirect.
 */
export default async function Page(props: PageProps) {
	const { slug } = await props.params;
	const locale = getStorefrontLocaleSlug();
	const channel = getStorefrontChannelSlug();
	const [collection, tListing, tNav] = await Promise.all([
		getCollectionData(slug, channel, locale),
		getTranslations({ locale, namespace: "productsListing" }),
		getTranslations({ locale, namespace: "nav" }),
	]);

	if (!collection) {
		notFound();
	}

	if (decodeURIComponent(slug) !== pickTranslatedSlug(collection)) {
		redirectToCanonicalCatalogSlug({
			locale,
			channel,
			urlSlug: slug,
			kind: "collections",
			entity: collection,
			searchParams: await props.searchParams,
		});
	}

	const plainDescription = parseEditorJSToText(collection.description);
	const collectionPath = catalogPathSuffix("collections", collection);

	const breadcrumbs = [
		{ label: tListing("breadcrumbHome"), href: buildStorefrontPath(locale, channel) },
		{
			label: collection.name,
			href: buildStorefrontPath(locale, channel, collectionPath),
		},
	];

	return (
		<>
			<CatalogIdentityBridge
				kind="collections"
				primarySlug={collection.slug}
				localeSlugs={buildLocaleSlugMap(collection)}
			/>
			<templates.plp.Layout
				surface={{ kind: "collection", title: collection.name, description: plainDescription }}
				slots={{
					header: (
						<CategoryHero
							title={collection.name}
							description={plainDescription}
							backgroundImage={collection.backgroundImage?.url}
							breadcrumbs={breadcrumbs}
							breadcrumbAriaLabel={tNav("breadcrumbAriaLabel")}
						/>
					),
					results: (
						<Suspense fallback={<templates.plp.Skeleton />}>
							<CollectionProducts slug={collection.slug} />
						</Suspense>
					),
					empty: null,
				}}
			/>
		</>
	);
}

/**
 * `slug` is the resolved Saleor slug — the storefront scope (channel + locale) comes from
 * configuration, so the only request data this boundary still needs is the URL slug.
 */
async function CollectionProducts({ slug }: { slug: string }) {
	const payload = await loadListingView({
		surface: "collection",
		locale: getStorefrontLocaleSlug(),
		channel: getStorefrontChannelSlug(),
		slug,
		view: {},
	});
	if (!payload) {
		notFound();
	}

	return (
		<PlpListingClient
			surface="collection"
			locale={getStorefrontLocaleSlug()}
			channel={getStorefrontChannelSlug()}
			slug={slug}
			products={payload.products}
			pageInfo={payload.pageInfo}
			totalCount={payload.totalCount}
			facetsPlacement={templates.plp.facets}
			providerId={listingProviderFor("collection").id}
			sorts={payload.sorts}
		/>
	);
}
