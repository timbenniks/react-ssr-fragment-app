import { Routes, Route } from "react-router-dom";
import { CategoryPage, NotFound } from "./pages";
import "./App.css";

export function App() {
  return (
    <div className="fragment-app">
      <Routes>
        <Route path="/:device/:locale/:category/*" element={<CategoryPage />} />
        <Route path="/:device/:locale/:category" element={<CategoryPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
