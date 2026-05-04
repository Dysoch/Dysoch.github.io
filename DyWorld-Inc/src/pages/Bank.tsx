import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import resourcesData from '../content/resources.json'
import exchangeRatesData from '../content/exchange_rates.json'
import type { Resource, ExchangeRate } from '../types'

const allResources = resourcesData as Resource[]
const exchangeRates = exchangeRatesData as ExchangeRate[]

// Only capital-tier currencies on the Bank page
const capitalResources = allResources
  .filter((r) => r.category === 'capital')
  .sort((a, b) => a.tier - b.tier)
const resourceMap = Object.fromEntries(allResources.map((r) => [r.id, r]))

interface ExchangeCardProps {
  fromId: string
  toId: string
  /** How much fromId is spent per single exchange */
  spendPer: number
  /** How much toId is gained per single exchange */
  gainPer: number
  balances: Record<string, number>
  onExchange1: () => void
  onExchangeMax: () => void
  maxCount: number
}

function ExchangeCard({
  fromId, toId, spendPer, gainPer, balances, onExchange1, onExchangeMax, maxCount,
}: ExchangeCardProps) {
  const from = resourceMap[fromId]
  const to = resourceMap[toId]
  if (!from || !to) return null

  const available = balances[fromId] ?? 0
  const canExchange1 = available >= spendPer

  return (
    <div className="col-12 col-md-6">
      <div className={`card h-100 ${canExchange1 ? 'border-success' : ''}`}>
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: '1.5rem' }}>{from.icon}</span>
            <span className="text-body-secondary">→</span>
            <span style={{ fontSize: '1.5rem' }}>{to.icon}</span>
            <div className="ms-1">
              <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {from.name} → {to.name}
              </div>
              <div className="text-body-secondary" style={{ fontSize: '0.8rem' }}>
                {formatNumber(spendPer)} {from.name} = {formatNumber(gainPer)} {gainPer === 1 ? to.nameSingular : to.name}
              </div>
            </div>
          </div>

          <div className="mb-3" style={{ fontSize: '0.8rem' }}>
            <span className="text-body-secondary">You have: </span>
            <span className={canExchange1 ? 'text-success fw-semibold' : ''}>
              {formatNumber(available)} {from.name}
            </span>
            {maxCount > 1 && (
              <span className="text-body-secondary ms-2">
                (max {formatNumber(maxCount)}×)
              </span>
            )}
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-success flex-grow-1"
              disabled={!canExchange1}
              onClick={onExchange1}
            >
              Exchange 1×
            </button>
            <button
              className="btn btn-sm btn-outline-success flex-grow-1"
              disabled={maxCount < 1}
              onClick={onExchangeMax}
            >
              Max ({formatNumber(maxCount)}×)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Bank() {
  const { resources: balances, exchange } = useGameStore()

  return (
    <div className="p-4">
      <h2>🏦 Bank</h2>
      <p className="text-body-secondary mb-4">
        Exchange coins between tiers. Rate: {formatNumber(10000)}:1 in either direction.
      </p>

      {/* Capital balances */}
      <h5 className="mb-3">Balances</h5>
      <div className="row g-2 mb-4" style={{ maxWidth: 720 }}>
        {capitalResources.map((r) => (
          <div className="col" key={r.id}>
            <div className="card text-center">
              <div className="card-body py-2 px-2">
                <div style={{ fontSize: '1.5rem' }}>{r.icon}</div>
                <div className="fw-semibold" style={{ fontSize: '0.8rem' }}>{r.name}</div>
                <div className="text-body-secondary" style={{ fontSize: '0.875rem' }}>
                  {formatNumber(balances[r.id] ?? 0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade: low → high */}
      <h5 className="mb-3">Upgrade (lower → higher tier)</h5>
      <div className="row g-3 mb-4" style={{ maxWidth: 720 }}>
        {exchangeRates.map((rate: ExchangeRate) => {
          const available = balances[rate.fromId] ?? 0
          const maxCount = Math.floor(available / rate.rate)
          return (
            <ExchangeCard
              key={`up-${rate.fromId}`}
              fromId={rate.fromId}
              toId={rate.toId}
              spendPer={rate.rate}
              gainPer={1}
              balances={balances}
              maxCount={maxCount}
              onExchange1={() => exchange(rate.fromId, rate.toId, rate.rate, 1)}
              onExchangeMax={() => exchange(rate.fromId, rate.toId, rate.rate * maxCount, maxCount)}
            />
          )
        })}
      </div>

      {/* Downgrade: high → low */}
      <h5 className="mb-3">Downgrade (higher → lower tier)</h5>
      <div className="row g-3" style={{ maxWidth: 720 }}>
        {[...exchangeRates].reverse().map((rate: ExchangeRate) => {
          const available = balances[rate.toId] ?? 0
          const maxCount = available  // can break down all of them (1 at a time shown as ×)
          return (
            <ExchangeCard
              key={`down-${rate.toId}`}
              fromId={rate.toId}
              toId={rate.fromId}
              spendPer={1}
              gainPer={rate.rate}
              balances={balances}
              maxCount={Math.floor(available)}
              onExchange1={() => exchange(rate.toId, rate.fromId, 1, rate.rate)}
              onExchangeMax={() => exchange(rate.toId, rate.fromId, Math.floor(maxCount), Math.floor(maxCount) * rate.rate)}
            />
          )
        })}
      </div>
    </div>
  )
}
