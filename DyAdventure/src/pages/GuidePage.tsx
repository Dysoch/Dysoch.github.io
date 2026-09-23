import guideData from '../content/guide.json'
import prestigeData from '../content/prestige.json'
import { DEPTH_CLEARS_MAX, DEPTH_CLEARS_MIN, DESCEND_COOLDOWN_MS } from '../constants'
import { useGameStore } from '../store/gameStore'
import { canRecall, getZoneDef, getDefaultZoneId, zoneGateDepth } from '../worker/simLogic'
import type { SimState } from '../types'

interface GuideSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

const SECTIONS = guideData as GuideSection[]

// Sections not listed here are always shown (the core loop a brand-new player needs immediately).
// Gated ones only appear once their subject is actually reachable, same "don't show what isn't
// needed yet" rule the Prestige tab follows — and once true they stay true (discoveredItemIds only
// grows; the prestige check reuses the same lifetime-counter guard TabBar uses, so it doesn't
// flicker off after a Recall wipes live progress).
const SECTION_GATES: Record<string, (state: SimState) => boolean> = {
  gear: (state) => state.discoveredItemIds.length > 0,
  crafting: (state) => state.discoveredItemIds.length > 0,
  prestige: (state) => canRecall(state) || (state.lifetime.recalls ?? 0) > 0,
}

// Numbers in the guide text are filled in from the real game values so they never go stale
const TOKENS: Record<string, string | number> = {
  clearsMin: DEPTH_CLEARS_MIN,
  clearsMax: DEPTH_CLEARS_MAX,
  cooldown: DESCEND_COOLDOWN_MS / 1000,
  gateDepth: zoneGateDepth(getZoneDef(getDefaultZoneId())),
  recallDepth: prestigeData.recall.minDepth,
  ascendEchoes: prestigeData.ascend.minEchoesEarned,
}

function fill(text: string): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in TOKENS ? String(TOKENS[key]) : match))
}

export default function GuidePage() {
  const state = useGameStore((s) => s)
  const visibleSections = SECTIONS.filter((section) => (SECTION_GATES[section.id] ?? (() => true))(state))

  return (
    <div className="guide-columns" style={{ padding: '24px' }}>
      {visibleSections.map((section) => (
        <div key={section.id} className="panel" style={{ padding: '16px' }}>
          <h6 style={{ marginBottom: '10px' }}>{section.title}</h6>
          {section.paragraphs.map((text, i) => (
            <p key={i} className="small" style={{ marginBottom: '8px' }}>{fill(text)}</p>
          ))}
          {section.bullets && (
            <ul className="small mb-0">
              {section.bullets.map((text, i) => <li key={i}>{fill(text)}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
