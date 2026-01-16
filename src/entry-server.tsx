/**
 * Server entry point - renders React to HTML string
 */

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App";
import { fetchPageBySlug, type RenderProps } from "./api/contentstack";

export async function render(url: string, props?: RenderProps) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App content={props?.content} />
    </StaticRouter>
  );
  return { html };
}

export { fetchPageBySlug };
