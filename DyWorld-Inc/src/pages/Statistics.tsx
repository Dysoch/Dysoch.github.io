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

interface StatRowProps {
  label: string
  value: string | number
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <tr>
      <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>{label}</td>
      <td className="text-end fw-semibold" style={{ fontSize: '0.875rem' }}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </td>
    </tr>
  )
}

const STATS_TABS: { id: StatsTab; label: string }[] = [
  { id: 'capital',      label: '💰 Capital' },
  { id: 'basic',        label: '🪵 Basic Resources' },
  { id: 'manual-labor', label: '⛏️ Manual Labor' },
  { id: 'properties',   label: '🏗️ Properties' },
]

export default function Statistics() {
  const { resources: balances, stats } = useGameStore()
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>('capital')

  const capitalResources = resources.filter((r) => r.category === 'capital')
  const basicResources   = resources.filter((r) => r.category === 'basic')

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

      {/* Capital */}
      {activeStatsTab === 'capital' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">💰 Capital — Current Balances</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.8rem' }}>Resource</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Balance</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Lifetime Earned</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Lifetime Spent</th>
                </tr>
              </thead>
              <tbody>
                {capitalResources.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: '0.875rem' }}>{r.icon} {r.name}</td>
                    <td className="text-end fw-semibold" style={{ fontSize: '0.875rem' }}>
                      {formatNumber(balances[r.id] ?? 0)}
                    </td>
                    <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                      {formatNumber(stats[`${r.id}_earned`] ?? 0)}
                    </td>
                    <td className="text-end text-danger" style={{ fontSize: '0.875rem' }}>
                      {formatNumber(stats[`${r.id}_spent`] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Basic Resources */}
      {activeStatsTab === 'basic' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">🪵 Basic Resources</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.8rem' }}>Resource</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Amount</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Lifetime Earned</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Lifetime Spent</th>
                </tr>
              </thead>
              <tbody>
                {basicResources.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: '0.875rem' }}>{r.icon} {r.name}</td>
                    <td className="text-end fw-semibold" style={{ fontSize: '0.875rem' }}>
                      {formatNumber(balances[r.id] ?? 0)}
                    </td>
                    <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                      {formatNumber(stats[`${r.id}_earned`] ?? 0)}
                    </td>
                    <td className="text-end text-danger" style={{ fontSize: '0.875rem' }}>
                      {formatNumber(stats[`${r.id}_spent`] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Labor */}
      {activeStatsTab === 'manual-labor' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">⛏️ Manual Labor</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <tbody>
                {jobs.map((job) => {
                  const completions = stats[`job_${job.id}_completed`] ?? 0
                  return (
                    <StatRow
                      key={job.id}
                      label={`${job.icon} ${job.name} — completions`}
                      value={completions}
                    />
                  )
                })}
                {jobs.flatMap((job) =>
                  job.rewards.map((r) => {
                    const res = resources.find((res) => res.id === r.resourceId)
                    return (
                      <StatRow
                        key={`${job.id}_${r.resourceId}`}
                        label={`${job.icon} ${job.name} — total ${res?.name ?? r.resourceId} earned`}
                        value={stats[`job_${job.id}_${r.resourceId}_earned`] ?? 0}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Properties */}
      {activeStatsTab === 'properties' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">🏗️ Properties</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <tbody>
                {buildings.map((b) => (
                  <StatRow
                    key={`${b.id}_count`}
                    label={`${b.icon} ${b.name} — total purchased`}
                    value={stats[`building_${b.id}_count`] ?? 0}
                  />
                ))}
                {buildings.flatMap((b) =>
                  b.production.map((p) => {
                    const res = resources.find((r) => r.id === p.resourceId)
                    const produced = stats[`building_${b.id}_produced_${p.resourceId}`] ?? 0
                    return (
                      <StatRow
                        key={`${b.id}_${p.resourceId}`}
                        label={`${b.icon} ${b.name} — total ${res?.name ?? p.resourceId} produced`}
                        value={produced}
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
