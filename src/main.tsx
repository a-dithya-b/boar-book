import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { MotionConfig } from "motion/react";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import App from "./App";
import { ArtifactRouter } from "@/components/ArtifactRouter";
import { IS_ARTIFACT } from "@/lib/target";

const Router = IS_ARTIFACT ? ArtifactRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Router>
        <App />
      </Router>
    </MotionConfig>
  </StrictMode>,
);
