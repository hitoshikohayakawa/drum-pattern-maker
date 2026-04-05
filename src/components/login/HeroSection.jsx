export default function HeroSection() {
  return (
    <section className="lp-section lp-hero">
      <div className="lp-copy-block">
        <p className="panel-kicker">Practice Smarter</p>
        <h3>ドラム練習を、もっと直感的に。</h3>
        <p className="lp-copy-lead">
          アクセント練習の自動生成、フィルインの作成、みんなのパターン共有まで。
          drum pattern maker は、日々の練習を一つの画面で前に進めるためのスタジオです。
        </p>
      </div>

      <div className="lp-highlight-list">
        <div className="lp-highlight-card">
          <strong>無限に生成</strong>
          <span>毎回違う譜面で、飽きずに反復できます。</span>
        </div>
        <div className="lp-highlight-card">
          <strong>その場で再生</strong>
          <span>音で確認しながら、譜面と身体をすぐ一致させられます。</span>
        </div>
      </div>
    </section>
  )
}
