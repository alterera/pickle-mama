/**
 * Browse root the specs run against. It needs products (more than one page) in that channel.
 *
 * URLs are flat (ADR 0005), so the storefront root is `/`. `E2E_BROWSE_PATH` can still
 * override it for deployments that mount the storefront under a sub-path.
 */
export const browsePath = process.env.E2E_BROWSE_PATH || "/";
