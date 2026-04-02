import { useEffect, useState } from 'react'

export default function ImageNotationPreview({ imageUrl }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
  }, [imageUrl])

  if (!imageUrl) {
    return (
      <div className="abc-preview vexflow-preview" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#44516b', fontWeight: 700 }}>画像データがありません</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {loading && <div style={{ marginBottom: '16px', color: '#6b7280' }}>画像を読み込み中...</div>}
      <img
        src={imageUrl}
        alt="ドラム譜面"
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: loading ? 'none' : 'block',
          border: '1px solid #e5e7eb',
        }}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  )
}
