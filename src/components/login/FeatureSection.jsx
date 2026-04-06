import { useI18n } from '../../contexts/I18nContext.jsx'

export default function FeatureSection() {
  const { t } = useI18n()

  const features = [
    {
      title: t('lp.features.card1.title'),
      description: t('lp.features.card1.body'),
    },
    {
      title: t('lp.features.card2.title'),
      description: t('lp.features.card2.body'),
    },
    {
      title: t('lp.features.card3.title'),
      description: t('lp.features.card3.body'),
    },
  ]

  const differentiators = [
    t('lp.difference.item1'),
    t('lp.difference.item2'),
    t('lp.difference.item3'),
    t('lp.difference.item4'),
  ]

  return (
    <section className="lp-section lp-feature-section">
      <div className="lp-section-heading">
        <p className="panel-kicker">{t('lp.features.kicker')}</p>
        <h3>{t('lp.features.title')}</h3>
      </div>

      <div className="lp-feature-grid">
        {features.map((feature) => (
          <article className="lp-feature-card" key={feature.title}>
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>

      <div className="lp-difference-card">
        <p className="panel-kicker">{t('lp.difference.kicker')}</p>
        <h4>{t('lp.difference.title')}</h4>
        <ul className="lp-difference-list">
          {differentiators.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
