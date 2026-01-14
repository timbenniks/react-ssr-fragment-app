import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { App } from "./App";

interface RenderResult {
  html: string;
}

export function render(url: string, _props?: unknown): RenderResult {
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
  return { html };
}
