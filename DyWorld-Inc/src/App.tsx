import { useTheme } from './hooks/useTheme'
import TopBar from './components/TopBar'
import SideBar from './components/SideBar'
import ContentArea from './components/ContentArea'

export default function App() {
  useTheme()

  return (
    <>
      <TopBar />
      <SideBar />
      <ContentArea />
    </>
  )
}
