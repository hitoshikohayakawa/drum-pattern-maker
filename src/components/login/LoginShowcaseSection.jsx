import { useI18n } from '../../contexts/I18nContext.jsx'

export default function LoginShowcaseSection() {
  const { language } = useI18n()
  const imageSrc = language === 'ja' ? '/ogp.png' : '/drumOGPen.png'
  const imageAlt = language === 'ja'
    ? 'Drum Pattern Maker のサービスイメージ'
    : 'Drum Pattern Maker service showcase'

  return (
    <section className="lp-section lp-showcase-section">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="lp-showcase-image"
      />
    </section>
  )
}
