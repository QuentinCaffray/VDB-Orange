import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function PageWrapper() {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
