import { useRouteContext } from "../routing";

export function CategoryPage() {
  const { device, locale, category, isValidDevice, isValidLocale } =
    useRouteContext();

  return (
    <section className="category-page">
      <h1 className="category-page__title">Category Page</h1>

      <div className="category-page__params">
        <h2>Route Parameters</h2>
        <dl className="category-page__list">
          <dt>Device</dt>
          <dd>
            <code>{device ?? "undefined"}</code>
            <span
              className={`category-page__badge ${isValidDevice ? "category-page__badge--valid" : "category-page__badge--invalid"}`}
            >
              {isValidDevice ? "valid" : "invalid"}
            </span>
          </dd>

          <dt>Locale</dt>
          <dd>
            <code>{locale ?? "undefined"}</code>
            <span
              className={`category-page__badge ${isValidLocale ? "category-page__badge--valid" : "category-page__badge--invalid"}`}
            >
              {isValidLocale ? "valid" : "invalid"}
            </span>
          </dd>

          <dt>Category</dt>
          <dd>
            <code>{category ?? "undefined"}</code>
          </dd>
        </dl>
      </div>
    </section>
  );
}
