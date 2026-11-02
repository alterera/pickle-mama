# ADR 0008: Single-market flat URLs

**Status:** Accepted (implemented)  
**Date:** 2026-11-02  
**Supersedes:** ADR 0001 for URL shape only — its locale/language reasoning, cache keys, and `languageCode` handling still apply.  
**Related:** ADR 0004 (translated catalog slugs), `skills/saleor-paper-storefront/rules/ui-locale-routing.md`.

## Context

ADR 0001 gave every browse route two prefixes: `/{locale}/{channel}/…`. That shape exists to
serve several markets and languages from one deployment, and it costs a segment in every
URL, `hreflang` machinery, a channel/locale matrix, a 404 guard for invalid pairs, and two
picker widgets in the footer.

This storefront serves **one Saleor channel and one UI locale**. Both prefixes were always
the same value, so the URLs carried no information:

```
/en/default-channel/products/hoodie   →   /products/hoodie
/en/default-channel/categories/…      →   /categories/…
/en/default-channel                   →   /
```

Meanwhile the prefixes actively hurt:

- `sitemap`/canonical URLs are longer than they need to be, and nothing distinguishes them.
- `hreflang` emitted `en` + `x-default` pointing at the identical URL (duplicate documents).
- Middleware ran a redirect + `Set-Cookie` dance on every HTML response to normalise
  `/…` → `/{locale}/{channel}/…`.
- Every chrome component threaded a `params` promise down three levels only to read two
  constants.

## Decision

Browse URLs are **flat**. There is no locale segment and no channel segment.

```
/                        homepage
/products                all products
/products/{slug}         PDP
/categories/{slug}       PLP
/collections/{slug}      collection
/search?query=…          search
/cart, /login, /signup, /account/…, /pages/{slug}
```

Channel and locale remain **real, explicit values** — only their source changes:

| Value   | Before               | After                                    |
| ------- | -------------------- | ---------------------------------------- |
| channel | `params.channel`     | `getStorefrontChannelSlug()` (config)    |
| locale  | `params.locale`      | `getStorefrontLocaleSlug()` (config)     |

`src/lib/storefront-scope.ts` is the single source of truth. Saleor queries, cache keys,
cache tags, cart cookies, and `languageCode` are unchanged.

Supporting decisions:

1. **Route tree** — `src/app/(storefront)/[locale]/[channel]/(main)/…` collapsed to
   `src/app/(storefront)/(main)/…`; `(storefront)/[locale]/layout.tsx` became the group root
   layout with a static `<html lang>`. The `(root)` group and its redirect-only `page.tsx`
   were deleted.
2. **`app/not-found.tsx` is required** — two root layouts (`(storefront)`, `(checkout)`) mean
   no single layout wraps unmatched URLs, so the global 404 renders its own document (the
   same constraint `global-error.tsx` works under).
3. **Legacy redirects stay** — middleware 308s `/{locale}/{channel}/…` and `/{channel}/…` to
   the flat path so indexed URLs keep their signal. A bare `/{locale}` is deliberately *not*
   redirected: any locale-like string would become a redirect oracle for guessed slugs.
4. **`buildStorefrontPath(locale, channel, suffix)` is kept as a deprecated shim** that
   ignores its scope arguments. It has ~30 call sites, including the core-locked data layer
   (`src/lib/listing/`), so keeping the signature avoided touching Paper-owned files.
5. **Revalidation paths are flat** — `CACHE_PROFILES.*.pathPattern` in
   `src/lib/saleor/cache/manifest.ts` became `/products/{slug}`, `/categories/{slug}`,
   `/collections/{slug}`, `/pages/{slug}`, `/`. This is the one deliberate Paper-core edit,
   declared in `paper-version.json` → `coreOverrides`.
6. **No `hreflang`** — `buildLocaleHreflangAlternates()` returns `{}`. Flat URLs give every
   language the same URL, so alternates would be duplicate self-references.
7. **Pickers removed** — `StorefrontRegionPicker`, `ChannelSelect`, `LocaleSelect` and
   `useStorefrontRegionNavigation` are deleted. They could only ever render one option.
8. **Locale seam kept** — `NEXT_PUBLIC_STOREFRONT_LOCALES`, `LOCALE_DEFINITIONS`, and the
   GraphQL translation fields stay. Only the URL shape is single-locale.

## Consequences

**Positive**

- One canonical URL per page; sitemap, canonical, and OG URLs are the paths people type.
- Middleware is now purely legacy-URL support (no cookie writes, no root redirect).
- Chrome no longer threads `params` through three components to read two constants; cache
  chrome slots read scope directly.
- Two picker trees and their client bundle are gone.

**Negative / accepted tradeoffs**

- **Adding a second language or market later means redoing locale plumbing** — routing,
  `hreflang`, pickers, middleware, and every URL. This was the explicit cost of the
  decision; there is no incremental path back.
- `hreflang` coverage is zero. Correct for one language, and it must be revisited before a
  second is added.
- The route tree under `src/app/(storefront)/` now diverges from upstream Paper. Upstream
  route-layout changes will conflict on merge; the ADR is the reference for re-deriving the
  flat equivalent.

## Verification

`generate:all` → `typecheck` → `lint` → `test:run` → `data:lock:check` → `core:lock:check` →
`docs:check` → `build` → `test:e2e`, plus a manual pass over `/`, `/products`,
`/categories/<slug>`, a PDP with variant params, add-to-cart, checkout, and `/nope` (404).
