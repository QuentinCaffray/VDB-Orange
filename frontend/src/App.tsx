import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PageWrapper from './components/layout/PageWrapper'
import TasksPage from './pages/tasks'
import ObjectivesPage from './pages/objectives'
import TeamPage from './pages/team'
import ProfilePage from './pages/profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PageWrapper />}>
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/objectives" element={<ObjectivesPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
