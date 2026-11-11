import { useMemo, useState } from 'react'
import { CalendarDays, Check, Circle, ListFilter, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCampus } from '../context/CampusContext'
import { createId } from '../services/storage'
import { formatLongDate, getLocalDateString } from '../services/dates'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const blank = { title: '', description: '', dueDate: '', priority: 'Medium', status: 'Pending' }
export default function Tasks() {
  const { t, i18n } = useTranslation()
  const { tasks, setTasks } = useCampus()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [priority, setPriority] = useState('All')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const today = getLocalDateString()
  const filtered = useMemo(() => tasks.filter((task) => (status === 'All' || task.status === status) && (priority === 'All' || task.priority === priority) && `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase())), [tasks, status, priority, query])
  const openForm = (task = null) => { setEditing(task || false); setForm(task ? { ...task } : blank); setError('') }
  const save = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.dueDate) { setError('tasks.validation'); return }
    const saved = { ...form, title: form.title.trim(), description: form.description.trim() }
    setTasks((items) => editing ? items.map((item) => item.id === editing.id ? { ...item, ...saved } : item) : [{ ...saved, id: createId('task'), createdAt: today }, ...items])
    setEditing(null)
  }
  const remove = () => { setTasks((items) => items.filter((item) => item.id !== deleting.id)); setDeleting(null) }
  const toggle = (id) => setTasks((items) => items.map((item) => item.id === id ? { ...item, status: item.status === 'Completed' ? 'Pending' : 'Completed' } : item))
  const isEditing = !editing
  const formatDate = (date) => formatLongDate(date, i18n.resolvedLanguage || 'fr')

  return <div className="module-page">
    <div className="page-title-row"><div><div className="eyebrow">{t('tasks.eyebrow')}</div><h1>{t('tasks.title')}</h1><p>{t('tasks.intro')}</p></div><button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> {t('tasks.add')}</button></div>
    <div className="module-summary"><div><strong>{tasks.length}</strong><span>{t('tasks.total')}</span></div><div><strong>{tasks.filter((item) => item.status === 'Pending').length}</strong><span>{t('tasks.pending')}</span></div><div><strong>{tasks.filter((item) => item.status === 'Completed').length}</strong><span>{t('tasks.completed')}</span></div><div className="overdue-count"><strong>{tasks.filter((item) => item.status === 'Pending' && item.dueDate < today).length}</strong><span>{t('tasks.overdue')}</span></div></div>
    <section className="panel listing-panel">
      <div className="list-toolbar"><div className="search-field"><Search size={17} /><input placeholder={t('tasks.search')} value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t('tasks.searchLabel')} /></div><div className="filter-controls"><ListFilter size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t('tasks.filterStatus')}><option value="All">{t('tasks.allStatus')}</option><option value="Pending">{t('status.Pending')}</option><option value="Completed">{t('status.Completed')}</option></select><select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label={t('tasks.filterPriority')}><option value="All">{t('tasks.allPriorities')}</option><option value="High">{t('priority.High')}</option><option value="Medium">{t('priority.Medium')}</option><option value="Low">{t('priority.Low')}</option></select></div></div>
      {filtered.length ? <div className="task-table">
        <div className="table-head task-columns"><span>{t('tasks.task')}</span><span>{t('tasks.dueDate')}</span><span>{t('tasks.priority')}</span><span>{t('tasks.status')}</span><span>{t('tasks.actions')}</span></div>
        {filtered.map((task) => { const overdue = task.status === 'Pending' && task.dueDate < today; return <div className="table-row task-columns" key={task.id}>
          <div className="table-task-cell"><button className={`task-check ${task.status === 'Completed' ? 'checked' : ''}`} onClick={() => toggle(task.id)} aria-label={t(task.status === 'Completed' ? 'tasks.markPending' : 'tasks.markCompleted', { title: task.title })}>{task.status === 'Completed' && <Check size={13} />}</button><div><strong className={task.status === 'Completed' ? 'text-done' : ''}>{task.title}</strong><span>{task.description || t('tasks.descriptionEmpty')}</span></div></div>
          <div className={`due-cell ${overdue ? 'overdue' : ''}`}><CalendarDays size={15} />{overdue && <span className="sr-only">{t('tasks.overdue')}: </span>}{formatDate(task.dueDate)}{overdue && <small>{t('tasks.overdue')}</small>}</div>
          <div><span className={`priority-dot priority-${task.priority.toLowerCase()}`}>{t(`priority.${task.priority}`)}</span></div>
          <div><span className={`status-pill status-${task.status.toLowerCase()}`}>{task.status === 'Completed' ? <Check size={12} /> : <Circle size={8} />}{t(`status.${task.status}`)}</span></div>
          <div className="row-actions"><button className="icon-button" onClick={() => openForm(task)} aria-label={t('tasks.edit', { title: task.title })}><Pencil size={16} /></button><button className="icon-button delete-action" onClick={() => setDeleting(task)} aria-label={t('tasks.delete', { title: task.title })}><Trash2 size={16} /></button></div>
        </div>})}
      </div> : <EmptyState title={tasks.length ? t('tasks.noMatches') : t('tasks.clear')} message={tasks.length ? t('tasks.adjustFilters') : t('tasks.addToStart')} />}
    </section>
    {editing !== null && <Modal title={isEditing ? t('tasks.addTitle') : t('tasks.editTitle')} onClose={() => setEditing(null)}>
      <form className="form-body" onSubmit={save} noValidate>
        <label>{t('tasks.titleLabel')}<input autoFocus maxLength="100" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('tasks.titlePlaceholder')} /></label>
        <label>{t('tasks.description')} <span className="optional">{t('tasks.optional')}</span><textarea rows="3" maxLength="500" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t('tasks.descriptionPlaceholder')} /></label>
        <div className="form-row"><label>{t('tasks.dueDate')}<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label><label>{t('tasks.priorityLabel')}<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="Low">{t('priority.Low')}</option><option value="Medium">{t('priority.Medium')}</option><option value="High">{t('priority.High')}</option></select></label></div>
        {error && <p className="form-error">{t(error)}</p>}
        <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setEditing(null)}>{t('tasks.cancel')}</button><button className="button button-primary"><Check size={16} /> {t('tasks.save')}</button></div>
      </form>
    </Modal>}
    {deleting && <ConfirmDialog title={t('tasks.deleteTitle')} message={t('tasks.deleteMessage', { title: deleting.title })} onCancel={() => setDeleting(null)} onConfirm={remove} />}
  </div>
}
