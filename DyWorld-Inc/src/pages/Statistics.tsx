import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import resourcesData from '../content/resources.json'
import jobsData from '../content/jobs.json'
import type { Resource, Job } from '../types'

const resources = resourcesData as Resource[]
const jobs = jobsData as Job[]

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

export default function Statistics() {
  const { resources: balances, stats } = useGameStore()

  const capitalResources = resources.filter((r) => r.category === 'capital')

  return (
    <div className="p-4">
      <h2>📊 Statistics</h2>
      <p className="text-body-secondary mb-4">
        A summary of everything you have earned and accomplished.
      </p>

      {/* Capital resources */}
      <div className="card mb-4" style={{ maxWidth: 600 }}>
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
                  <td style={{ fontSize: '0.875rem' }}>
                    {r.icon} {r.name}
                  </td>
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

      {/* Manual Labor */}
      <div className="card" style={{ maxWidth: 600 }}>
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
                  const earnedKey = `${r.resourceId}_earned`
                  return (
                    <StatRow
                      key={`${job.id}_${r.resourceId}`}
                      label={`${job.icon} ${job.name} — total ${res?.name ?? r.resourceId} earned`}
                      value={stats[earnedKey] ?? 0}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
