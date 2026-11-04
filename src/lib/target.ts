/** True in the build published as a claude.ai artifact (`npm run build:artifact`). */
export const IS_ARTIFACT = import.meta.env.MODE === "artifact";

const SLUG_IN_PATH = /^\/chapter\/([^/]+)/;
const SLUG_IN_HASH = /^#([a-z0-9-]+)$/;

/** The chapter slug in the address the page was opened with, if any. */
export function initialChapterSlug(): string | null {
  const m = IS_ARTIFACT ? window.location.hash.match(SLUG_IN_HASH) : window.location.pathname.match(SLUG_IN_PATH);
  return m ? m[1] : null;
}
