"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { COLORS, LABELS, OUTCOMES } from "@/lib/constants";
import { fmtDur, fmtWhen } from "@/lib/format";
import { PageHead, Range, RefreshButton, Kpi, KpiSkeletons, Badge, Alert } from "@/components/ui";
import { HBars } from "@/components/Charts";
import { Icon } from "@/components/Icons";

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useApi(`/api/analytics?days=${days}`, { refreshMs: 60000 });

  return (
    <div className="page">
      <PageHead title="Dashboard" subtitle="A live overview of your AI calling campaigns. Times are Pacific.">
        <Range value={days} onChange={setDays} />
        <RefreshButton onClick={reload} loading={loading} />
      </PageHead>

      {error && <Alert title="Could not load data">{error}</Alert>}
      {!data && loading && !error && <KpiSkeletons />}

      {data && (
        <div className={loading ? "fade" : ""}>
          <div className="kpi-grid">
            <Kpi label="Total calls" value={data.total} delta={data.deltas.total} />
            <Kpi label="Samples requested" value={data.counts.sample_requested} delta={data.deltas.samples} strong />
            <Kpi label="Meetings booked" value={data.counts.meeting_booked} delta={data.deltas.meetings} strong />
            <Kpi label="Conversion rate" value={`${data.conversion}%`} hint="of answered calls" />
            <Kpi label="Avg call length" value={fmtDur(data.avgSeconds)} hint="answered calls" />
            <Kpi label="Voicemails" value={data.counts.voicemail} hint={`${data.answered} answered`} />
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-head"><h2>Latest calls</h2><Link href="/recent-calls" className="link-arrow">View all <Icon name="arrow" size={14} /></Link></div>
              {data.latest.length === 0 ? (
                <p className="muted pad">No calls yet. Upload a list of leads to start calling.</p>
              ) : (
                <ul className="feed">
                  {data.latest.map((c) => (
                    <li key={c.call_id}>
                      <div>
                        <strong>{c.restaurant_name || "Unknown restaurant"}</strong>
                        <span className="muted">{c.phone || "–"} · {fmtWhen(c.started_at)} · {fmtDur(c.duration_seconds)}</span>
                      </div>
                      <Badge outcome={c.call_outcome} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-head"><h2>Outcomes</h2><Link href="/analytics" className="link-arrow">Analytics <Icon name="arrow" size={14} /></Link></div>
              <HBars rows={OUTCOMES.map((o) => ({ label: LABELS[o], value: data.counts[o], color: COLORS[o] }))} />
            </section>
          </div>

          <div className="actions-grid">
            <Link href="/generate-leads" className="action-card"><Icon name="search" size={22} /><strong>Generate leads</strong><span>Scrape restaurants by query and location.</span></Link>
            <Link href="/upload-leads" className="action-card"><Icon name="upload" size={22} /><strong>Upload leads</strong><span>Start a calling or email campaign from a CSV.</span></Link>
          </div>
        </div>
      )}
    </div>
  );
}
