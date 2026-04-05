export default function CTASection({ isDisabled, isLoading, onStart }) {
  return (
    <section className="lp-section lp-cta-section">
      <div className="lp-cta-card">
        <p className="panel-kicker">Start Now</p>
        <h3>今日の練習を、もっと気持ちよく。</h3>
        <p>
          ログインすると、練習譜の生成、フィルの作成、みんなのパターン保存まで
          すぐに始められます。
        </p>
        <button
          type="button"
          className="auth-primary-button lp-cta-button"
          onClick={onStart}
          disabled={isDisabled}
        >
          {isLoading ? '接続中...' : '無料で始める'}
        </button>
      </div>
    </section>
  )
}
