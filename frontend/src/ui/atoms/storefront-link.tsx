"use client";
import Link from "next/link";
import { type ComponentProps } from "react";
import { storefrontHref } from "@/lib/storefront-path";

/**
 * Root-relative browse link.
 *
 * URLs are flat (ADR 0008) — no `/{locale}/{channel}` prefix — so this only normalizes
 * the suffix. Kept as a component (rather than `<Link>`) so browse links share one place
 * to add future URL logic.
 */
export const StorefrontLink = ({
	href,
	...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) => {
	if (!href.startsWith("/")) {
		return <Link {...props} href={href} />;
	}

	return <Link {...props} href={storefrontHref(href)} />;
};
