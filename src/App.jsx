import { useMemo, useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

const NOTE_OPTIONS = [
  { value: '4th', label: '4部音符' },
  { value: '8th', label: '8部音符' },
  { value: '16th', label: '16部音符' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'イージー' },
  { value: 'normal', label: 'ノーマル' },
  { value: 'hard', label: 'ハード' },
]

const BAR_OPTIONS = [
  { value: '2', label: '2小節固定' },
  { value: '4', label: '4小節固定' },
  { value: '16', label: '16小節固定' },
]

const ORCHESTRATION_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: 'tom', label: 'タム' },
  { value: 'tomCymbal', label: 'タム・シンバル' },
]

const KICK_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: '1', label: '1拍' },
  { value: '2', label: '2拍' },
  { value: '3', label: '3拍' },
  { value: '4', label: '4拍' },
]

const TOTAL_BARS_PER_PAGE = 16
const CELL_SIZE = 4

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getStepsPerBar(noteType) {
  if (noteType === '4th') return 4
  if (noteType === '8th') return 8
  return 16
}

function getQuarterStep(noteType) {
  if (noteType === '4th') return 1
  if (noteType === '8th') return 2
  return 4
}

function getCellCountPerBar(noteType) {
  if (noteType === '4th') return 1
  if (noteType === '8th') return 2
  return 4
}

function getAccentCountForCell(difficulty) {
  if (difficulty === 'easy') return 1
  if (difficulty === 'normal') return Math.random() < 0.7 ? 1 : 2

  const roll = Math.random()
  if (roll < 0.25) return 1
  if (roll < 0.6) return 2
  if (roll < 0.85) return 3
  return 4
}

function createAccentPositions(accentCount) {
  return shuffle([0, 1, 2, 3]).slice(0, accentCount).sort((a, b) => a - b)
}

function createOrchestrationMap(accentPositions, orchestration) {
  const map = {}

  accentPositions.forEach((pos) => {
    if (orchestration === 'none') {
      map[pos] = 'accent'
      return
    }

    if (orchestration === 'tom') {
      map[pos] = Math.random() < 0.5 ? 'tom' : 'floorTom'
      return
    }

    const roll = Math.random()
    if (roll < 0.45) {
      map[pos] = 'crash'
    } else if (roll < 0.75) {
      map[pos] = 'tom'
    } else {
      map[pos] = 'floorTom'
    }
  })

  return map
}

function createCellPattern(difficulty, orchestration) {
  const accentCount = getAccentCountForCell(difficulty)
  const accentPositions = createAccentPositions(accentCount)
  const orchestrationMap = createOrchestrationMap(accentPositions, orchestration)

  const accentRow = Array(CELL_SIZE).fill('')

  accentPositions.forEach((pos) => {
    const type = orchestrationMap[pos]
    if (type === 'crash') accentRow[pos] = '✕'
    else if (type === 'tom') accentRow[pos] = '△'
    else if (type === 'floorTom') accentRow[pos] = '▲'
    else accentRow[pos] = '＜'
  })

  return { accentRow }
}

function getKickBeatNumbers(kickSetting) {
  if (kickSetting === 'none') return []
  if (kickSetting === '1') return [1]
  if (kickSetting === '2') return [1, 3]
  if (kickSetting === '3') return [1, 2, 3]
  return [1, 2, 3, 4]
}

function applyKickToBar(kickRow, noteType, kickSetting) {
  const quarterStep = getQuarterStep(noteType)
  const beatNumbers = getKickBeatNumbers(kickSetting)

  beatNumbers.forEach((beat) => {
    const index = (beat - 1) * quarterStep
    if (index < kickRow.length) kickRow[index] = '●'
  })
}

function createBarPattern(noteType, difficulty, orchestration, kickSetting) {
  const stepsPerBar = getStepsPerBar(noteType)
  const cellCountPerBar = getCellCountPerBar(noteType)

  const accentRow = []
  const kickRow = Array(stepsPerBar).fill('')

  for (let cellIndex = 0; cellIndex < cellCountPerBar; cellIndex += 1) {
    const cell = createCellPattern(difficulty, orchestration)
    accentRow.push(...cell.accentRow)
  }

  applyKickToBar(kickRow, noteType, kickSetting)

  accentRow.forEach((symbol, index) => {
    if (symbol === '✕') kickRow[index] = '●'
  })

  return { accentRow, kickRow, stepsPerBar }
}

function createFullPattern(noteType, difficulty, bars, orchestration, kickSetting) {
  const totalBars = Number(bars)
  const accentRow = []
  const kickRow = []

  for (let bar = 0; bar < totalBars; bar += 1) {
    const barPattern = createBarPattern(noteType, difficulty, orchestration, kickSetting)
    accentRow.push(...barPattern.accentRow)
    kickRow.push(...barPattern.kickRow)
  }

  return {
    accentRow,
    kickRow,
    stepsPerBar: getStepsPerBar(noteType),
    totalSteps: getStepsPerBar(noteType) * totalBars,
  }
}

function createPagePatterns(noteType, difficulty, bars, orchestration, kickSetting) {
  const barsPerRow = Number(bars)
  const rowCount = Math.max(1, Math.floor(TOTAL_BARS_PER_PAGE / barsPerRow))
  return Array.from({ length: rowCount }, () =>
    createFullPattern(noteType, difficulty, bars, orchestration, kickSetting)
  )
}

function PatternSvgRow({ pattern, rowNumber, noteType }) {
  const { accentRow, kickRow, totalSteps, stepsPerBar } = pattern

  const stepX = 72
  const cellGap = 26
  const rowLeft = 52

  const positions = []
  let x = rowLeft

  for (let i = 0; i < totalSteps; i += 1) {
    positions.push(x)
    x += stepX
    if ((i + 1) % CELL_SIZE === 0 && i !== totalSteps - 1) {
      x += cellGap
    }
  }

  const width = x + 30
  const height = 210

  const accentY = 42
  const beamY = 84
  const stemTop = beamY
  const stemBottom = 150
  const headY = 156
  const kickY = 188

  const cellStarts = []
  for (let i = 0; i < totalSteps; i += CELL_SIZE) cellStarts.push(i)

  const barStarts = []
  for (let i = 0; i < totalSteps; i += stepsPerBar) barStarts.push(i)

  return (
    <div className="pattern-block">
      <div className="pattern-row-number">{rowNumber}</div>
      <svg
        className="pattern-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        

        {accentRow.map((symbol, index) =>
          symbol ? (
            <text
              key={`accent-${index}`}
              x={positions[index]}
              y={accentY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="accent-text"
            >
              {symbol}
            </text>
          ) : null
        )}

        {cellStarts.map((startIndex) => {
          const xs = positions.slice(startIndex, startIndex + 4)
          const beamStart = xs[0] - 10
          const beamEnd = xs[3] + 10

          return (
            <g key={`cell-${startIndex}`}>
              <line
                x1={beamStart}
                y1={beamY}
                x2={beamEnd}
                y2={beamY}
                stroke="#111"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {xs.map((px, i) => (
                <g key={i}>
                  <line
                    x1={px + 8}
                    y1={stemTop}
                    x2={px + 8}
                    y2={stemBottom}
                    stroke="#111"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <ellipse
                    cx={px}
                    cy={headY}
                    rx="12"
                    ry="10"
                    fill="#111"
                  />
                </g>
              ))}
            </g>
          )
        })}

        {kickRow.map((symbol, index) =>
          symbol ? (
            <circle
              key={`kick-${index}`}
              cx={positions[index]}
              cy={kickY}
              r="15"
              fill="#111"
            />
          ) : null
        )}
      </svg>
    </div>
  )
}

export default function App() {
  const [noteType, setNoteType] = useState('8th')
  const [difficulty, setDifficulty] = useState('easy')
  const [bars, setBars] = useState('2')
  const [orchestration, setOrchestration] = useState('none')
  const [kickSetting, setKickSetting] = useState('2')
  const [refreshKey, setRefreshKey] = useState(0)
  const [bpm, setBpm] = useState(90)
  const [isPlaying, setIsPlaying] = useState(false)

  const patterns = useMemo(() => {
    return createPagePatterns(noteType, difficulty, bars, orchestration, kickSetting)
  }, [noteType, difficulty, bars, orchestration, kickSetting, refreshKey])

  const accentSynthRef = useRef(null)
  const kickSynthRef = useRef(null)
  const playEventIdRef = useRef(null)

  useEffect(() => {
    accentSynthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: {
        attack: 0.001,
        decay: 0.12,
        sustain: 0,
        release: 0.08,
      },
    }).toDestination()

    kickSynthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 6,
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.15,
      },
    }).toDestination()

    Tone.Transport.bpm.value = bpm

    return () => {
      Tone.Transport.stop()
      Tone.Transport.cancel()
      accentSynthRef.current?.dispose()
      kickSynthRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    Tone.Transport.bpm.value = bpm
  }, [bpm])

  const getStepDuration = () => {
    if (noteType === '4th') return '4n'
    if (noteType === '8th') return '8n'
    return '16n'
  }

  const handlePlay = async () => {
    if (!patterns.length) return

    await Tone.start()

    const pattern = patterns[0]
    const { accentRow, kickRow } = pattern
    const stepDuration = getStepDuration()

    Tone.Transport.stop()
    Tone.Transport.cancel()

    let stepIndex = 0

    playEventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const accent = accentRow[stepIndex]
      const kick = kickRow[stepIndex]

      if (kick) {
        kickSynthRef.current?.triggerAttackRelease('C1', '8n', time, 1)
      }

      if (accent === '＜') {
        accentSynthRef.current?.triggerAttackRelease('G3', '16n', time, 0.95)
      } else if (accent === '✕') {
        accentSynthRef.current?.triggerAttackRelease('A3', '16n', time, 1)
      } else if (accent === '△' || accent === '▲') {
        accentSynthRef.current?.triggerAttackRelease('E3', '16n', time, 0.85)
      } else {
        accentSynthRef.current?.triggerAttackRelease('D3', '16n', time, 0.25)
      }

      stepIndex += 1

      if (stepIndex >= accentRow.length) {
        Tone.Transport.stop()
        Tone.Transport.cancel()
        setIsPlaying(false)
      }
    }, stepDuration)

    Tone.Transport.start()
    setIsPlaying(true)
  }

  const handleStop = () => {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    setIsPlaying(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ドラム練習パターンメーカー</h1>
      </header>

      <section className="control-panel no-print">
        <div className="control-item">
          <label>音符パターン</label>
          <select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
            {NOTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>難易度</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>固定小節</label>
          <select value={bars} onChange={(e) => setBars(e.target.value)}>
            {BAR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>タム・シンバル構成</label>
          <select value={orchestration} onChange={(e) => setOrchestration(e.target.value)}>
            {ORCHESTRATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>キック設定</label>
          <select value={kickSetting} onChange={(e) => setKickSetting(e.target.value)}>
            {KICK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="button-row no-print">
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>生成</button>
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>再生成</button>
        <button onClick={startPlayback}>再生</button>
        <button onClick={stopPlayback}>停止</button>  

        <label className="bpm-control">
          BPM
          <input
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </label>

        <button onClick={() => window.print()}>印刷 / PDF保存</button>
      </section>

      <section className="sheet-area">
        <div className="sheet-paper">
          <div className="sheet-meta">
            <div>音符: {NOTE_OPTIONS.find((item) => item.value === noteType)?.label}</div>
            <div>難易度: {DIFFICULTY_OPTIONS.find((item) => item.value === difficulty)?.label}</div>
            <div>固定小節: {BAR_OPTIONS.find((item) => item.value === bars)?.label}</div>
            <div>構成: {ORCHESTRATION_OPTIONS.find((item) => item.value === orchestration)?.label}</div>
            <div>キック: {KICK_OPTIONS.find((item) => item.value === kickSetting)?.label}</div>
          </div>

          <div className="pattern-list">
            {patterns.map((pattern, index) => (
              <PatternSvgRow
                key={`${refreshKey}-${index}`}
                pattern={pattern}
                rowNumber={index + 1}
                noteType={noteType}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
const startPlayback = async () => {
  await Tone.start()

  Tone.Transport.stop()
  Tone.Transport.cancel()

  const synth = new Tone.MembraneSynth().toDestination()

  const bpmValue = Number(document.querySelector('input')?.value || 90)
  Tone.Transport.bpm.value = bpmValue

  const currentPattern = patterns[0] // とりあえず1行目再生

  currentPattern.kickRow.forEach((kick, index) => {
    if (kick === '●') {
      const time = index * (60 / bpmValue / 2) // 8分想定
      Tone.Transport.schedule((t) => {
        synth.triggerAttackRelease('C1', '8n', t)
      }, time)
    }
  })

  Tone.Transport.start()
  setIsPlaying(true)
}
const stopPlayback = () => {
  Tone.Transport.stop()
  setIsPlaying(false)
}
