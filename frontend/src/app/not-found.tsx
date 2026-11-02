import "./globals.css";
import { NotFoundContent } from "@/ui/components/not-found-content";

/**
 * Global 404 for URLs that match no route group.
 *
 * With two root layouts (`(storefront)` and `(checkout)`) no single layout wraps unmatched
 * URLs, so Next renders this file inside its own implicit `<html>`/`<body>` document. This
 * component must therefore not render another `<html>`/`<body>` — it only supplies the body
 * content. `globals.css` is imported here because no layout in that implicit tree does.
 *
 * `(storefront)/not-found.tsx` still handles `notFound()` raised inside browse pages, where
 * the real storefront shell (header, footer, fonts) exists.
 */
export default function GlobalNotFound() {
	return <NotFoundContent />;
}
