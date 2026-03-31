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

function getVisibleRuns(indexes) {
  if (!indexes.length) return []
  const runs = [[indexes[0]]]
  for (let i = 1; i < indexes.length; i += 1) {
    const current = indexes[i]
    const prev = indexes[i - 1]
    if (current === prev + 1) {
      runs[runs.length - 1].push(current)
    } else {
      runs.push([current])
    }
  }
  return runs
}

function isCymbalSymbol(symbol) {
  return symbol === '✕' || symbol === 'H' || symbol === 'O' || symbol === 'C' || symbol === 'R'
}

function hasLayer(symbol, target) {
  return typeof symbol === 'string' && symbol.includes(target)
}

export default function SvgNotationPreview({
  pattern,
  noteType,
  orchestration,
  mode = 'accent',
  showAccentMarks = true,
  activeStepIndex = null,
}) {
  if (!pattern) return <div className="abc-preview">プレビュー対象がありません</div>

  const { accentRow = [], kickRow = [], totalSteps = 0, stepsPerBar = 0 } = pattern
  if (!totalSteps || !stepsPerBar) return <div className="abc-preview">プレビュー対象がありません</div>

  const rowLeft = 120
  const rowTop = 42
  const stepX = 38
  const width = rowLeft + totalSteps * stepX + 60
  const height = 190
  const lineYs = Array.from({ length: 5 }, (_, i) => rowTop + i * 14)
  const snareY = (lineYs[1] + lineYs[2]) / 2
  const tomY = lineYs[1]
  const floorTomY = lineYs[4]
  const bassDrumY = lineYs[4] + 18
  const beamTop = rowTop - 10
  const beamThickness = 3
  const secondaryBeamOffset = 10
  const accentY = rowTop - 8
  const activeColor = '#9acd32'

  const beamLevel = getBeamLevel(noteType)
  const groupSize = getGroupSize(noteType)

  const positions = Array.from({ length: totalSteps }, (_, i) => rowLeft + i * stepX)

  function normalizeSymbol(symbol) {
    if (orchestration === 'tom' && symbol === '✕') return '△'
    return symbol
  }

  function getHandNoteY(symbol, index) {
    const normalized = normalizeSymbol(symbol)
    if (normalized === 'C') return lineYs[0] - 18
    if (normalized === 'H') return lineYs[0] - 6
    if (normalized === 'O') return lineYs[0] - 6
    if (normalized === 'R') return lineYs[1] - 10
    if (normalized === 'T') return lineYs[1]
    if (normalized === 'M') return lineYs[2]
    if (normalized === 'F') return floorTomY
    if (normalized === 'S') return snareY
    if (normalized === '▲' || normalized === '△') {
      const isRightHand = index % 2 === 0
      return isRightHand ? floorTomY : tomY
    }
    if (hasLayer(normalized, 'S')) return snareY
    if (normalized === '✕') return lineYs[0] - 6
    return snareY
  }

  const groupStarts = []
  for (let i = 0; i < totalSteps; i += groupSize) groupStarts.push(i)

  const barStarts = []
  for (let i = 0; i <= totalSteps; i += stepsPerBar) barStarts.push(i)

  const beamedIndexes = new Set()
  groupStarts.forEach((start) => {
    const end = Math.min(start + groupSize - 1, totalSteps - 1)
    const indexes = []
    for (let i = start; i <= end; i += 1) {
      const symbol = normalizeSymbol(accentRow[i])
      const drawHandNote = mode === 'accent' || Boolean(symbol)
      if (drawHandNote && !isCymbalSymbol(symbol)) indexes.push(i)
    }
    getVisibleRuns(indexes)
      .filter((run) => run.length > 1)
      .forEach((run) => {
        run.forEach((index) => {
          beamedIndexes.add(index)
        })
      })
  })

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
          const indexes = []
          for (let i = start; i <= end; i += 1) {
            const symbol = normalizeSymbol(accentRow[i])
            const drawHandNote = mode === 'accent' || Boolean(symbol)
            if (drawHandNote && !isCymbalSymbol(symbol)) indexes.push(i)
          }
          const runs = getVisibleRuns(indexes).filter((run) => run.length > 1)

          return (
            <g key={`group-${groupIndex}`}>
              {runs.map((run, runIndex) => {
                const beamStart = positions[run[0]] + 2
                const beamEnd = positions[run[run.length - 1]] + 9
                const runHasCymbal = run.some((index) => isCymbalSymbol(normalizeSymbol(accentRow[index])))
                const secondaryBeamEnabled = beamLevel > 1 && !runHasCymbal

                return (
                  <g key={`run-${runIndex}`}>
                    {beamLevel > 0 ? (
                      <line
                        x1={beamStart}
                        y1={beamTop + beamThickness / 2}
                        x2={beamEnd}
                        y2={beamTop + beamThickness / 2}
                        stroke="#111"
                        strokeWidth={beamThickness}
                        strokeLinecap="square"
                      />
                    ) : null}
                    {secondaryBeamEnabled ? (
                      <line
                        x1={beamStart}
                        y1={beamTop + secondaryBeamOffset + beamThickness / 2}
                        x2={beamEnd}
                        y2={beamTop + secondaryBeamOffset + beamThickness / 2}
                        stroke="#111"
                        strokeWidth={beamThickness}
                        strokeLinecap="square"
                      />
                    ) : null}
                  </g>
                )
              })}
            </g>
          )
        })}

        {positions.map((x, index) => {
          const symbol = normalizeSymbol(accentRow[index])
          const handY = getHandNoteY(symbol, index)
          const hasKick = Boolean(kickRow[index])
          const isCymbal = isCymbalSymbol(symbol)
          const hasHiHatLayer = hasLayer(symbol, 'H')
          const hasOpenHiHatLayer = symbol === 'O' || hasLayer(symbol, 'O')
          const hasRideLayer = hasLayer(symbol, 'R')
          const hasSnareLayer = symbol === 'S' || symbol === '＜' || hasLayer(symbol, 'S')
          const drawHandNote = mode === 'accent' || Boolean(symbol)
          const isBeamed = beamedIndexes.has(index)
          const isActiveStep = activeStepIndex === index
          const stemEndY = isBeamed
            ? beamTop + (beamLevel > 1 ? secondaryBeamOffset + beamThickness : beamThickness)
            : handY - 40
          const noteColor = isActiveStep ? activeColor : '#111'

          return (
            <g key={`note-${index}`}>
              {drawHandNote ? (
                <>
                  <line x1={x + 8} y1={handY - 2} x2={x + 8} y2={stemEndY} stroke={noteColor} strokeWidth="2.8" />
                  {isCymbal ? (
                    <g>
                      <line x1={x - 6.5} y1={handY - 5.5} x2={x + 6.5} y2={handY + 5.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      <line x1={x + 6.5} y1={handY - 5.5} x2={x - 6.5} y2={handY + 5.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                    </g>
                  ) : null}
                  {hasHiHatLayer || hasOpenHiHatLayer ? (
                    <g>
                      <line x1={x - 6.5} y1={lineYs[0] - 11.5} x2={x + 6.5} y2={lineYs[0] - 0.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      <line x1={x + 6.5} y1={lineYs[0] - 11.5} x2={x - 6.5} y2={lineYs[0] - 0.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      {hasOpenHiHatLayer ? (
                        <circle cx={x} cy={lineYs[0] - 18} r="4.5" fill="none" stroke={noteColor} strokeWidth="1.5" />
                      ) : null}
                    </g>
                  ) : null}
                  {hasRideLayer ? (
                    <g>
                      <line x1={x - 6.5} y1={lineYs[1] - 15.5} x2={x + 6.5} y2={lineYs[1] - 4.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      <line x1={x + 6.5} y1={lineYs[1] - 15.5} x2={x - 6.5} y2={lineYs[1] - 4.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                    </g>
                  ) : null}
                  {(!isCymbal && !hasHiHatLayer && !hasOpenHiHatLayer && !hasRideLayer) || hasSnareLayer ? (
                    <ellipse cx={x} cy={handY} rx="9.5" ry="7.5" fill={noteColor} transform={`rotate(-18 ${x} ${handY})`} />
                  ) : null}
                </>
              ) : null}

              {hasKick ? (
                <ellipse
                  cx={x - 1}
                  cy={bassDrumY}
                  rx="10.5"
                  ry="8.5"
                  fill={noteColor}
                  transform={`rotate(-18 ${x - 1} ${bassDrumY})`}
                />
              ) : null}

              {showAccentMarks && symbol ? (
                <text x={x + 1} y={accentY} fontSize="22" fontWeight="600" textAnchor="middle">{'>'}</text>
              ) : null}
            </g>
          )
        })}

      </svg>
    </div>
  )
}
