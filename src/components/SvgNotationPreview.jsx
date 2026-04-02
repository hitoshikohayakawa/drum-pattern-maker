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

  const isAccentMode = mode === 'accent'
  const rowLeft = isAccentMode ? 92 : 102
  const rowTop = isAccentMode ? 24 : 30
  const lineGap = isAccentMode ? 10 : 11
  const contentWidth = isAccentMode ? 1080 : 1180
  const stepX = totalSteps > 1 ? contentWidth / totalSteps : contentWidth
  const width = rowLeft + contentWidth + 44
  const height = isAccentMode ? 118 : 138
  const lineYs = Array.from({ length: 5 }, (_, i) => rowTop + i * lineGap)
  const snareY = (lineYs[1] + lineYs[2]) / 2
  const tomY = lineYs[1]
  const floorTomY = lineYs[4]
  const bassDrumY = lineYs[4] + (isAccentMode ? 16 : 18)
  const beamTop = rowTop - (isAccentMode ? 8 : 10)
  const beamThickness = 3
  const secondaryBeamOffset = isAccentMode ? 8 : 10
  const activeColor = '#9acd32'

  const beamLevel = getBeamLevel(noteType)
  const groupSize = getGroupSize(noteType)
  const noteHeadRx = mode === 'accent' ? 6.6 : 7.2
  const noteHeadRy = mode === 'accent' ? 5.2 : 5.8
  const kickHeadRx = mode === 'accent' ? 6.8 : 7.4
  const kickHeadRy = mode === 'accent' ? 5.5 : 6.1
  const stemOffsetX = noteHeadRx - 0.8
  const hiHatY = lineYs[0] - 1
  const hiHatStemTopY = hiHatY - 14
  const openHiHatCircleY = hiHatY - 20

  const positions = Array.from({ length: totalSteps }, (_, i) => rowLeft + i * stepX + stepX / 2)

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
          const hasUpperLayer = hasHiHatLayer || hasOpenHiHatLayer || hasRideLayer
          const needsSharedStem = hasSnareLayer && hasUpperLayer
          const isStandaloneCymbal = symbol === '✕' || symbol === 'C'
          const drawHandNote = mode === 'accent' || Boolean(symbol)
          const isBeamed = beamedIndexes.has(index)
          const isActiveStep = activeStepIndex === index
          const stemEndY = isBeamed
            ? beamTop + (beamLevel > 1 ? secondaryBeamOffset + beamThickness : beamThickness)
            : handY - 40
          const accentMarkY = Math.min(handY - (noteType === '4th' ? 24 : 16), lineYs[0] - 10)
          const noteColor = isActiveStep ? activeColor : '#111'

          return (
            <g key={`note-${index}`}>
              {drawHandNote ? (
                <>
                  {!isStandaloneCymbal && (!hasUpperLayer || needsSharedStem) ? (
                    <line x1={x + stemOffsetX} y1={handY - 1.5} x2={x + stemOffsetX} y2={stemEndY} stroke={noteColor} strokeWidth="2.8" />
                  ) : null}
                  {isStandaloneCymbal ? (
                    <g>
                      <line x1={x} y1={handY - 1} x2={x} y2={handY - 16} stroke={noteColor} strokeWidth="2.2" />
                      <line x1={x - 6.5} y1={handY - 5.5} x2={x + 6.5} y2={handY + 5.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      <line x1={x + 6.5} y1={handY - 5.5} x2={x - 6.5} y2={handY + 5.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                    </g>
                  ) : null}
                  {hasHiHatLayer || hasOpenHiHatLayer ? (
                    <g>
                      {!needsSharedStem ? (
                        <line x1={x} y1={hiHatY - 1} x2={x} y2={hiHatStemTopY} stroke={noteColor} strokeWidth="2.2" />
                      ) : null}
                      <line x1={x - 6.5} y1={hiHatY - 5.5} x2={x + 6.5} y2={hiHatY + 5.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      <line x1={x + 6.5} y1={hiHatY - 5.5} x2={x - 6.5} y2={hiHatY + 5.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      {hasOpenHiHatLayer ? (
                        <circle cx={x} cy={openHiHatCircleY} r="4.5" fill="none" stroke={noteColor} strokeWidth="1.5" />
                      ) : null}
                    </g>
                  ) : null}
                  {hasRideLayer ? (
                    <g>
                      {!needsSharedStem ? (
                        <line x1={x} y1={lineYs[1] - 9} x2={x} y2={lineYs[1] - 23} stroke={noteColor} strokeWidth="2.2" />
                      ) : null}
                      <line x1={x - 6.5} y1={lineYs[1] - 14.5} x2={x + 6.5} y2={lineYs[1] - 3.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                      <line x1={x + 6.5} y1={lineYs[1] - 14.5} x2={x - 6.5} y2={lineYs[1] - 3.5} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round" />
                    </g>
                  ) : null}
                  {(!isCymbal && !hasHiHatLayer && !hasOpenHiHatLayer && !hasRideLayer) || hasSnareLayer ? (
                    <ellipse
                      cx={x}
                      cy={handY}
                      rx={noteHeadRx}
                      ry={noteHeadRy}
                      fill={noteColor}
                      transform={`rotate(-18 ${x} ${handY})`}
                    />
                  ) : null}
                </>
              ) : null}

              {hasKick ? (
                <ellipse
                  cx={x - 1}
                  cy={bassDrumY}
                  rx={kickHeadRx}
                  ry={kickHeadRy}
                  fill={noteColor}
                  transform={`rotate(-18 ${x - 1} ${bassDrumY})`}
                />
              ) : null}

              {showAccentMarks && symbol ? (
                <text x={x + 1} y={accentMarkY} fontSize="22" fontWeight="600" textAnchor="middle">{'>'}</text>
              ) : null}
            </g>
          )
        })}

      </svg>
    </div>
  )
}
