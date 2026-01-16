/**
 * Root App component - sets up routing and live preview
 */

import { Routes, Route } from "react-router-dom";
import { Page } from "./pages/Page";
import { useLivePreview } from "./hooks/useLivePreview";
import type { Page as PageType } from "./api/contentstack";
import "./App.css";

interface AppProps {
  content?: PageType | null;
}

export function App({ content: initialContent }: AppProps) {
  const page = useLivePreview(initialContent);

  return (
    <div className="font-sans leading-relaxed text-slate-900">
      <Routes>
        <Route path="/*" element={<Page content={page} />} />
      </Routes>
    </div>
  );
}
