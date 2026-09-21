import zonesData from '../content/zones.json'
import { useGameStore } from '../store/gameStore'
import type { ZoneDef } from '../types'

const ZONES = zonesData as ZoneDef[]

function lockHint(zoneId: string): string {
  const prev = ZONES.find((z) => z.unlocksZoneId === zoneId)
  return prev ? `Defeat the Gate Boss at depth ${prev.maxDepth} in ${prev.name} to unlock.` : ''
}

export default function ZonesPage() {
  const currentZoneId = useGameStore((s) => s.currentZoneId)
  const unlockedZoneIds = useGameStore((s) => s.unlockedZoneIds)
  const selectZone = useGameStore((s) => s.selectZone)

  return (
    <div style={{ padding: '24px' }}>
      {ZONES.map((zone) => {
        const unlocked = unlockedZoneIds.includes(zone.id)
        const active = zone.id === currentZoneId
        return (
          <div key={zone.id} className="panel" style={{ padding: '16px', marginBottom: '12px', borderColor: active ? 'var(--accent)' : undefined }}>
            <div className="fw-bold">{zone.name}</div>
            <div className="text-body-secondary small mb-2">{zone.description}</div>
            <div className="small">Depths {zone.minDepth}–{zone.maxDepth} · Boss every {zone.bossEvery} floors</div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary mt-2"
              disabled={!unlocked || active}
              onClick={() => selectZone(zone.id)}
            >
              {active ? 'Current zone' : unlocked ? 'Travel here' : 'Locked'}
            </button>
            {!unlocked && <div className="text-body-secondary small mt-1">{lockHint(zone.id)}</div>}
          </div>
        )
      })}
    </div>
  )
}
