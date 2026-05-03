import { useGameStore } from '../store/gameStore'
import ManualLabor from '../pages/ManualLabor'
import Statistics from '../pages/Statistics'
import Market from '../pages/Market'
import Bank from '../pages/Bank'
import Settings from '../pages/Settings'
import About from '../pages/About'

export default function ContentArea() {
  const activeTab = useGameStore((s) => s.activeTab)

  const page = (() => {
    switch (activeTab) {
      case 'manual-labor': return <ManualLabor />
      case 'statistics':   return <Statistics />
      case 'market':       return <Market />
      case 'bank':         return <Bank />
      case 'settings':     return <Settings />
      case 'about':        return <About />
    }
  })()

  return (
    <main
      style={{
        position: 'fixed',
        top: 56,
        left: 220,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
      }}
    >
      {page}
    </main>
  )
}
