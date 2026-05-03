import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import resourcesData from '../content/resources.json'
import jobsData from '../content/jobs.json'
import buildingsData from '../content/buildings.json'
import type { Resource, Job, Building } from '../types'

const resources = resourcesData as Resource[]
const jobs = jobsData as Job[]
const buildings = buildingsData as Building[]

type StatsTab = 'capital' | 'basic' | 'manual-labor' | 'properties'

const STATS_TABS: { id: StatsTab; label: string }[] = [
  { id: 'capital',      label: '💰 Capital' },
  { id: 'basic',        label: '🪵 Basic Resources' },
  { id: 'manual-labor', label: '⛏️ Manual Labor' },
  { id: 'properties',   label: '🏗️ Properties' },
]

function fmt(n: number) {
  return formatNumber(n)
}

export default function Statistics() {
  const { resources: balances, stats, prevVentureStats, lifetimeStats } = useGameStore()
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>('capital')

  const capitalResources = resources.filter((r) => r.category === 'capital')
  const basicResources   = resources.filter((r) => r.category === 'basic')

  function ResourceTable({ list }: { list: Resource[] }) {
    return (
      <div className="card" style={{ maxWidth: 780 }}>
        <div className="card-body p-0">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th style={{ fontSize: '0.8rem' }}>Resource</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Balance</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Earned (This)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Earned (Prev)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Earned (All)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Spent (This)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Spent (All)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: '0.875rem' }}>{r.icon} {r.name}</td>
                  <td className="text-end fw-semibold" style={{ fontSize: '0.875rem' }}>
                    {fmt(balances[r.id] ?? 0)}
                  </td>
                  <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                    {fmt(stats[`${r.id}_earned`] ?? 0)}
                  </td>
                  <td className="text-end text-body-secondary" style={{ fontSize: '0.875rem' }}>
                    {fmt(prevVentureStats[`${r.id}_earned`] ?? 0)}
                  </td>
                  <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                    {fmt(lifetimeStats[`${r.id}_earned`] ?? 0)}
                  </td>
                  <td className="text-end text-danger" style={{ fontSize: '0.875rem' }}>
                    {fmt(stats[`${r.id}_spent`] ?? 0)}
                  </td>
                  <td className="text-end text-danger" style={{ fontSize: '0.875rem' }}>
                    {fmt(lifetimeStats[`${r.id}_spent`] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function StatRow3({ label, thisVal, prevVal, allVal }: {
    label: string; thisVal: number; prevVal: number; allVal: number
  }) {
    return (
      <tr>
        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>{label}</td>
        <td className="text-end fw-semibold" style={{ fontSize: '0.875rem' }}>{fmt(thisVal)}</td>
        <td className="text-end text-body-secondary" style={{ fontSize: '0.875rem' }}>{fmt(prevVal)}</td>
        <td className="text-end" style={{ fontSize: '0.875rem' }}>{fmt(allVal)}</td>
      </tr>
    )
  }

  return (
    <div className="p-4">
      <h2>📊 Statistics</h2>
      <p className="text-body-secondary mb-3">
        A summary of everything you have earned and accomplished.
      </p>

      <ul className="nav nav-pills mb-4">
        {STATS_TABS.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link ${activeStatsTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveStatsTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeStatsTab === 'capital' && (
        <div>
          <div className="text-body-secondary mb-2" style={{ fontSize: '0.8rem' }}>
            This Venture / Previous Venture / All Time
          </div>
          <ResourceTable list={capitalResources} />
        </div>
      )}

      {activeStatsTab === 'basic' && (
        <div>
          <div className="text-body-secondary mb-2" style={{ fontSize: '0.8rem' }}>
            This Venture / Previous Venture / All Time
          </div>
          <ResourceTable list={basicResources} />
        </div>
      )}

      {activeStatsTab === 'manual-labor' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">⛏️ Manual Labor</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.8rem' }}>Stat</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>This Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Prev Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>All Time</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <StatRow3
                    key={`${job.id}_comp`}
                    label={`${job.icon} ${job.name} — completions`}
                    thisVal={stats[`job_${job.id}_completed`] ?? 0}
                    prevVal={prevVentureStats[`job_${job.id}_completed`] ?? 0}
                    allVal={lifetimeStats[`job_${job.id}_completed`] ?? 0}
                  />
                ))}
                {jobs.flatMap((job) =>
                  job.rewards.map((r) => {
                    const res = resources.find((res) => res.id === r.resourceId)
                    const key = `job_${job.id}_${r.resourceId}_earned`
                    return (
                      <StatRow3
                        key={`${job.id}_${r.resourceId}`}
                        label={`${job.icon} ${job.name} — ${res?.name ?? r.resourceId} earned`}
                        thisVal={stats[key] ?? 0}
                        prevVal={prevVentureStats[key] ?? 0}
                        allVal={lifetimeStats[key] ?? 0}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeStatsTab === 'properties' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">🏗️ Properties</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.8rem' }}>Stat</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>This Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Prev Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>All Time</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((b) => (
                  <StatRow3
                    key={`${b.id}_count`}
                    label={`${b.icon} ${b.name} — purchased`}
                    thisVal={stats[`building_${b.id}_count`] ?? 0}
                    prevVal={prevVentureStats[`building_${b.id}_count`] ?? 0}
                    allVal={lifetimeStats[`building_${b.id}_count`] ?? 0}
                  />
                ))}
                {buildings.flatMap((b) =>
                  b.production.map((p) => {
                    const res = resources.find((r) => r.id === p.resourceId)
                    const key = `building_${b.id}_produced_${p.resourceId}`
                    return (
                      <StatRow3
                        key={`${b.id}_${p.resourceId}`}
                        label={`${b.icon} ${b.name} — ${res?.name ?? p.resourceId} produced`}
                        thisVal={stats[key] ?? 0}
                        prevVal={prevVentureStats[key] ?? 0}
                        allVal={lifetimeStats[key] ?? 0}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
