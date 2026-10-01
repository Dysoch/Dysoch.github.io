import { useGameStore } from '../store/gameStore'
import { getSpecDef } from '../worker/simLogic'
import type { GroupDef } from '../types'

/** One line naming the groups the current spec locks (hidden from the page below), or nothing for an Adventurer. */
export function LockedGroupsNote({ groups }: { groups: GroupDef[] }) {
  const spec = useGameStore((s) => getSpecDef(s.spec))
  const locked = groups.filter((g) => spec.lockedGroups.includes(g.id))
  if (locked.length === 0) return null
  return (
    <p className="small mb-3" style={{ color: 'var(--text-dim)' }}>
      {locked.map((g) => g.name).join(' and ')} {locked.length > 1 ? 'are' : 'is'} locked for a {spec.name}. You can pick another spec the next time you Ascend.
    </p>
  )
}
