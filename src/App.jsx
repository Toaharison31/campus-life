import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from './hooks/useLocalStorage'
import { CampusContext } from './context/CampusContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Timetable from './pages/Timetable'
import Announcements from './pages/Announcements'
import Resources from './pages/Resources'

function App() {
  const { t } = useTranslation()
  const [tasks, setTasks] = useLocalStorage('campus-life:tasks', 'tasks')
  const [courses, setCourses] = useLocalStorage('campus-life:courses', 'courses')
  const [announcements, setAnnouncements] = useLocalStorage('campus-life:announcements', 'announcements')
  const [resources, setResources] = useLocalStorage('campus-life:resources', 'resources')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = t('app.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('app.description'))
  }, [t])

  return (
    <CampusContext.Provider value={{ tasks, setTasks, courses, setCourses, announcements, setAnnouncements, resources, setResources }}>
      <div className="app-shell">
        <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {menuOpen && <button className="mobile-backdrop" aria-label={t('navigation.close')} onClick={() => setMenuOpen(false)} />}
        <div className="main-shell">
          <Header onMenuClick={() => setMenuOpen((open) => !open)} />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </CampusContext.Provider>
  )
}

export default App
