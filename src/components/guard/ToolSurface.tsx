export function ToolSurface({ surface }: { surface: PageControlSurface }) {
  const total = surface.guarded.length + surface.unguarded.length;

  return (
    <section className="tool-surface" aria-labelledby="tool-surface-title">
      <div>
        <p className="panel-eyebrow">Tool coverage</p>
        <h2 id="tool-surface-title">
          {surface.guarded.length} of {total} tools guarded
        </h2>
      </div>
      {surface.unguarded.length ? (
        <div className="tool-surface-warning" role="alert">
          <strong>{surface.unguarded.length} unguarded</strong>
          <span>{surface.unguarded.join(", ")}</span>
          <p>These tools were registered outside PageControl.</p>
        </div>
      ) : (
        <p className="tool-surface-ok">Every tool reported by the browser is protected.</p>
      )}
    </section>
  );
}
