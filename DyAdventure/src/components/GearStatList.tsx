import { Fragment } from 'react'
import { useGameStore } from '../store/gameStore'
import { getSpecDef, getStatLabel, isStatLocked } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import type { GearStatDef } from '../types'

/** "+2.5 Might · +1 Speed", with stats the current spec locks struck through (they do nothing). */
export function GearStatList({ stats, separator = ' · ' }: { stats: GearStatDef[]; separator?: string }) {
  const state = useGameStore((s) => s)
  const specName = getSpecDef(state.spec).name
  return (
    <>
      {stats.map((st, i) => {
        const locked = isStatLocked(state, st.statId)
        const text = `+${formatNumber(st.value)} ${getStatLabel(st.statId)}`
        return (
          <Fragment key={st.statId}>
            {i > 0 && separator}
            {locked ? (
              <s style={{ color: 'var(--text-dim)' }} title={`Does nothing for a ${specName}`}>{text}</s>
            ) : (
              text
            )}
          </Fragment>
        )
      })}
    </>
  )
}
