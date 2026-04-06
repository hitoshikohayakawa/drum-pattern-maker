import { useI18n } from '../../contexts/I18nContext.jsx'

export default function HeroSection() {
  const { t } = useI18n()

  return (
    <section className="lp-section lp-hero">
      <div className="lp-copy-block">
        <p className="panel-kicker">{t('lp.hero.kicker')}</p>
        <h3>{t('lp.hero.title')}</h3>
        <p className="lp-copy-lead">{t('lp.hero.body')}</p>
      </div>

      <div className="lp-highlight-list">
        <div className="lp-highlight-card">
          <strong>{t('lp.hero.card1.title')}</strong>
          <span>{t('lp.hero.card1.body')}</span>
        </div>
        <div className="lp-highlight-card">
          <strong>{t('lp.hero.card2.title')}</strong>
          <span>{t('lp.hero.card2.body')}</span>
        </div>
      </div>
    </section>
  )
}
