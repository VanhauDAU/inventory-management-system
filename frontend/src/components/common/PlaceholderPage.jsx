import './PlaceholderPage.css'

export default function PlaceholderPage({ title, description, icon }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon" aria-hidden="true">{icon || '🚧'}</div>
      <h2 className="placeholder-title">{title}</h2>
      <p className="placeholder-desc">
        {description || 'Tính năng này đang được phát triển và sẽ sớm ra mắt.'}
      </p>
      <span className="placeholder-badge">Đang phát triển</span>
    </div>
  )
}
