import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import ActivateRoute from './components/layout/ActivateRoute'
import PageWrapper from './components/layout/PageWrapper'
import LoginPage from './pages/login'
import ActivatePage from './pages/activate'
import TasksPage from './pages/tasks'
import HistoryPage from './pages/history'
import ObjectivesPage from './pages/objectives'
import TeamPage from './pages/team'
import ProfilePage from './pages/profile'
import AdminManageIndicatorsPage from './pages/admin/indicators'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />

          {/* Activation — uniquement après login si isFirstLogin */}
          <Route element={<ActivateRoute />}>
            <Route path="/activate" element={<ActivatePage />} />
          </Route>

          {/* Routes protégées — redirige vers /login si non authentifié */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PageWrapper />}>
              <Route index element={<Navigate to="/tasks" replace />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/objectives" element={<ObjectivesPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin/indicators" element={<AdminManageIndicatorsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
