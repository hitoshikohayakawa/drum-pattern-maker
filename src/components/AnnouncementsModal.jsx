import { useEffect, useMemo, useState } from 'react'

import { getPublishedAnnouncements } from '../constants/updates.js'
import { useI18n } from '../contexts/I18nContext.jsx'

function localizeType(type, language) {
  if (language === 'ja') {
    if (type === 'fix') return '修正'
    if (type === 'improvement') return '改善'
    return '新機能'
  }

  if (type === 'fix') return 'Fix'
  if (type === 'improvement') return 'Improvement'
  return 'Feature'
}

export default function AnnouncementsModal({ isOpen, onClose, onOpen }) {
  const { language } = useI18n()
  const announcements = useMemo(() => getPublishedAnnouncements(), [])
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedAnnouncementId(null)
      return
    }

    onOpen?.()
  }, [isOpen, onOpen])

  const selectedAnnouncement = announcements.find((item) => item.id === selectedAnnouncementId) || null

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-card announcement-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcements-modal-title"
      >
        <div className="modal-header">
          <div>
            <p className="panel-kicker">{language === 'ja' ? 'Updates' : 'Updates'}</p>
            <h2 id="announcements-modal-title">{language === 'ja' ? 'お知らせ' : 'Announcements'}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={language === 'ja' ? '閉じる' : 'Close'}>
            ×
          </button>
        </div>

        {selectedAnnouncement ? (
          <div className="announcement-detail">
            <button
              type="button"
              className="text-link-button announcement-back-button"
              onClick={() => setSelectedAnnouncementId(null)}
            >
              {language === 'ja' ? '一覧に戻る' : 'Back to list'}
            </button>

            <div className="announcement-meta-row">
              <span className="announcement-type-pill">{localizeType(selectedAnnouncement.type, language)}</span>
              <span className="announcement-date">{selectedAnnouncement.date}</span>
            </div>

            <h3 className="announcement-detail-title">{selectedAnnouncement.title[language]}</h3>
            <p className="announcement-detail-summary">{selectedAnnouncement.summary[language]}</p>

            <ul className="announcement-body-list">
              {selectedAnnouncement.body[language].map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="announcement-list" role="list">
            {announcements.map((announcement) => (
              <button
                key={announcement.id}
                type="button"
                className="announcement-list-item"
                onClick={() => setSelectedAnnouncementId(announcement.id)}
              >
                <div className="announcement-meta-row">
                  <span className="announcement-type-pill">{localizeType(announcement.type, language)}</span>
                  <span className="announcement-date">{announcement.date}</span>
                </div>
                <strong>{announcement.title[language]}</strong>
                <span>{announcement.summary[language]}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}