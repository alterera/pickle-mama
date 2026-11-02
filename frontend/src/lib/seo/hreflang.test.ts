import { afterEach, describe, expect, it, vi } from "vitest";
import { buildLocaleHreflangAlternates } from "./hreflang";

describe("buildLocaleHreflangAlternates", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns no alternates for a single-locale storefront", () => {
		vi.stubEnv("NEXT_PUBLIC_STOREFRONT_LOCALES", "en");
		vi.stubEnv("NEXT_PUBLIC_DEFAULT_CHANNEL", "default-channel");
		vi.stubEnv("STOREFRONT_CHANNELS", "default-channel");

		expect(buildLocaleHreflangAlternates("default-channel", "/products/hoodie")).toEqual({});
	});

	// Flat URLs have no locale segment (ADR 0008), so even a multi-locale config resolves
	// every language to the same document. Asserting `{}` here documents the tradeoff
	// rather than silently emitting duplicate self-referencing alternates.
	it("returns no alternates when multiple locales are configured over flat URLs", () => {
		vi.stubEnv("NEXT_PUBLIC_STOREFRONT_LOCALES", "en,pl,ja");
		vi.stubEnv("NEXT_PUBLIC_DEFAULT_CHANNEL", "default-channel");
		vi.stubEnv("STOREFRONT_CHANNELS", "default-channel,channel-pln,japan");
		vi.stubEnv("NEXT_PUBLIC_STOREFRONT_LOCALE_CHANNELS", "en:default-channel,pl:channel-pln,ja:japan");

		expect(buildLocaleHreflangAlternates("default-channel", "/products/hoodie")).toEqual({});
		expect(
			buildLocaleHreflangAlternates("default-channel", {
				en: "/products/hoodie",
				pl: "/products/bluza",
			}),
		).toEqual({});
	});
});

