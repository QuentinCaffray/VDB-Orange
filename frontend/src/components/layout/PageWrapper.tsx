import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function PageWrapper() {
  return (
    <div className="min-h-dvh">
      {/* Sidebar fixe — affichée uniquement sur desktop (md+) */}
      <Sidebar />

      {/* Zone de contenu — pousse de 240px sur desktop pour laisser place à la sidebar */}
      <div className="flex flex-col min-h-dvh md:ml-[240px]">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Bottom navigation — cachée sur desktop, visible sur mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
