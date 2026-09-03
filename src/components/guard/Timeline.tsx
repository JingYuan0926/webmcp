import { TimelineRow } from "@/components/guard/TimelineRow";

export type JourneyGroup = {
  key: string;
  pending: PageControlEntry | null;
  final: PageControlEntry | null;
};

/**
 * A call that waits for a human writes two journal records: the checkpoint and
 * its outcome. Both stay in the hash chain — it is append-only, and that is the
 * point — but they are one action, so the timeline shows them as one row with
 * both timestamps.
 */
export function groupJourney(entries: PageControlEntry[]): JourneyGroup[] {
  const groups: JourneyGroup[] = [];
  const openByCall = new Map<string, number>();

  for (const entry of entries) {
    if (entry.verdict === "approval_pending" && entry.callId) {
      openByCall.set(entry.callId, groups.length);
      groups.push({ key: entry.id, pending: entry, final: null });
      continue;
    }
    const at = entry.callId ? openByCall.get(entry.callId) : undefined;
    if (at !== undefined && entry.callId) {
      groups[at].final = entry;
      openByCall.delete(entry.callId);
      continue;
    }
    groups.push({ key: entry.id, pending: null, final: entry });
  }

  return groups;
}

export function Timeline({ entries }: { entries: PageControlEntry[] }) {
  const visibleGroups = groupJourney(entries).slice(-60).reverse();
  return (
    <section className="timeline-section" aria-labelledby="timeline-title">
      <div className="panel-section-heading timeline-heading">
        <div>
          <p className="panel-eyebrow">Live flight recorder</p>
          <h2 id="timeline-title">Journey</h2>
        </div>
        <span className="panel-caption">Newest first</span>
      </div>
      {visibleGroups.length ? (
        <div className="timeline-list">
          {visibleGroups.map((group) => <TimelineRow key={group.key} group={group} />)}
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
