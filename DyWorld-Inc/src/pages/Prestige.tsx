import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import skillsData from '../content/skills.json'
import prestigeConfigData from '../content/prestige_config.json'
import type { SkillDef, PrestigeConfig } from '../types'

const skills = skillsData as SkillDef[]
const cfg = prestigeConfigData as PrestigeConfig

// Auto-generate tree tabs from unique tree values — adding a new tree only requires JSON entries
const trees = [...new Map(skills.map((s) => [s.tree, { id: s.tree, label: s.treeLabel }])).values()]

function computeInsight(stats: Record<string, number>): number {
  let score = 0
  for (const { resourceId, weight } of cfg.insightWeights) {
    score += (stats[`${resourceId}_earned`] ?? 0) * weight
  }
  return Math.max(1, Math.floor(Math.log2(score + 1)))
}

export default function Prestige() {
  const {
    resources,
    stats,
    insight,
    prestigeCount,
    purchasedSkills,
    prestige: doPrestige,
    buySkill,
  } = useGameStore()

  const [activeTree, setActiveTree] = useState(trees[0]?.id ?? 'hustle')

  const reqResource = cfg.requirement.resourceId
  const reqAmount   = cfg.requirement.amount
  const haveReq     = resources[reqResource] ?? 0
  const canPrestige = haveReq >= reqAmount
  const nextInsight = computeInsight(stats)

  const treeSkills = skills.filter((s) => s.tree === activeTree)

  return (
    <div className="p-4" style={{ maxWidth: 1500 }}>
      <h2>✨ Prestige</h2>
      <p className="text-body-secondary mb-4">
        Reset your venture in exchange for Insight — a permanent currency spent on skills that persist across all runs.
        Insight earned is based on how much capital you accumulated this venture.
      </p>

      {/* Status card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-auto">
              <div className="text-body-secondary" style={{ fontSize: '0.8rem' }}>Prestige Count</div>
              <div className="fw-semibold fs-5">{prestigeCount}</div>
            </div>
            <div className="col-auto">
              <div className="text-body-secondary" style={{ fontSize: '0.8rem' }}>Insight</div>
              <div className="fw-semibold fs-5 text-warning">✨ {formatNumber(insight)}</div>
            </div>
            <div className="col-auto">
              <div className="text-body-secondary" style={{ fontSize: '0.8rem' }}>Requirement</div>
              <div className={`fw-semibold fs-5 ${canPrestige ? 'text-success' : 'text-danger'}`}>
                🔶 {formatNumber(haveReq)} / {reqAmount} Bronze
              </div>
            </div>
            <div className="col-auto">
              <div className="text-body-secondary" style={{ fontSize: '0.8rem' }}>Prestige Now Earns</div>
              <div className="fw-semibold fs-5 text-warning">✨ {nextInsight} Insight</div>
            </div>
          </div>

          <div className="text-body-secondary mb-3" style={{ fontSize: '0.8rem' }}>
            Based on bronze/silver/gold/platinum earned this venture. Earn more capital before prestiging to get more Insight.
          </div>

          <button
            className="btn btn-warning"
            disabled={!canPrestige}
            onClick={() => {
              if (window.confirm(
                `Start a New Venture?\n\nYou will lose all resources, buildings, and upgrades from this run, but earn ${nextInsight} Insight.\n\nYour prestige skills remain.`
              )) {
                doPrestige()
              }
            }}
          >
            New Venture
          </button>

          {!canPrestige && (
            <div className="text-body-secondary mt-2" style={{ fontSize: '0.875rem' }}>
              Collect {reqAmount} Bronze Coins to prestige. Exchange Copper → Bronze at the Bank (1 billion copper per bronze).
            </div>
          )}
        </div>
      </div>

      {/* Skill trees */}
      <h5 className="mb-3">Skill Trees</h5>

      <ul className="nav nav-pills mb-3">
        {trees.map((tree) => (
          <li className="nav-item" key={tree.id}>
            <button
              className={`nav-link ${activeTree === tree.id ? 'active' : ''}`}
              onClick={() => setActiveTree(tree.id)}
            >
              {tree.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="row g-2">
        {treeSkills.map((skill) => {
          const currentLevel = purchasedSkills[skill.id] ?? 0
          const isMaxed = currentLevel >= skill.maxLevel
          const nextCost = isMaxed ? null : skill.costs[currentLevel]
          const canBuy = !isMaxed && nextCost !== null && insight >= nextCost

          return (
            <div className="col-12 col-md-3" key={skill.id}>
              <div className={`card h-100 ${canBuy ? 'border-warning' : ''} ${isMaxed ? 'opacity-75' : ''}`}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-1">
                    <h6 className="card-title mb-0">{skill.name}</h6>
                    <span className={`badge ms-2 flex-shrink-0 ${isMaxed ? 'bg-success' : 'bg-secondary'}`}>
                      {currentLevel}/{skill.maxLevel}
                    </span>
                  </div>
                  <p className="text-body-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                    {skill.description}
                  </p>
                  {!isMaxed && nextCost !== null && (
                    <div className="mb-2">
                      <span className="badge bg-warning text-dark">✨ {nextCost} Insight</span>
                    </div>
                  )}
                  <button
                    className={`btn btn-sm w-100 ${isMaxed ? 'btn-outline-success' : canBuy ? 'btn-warning' : 'btn-outline-secondary'}`}
                    disabled={!canBuy}
                    onClick={() => buySkill(skill.id)}
                  >
                    {isMaxed ? 'Maxed' : canBuy ? 'Buy' : 'Not enough Insight'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
