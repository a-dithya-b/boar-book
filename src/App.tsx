import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Layout } from "@/components/Layout";
import { ChapterTransitionProvider } from "@/components/transition/ChapterTransition";
import Home from "@/pages/Home";

const ChapterPage = lazy(() => import("@/pages/Chapter"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <ChapterTransitionProvider>
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<div className="h-[60vh]" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chapter/:slug" element={<ChapterPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </Layout>
    </ChapterTransitionProvider>
  );
}
