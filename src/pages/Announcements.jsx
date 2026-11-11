import { useMemo, useState } from 'react'
import { Megaphone, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCampus } from '../context/CampusContext'
import { createId } from '../services/storage'
import { formatLongDate, getLocalDateString } from '../services/dates'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const categories = ['Academic', 'Campus', 'Events', 'General']
const blank = { title: '', content: '', category: 'Academic', author: 'Jordan Miller' }
export default function Announcements() {
  const { t, i18n } = useTranslation()
  const { announcements, setAnnouncements } = useCampus()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const today = getLocalDateString()
  const filtered = useMemo(() => [...announcements].filter((item) => (category === 'All' || item.category === category) && `${item.title} ${item.content} ${item.author}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), [announcements, category, query])
  const openForm = (item = null) => { setEditing(item || false); setForm(item ? { ...item } : blank); setError('') }
  const closeForm = () => setEditing(null)
  const save = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim() || !form.author.trim()) { setError('announcements.validation'); return }
    const saved = { ...form, title: form.title.trim(), content: form.content.trim(), author: form.author.trim() }
    setAnnouncements((items) => editing ? items.map((item) => item.id === editing.id ? { ...item, ...saved } : item) : [{ ...saved, id: createId('announcement'), publishedAt: today }, ...items])
    closeForm()
  }
  const remove = () => { setAnnouncements((items) => items.filter((item) => item.id !== deleting.id)); setDeleting(null) }

  return <div className="module-page">
    <div className="page-title-row"><div><div className="eyebrow">{t('announcements.eyebrow')}</div><h1>{t('announcements.title')}</h1><p>{t('announcements.intro')}</p></div><button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> {t('announcements.publish')}</button></div>
    <section className="panel announcement-tools"><div className="search-field"><Search size={17} /><input placeholder={t('announcements.search')} value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t('announcements.searchLabel')} /></div><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label={t('announcements.filterCategory')}><option value="All">{t('announcements.allCategories')}</option>{categories.map((value) => <option key={value} value={value}>{t(`category.${value}`)}</option>)}</select><span className="results-note">{t('announcements.updates', { count: filtered.length })}</span></section>
    <div className="announcement-cards">{filtered.map((item) => {
      const recent = (new Date(today) - new Date(item.publishedAt)) / 86400000 < 7
      return <article className="panel announcement-card" key={item.id}><div className="announcement-card-top"><span className={`category-badge category-${item.category.toLowerCase()}`}>{t(`category.${item.category}`)}</span>{recent && <span className="new-badge"><i /> {t('announcements.recent')}</span>}<div className="row-actions"><button className="icon-button" aria-label={t('announcements.edit', { title: item.title })} onClick={() => openForm(item)}><Pencil size={16} /></button><button className="icon-button delete-action" aria-label={t('announcements.delete', { title: item.title })} onClick={() => setDeleting(item)}><Trash2 size={16} /></button></div></div><h2>{item.title}</h2><p className="announcement-content">{item.content}</p><div className="announcement-card-footer"><div className="author-avatar"><Megaphone size={14} /></div><strong>{item.author}</strong><span>·</span><time>{formatLongDate(item.publishedAt, i18n.resolvedLanguage || 'fr')}</time></div></article>
    })}</div>
    {!filtered.length && <section className="panel"><EmptyState title={announcements.length ? t('announcements.noMatches') : t('announcements.emptyTitle')} message={announcements.length ? t('announcements.tryAnother') : t('announcements.emptyMessage')} /></section>}
    {editing !== null && <Modal title={editing ? t('announcements.editTitle') : t('announcements.publishTitle')} onClose={closeForm} wide>
      <form className="form-body" onSubmit={save} noValidate>
        <label>{t('announcements.titleLabel')}<input autoFocus maxLength="140" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('announcements.titlePlaceholder')} /></label>
        <div className="form-row"><label>{t('announcements.category')}<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((value) => <option key={value} value={value}>{t(`category.${value}`)}</option>)}</select></label><label>{t('announcements.author')}<input maxLength="80" value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} /></label></div>
        <label>{t('announcements.content')}<textarea rows="5" maxLength="2000" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder={t('announcements.contentPlaceholder')} /></label>
        {error && <p className="form-error">{t(error)}</p>}
        <div className="form-actions"><button type="button" className="button button-secondary" onClick={closeForm}>{t('announcements.cancel')}</button><button className="button button-primary"><Megaphone size={16} /> {t('announcements.publishButton')}</button></div>
      </form>
    </Modal>}
    {deleting && <ConfirmDialog title={t('announcements.deleteTitle')} message={t('announcements.deleteMessage', { title: deleting.title })} onCancel={() => setDeleting(null)} onConfirm={remove} />}
  </div>
}
