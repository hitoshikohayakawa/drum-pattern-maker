function getBeamLevel(noteType) {
  if (noteType === '4th') return 0
  if (noteType === '8th') return 1
  return 2
}

function getGroupSize(noteType) {
  if (noteType === '4th') return 1
  if (noteType === '8th') return 4
  return 4
}

export default function SvgNotationPreview({ pattern, noteType, orchestration }) {
  if (!pattern) return <div className="abc-preview">プレビュー対象がありません</div>

  const { accentRow = [], kickRow = [], totalSteps = 0, stepsPerBar = 0 } = pattern
  if (!totalSteps || !stepsPerBar) return <div className="abc-preview">プレビュー対象がありません</div>

  const rowLeft = 120
  const rowTop = 42
  const stepX = 38
  const width = rowLeft + totalSteps * stepX + 60
  const height = 190
  const lineYs = Array.from({ length: 5 }, (_, i) => rowTop + i * 14)
  const snareY = lineYs[3]
  const tomY = lineYs[1]
  const floorTomY = lineYs[4]
  const bassDrumY = lineYs[4] + 18
  const stemTop = rowTop + 8
  const accentY = rowTop - 8
  const beamGap = 8

  const beamLevel = getBeamLevel(noteType)
  const groupSize = getGroupSize(noteType)

  const positions = Array.from({ length: totalSteps }, (_, i) => rowLeft + i * stepX)

  function normalizeSymbol(symbol) {
    if (orchestration === 'tom' && symbol === '✕') return '△'
    return symbol
  }

  function getHandNoteY(symbol, index) {
    const normalized = normalizeSymbol(symbol)
    if (normalized === '▲' || normalized === '△') {
      const isRightHand = index % 2 === 0
      return isRightHand ? floorTomY : tomY
    }
    if (normalized === '✕') return lineYs[0] - 6
    return snareY
  }

  const groupStarts = []
  for (let i = 0; i < totalSteps; i += groupSize) groupStarts.push(i)

  const barStarts = []
  for (let i = 0; i <= totalSteps; i += stepsPerBar) barStarts.push(i)

  return (
    <div className="abc-preview">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet">
        {lineYs.map((y, index) => (
          <line
            key={`staff-${index}`}
            x1={30}
            y1={y}
            x2={width - 20}
            y2={y}
            stroke="#111"
            strokeWidth="1.5"
          />
        ))}

        <line x1={48} y1={lineYs[0]} x2={48} y2={lineYs[4]} stroke="#111" strokeWidth="6" />
        <line x1={58} y1={lineYs[0]} x2={58} y2={lineYs[4]} stroke="#111" strokeWidth="3.5" />
        <text x={78} y={rowTop + 18} fontSize="30" fontWeight="700" textAnchor="middle">4</text>
        <text x={78} y={rowTop + 52} fontSize="30" fontWeight="700" textAnchor="middle">4</text>

        {barStarts.map((barStart, index) => {
          if (barStart === 0 || barStart === totalSteps) return null
          const x = positions[barStart] - stepX / 2
          return (
            <line
              key={`bar-${index}`}
              x1={x}
              y1={lineYs[0]}
              x2={x}
              y2={lineYs[4]}
              stroke="#111"
              strokeWidth="1.6"
            />
          )
        })}

        {groupStarts.map((start, groupIndex) => {
          const end = Math.min(start + groupSize - 1, totalSteps - 1)
          const xs = positions.slice(start, end + 1)
          const beamStart = xs[0] + 2
          const beamEnd = xs[xs.length - 1] + 9

          return (
            <g key={`group-${groupIndex}`}>
              {beamLevel > 0 && (
                <line x1={beamStart} y1={stemTop} x2={beamEnd} y2={stemTop} stroke="#111" strokeWidth="4.2" />
              )}
              {beamLevel > 1 && (
                <line
                  x1={beamStart}
                  y1={stemTop + beamGap}
                  x2={beamEnd}
                  y2={stemTop + beamGap}
                  stroke="#111"
                  strokeWidth="4.2"
                />
              )}
            </g>
          )
        })}

        {positions.map((x, index) => {
          const symbol = normalizeSymbol(accentRow[index])
          const handY = getHandNoteY(symbol, index)
          const hasKick = Boolean(kickRow[index])
          const isCymbal = symbol === '✕'

          return (
            <g key={`note-${index}`}>
              {beamLevel === 0 ? (
                <line x1={x + 8} y1={handY - 2} x2={x + 8} y2={stemTop + 48} stroke="#111" strokeWidth="3.2" />
              ) : (
                <line x1={x + 8} y1={handY - 2} x2={x + 8} y2={stemTop} stroke="#111" strokeWidth="3.2" />
              )}
              {isCymbal ? (
                <g>
                  <circle cx={x} cy={handY} r="9.5" fill="#fff" stroke="#111" strokeWidth="2.2" />
                  <line x1={x - 5.2} y1={handY - 5.2} x2={x + 5.2} y2={handY + 5.2} stroke="#111" strokeWidth="2" />
                  <line x1={x + 5.2} y1={handY - 5.2} x2={x - 5.2} y2={handY + 5.2} stroke="#111" strokeWidth="2" />
                </g>
              ) : (
                <ellipse cx={x} cy={handY} rx="9.5" ry="7.5" fill="#111" transform={`rotate(-18 ${x} ${handY})`} />
              )}

              {hasKick ? (
                <ellipse
                  cx={x - 1}
                  cy={bassDrumY}
                  rx="10.5"
                  ry="8.5"
                  fill="#111"
                  transform={`rotate(-18 ${x - 1} ${bassDrumY})`}
                />
              ) : null}

              {symbol ? (
                <text x={x + 1} y={accentY} fontSize="22" fontWeight="600" textAnchor="middle">{'>'}</text>
              ) : null}
            </g>
          )
        })}

      </svg>
    </div>
  )
}
