import guideData from '../content/guide.json'
import prestigeData from '../content/prestige.json'
import { DEPTH_CLEARS_MAX, DEPTH_CLEARS_MIN, DESCEND_COOLDOWN_MS } from '../constants'
import { getZoneDef, getDefaultZoneId } from '../worker/simLogic'

interface GuideSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

const SECTIONS = guideData as GuideSection[]

// Numbers in the guide text are filled in from the real game values so they never go stale
const TOKENS: Record<string, string | number> = {
  clearsMin: DEPTH_CLEARS_MIN,
  clearsMax: DEPTH_CLEARS_MAX,
  cooldown: DESCEND_COOLDOWN_MS / 1000,
  gateDepth: getZoneDef(getDefaultZoneId()).maxDepth,
  recallDepth: prestigeData.recall.minDepth,
  ascendEchoes: prestigeData.ascend.minEchoesEarned,
}

function fill(text: string): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in TOKENS ? String(TOKENS[key]) : match))
}

export default function GuidePage() {
  return (
    <div style={{ padding: '24px', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {SECTIONS.map((section) => (
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
