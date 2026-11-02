"use client";

import { usePathname } from "next/navigation";

/**
 * Pathname used for nav active-state matching.
 *
 * Browse URLs are already root-relative and unprefixed (ADR 0008), so there is no
 * `/{locale}/{channel}` prefix left to strip.
 */
function useSelectedPathname() {
	return usePathname();
}

export default useSelectedPathname;
