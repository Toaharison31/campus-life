import { ArrowRight, BookOpen, CalendarDays, Check, Clock3, NotebookTabs, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCampus } from '../context/CampusContext'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import { formatShortDate, getTodayScheduleLabel, getTodayWeekday } from '../services/dates'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { tasks, courses, announcements, resources } = useCampus()
  const completed = tasks.filter((task) => task.status === 'Completed').length
  const pending = tasks.filter((task) => task.status === 'Pending').length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const language = i18n.resolvedLanguage || 'fr'
  const today = getTodayWeekday('en')
  const upcoming = courses.filter((course) => course.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(0, 3)
  const recentTasks = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  const recentAnnouncements = [...announcements].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3)

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div><div className="eyebrow"><Sparkles size={14} /> {t('dashboard.eyebrow')}</div><h1>{t('dashboard.greeting')} <span>✦</span></h1><p>{t('dashboard.intro')}</p></div>
        <Link className="button button-primary" to="/tasks"><Plus size={17} /> {t('dashboard.newTask')}</Link>
      </section>
      <div className="profile-strip">
        <div className="profile-main"><div className="avatar avatar-large">JM</div><div><span className="profile-caption">{t('dashboard.profile')}</span><strong>{t('profile.studentName')}</strong><span>{t('profile.major')} · {t('profile.year')}</span></div></div>
        <div className="profile-detail"><span>{t('dashboard.studentId')}</span><strong>CS-2024-0842</strong></div>
        <div className="profile-detail"><span>{t('dashboard.gpa')}</span><strong>3.82 <small>/ 4.00</small></strong></div>
        <div className="profile-detail"><span>{t('dashboard.semester')}</span><strong>{t('profile.fall')}</strong></div>
      </div>
      <section className="stats-grid">
        <StatCard icon={NotebookTabs} label={t('dashboard.totalTasks')} value={tasks.length} note={t('dashboard.allCourses')} tone="blue" />
        <StatCard icon={Check} label={t('dashboard.completed')} value={completed} note={t('dashboard.completionRate', { percent: progress })} tone="green" />
        <StatCard icon={Clock3} label={t('dashboard.pending')} value={pending} note={t('dashboard.keepMomentum')} tone="amber" />
        <StatCard icon={BookOpen} label={t('dashboard.resources')} value={resources.length} note={t('dashboard.inLibrary')} tone="purple" />
      </section>
      <div className="dashboard-grid">
        <section className="panel task-panel">
          <div className="panel-heading"><div><h2>{t('dashboard.recentTasks')}</h2><p>{t('dashboard.recentTasksIntro')}</p></div><Link className="text-link" to="/tasks">{t('dashboard.viewAll')} <ArrowRight size={15} /></Link></div>
          {recentTasks.length ? <div className="task-list">{recentTasks.map((task) => <div className="task-row" key={task.id}>
            <span className={`task-check ${task.status === 'Completed' ? 'checked' : ''}`}>{task.status === 'Completed' && <Check size={13} />}</span>
            <div className="task-row-copy"><strong className={task.status === 'Completed' ? 'text-done' : ''}>{task.title}</strong><span>{t('dashboard.dueShort', { date: formatShortDate(task.dueDate, language) })}</span></div>
            <span className={`priority-dot priority-${task.priority.toLowerCase()}`}>{t(`priority.${task.priority}`)}</span>
          </div>)}</div> : <EmptyState title={t('dashboard.emptyTasksTitle')} message={t('dashboard.emptyTasksMessage')} />}
          <div className="completion-box"><div className="completion-head"><span>{t('dashboard.taskCompletion')}</span><strong>{progress}%</strong></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><small>{t('dashboard.completedOf', { completed, total: tasks.length, count: tasks.length })}</small></div>
        </section>
        <section className="panel schedule-panel">
          <div className="panel-heading"><div><h2>{t('dashboard.todaysClasses')}</h2><p>{getTodayScheduleLabel(language)}</p></div><Link className="panel-icon-link" to="/timetable" aria-label={t('dashboard.viewTimetable')}><CalendarDays size={18} /></Link></div>
          {upcoming.length ? <div className="class-list">{upcoming.map((course) => <div className="class-row" key={course.id}><div className="class-time">{course.startTime}<span>{course.endTime}</span></div><div className="class-indicator" /><div className="class-copy"><strong>{course.name}</strong><span>{course.classroom} · {course.teacher}</span></div></div>)}</div> : <EmptyState title={t('dashboard.noClassesToday')} message={t('dashboard.freeTime')} />}
          <Link className="schedule-footer" to="/timetable">{t('dashboard.weeklyTimetable')} <ArrowRight size={15} /></Link>
        </section>
        <section className="panel announcements-panel">
          <div className="panel-heading"><div><h2>{t('dashboard.campusUpdates')}</h2><p>{t('dashboard.latestUniversity')}</p></div><Link className="text-link" to="/announcements">{t('dashboard.allUpdates')} <ArrowRight size={15} /></Link></div>
          {recentAnnouncements.length ? <div className="announcement-list">{recentAnnouncements.map((item) => <article className="announcement-row" key={item.id}><span className={`category-mark category-${item.category.toLowerCase()}`} /><div><div className="announcement-meta"><span>{t(`category.${item.category}`)}</span><time>{formatShortDate(item.publishedAt, language)}</time></div><strong>{item.title}</strong><p>{item.content}</p></div></article>)}</div> : <EmptyState title={t('dashboard.noAnnouncements')} />}
        </section>
        <section className="panel progress-panel">
          <div className="panel-heading"><div><h2>{t('dashboard.keepItUp')}</h2><p>{t('dashboard.smallSteps')}</p></div></div>
          <div className="study-quote"><div className="quote-icon"><Sparkles size={20} /></div><p>{t('dashboard.quote')}</p><span>{t('dashboard.quoteAuthor')}</span></div>
          <Link className="quick-resource" to="/resources"><span><BookOpen size={17} /></span><div><strong>{t('dashboard.exploreLibrary')}</strong><small>{t('dashboard.resourcesReady', { count: resources.length })}</small></div><ArrowRight size={16} /></Link>
        </section>
      </div>
    </div>
  )
}
