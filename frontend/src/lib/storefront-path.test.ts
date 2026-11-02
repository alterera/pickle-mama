import { describe, expect, it } from "vitest";
import { buildStorefrontPath, storefrontHref } from "./storefront-path";

describe("storefront-path", () => {
	it("builds flat browse URLs", () => {
		expect(storefrontHref()).toBe("/");
		expect(storefrontHref("/")).toBe("/");
		expect(storefrontHref("/products")).toBe("/products");
		expect(storefrontHref("products")).toBe("/products");
		expect(storefrontHref("/categories/chicken-pickle")).toBe("/categories/chicken-pickle");
	});

	it("preserves query strings on browse URLs", () => {
		expect(storefrontHref("/account/orders?after=cursor-1")).toBe("/account/orders?after=cursor-1");
	});

	it("treats the deprecated locale/channel arguments as no-ops", () => {
		expect(buildStorefrontPath("en", "default-channel")).toBe("/");
		expect(buildStorefrontPath("en", "default-channel", "/products/hoodie")).toBe("/products/hoodie");
		expect(buildStorefrontPath("pl", "channel-pln", "products")).toBe("/products");
	});
});

