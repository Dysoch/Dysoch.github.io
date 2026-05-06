import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber, formatDuration } from '../utils/format'
import { getJobRewardMinMult, getJobRewardMaxMult, getJobDurationMult, getMaxQueueSize } from '../utils/multipliers'
import { isUnlocked } from '../utils/unlock'
import jobsData from '../content/jobs.json'
import resourcesData from '../content/resources.json'
import type { Job, Resource } from '../types'

const allJobs = jobsData as Job[]
const resources = resourcesData as Resource[]
const resourceMap = Object.fromEntries(resources.map((r) => [r.id, r]))

function canAffordJob(job: Job, balances: Record<string, number>): boolean {
  if (!job.costs?.length) return true
  return job.costs.every((c) => (balances[c.resourceId] ?? 0) >= c.amount)
}

export default function ManualLabor() {
  const {
    activeJob, startJob, resources: balances,
    purchasedUpgrades, purchasedSkills,
    jobQueue, addToQueue, removeFromQueue, clearQueue,
    stats, lifetimeStats, prestigeCount,
  } = useGameStore()
  const [now, setNow] = useState(Date.now)

  // Progress bar update — completion handled globally in App.tsx
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])

  const maxQueueSize = getMaxQueueSize(purchasedSkills)
  const queueUnlocked = maxQueueSize > 0
  const unlockState = { stats, lifetimeStats, purchasedSkills, purchasedUpgrades, prestigeCount }
  const jobs = allJobs.filter((j) => isUnlocked(j.unlock, unlockState))

  return (
    <div className="p-4">
      <h2>⛏️ Manual Labor</h2>
      <p className="text-body-secondary mb-4">
        Work jobs to earn resources. Only one job can run at a time.
      </p>
      {/* ── Left panel: Workbenches + Queue ── */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="row g-2" style={{ maxWidth: 1500 }}>
            {jobs.map((job) => {
              const isThisJobActive = activeJob !== null && activeJob.jobId === job.id
              const isAnyJobActive = activeJob !== null
              const affordable = canAffordJob(job, balances)

              const durMult = getJobDurationMult(job.id, purchasedSkills)
              const effectiveDuration = job.durationSeconds * durMult

              const rewardResource = job.rewards[0]
              const minMult = getJobRewardMinMult(job.id, purchasedUpgrades, purchasedSkills)
              const maxMult = getJobRewardMaxMult(job.id, purchasedUpgrades, purchasedSkills)
              const displayMin = rewardResource.min * minMult
              const displayMax = rewardResource.max * maxMult

              // Use actual stored endTime as basis so skills purchased mid-job don't desync the bar
              const actualDurationMs = activeJob && isThisJobActive
                ? activeJob.endTime - activeJob.startTime
                : effectiveDuration * 1000
              const elapsed = activeJob && isThisJobActive
                ? Math.min(now - activeJob.startTime, actualDurationMs)
                : 0
              const progress = isThisJobActive ? (elapsed / actualDurationMs) * 100 : 0
              const remaining = activeJob && isThisJobActive
                ? Math.max(0, Math.ceil((activeJob.endTime - now) / 1000))
                : effectiveDuration
              const isFinishing = isThisJobActive && remaining === 0

              const rewardRes = resourceMap[rewardResource.resourceId]
              const rewardLabel = rewardRes ? rewardRes.name : rewardResource.resourceId.replace(/_/g, ' ')

              const isQueued = jobQueue.includes(job.id)

              return (
                <div className="col-12 col-md-3" key={job.id}>
                  <div className={`card h-100 ${isThisJobActive ? 'border-primary' : ''}`}>
                    <div className="card-body">
                      <div className="mb-2">
                        <h5 className="card-title mb-1">{job.icon} {job.name}</h5>
                        <p className="text-body-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                          {job.description}
                        </p>
                      </div>

                      <div className="mb-3" style={{ fontSize: '0.875rem' }}>
                        <span className="badge bg-secondary me-2">⏱ {formatDuration(effectiveDuration)}</span>
                        <span className="badge bg-success me-1">
                          +{formatNumber(displayMin)} – {formatNumber(displayMax)} {rewardRes?.icon} {rewardLabel}
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
                            <span className={isFinishing ? 'text-warning' : 'text-primary'}>
                              {isFinishing ? 'Finishing…' : 'Working…'}
                            </span>
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
                        className={`btn btn-sm w-100 mb-1 ${isThisJobActive ? 'btn-outline-secondary' : 'btn-primary'}`}
                        disabled={isAnyJobActive || (!isThisJobActive && !affordable)}
                        onClick={() => startJob(job.id, effectiveDuration, job.costs)}
                      >
                        {isThisJobActive ? 'In progress…' : !affordable ? 'Cannot afford' : 'Start'}
                      </button>

                      {queueUnlocked && (
                        <button
                          className="btn btn-sm btn-outline-secondary w-100"
                          disabled={jobQueue.length >= maxQueueSize || !affordable}
                          onClick={() => addToQueue(job.id)}
                        >
                          + Queue{isQueued ? ` (${jobQueue.filter((id) => id === job.id).length})` : ''}
                        </button>
                      )}
                    </div>

                    <div className="card-footer text-body-secondary" style={{ fontSize: '0.8rem' }}>
                      {rewardRes?.icon} {rewardLabel}: {formatNumber(balances[rewardResource.resourceId] ?? 0)}
                      {job.costs?.filter((c) => c.resourceId !== rewardResource.resourceId).map((c) => {
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

        {queueUnlocked && (
          <div className="col-12 col-lg-4">
            <div className="mt-4" style={{ maxWidth: 720 }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">Job Queue ({jobQueue.length}/{maxQueueSize})</h5>
                {jobQueue.length > 0 && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={clearQueue}>
                    Clear Queue
                  </button>
                )}
              </div>
              {jobQueue.length === 0 ? (
                <p className="text-body-secondary" style={{ fontSize: '0.875rem' }}>
                  Queue is empty. Click "+ Queue" on a job while another is running to add it.
                </p>
              ) : (
                <ol className="list-group list-group-numbered">
                  {jobQueue.map((qJobId, idx) => {
                    const qDef = allJobs.find((j) => j.id === qJobId)
                    return (
                      <li key={idx} className="list-group-item d-flex align-items-center justify-content-between">
                        <span>{qDef?.icon} {qDef?.name ?? qJobId}</span>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFromQueue(idx)}
                        >
                          Remove
                        </button>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
