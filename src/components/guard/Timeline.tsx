import { TimelineRow } from "@/components/guard/TimelineRow";

export function Timeline({ entries }: { entries: PageControlEntry[] }) {
  const visibleEntries = entries.slice(-60).reverse();
  return (
    <section className="timeline-section" aria-labelledby="timeline-title">
      <div className="panel-section-heading timeline-heading">
        <div>
          <p className="panel-eyebrow">Live flight recorder</p>
          <h2 id="timeline-title">Journey</h2>
        </div>
        <span className="panel-caption">Newest first</span>
      </div>
      {visibleEntries.length ? (
        <div className="timeline-list">
          {visibleEntries.map((entry) => <TimelineRow key={entry.id} entry={entry} />)}
        </div>
      ) : (
        <div className="panel-empty">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <strong>No tool calls yet</strong>
          <span>Run the test agent to record a guarded journey.</span>
        </div>
      )}
    </section>
  );
}

