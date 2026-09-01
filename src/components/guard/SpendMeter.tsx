import { formatRM } from "@/lib/catalog";

type SpendMeterProps = {
  budget: { limit: number; spent: number; currency: string };
};

export function SpendMeter({ budget }: SpendMeterProps) {
  const ratio = budget.limit > 0 ? budget.spent / budget.limit : budget.spent > 0 ? 1 : 0;
  const level = ratio >= 1 ? "danger" : ratio >= 0.7 ? "warn" : "ok";
  const percent = Math.min(100, Math.max(0, ratio * 100));

  return (
    <section className="guard-section spend-card" aria-labelledby="spend-title">
      <div className="panel-section-heading">
        <div>
          <p className="panel-eyebrow">Session budget</p>
          <h2 id="spend-title">Spend meter</h2>
        </div>
        <strong className={`meter-value meter-value--${level}`}>{formatRM(budget.spent)}</strong>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label="Agent spend"
        aria-valuemin={0}
        aria-valuemax={budget.limit}
        aria-valuenow={Math.min(budget.spent, budget.limit)}
      >
        <span className={`meter-fill meter-fill--${level}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="meter-meta">
        <span>{Math.round(ratio * 100)}% used</span>
        <span>{formatRM(budget.limit)} limit</span>
      </div>
    </section>
  );
}

