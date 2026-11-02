import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { catalogPathSuffix, redirectToCanonicalCatalogSlug } from "@/lib/catalog/canonical-slug";
import { CatalogIdentityBridge } from "@/lib/catalog/catalog-identity-bridge";
import { getCategoryData } from "@/lib/catalog/get-category-data";
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

// Prefetch: default (auto) under global `partialPrefetching` — App Shell only. Category
// tiles deliberately do not opt into `prefetch={true}`: one runtime prefetch per tile in a
// grid is a large invocation bill for navigation that already feels instant.

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
	const category = await getCategoryData(slug, channel, locale);
	const plainDescription = parseEditorJSToText(category?.description);

	return buildBrowsePageMetadata({
		title: category?.seoTitle || category?.name || "Category",
		description: category?.seoDescription || plainDescription || category?.name,
		locale,
		channel,
		pathSuffix: category ? catalogPathSuffix("categories", category) : `/categories/${encodeURIComponent(slug)}`,
		pathSuffixByLocale: category
			? buildCatalogPathSuffixByLocale("categories", buildLocaleSlugMap(category))
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
	const [category, tListing, tNav] = await Promise.all([
		getCategoryData(slug, channel, locale),
		getTranslations({ locale, namespace: "productsListing" }),
		getTranslations({ locale, namespace: "nav" }),
	]);

	if (!category) {
		notFound();
	}

	if (decodeURIComponent(slug) !== pickTranslatedSlug(category)) {
		redirectToCanonicalCatalogSlug({
			locale,
			channel,
			urlSlug: slug,
			kind: "categories",
			entity: category,
			searchParams: await props.searchParams,
		});
	}

	const plainDescription = parseEditorJSToText(category.description);
	const categoryPath = catalogPathSuffix("categories", category);

	const breadcrumbs = [
		{
			label: tListing("breadcrumbHome"),
			href: buildStorefrontPath(locale, channel),
		},
		{
			label: category.name,
			href: buildStorefrontPath(locale, channel, categoryPath),
		},
	];

	return (
		<>
			<CatalogIdentityBridge
				kind="categories"
				primarySlug={category.slug}
				localeSlugs={buildLocaleSlugMap(category)}
			/>
			<templates.plp.Layout
				surface={{ kind: "category", title: category.name, description: plainDescription }}
				slots={{
					header: (
						<CategoryHero
							title={category.name}
							description={plainDescription}
							backgroundImage={category.backgroundImage?.url}
							breadcrumbs={breadcrumbs}
							breadcrumbAriaLabel={tNav("breadcrumbAriaLabel")}
						/>
					),
					results: (
						<Suspense fallback={<templates.plp.Skeleton />}>
							<CategoryProducts slug={category.slug} />
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
async function CategoryProducts({ slug }: { slug: string }) {
	const payload = await loadListingView({
		surface: "category",
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
			surface="category"
			locale={getStorefrontLocaleSlug()}
			channel={getStorefrontChannelSlug()}
			slug={slug}
			products={payload.products}
			pageInfo={payload.pageInfo}
			totalCount={payload.totalCount}
			facetsPlacement={templates.plp.facets}
			providerId={listingProviderFor("category").id}
			sorts={payload.sorts}
		/>
	);
}
