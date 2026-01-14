# React SSR Fragment Server

A Vite + React + TypeScript SSR fragment server that returns server-rendered HTML fragments for injection into existing pages (e.g., .NET MVC applications).

## Problem Being Solved

Modern web applications often need to integrate React components into existing server-rendered pages. This project provides a solution for:

- **SSR React fragments** that can be fetched and injected into a .NET MVC (or similar) page
- **Hydration** on the client side for interactivity
- **CDN caching** of the assembled output with absolute asset URLs
- **No framework overhead** - just React, Vite, and Express

The fragment response is a snippet (not a full HTML document) containing:

1. A root `<div>` with SSR markup
2. CSS `<link>` tags for styles
3. Optional `<link rel="modulepreload">` tags for JavaScript chunks
4. A `<script type="module">` tag for client hydration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    .NET MVC Application                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │    Header    │    │   Fragment   │    │    Footer    │   │
│  │   (server)   │    │   (fetched)  │    │   (server)   │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │  SSR Fragment Server  │
                   │                       │
                   │  GET /:device/:locale │
                   │       /:category      │
                   │  GET /assets/*        │
                   └───────────────────────┘
```

## Route Format

The app uses React Router with the following URL structure:

```
/:device/:locale/:category
```

| Segment    | Description         | Valid Values                              |
| ---------- | ------------------- | ----------------------------------------- |
| `device`   | Device type         | `desktop`, `mobile`                       |
| `locale`   | Locale code         | Pattern: `xx-xx` (e.g., `en-mx`, `es-es`) |
| `category` | Category identifier | Any string                                |

### Examples

- `/desktop/en-mx/women` - Desktop, Mexico English, Women's category
- `/mobile/es-es/sale` - Mobile, Spain Spanish, Sale category
- `/desktop/fr-fr/accessories` - Desktop, France French, Accessories

## Project Structure

```
├── src/
│   ├── App.tsx                 # Routes configuration
│   ├── App.css                 # Component styles
│   ├── pages/
│   │   ├── CategoryPage.tsx    # Main category page component
│   │   ├── NotFound.tsx        # 404 page component
│   │   └── index.ts            # Page exports
│   ├── routing/
│   │   ├── useRouteContext.ts  # Hook for validated route params
│   │   └── index.ts            # Routing exports
│   ├── entry-client.tsx        # Client hydration with BrowserRouter
│   └── entry-server.tsx        # Server render with StaticRouter
├── server/
│   └── index.ts                # Express SSR server
├── dist/
│   ├── client/                 # Vite client build output
│   │   ├── assets/             # Hashed static assets
│   │   └── .vite/manifest.json # Asset manifest
│   └── server/                 # Vite SSR build output
│       └── entry-server.js     # SSR bundle
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config (src)
├── tsconfig.server.json        # TypeScript config (server)
└── package.json
```

## Installation

```bash
npm install
```

## Build

Build both client and server bundles, plus the Express server:

```bash
npm run build:all
```

This runs:

1. `build:client` - Vite client build → `dist/client`
2. `build:server` - Vite SSR build → `dist/server`
3. `build:express` - TypeScript server build → `dist/server-runtime`

## Running the Server

### Basic Usage

```bash
npm start
```

Server starts on `http://localhost:3000` by default.

### Configuration

The server uses [dotenv](https://www.npmjs.com/package/dotenv) to load environment variables from a `.env` file.

1. Copy the example file:

```bash
cp .env.example .env
```

2. Edit `.env` with your settings:

```bash
# Server port (default: 3000)
PORT=3000

# Base URL for absolute asset paths
# Set this to your CDN or fragment server origin in production
ASSET_BASE_URL=https://fragments.example.com
```

3. Start the server:

```bash
npm start
```

You can also pass environment variables directly:

```bash
PORT=8080 ASSET_BASE_URL=https://fragments.example.com npm start
```

### Environment Variables

| Variable         | Description                       | Default          |
| ---------------- | --------------------------------- | ---------------- |
| `PORT`           | Server port                       | `3000`           |
| `ASSET_BASE_URL` | Base URL for absolute asset paths | (relative paths) |

## API Endpoints

### GET /:device/:locale/:category

Returns an HTML fragment with SSR markup and asset tags.

**Example Request:**

```bash
curl http://localhost:3000/desktop/en-mx/women
```

**Example Response:**

```html
<div id="fragment-root">
  <div class="fragment-app">
    <section class="category-page">
      <h1 class="category-page__title">Category Page</h1>
      <div class="category-page__params">
        <h2>Route Parameters</h2>
        <dl class="category-page__list">
          <dt>Device</dt>
          <dd>
            <code>desktop</code
            ><span class="category-page__badge category-page__badge--valid"
              >valid</span
            >
          </dd>
          <dt>Locale</dt>
          <dd>
            <code>en-mx</code
            ><span class="category-page__badge category-page__badge--valid"
              >valid</span
            >
          </dd>
          <dt>Category</dt>
          <dd><code>women</code></dd>
        </dl>
      </div>
    </section>
  </div>
</div>
<link
  rel="stylesheet"
  href="https://fragments.example.com/assets/entry-client-xxx.css"
  crossorigin
/>
<script
  type="module"
  src="https://fragments.example.com/assets/entry-client-xxx.js"
  crossorigin
></script>
```

### GET /assets/\*

Serves static assets with immutable cache headers:

- `Cache-Control: max-age=31536000, immutable`

### GET /health

Health check endpoint returning `{ "status": "ok" }`.

## Accessing Route Parameters

### Using `useParams` (React Router)

```tsx
import { useParams } from "react-router-dom";

function MyComponent() {
  const { device, locale, category } = useParams();
  return <div>Device: {device}</div>;
}
```

### Using `useRouteContext` (with validation)

```tsx
import { useRouteContext } from "./routing";

function MyComponent() {
  const { device, locale, category, isValidDevice, isValidLocale } =
    useRouteContext();

  if (!isValidDevice || !isValidLocale) {
    return <div>Invalid route parameters</div>;
  }

  return (
    <div>
      Device: {device}, Locale: {locale}
    </div>
  );
}
```

The `useRouteContext` hook returns:

```ts
interface RouteContext {
  device: string | undefined;
  locale: string | undefined;
  category: string | undefined;
  isValidDevice: boolean; // true if device is "desktop" or "mobile"
  isValidLocale: boolean; // true if locale matches pattern xx-xx
}
```

## Injecting into .NET MVC

Example Razor view:

```cshtml
@{
    var requestPath = Context.Request.Path; // e.g., "/desktop/en-mx/women"
    var fragmentUrl = $"https://fragments.example.com{requestPath}";
    var fragmentHtml = await HttpClient.GetStringAsync(fragmentUrl);
}

<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    @Html.Raw(await RenderHeaderAsync())

    <!-- Injected React Fragment -->
    @Html.Raw(fragmentHtml)

    @Html.Raw(await RenderFooterAsync())
</body>
</html>
```

The fragment includes all necessary CSS and JS tags, so no additional asset includes are needed.

## Quick Test

```bash
# Build and start the server
npm run build:all
npm start

# Test SSR with route params
curl http://localhost:3000/desktop/en-mx/women

# Verify the response contains:
# - device: "desktop"
# - locale: "en-mx"
# - category: "women"
# - Both device and locale marked as "valid"
```

## Development

For local development with hot reload:

```bash
npm run dev
```

This starts Vite dev server. Note: This is for component development only. For SSR testing, use the production build.

## Key Features

- **No full HTML document** - Fragment contains only the component markup and asset tags
- **React Router SSR** - Server uses `StaticRouter`, client uses `BrowserRouter`
- **Route param validation** - `useRouteContext` hook validates device and locale
- **Manifest-based assets** - All asset paths resolved from Vite's manifest for cache-busting
- **Absolute URLs** - Asset URLs include the full origin when `ASSET_BASE_URL` is set
- **Crossorigin attributes** - All script/link tags include `crossorigin` for CORS
- **Immutable caching** - Static assets served with 1-year cache headers
- **React 19** - Uses latest React with `hydrateRoot` for hydration

## License

MIT
