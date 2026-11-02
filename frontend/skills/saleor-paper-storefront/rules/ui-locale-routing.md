---
name: ui-locale-routing
description: Single-market flat URLs (fork ADR 0008) - no [locale]/[channel] segments, scope resolved from config, per-locale cache keys and languageCode still applied. Use when touching locale, market, or browse URL shape.
---

# Locale & Market: Flat URLs

**Fork override.** Upstream Paper routes browse pages as `/{locale}/{channel}/…`. This
storefront serves one Saleor channel and one UI locale, so browse URLs are **flat**:
`/categories/chicken-pickle`, `/products`, `/`. See `docs/adr/0008-single-market-urls.md`;
ADR 0001 is superseded for URL shape, but its locale/caching reasoning still applies.

> **Scope helpers:** `src/lib/storefront-scope.ts` — `getStorefrontChannelSlug()`,
> `getStorefrontLocaleSlug()`
> **Path helpers:** `src/lib/storefront-path.ts` — `storefrontHref()`
> **Caching:** `data-caching.md` · **Channels:** `ui-channels.md` · **SEO:** `seo-metadata.md`

---

## URL shape

```
/categories/chicken-pickle
/products/hoodie
/cart
/
```

There is no locale segment and no channel segment. Channel and locale are **configuration**
(`NEXT_PUBLIC_DEFAULT_CHANNEL`, `NEXT_PUBLIC_DEFAULT_LOCALE`), read through
`getStorefrontChannelSlug()` / `getStorefrontLocaleSlug()`.

Nothing about the Saleor request changes: queries still receive an explicit `channel` and
`languageCode`, cache keys still include both, and cart cookies are still channel-scoped.
Only the *source* of those values moved — from route params to config.

Legacy URLs keep working via `src/middleware.ts` (308):

| Legacy                              | Flat              |
| ----------------------------------- | ----------------- |
| `/{locale}/{channel}/products/foo`  | `/products/foo`   |
| `/{channel}/products/foo`           | `/products/foo`   |

---

## Saleor: two independent axes, one deployment

| Axis     | Saleor concept                    | Resolved from                 |
| -------- | --------------------------------- | ----------------------------- |
| Market   | Channel                           | `NEXT_PUBLIC_DEFAULT_CHANNEL` |
| Language | `LanguageCodeEnum` / translations | `NEXT_PUBLIC_DEFAULT_LOCALE`  |

A single deployment still cannot express "English UI, UK market" and "Polish UI, Poland
market" as distinct URLs. Serving a second market or language means reintroducing a URL
segment first — the flat shape is a deliberate one-way tradeoff, not a migration step.

---

## Conventions (still binding)

1. **One scope, one source** — read channel/locale from `storefront-scope.ts`. Never
   re-derive them from `useParams()`, cookies, or a literal string in a component.
2. **Locale slugs** — lowercase BCP 47 in `src/config/locale.ts` (`graphqlLanguageCode`,
   `htmlLang`, `Intl` locale). Dashboard translations use base codes (`EN`, `PL`).
3. **Cache keys** — keep passing `localeSlug` into every `"use cache"` catalog/menu fetch.
   Dropping it would silently mix languages if a second locale is ever added.
4. **Cache tags** — catalog tags stay slug-scoped (`product:{slug}`); storefront content
   uses `storefront-content:{channel}:{locale}`. Revalidation path patterns are flat now —
   see `data-caching.md`.
5. **GraphQL `languageCode`** — still sent on catalog/menus/search/CMS queries.
6. **Links** — `StorefrontLink` (`src/ui/atoms/storefront-link.tsx`) or `storefrontHref()`;
   there is no `LinkWithChannel` prefix logic any more.
7. **Keep the locale seam** — `NEXT_PUBLIC_STOREFRONT_LOCALES`, `LOCALE_DEFINITIONS` and the
   GraphQL translation fields stay even though one locale is active; they are what a second
   language would plug into. `NEXT_PUBLIC_STOREFRONT_LOCALE_CHANNELS` no longer affects URLs
   and is ignored.

---

## Invalidation

A product edit still fans out tags, then paths:

```
product update → revalidateTag("product:{slug}") → revalidatePath("/products/{slug}")
```

`planPageRevalidation` / `planStorefrontContentRevalidation`
(`src/lib/saleor/cache/manifest.ts`) emit one flat path per configured locale — with a
single locale, that is one path. Full detail: `data-caching.md` § Locale & Caching.

---

## Anti-patterns

❌ **Adding a locale or channel segment "just in case"** — it changes every URL and sitemap
entry; make it a decision with an ADR, not a default
❌ **Reading `useParams().locale` / `.channel`** — those params no longer exist; the value is
`undefined` and silently produces wrong links
❌ **Hardcoding `EN_US` / `PL_PL` in `graphqlLanguageCode`** — use `src/config/locale.ts`
❌ **Omitting `localeSlug` from cached fetches** — all locales would share one cache entry
❌ **Overwriting `entity.slug` with the translation** — breaks cache tags / webhooks; use
`pickTranslatedSlug` for URLs only
❌ **Keeping a translated slug when switching locale** — foreign-language handles 404;
rewrite to the primary slug via `CatalogIdentityBridge`
❌ **Emitting `hreflang` alternates over flat URLs** — every alternate is the same URL;
`buildLocaleHreflangAlternates()` returns `{}` on purpose

---

## Related

- `ui-channels.md` — channel allowlist, single-channel scope, fulfillment
- `data-storefront-content` — locale-keyed content cache
- `data-caching.md` — locale cache keys, tags, invalidation fan-out
- `ui-i18n` — next-intl namespaces and patterns
- `docs/international-storefront.md` — human overview (three string systems)
