import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import jobsData from '../content/jobs.json'
import type { Job } from '../types'

const jobs = jobsData as Job[]

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function ManualLabor() {
  const { activeJob, startJob, completeJob, resources } = useGameStore()
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      const job = useGameStore.getState().activeJob
      if (job && Date.now() >= job.endTime) {
        const def = jobs.find((j) => j.id === job.jobId)
        if (def) {
          const reward = def.rewards[0]
          const amount = randomBetween(reward.min, reward.max)
          completeJob(job.jobId, reward.resourceId, amount)
        }
      }
    }, 100)
    return () => clearInterval(id)
  }, [completeJob])

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

          const elapsed = activeJob && isThisJobActive
            ? Math.min(now - activeJob.startTime, job.durationSeconds * 1000)
            : 0
          const progress = isThisJobActive
            ? (elapsed / (job.durationSeconds * 1000)) * 100
            : 0
          const remaining = activeJob && isThisJobActive
            ? Math.max(0, Math.ceil((activeJob.endTime - now) / 1000))
            : job.durationSeconds

          const rewardSummary = job.rewards
            .map((r) => `${r.min}–${r.max}`)
            .join(', ')
          const rewardResource = job.rewards[0]

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
                    <span className="badge bg-success">
                      +{rewardSummary} {rewardResource.resourceId.replace('_coins', '')} coins
                    </span>
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
                    disabled={isAnyJobActive}
                    onClick={() => startJob(job.id, job.durationSeconds)}
                  >
                    {isThisJobActive ? 'In progress…' : 'Start'}
                  </button>
                </div>

                <div className="card-footer text-body-secondary" style={{ fontSize: '0.8rem' }}>
                  Current{' '}
                  {rewardResource.resourceId.replace('_', ' ')}: {formatNumber(resources[rewardResource.resourceId] ?? 0)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
