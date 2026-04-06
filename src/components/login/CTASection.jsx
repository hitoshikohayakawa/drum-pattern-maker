import { useI18n } from '../../contexts/I18nContext.jsx'

export default function CTASection({ isDisabled, isLoading, onStart }) {
  const { t } = useI18n()

  return (
    <section className="lp-section lp-cta-section">
      <div className="lp-cta-card">
        <p className="panel-kicker">{t('lp.cta.kicker')}</p>
        <h3>{t('lp.cta.title')}</h3>
        <p>{t('lp.cta.body')}</p>
        <button
          type="button"
          className="auth-primary-button lp-cta-button"
          onClick={onStart}
          disabled={isDisabled}
        >
          {isLoading ? '...' : t('lp.cta.button')}
        </button>
      </div>
    </section>
  )
}
