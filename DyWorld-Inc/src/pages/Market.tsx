import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import marketItemsData from '../content/market_items.json'
import resourcesData from '../content/resources.json'
import type { MarketItem, Resource } from '../types'

const marketItems = marketItemsData as MarketItem[]
const resourceMap = Object.fromEntries((resourcesData as Resource[]).map((r) => [r.id, r]))
const QUANTITIES = [1, 5, 10, 50] as const

export default function Market() {
  const {
    resources,
    marketPrices,
    marketPriceTrend,
    lastMarketTick,
    buyMarketResource,
    sellMarketResource,
  } = useGameStore()

  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const nextUpdateIn = Math.max(0, Math.ceil(30 - (now - lastMarketTick) / 1000))
  const copper = resources['copper_coins'] ?? 0

  return (
    <div className="p-4">
      <h2>🏪 Market</h2>
      <p className="text-body-secondary mb-1">
        Buy and sell basic resources for copper coins.
      </p>
      <p className="mb-4" style={{ fontSize: '0.8rem' }}>
        <span className="text-body-secondary">Prices update every 30 seconds — </span>
        <span className="fw-semibold">next update in {nextUpdateIn}s</span>
      </p>

      <div className="row g-3" style={{ maxWidth: 720 }}>
        {marketItems.map((item) => {
          const res = resourceMap[item.resourceId]
          const price = marketPrices[item.resourceId] ?? item.basePrice
          const trend = marketPriceTrend[item.resourceId] ?? 'same'
          const balance = resources[item.resourceId] ?? 0

          const maxBuy = Math.floor(copper / price)
          const maxSell = Math.floor(balance)

          const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
          const trendClass = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-body-secondary'

          return (
            <div className="col-12 col-md-6" key={item.resourceId}>
              <div className="card h-100">
                <div className="card-body">

                  {/* Header: name + current price */}
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <h5 className="card-title mb-0">
                      {res?.icon} {res?.name}
                    </h5>
                    <div className="d-flex align-items-center gap-1">
                      <span className="fw-semibold">🟤 {formatNumber(price)}</span>
                      <span className={trendClass} style={{ fontSize: '1.1rem', lineHeight: 1 }}>{trendIcon}</span>
                    </div>
                  </div>

                  <div className="text-body-secondary mb-3" style={{ fontSize: '0.75rem' }}>
                    Price range: 🟤 {item.minPrice} – {item.maxPrice} per unit
                  </div>

                  {/* Buy section */}
                  <div className="mb-3">
                    <div className="text-body-secondary mb-1" style={{ fontSize: '0.8rem' }}>
                      Buy <span className="text-body-secondary">(spend 🟤 copper)</span>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {QUANTITIES.map((qty) => {
                        const cost = price * qty
                        const canBuy = copper >= cost
                        return (
                          <button
                            key={qty}
                            className="btn btn-sm btn-outline-success"
                            disabled={!canBuy}
                            title={`Cost: ${formatNumber(cost)} copper`}
                            onClick={() => buyMarketResource(item.resourceId, qty)}
                          >
                            {qty}x
                          </button>
                        )
                      })}
                      <button
                        className="btn btn-sm btn-success"
                        disabled={maxBuy <= 0}
                        title={maxBuy > 0 ? `Buy ${maxBuy} for ${formatNumber(price * maxBuy)} copper` : 'Cannot afford any'}
                        onClick={() => buyMarketResource(item.resourceId, maxBuy)}
                      >
                        Max ({formatNumber(maxBuy)})
                      </button>
                    </div>
                  </div>

                  {/* Sell section */}
                  <div>
                    <div className="text-body-secondary mb-1" style={{ fontSize: '0.8rem' }}>
                      Sell <span className="text-body-secondary">(gain 🟤 copper)</span>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {QUANTITIES.map((qty) => {
                        const revenue = price * qty
                        const canSell = balance >= qty
                        return (
                          <button
                            key={qty}
                            className="btn btn-sm btn-outline-danger"
                            disabled={!canSell}
                            title={`Gain: ${formatNumber(revenue)} copper`}
                            onClick={() => sellMarketResource(item.resourceId, qty)}
                          >
                            {qty}x
                          </button>
                        )
                      })}
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={maxSell <= 0}
                        title={maxSell > 0 ? `Sell ${maxSell} for ${formatNumber(price * maxSell)} copper` : 'Nothing to sell'}
                        onClick={() => sellMarketResource(item.resourceId, maxSell)}
                      >
                        Max ({formatNumber(maxSell)})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card-footer text-body-secondary" style={{ fontSize: '0.8rem' }}>
                  {res?.icon} {res?.name}: {formatNumber(balance)}
                  <span className="mx-2">|</span>
                  🟤 Copper: {formatNumber(copper)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
