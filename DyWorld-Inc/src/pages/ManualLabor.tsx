import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import jobsData from '../content/jobs.json'
import resourcesData from '../content/resources.json'
import type { Job, Resource } from '../types'

const jobs = jobsData as Job[]
const resources = resourcesData as Resource[]
const resourceMap = Object.fromEntries(resources.map((r) => [r.id, r]))

function canAffordJob(job: Job, balances: Record<string, number>): boolean {
  if (!job.costs?.length) return true
  return job.costs.every((c) => (balances[c.resourceId] ?? 0) >= c.amount)
}

export default function ManualLabor() {
  const { activeJob, startJob, resources: balances } = useGameStore()
  const [now, setNow] = useState(Date.now)

  // Progress bar update — completion handled globally in App.tsx
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-4">
      <h2>⛏️ Manual Labor</h2>
      <p className="text-body-secondary mb-4">
        Work jobs to earn resources. Only one job can run at a time.
      </p>

      <div className="row g-3" style={{ maxWidth: 720 }}>
        {jobs.map((job) => {
          const isThisJobActive = activeJob !== null && activeJob.jobId === job.id
          const isAnyJobActive = activeJob !== null
          const affordable = canAffordJob(job, balances)

          const elapsed = activeJob && isThisJobActive
            ? Math.min(now - activeJob.startTime, job.durationSeconds * 1000)
            : 0
          const progress = isThisJobActive
            ? (elapsed / (job.durationSeconds * 1000)) * 100
            : 0
          const remaining = activeJob && isThisJobActive
            ? Math.max(0, Math.ceil((activeJob.endTime - now) / 1000))
            : job.durationSeconds

          const rewardResource = job.rewards[0]
          const rewardRes = resourceMap[rewardResource.resourceId]
          const rewardLabel = rewardRes ? rewardRes.name : rewardResource.resourceId.replace(/_/g, ' ')

          return (
            <div className="col-12 col-md-6" key={job.id}>
              <div className={`card h-100 ${isThisJobActive ? 'border-primary' : ''}`}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <h5 className="card-title mb-1">
                        {job.icon} {job.name}
                      </h5>
                      <p className="text-body-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                        {job.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3" style={{ fontSize: '0.875rem' }}>
                    <span className="badge bg-secondary me-2">⏱ {job.durationSeconds}s</span>
                    <span className="badge bg-success me-1">
                      +{rewardResource.min}–{rewardResource.max} {rewardRes?.icon} {rewardLabel}
                    </span>
                    {job.costs?.map((c) => {
                      const costRes = resourceMap[c.resourceId]
                      return (
                        <span key={c.resourceId} className="badge bg-danger me-1">
                          -{c.amount} {costRes?.icon} {costRes?.name ?? c.resourceId.replace(/_/g, ' ')}
                        </span>
                      )
                    })}
                  </div>

                  {isThisJobActive && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                        <span className="text-primary">Working…</span>
                        <span className="text-body-secondary">{remaining}s remaining</span>
                      </div>
                      <div className="progress" style={{ height: 8 }}>
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    className={`btn btn-sm w-100 ${isThisJobActive ? 'btn-outline-secondary' : 'btn-primary'}`}
                    disabled={isAnyJobActive || (!isThisJobActive && !affordable)}
                    onClick={() => startJob(job.id, job.durationSeconds, job.costs)}
                  >
                    {isThisJobActive ? 'In progress…' : !affordable ? 'Cannot afford' : 'Start'}
                  </button>
                </div>

                <div className="card-footer text-body-secondary" style={{ fontSize: '0.8rem' }}>
                  {rewardRes?.icon} {rewardLabel}: {formatNumber(balances[rewardResource.resourceId] ?? 0)}
                  {job.costs?.filter(c => c.resourceId !== rewardResource.resourceId).map((c) => {
                    const costRes = resourceMap[c.resourceId]
                    return (
                      <span key={c.resourceId} className="ms-2">
                        | {costRes?.icon} {costRes?.name ?? c.resourceId.replace(/_/g, ' ')}: {formatNumber(balances[c.resourceId] ?? 0)}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
