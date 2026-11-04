import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";

const ChapterPage = lazy(() => import("@/pages/Chapter"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
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
  );
}
