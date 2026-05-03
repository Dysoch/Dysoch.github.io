import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import resourcesData from '../content/resources.json'
import exchangeRatesData from '../content/exchange_rates.json'
import type { Resource, ExchangeRate } from '../types'

const resources = resourcesData as Resource[]
const exchangeRates = exchangeRatesData as ExchangeRate[]

const resourceMap = Object.fromEntries(resources.map((r) => [r.id, r]))

export default function Bank() {
  const { resources: balances, exchange } = useGameStore()

  return (
    <div className="p-4">
      <h2>🏦 Bank</h2>
      <p className="text-body-secondary mb-4">
        Exchange lower-tier coins for higher-tier coins.
      </p>

      {/* Balances */}
      <h5 className="mb-3">Your Balances</h5>
      <div className="row g-2 mb-4" style={{ maxWidth: 720 }}>
        {resources.map((r) => (
          <div className="col-6 col-md-4 col-lg" key={r.id}>
            <div className="card text-center">
              <div className="card-body py-2 px-2">
                <div style={{ fontSize: '1.5rem' }}>{r.icon}</div>
                <div className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                  {r.name}
                </div>
                <div className="text-body-secondary" style={{ fontSize: '0.875rem' }}>
                  {formatNumber(balances[r.id] ?? 0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exchange tables */}
      <h5 className="mb-3">Exchange</h5>
      <div className="row g-3" style={{ maxWidth: 720 }}>
        {exchangeRates.map((rate) => {
          const from = resourceMap[rate.fromId]
          const to = resourceMap[rate.toId]
          if (!from || !to) return null

          const available = balances[rate.fromId] ?? 0
          const canExchange1 = available >= rate.rate
          const maxCount = Math.floor(available / rate.rate)

          return (
            <div className="col-12 col-md-6" key={`${rate.fromId}-${rate.toId}`}>
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
                        {formatNumber(rate.rate)} {from.name} = 1 {to.nameSingular}
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
                        (max {formatNumber(maxCount)})
                      </span>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-success flex-grow-1"
                      disabled={!canExchange1}
                      onClick={() => exchange(rate.fromId, rate.toId, rate.rate, 1)}
                    >
                      Exchange 1
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success flex-grow-1"
                      disabled={maxCount < 1}
                      onClick={() => exchange(rate.fromId, rate.toId, rate.rate, maxCount)}
                    >
                      Exchange Max ({formatNumber(maxCount)})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
