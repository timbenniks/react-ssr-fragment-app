# React SSR Fragment Server

A Vite + React + TypeScript SSR fragment server that returns server-rendered HTML fragments for injection into existing pages (e.g., .NET MVC applications). Includes Contentstack CMS integration for content fetching.

## Problem Being Solved

Modern web applications often need to integrate React components into existing server-rendered pages. This project provides a solution for:

- **SSR React fragments** that can be fetched and injected into a .NET MVC (or similar) page
- **Hydration** on the client side for interactivity
- **CDN caching** of the assembled output with absolute asset URLs
- **Contentstack CMS integration** for content management
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
                   │  GET /*               │
                   │  GET /assets/*        │
                   └───────────────────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │     Contentstack      │
                   │        (CMS)          │
                   └───────────────────────┘
```

## Routing

The app uses slug-based routing. The URL path is used to fetch content from Contentstack by matching against the `url` field.

### Examples

| URL Path      | Contentstack Query         |
| ------------- | -------------------------- |
| `/`           | `url` equals `/`           |
| `/about`      | `url` equals `/about`      |
| `/products/1` | `url` equals `/products/1` |

React Router is included for future extensibility - you can add custom routes in `src/App.tsx` as needed.

## Project Structure

```
├── src/
│   ├── api/
│   │   └── contentstack/
│   │       ├── client.ts        # Contentstack SDK initialization & live preview
│   │       ├── types.ts         # TypeScript types for content models
│   │       ├── queries.ts       # Data fetching functions
│   │       └── index.ts         # Barrel exports
│   ├── components/
│   │   └── BlockComponent.tsx   # Reusable block component
│   ├── hooks/
│   │   ├── useLivePreview.ts    # Live preview hook for content updates
│   │   └── index.ts             # Hook exports
│   ├── pages/
│   │   ├── Page.tsx             # Main page component (slug-based)
│   │   └── index.ts             # Page exports
│   ├── App.tsx                  # Routes configuration
│   ├── App.css                  # Component styles
│   ├── entry-client.tsx         # Client hydration with BrowserRouter
│   ├── entry-server.tsx         # Server render with StaticRouter
│   └── vite-env.d.ts            # Vite environment type definitions
├── server/
│   ├── dev.ts                   # Development server with HMR
│   ├── index.ts                 # Production Express SSR server
│   ├── types.ts                 # Shared server types
│   └── utils.ts                 # Server utility functions
├── dist/
│   ├── client/                  # Vite client build output
│   │   ├── assets/              # Hashed static assets
│   │   └── .vite/manifest.json  # Asset manifest
│   ├── server/                  # Vite SSR build output
│   │   └── entry-server.js      # SSR bundle
│   └── server-runtime/          # Compiled Express server
│       └── index.js
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config (src)
├── tsconfig.server.json         # TypeScript config (server)
└── package.json
```

## Contentstack Setup

Before you can run this code, you will need a Contentstack "Stack" to connect to. Follow the following steps to seed a Stack that this codebase understands.

> If you installed this project via the Contentstack Marketplace or new account onboarding, you can skip this step.

### Install the CLI

```bash
npm install -g @contentstack/cli
```

#### Using the CLI for the first time?

It might ask you to set your default region. You can get all regions and their codes [here](https://www.contentstack.com/docs/developers/cli/configure-regions-in-the-cli) or run `csdx config:get:region`.

> **Note:** Free Contentstack developer accounts are bound to the EU region. We still use the CDN, so the API is lightning fast.

Set your region like so:

```bash
csdx config:set:region EU
```

### Log in via the CLI

```bash
csdx auth:login
```

### Get your organization UID

In your Contentstack Organization dashboard, find `Org admin` and copy your Organization ID (Example: `blt481c598b0d8352d9`).

### Create a new stack

Make sure to replace `<YOUR_ORG_ID>` with your actual Organization ID and run the below.

```bash
csdx cm:stacks:seed --repo "contentstack/kickstart-stack-seed" --org "<YOUR_ORG_ID>" -n "Kickstart Stack"
```

### Create a delivery token

Go to `Settings > Tokens` and create a delivery token. Select the `preview` scope and turn on `Create preview token`.

### Fill out your .env file

Now that you have a delivery token, you can fill out the `.env` file in your codebase.

> You can find the API key, Delivery Token and Preview Token in Settings > Tokens > Your token.

```bash
# Server Configuration
PORT=3000
ASSET_BASE_URL=https://fragments.example.com

# Contentstack Configuration
CONTENTSTACK_API_KEY=<YOUR_API_KEY>
CONTENTSTACK_DELIVERY_TOKEN=<YOUR_DELIVERY_TOKEN>
CONTENTSTACK_PREVIEW_TOKEN=<YOUR_PREVIEW_TOKEN>
CONTENTSTACK_REGION=EU
CONTENTSTACK_ENVIRONMENT=preview
CONTENTSTACK_PREVIEW=true
```

### Turn on Live Preview

Go to Settings > Live Preview. Click enable and select the `Preview` environment in the dropdown. Hit save.

More details about Contentstack integration can be found on the [Contentstack docs](https://www.contentstack.com/docs/developers).

[![Join us on Discord](https://img.shields.io/badge/Join%20Our%20Discord-7289da.svg?style=flat&logo=discord&logoColor=%23fff)](https://community.contentstack.com)

## Installation

```bash
npm install
```

## Development

Start the development server with hot module replacement:

```bash
npm run dev
```

> **No build step required!** The dev server uses Vite's development mode which handles TypeScript transpilation, SSR module loading, and asset bundling automatically. Just run `npm run dev` and start coding.

This starts a dev server at `http://localhost:3000` with:

- **Hot Module Replacement** for React components
- **Instant SSR re-renders** on file save
- **Live Contentstack data fetching** during development
- **On-the-fly TypeScript compilation** - no build needed

### Development Workflow

**Important:** When adding features or components, you should **only modify files in `src/`**. The `server/` folder contains infrastructure code that should remain untouched.

**Where to work:**

- ✅ **`src/pages/`** - Add new page components
- ✅ **`src/components/`** - Add reusable components
- ✅ **`src/hooks/`** - Add custom React hooks
- ✅ **`src/api/contentstack/types.ts`** - Define content type interfaces
- ✅ **`src/api/contentstack/queries.ts`** - Add data fetching functions
- ✅ **`src/App.tsx`** - Add routes for new pages
- ✅ **`src/App.css`** - Add component styles

The server files automatically handle:

- SSR rendering
- Asset manifest generation
- Content fetching from the API layer
- Hot module replacement

You only need to import and use functions from `src/api/contentstack/` in your components.

## Build

Build the application for production:

```bash
npm run build
```

This runs:

1. `build:client` - Vite client build → `dist/client`
2. `build:server` - Vite SSR build → `dist/server`
3. `build:express` - TypeScript server build → `dist/server-runtime`

## Running the Production Server

```bash
npm start
```

Server starts on `http://localhost:3000` by default.

## Configuration

The server uses [dotenv](https://www.npmjs.com/package/dotenv) to load environment variables from a `.env` file.

> **First-time setup?** See the [Contentstack Setup](#contentstack-setup) section above to create your stack and get your API credentials using the CLI.

1. Create a `.env` file in the project root (or copy from `.env.example` if available):

```bash
cp .env.example .env  # if .env.example exists
# or create .env manually
```

2. Edit `.env` with your settings:

```bash
# Server Configuration
PORT=3000
ASSET_BASE_URL=https://fragments.example.com

# Contentstack Configuration
CONTENTSTACK_API_KEY=<YOUR_API_KEY>
CONTENTSTACK_DELIVERY_TOKEN=<YOUR_DELIVERY_TOKEN>
CONTENTSTACK_ENVIRONMENT=preview
CONTENTSTACK_REGION=EU

# Contentstack Live Preview (optional)
CONTENTSTACK_PREVIEW=true
CONTENTSTACK_PREVIEW_TOKEN=<YOUR_PREVIEW_TOKEN>
```

> You can find the API key, Delivery Token and Preview Token in Contentstack: Settings > Tokens > Your token.

### Environment Variables

| Variable                      | Description                       | Default          |
| ----------------------------- | --------------------------------- | ---------------- |
| `PORT`                        | Server port                       | `3000`           |
| `ASSET_BASE_URL`              | Base URL for absolute asset paths | (relative paths) |
| `CONTENTSTACK_API_KEY`        | Contentstack API key              | (required)       |
| `CONTENTSTACK_DELIVERY_TOKEN` | Contentstack delivery token       | (required)       |
| `CONTENTSTACK_ENVIRONMENT`    | Contentstack environment          | `production`     |
| `CONTENTSTACK_REGION`         | Contentstack region               | `us`             |
| `CONTENTSTACK_PREVIEW`        | Enable live preview mode          | `false`          |
| `CONTENTSTACK_PREVIEW_TOKEN`  | Preview token for live preview    | (optional)       |

### Supported Regions

The region is resolved using [@timbenniks/contentstack-endpoints](https://www.npmjs.com/package/@timbenniks/contentstack-endpoints):

| Region              | Aliases                        |
| ------------------- | ------------------------------ |
| AWS North America   | `na`, `us`, `aws-na`, `aws_na` |
| AWS Europe          | `eu`, `aws-eu`, `aws_eu`       |
| AWS Australia       | `au`, `aws-au`, `aws_au`       |
| Azure North America | `azure-na`, `azure_na`         |
| Azure Europe        | `azure-eu`, `azure_eu`         |
| GCP North America   | `gcp-na`, `gcp_na`             |
| GCP Europe          | `gcp-eu`, `gcp_eu`             |

## Contentstack API Layer

The API layer provides typed data fetching functions and live preview support. All Contentstack integration happens here - **no server files need to be modified**.

### Live Preview

The app includes Contentstack Live Preview support. When `CONTENTSTACK_PREVIEW=true`, content updates in the Contentstack UI automatically refresh the page without a full reload.

The `useLivePreview` hook handles:

- Initial content hydration from SSR
- Client-side content fetching on route changes
- Live preview content updates when editing in Contentstack

Usage in components:

```tsx
import { useLivePreview } from "./hooks";
import type { Page } from "./api/contentstack";

export function App({ content: initialContent }: { content?: Page | null }) {
  const page = useLivePreview(initialContent);
  // page automatically updates when content changes in Contentstack
}
```

### Adding Content Types

1. Define your type in `src/api/contentstack/types.ts`:

```ts
export interface ProductEntry extends BaseEntry {
  name: string;
  price: number;
  image?: { url: string };
}
```

2. Add a query function in `src/api/contentstack/queries.ts`:

```ts
export async function fetchProducts(): Promise<ProductEntry[]> {
  const result = await stack
    .contentType("product")
    .entry()
    .query()
    .find<ProductEntry>();
  return result.entries || [];
}
```

3. Export from `src/api/contentstack/index.ts`:

```ts
export type { ProductEntry } from "./types";
export { fetchProducts } from "./queries";
```

4. Use in your component:

```tsx
import { fetchProducts, type ProductEntry } from "./api/contentstack";
import { useLivePreview } from "./hooks";

export function ProductsPage({
  content: initialContent,
}: {
  content?: ProductEntry[];
}) {
  const products = useLivePreview(initialContent);
  // Or fetch client-side using useEffect + fetchProducts()
}
```

**Note:** The server automatically calls `fetchPageBySlug()` for SSR using the URL path. Content is passed to your page component via props. Use `useLivePreview` hook to enable live preview updates.

### Available Query Functions

```ts
import {
  fetchPageBySlug, // Fetch page by URL slug (used for SSR)
  fetchEntryByUid, // Fetch any entry by UID
  fetchEntries, // Fetch multiple entries
} from "./api/contentstack";
```

## API Endpoints

### GET /\*

Returns an HTML fragment with SSR markup for any URL path. Content is fetched from Contentstack by matching the `url` field.

**Example Request:**

```bash
curl http://localhost:3000/
curl http://localhost:3000/about
curl http://localhost:3000/products/featured
```

**Example Response:**

```html
<div id="fragment-root">
  <div class="fragment-app">
    <section class="page">
      <h1 class="page__title">Welcome</h1>
      <!-- Content from Contentstack -->
    </section>
  </div>
</div>
<script>
  window.__INITIAL_CONTENT__ = {...};
</script>
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

## Injecting into .NET MVC

Example Razor view:

```cshtml
@{
    var requestPath = Context.Request.Path; // e.g., "/about"
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
# Development (with HMR)
npm run dev

# Production
npm run build
npm start

# Test SSR
curl http://localhost:3000/
curl http://localhost:3000/about
```

## Scripts

| Script      | Description                       |
| ----------- | --------------------------------- |
| `dev`       | Start dev server with HMR         |
| `build`     | Build client, server, and Express |
| `start`     | Run production server             |
| `typecheck` | Run TypeScript type checking      |

## Key Features

- **Hot Module Replacement** - Components hot reload instantly during development
- **No full HTML document** - Fragment contains only the component markup and asset tags
- **Slug-based routing** - URL path maps to Contentstack `url` field
- **React Router SSR** - Server uses `StaticRouter`, client uses `BrowserRouter`
- **Contentstack CMS** - Typed content fetching with automatic region detection
- **Live Preview** - Real-time content updates when editing in Contentstack UI
- **Custom Hooks** - `useLivePreview` hook for seamless content management
- **Manifest-based assets** - All asset paths resolved from Vite's manifest for cache-busting
- **Absolute URLs** - Asset URLs include the full origin when `ASSET_BASE_URL` is set
- **Crossorigin attributes** - All script/link tags include `crossorigin` for CORS
- **Immutable caching** - Static assets served with 1-year cache headers
- **React 19** - Uses latest React with `hydrateRoot` for hydration
- **TypeScript** - Fully typed with strict type checking

## License

MIT
