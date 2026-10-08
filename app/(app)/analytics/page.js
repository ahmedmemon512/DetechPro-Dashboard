"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { fmtDur } from "@/lib/format";
import { PageHead, Range, RefreshButton, Kpi, KpiSkeletons, Alert } from "@/components/ui";
import { DailyStacked, Donut, Legend } from "@/components/Charts";

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useApi(`/api/analytics?days=${days}`, { refreshMs: 120000 });

  return (
    <div className="page">
      <PageHead title="Analytics" subtitle="A simple look at how your calls are going. Times are Pacific.">
        <Range value={days} onChange={setDays} options={[7, 30, 90, 365]} />
        <RefreshButton onClick={reload} loading={loading} />
      </PageHead>

      {error && <Alert title="Could not load data">{error}</Alert>}
      {!data && loading && !error && <KpiSkeletons n={4} />}

      {data && (
        <div className={loading ? "fade" : ""}>
          <div className="kpi-grid kpi-4">
            <Kpi label="Total calls" value={data.total} delta={data.deltas.total} />
            <Kpi label="Answer rate" value={`${data.total ? Math.round((data.answered / data.total) * 100) : 0}%`} hint={`${data.answered} answered`} />
            <Kpi label="Conversion rate" value={`${data.conversion}%`} hint="samples + meetings" strong />
            <Kpi label="Avg call length" value={fmtDur(data.avgSeconds)} hint="answered calls" />
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-head"><h2>Calls per day</h2><span className="muted small">Last {data.chartDays} days</span></div>
              <div className="card-body"><DailyStacked days={data.daily} /><Legend /></div>
            </section>
            <section className="card">
              <div className="card-head"><h2>Outcome share</h2></div>
              <div className="card-body"><Donut counts={data.counts} total={data.total} /></div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
