"use client";

import { type UserDetailsFragment } from "@/gql/graphql";
import { useTranslations } from "next-intl";
import { LogoutButton } from "@/lib/auth/logout-button";
import { StorefrontLink } from "@/ui/atoms/storefront-link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/components/ui/dropdown-menu";
import { UserInfo } from "./components/user-info";
import { UserAvatar } from "./components/user-avatar";

type Props = {
	user: UserDetailsFragment;
};

export function UserMenu({ user }: Props) {
	const t = useTranslations("nav.userMenu");

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger className="focus:outline-hidden relative flex rounded-full bg-secondary text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
				<span className="sr-only">{t("open")}</span>
				<UserAvatar user={user} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel className="font-normal">
					<UserInfo user={user} />
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<StorefrontLink href="/account">{t("myAccount")}</StorefrontLink>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<StorefrontLink href="/account/orders">{t("myOrders")}</StorefrontLink>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<LogoutButton className="w-full cursor-default">{t("logOut")}</LogoutButton>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
