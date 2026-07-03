import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { DarkModeProvider } from './context/DarkModeContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import ActivateRoute from './components/layout/ActivateRoute'
import PageWrapper from './components/layout/PageWrapper'
import LoginPage from './pages/login'
import ActivatePage from './pages/activate'
import DashboardPage from './pages/dashboard'
import TasksPage from './pages/tasks'
import HistoryPage from './pages/history'
import ObjectivesPage from './pages/objectives'
import TeamPage from './pages/team'
import ProfilePage from './pages/profile'
import AdminManageIndicatorsPage from './pages/admin/indicators'
import AdminUsersPage from './pages/admin/users'
import AdminRecurringTasksPage from './pages/admin/recurring-tasks'
import ChangePasswordPage from './pages/profile/change-password'
import GamePage from './pages/game'

export default function App() {
  return (
    <DarkModeProvider>
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '16px', fontFamily: 'inherit', fontSize: '14px' },
        }}
      />
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
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/objectives" element={<ObjectivesPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                <Route path="/admin/indicators" element={<AdminManageIndicatorsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/recurring-tasks" element={<AdminRecurringTasksPage />} />
              </Route>
              <Route path="/profile/change-password" element={<ChangePasswordPage />} />
              <Route path="/game" element={<GamePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </DarkModeProvider>
  )
}
