import { redirect } from "next/navigation";
import { buildStorefrontPath } from "@/lib/storefront-path";
import { getStorefrontChannelSlug, getStorefrontLocaleSlug } from "@/lib/storefront-scope";

/**
 * Redirect legacy /orders route to the new /account/orders route.
 */
export default async function LegacyOrdersPage() {
	redirect(buildStorefrontPath(getStorefrontLocaleSlug(), getStorefrontChannelSlug(), "/account/orders"));
}
