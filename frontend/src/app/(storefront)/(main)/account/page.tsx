import { Suspense } from "react";
import { getStorefrontLocaleSlug } from "@/lib/storefront-scope";
import { AccountOverviewWelcome } from "@/ui/components/account/account-overview-welcome";
import { AccountOverviewDefaultAddress } from "@/ui/components/account/account-overview-default-address";
import { RecentOrdersSection } from "@/ui/components/account/recent-orders-section";
import { RecentOrdersSectionSkeleton } from "@/ui/components/account/account-skeleton";

export default async function AccountOverviewPage() {
	const locale = getStorefrontLocaleSlug();

	return (
		<div className="space-y-8">
			<AccountOverviewWelcome />

			<Suspense fallback={<RecentOrdersSectionSkeleton />}>
				<RecentOrdersSection localeSlug={locale} />
			</Suspense>

			<AccountOverviewDefaultAddress />
		</div>
	);
}
