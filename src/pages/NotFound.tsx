export function NotFound() {
  return (
    <section className="not-found">
      <h1 className="not-found__title">404 - Not Found</h1>
      <p className="not-found__message">
        The requested page could not be found. Expected URL format:
        <code>/:device/:locale/:category</code>
      </p>
    </section>
  );
}
