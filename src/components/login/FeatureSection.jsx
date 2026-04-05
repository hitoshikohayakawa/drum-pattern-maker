const FEATURES = [
  {
    title: 'リズム練習生成',
    description: 'アクセントやグルーヴの練習譜を自動生成して、毎日の基礎練を回し続けられます。',
  },
  {
    title: 'フィルインエディタ',
    description: '思いついたフィルをステップ入力で作成し、譜面表示と再生でそのまま確認できます。',
  },
  {
    title: 'みんなのパターン共有',
    description: '公開されたフィルを見て、聴いて、保存して、自分の練習に取り込めます。',
  },
]

const DIFFERENTIATORS = [
  '自動生成で無限に練習メニューを作れる',
  '譜面と音を同時に確認できる',
  'スマホでも使いやすいシンプル設計',
  '公開フィルを保存して自分の練習へ流し込める',
]

export default function FeatureSection() {
  return (
    <section className="lp-section lp-feature-section">
      <div className="lp-section-heading">
        <p className="panel-kicker">What You Can Do</p>
        <h3>ひと目でわかる、3つの使い方</h3>
      </div>

      <div className="lp-feature-grid">
        {FEATURES.map((feature) => (
          <article className="lp-feature-card" key={feature.title}>
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>

      <div className="lp-difference-card">
        <p className="panel-kicker">Why It Feels Better</p>
        <h4>練習が続きやすい理由</h4>
        <ul className="lp-difference-list">
          {DIFFERENTIATORS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
