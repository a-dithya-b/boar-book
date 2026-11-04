import { useEffect, type ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { CHAPTERS } from "@/content/chapters";

/**
 * Artifact links only carry a plain `#name`, so routes live in memory and the
 * current chapter is mirrored as `#<slug>` (e.g. `#replication`).
 */
const isChapter = (slug: string) => CHAPTERS.some((c) => c.slug === slug);
const pathFromHash = () => {
  const slug = window.location.hash.slice(1);
  return isChapter(slug) ? `/chapter/${slug}` : "/";
};

function HashSync() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // route → address
  useEffect(() => {
    const slug = pathname.match(/^\/chapter\/([^/]+)/)?.[1];
    const want = slug ? `#${slug}` : "";
    if (window.location.hash !== want) {
      try {
        history.replaceState(null, "", want || window.location.pathname + window.location.search);
      } catch {
        /* some hosts refuse history writes; the page still works */
      }
    }
  }, [pathname]);

  // address → route (someone edits or follows a link)
  useEffect(() => {
    const onHash = () => navigate(pathFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [navigate]);

  return null;
}

export function ArtifactRouter({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={[pathFromHash()]}>
      <HashSync />
      {children}
    </MemoryRouter>
  );
}
