"use client";

import { forwardRef, type ComponentProps, type ReactNode } from "react";

import { getStorefrontChannelSlug, getStorefrontLocaleSlug } from "@/lib/storefront-scope";
import { useLogout, type LogoutOptions } from "./use-logout";

type LogoutButtonProps = {
	children: ReactNode;
	channel?: string;
	redirectTo?: string;
	stayOnPage?: boolean;
} & Omit<ComponentProps<"button">, "type">;

/**
 * Ends the Saleor session on server (checkout detach + cookies) and hard-navigates.
 * Forwards ref/onClick for Radix `DropdownMenuItem asChild` composition.
 */
export const LogoutButton = forwardRef<HTMLButtonElement, LogoutButtonProps>(function LogoutButton(
	{ children, channel: channelProp, redirectTo, stayOnPage, onClick, disabled, ...props },
	ref,
) {
	const logoutSession = useLogout();

	const logoutOptions: LogoutOptions = {
		locale: getStorefrontLocaleSlug(),
		channel: channelProp ?? getStorefrontChannelSlug(),
		redirectTo,
		stayOnPage,
	};

	return (
		<button
			ref={ref}
			type="button"
			disabled={disabled}
			{...props}
			onClick={(event) => {
				onClick?.(event);
				if (event.defaultPrevented) {
					return;
				}
				void logoutSession(logoutOptions);
			}}
		>
			{children}
		</button>
	);
});
