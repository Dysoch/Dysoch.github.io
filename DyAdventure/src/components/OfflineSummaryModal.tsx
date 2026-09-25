import { useGameStore } from '../store/gameStore'
import { describeMilestoneReward, getMilestone } from '../worker/simLogic'
import { formatDuration, formatNumber } from '../utils/format'

/** "While you were away" card, shown once after offline catch-up. Rows with nothing to report are left out. */
export default function OfflineSummaryModal() {
  const summary = useGameStore((s) => s.offlineSummary)
  const dismiss = useGameStore((s) => s.dismissOfflineSummary)
  if (!summary) return null

  const rows: [string, string][] = [
    ['Monsters defeated', formatNumber(summary.kills)],
    ['Bosses defeated', formatNumber(summary.bossKills)],
    ['Focus earned', formatNumber(summary.focusEarned)],
    ['New items found', formatNumber(summary.itemsFound)],
    ['Duplicates', formatNumber(summary.duplicates)],
    ['Items salvaged', formatNumber(summary.itemsSalvaged)],
    ['Materials gathered', formatNumber(summary.materialsGathered)],
    ['Stat levels trained', formatNumber(summary.statLevelsGained)],
    ['Ability ranks gained', formatNumber(summary.abilityRanksGained)],
    ['Times fainted', formatNumber(summary.faints)],
  ]
  const shown = rows.filter(([, value]) => value !== '0')

  return (
    <div className="modal-overlay" onClick={dismiss}>
      <div className="panel modal-card" role="dialog" aria-label="While you were away" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', fontWeight: 600 }}>While you were away</div>
        <div className="small" style={{ color: 'var(--text-dim)', marginBottom: '12px' }}>
          {formatDuration(summary.elapsedMs / 1000)} of adventuring
          {summary.capped && ' (offline progress is capped at 48 hours)'}
        </div>

        {summary.deepestAfter > summary.deepestBefore ? (
          <div className="small mb-2">
            Pushed deeper: depth <strong>{formatNumber(summary.deepestBefore)}</strong> → <strong style={{ color: 'var(--hp)' }}>{formatNumber(summary.deepestAfter)}</strong>
          </div>
        ) : (
          <div className="small mb-2">Held the line at depth <strong>{formatNumber(summary.depthAfter)}</strong></div>
        )}

        {shown.map(([label, value]) => (
          <div key={label} className="d-flex justify-content-between small border-bottom py-1">
            <span className="text-body-secondary">{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
          </div>
        ))}

        {summary.milestonesReached.length > 0 && (
          <div className="small mt-2">
            {summary.milestonesReached.map((id) => {
              const { track, tierIndex } = getMilestone(id)
              return (
                <div key={id} style={{ color: 'var(--focus)' }}>
                  🏆 {track.tiers[tierIndex].name} — {describeMilestoneReward(track, tierIndex)}
                </div>
              )
            })}
          </div>
        )}

        <button type="button" className="btn btn-sm btn-primary w-100 mt-3" onClick={dismiss}>
          Continue
        </button>
      </div>
    </div>
  )
}
