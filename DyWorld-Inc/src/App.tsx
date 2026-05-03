import { useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { useGameStore } from './store/gameStore'
import TopBar from './components/TopBar'
import SideBar from './components/SideBar'
import ContentArea from './components/ContentArea'
import jobsData from './content/jobs.json'
import type { Job } from './types'

const jobs = jobsData as Job[]

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export default function App() {
  useTheme()
  const tickPassiveIncome = useGameStore((s) => s.tickPassiveIncome)
  const lastPassiveTick   = useGameStore((s) => s.lastPassiveTick)
  const tickMarket        = useGameStore((s) => s.tickMarket)

  // Offline passive income catch-up on mount
  useEffect(() => {
    const delta = Date.now() - lastPassiveTick
    if (delta > 1000) tickPassiveIncome(delta)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 1-second passive income tick
  useEffect(() => {
    const id = setInterval(() => tickPassiveIncome(1000), 1000)
    return () => clearInterval(id)
  }, [tickPassiveIncome])

  // Job completion — global so it works on every page
  useEffect(() => {
    const id = setInterval(() => {
      const job = useGameStore.getState().activeJob
      if (job && Date.now() >= job.endTime) {
        const def = jobs.find((j) => j.id === job.jobId)
        if (def) {
          const reward = def.rewards[0]
          const amount = randomBetween(reward.min, reward.max)
          useGameStore.getState().completeJob(job.jobId, reward.resourceId, amount)
        }
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  // Market price updates — immediate catch-up if stale, then every 30s
  useEffect(() => {
    if (Date.now() - useGameStore.getState().lastMarketTick >= 30000) {
      tickMarket()
    }
    const id = setInterval(() => tickMarket(), 30000)
    return () => clearInterval(id)
  }, [tickMarket])

  return (
    <>
      <TopBar />
      <SideBar />
      <ContentArea />
    </>
  )
}
