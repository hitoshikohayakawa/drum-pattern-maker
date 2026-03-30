import { useMemo, useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import SvgNotationPreview from './components/SvgNotationPreview'

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

const SNARE_TONE_OPTIONS = [
  { value: 'maple', label: 'メープル（ウォーム）' },
  { value: 'bright', label: 'ブライト' },
  { value: 'fat', label: 'ファット' },
]

const TOM_TONE_OPTIONS = [
  { value: 'standard', label: 'スタンダード' },
  { value: 'tight', label: 'タイト（高め）' },
  { value: 'deep', label: 'ディープ（低め）' },
]

const FLOOR_TOM_TONE_OPTIONS = [
  { value: 'standard', label: 'スタンダード' },
  { value: 'tight', label: 'タイト（高め）' },
  { value: 'deep', label: 'ディープ（低め）' },
]

const CYMBAL_TONE_OPTIONS = [
  { value: 'tight', label: 'タイト' },
  { value: 'open', label: 'オープン寄り' },
  { value: 'dark', label: 'ダーク' },
]

const SNARE_TONE_PRESETS = {
  maple: { hpf: 130, lpf: 4200, threshold: -24, ratio: 2.8, attack: 0.004, release: 0.14, volume: -6, rate: 0.94 },
  bright: { hpf: 210, lpf: 7600, threshold: -19, ratio: 3.4, attack: 0.002, release: 0.1, volume: -4, rate: 1.05 },
  fat: { hpf: 100, lpf: 3600, threshold: -26, ratio: 2.2, attack: 0.005, release: 0.18, volume: -5, rate: 0.9 },
}

const TOM_TONE_PRESETS = {
  standard: { file: 'tom1.mp3', rate: 1 },
  tight: { file: 'tom1.mp3', rate: 1.1 },
  deep: { file: 'tom2.mp3', rate: 0.92 },
}

const FLOOR_TOM_TONE_PRESETS = {
  standard: { file: 'tom3.mp3', rate: 1 },
  tight: { file: 'tom2.mp3', rate: 1.06 },
  deep: { file: 'tom3.mp3', rate: 0.9 },
}

const CYMBAL_TONE_PRESETS = {
  tight: { file: 'hihat.mp3', baseUrl: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/', rate: 1.12, volume: -5 },
  open: { file: 'CR78/crash.mp3', baseUrl: 'https://tonejs.github.io/audio/', rate: 1.02, volume: -3.5 },
  dark: { file: 'CR78/crash.mp3', baseUrl: 'https://tonejs.github.io/audio/', rate: 0.9, volume: -4.5 },
}

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
  const [snareTone, setSnareTone] = useState('maple')
  const [tomTone, setTomTone] = useState('standard')
  const [floorTomTone, setFloorTomTone] = useState('standard')
  const [cymbalTone, setCymbalTone] = useState('tight')
  const [kitReady, setKitReady] = useState(false)
  const [snareReady, setSnareReady] = useState(false)

  const patterns = useMemo(() => {
    return createPagePatterns(noteType, difficulty, bars, orchestration, kickSetting)
  }, [noteType, difficulty, bars, orchestration, kickSetting, refreshKey])

  const drumKitRef = useRef(null)
  const cymbalPlayerRef = useRef(null)
  const snarePlayerRef = useRef(null)
  const snareHighPassRef = useRef(null)
  const snareLowPassRef = useRef(null)
  const snareCompressorRef = useRef(null)
  const playEventIdRef = useRef(null)
  const samplesReady = kitReady && snareReady

  useEffect(() => {
    snareHighPassRef.current = new Tone.Filter(140, 'highpass')
    snareLowPassRef.current = new Tone.Filter(4700, 'lowpass')
    snareCompressorRef.current = new Tone.Compressor({
      threshold: -22,
      ratio: 3,
      attack: 0.003,
      release: 0.12,
    }).toDestination()

    snareHighPassRef.current.connect(snareLowPassRef.current)
    snareLowPassRef.current.connect(snareCompressorRef.current)

    setSnareReady(false)
    const snarePlayer = new Tone.Player({
      url: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/snare.mp3',
      fadeOut: 0.02,
      onload: () => setSnareReady(true),
    })
    snarePlayer.connect(snareHighPassRef.current)
    snarePlayerRef.current = snarePlayer

    Tone.Transport.bpm.value = bpm

    return () => {
      Tone.Transport.stop()
      Tone.Transport.cancel()
      snarePlayerRef.current?.stop()
      snarePlayerRef.current?.dispose()
      cymbalPlayerRef.current?.stop()
      cymbalPlayerRef.current?.dispose()
      snareHighPassRef.current?.dispose()
      snareLowPassRef.current?.dispose()
      snareCompressorRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    const preset = SNARE_TONE_PRESETS[snareTone]
    if (!preset) return
    if (!snarePlayerRef.current || !snareHighPassRef.current || !snareLowPassRef.current || !snareCompressorRef.current) return

    snarePlayerRef.current.playbackRate = preset.rate
    snarePlayerRef.current.volume.value = preset.volume
    snareHighPassRef.current.frequency.value = preset.hpf
    snareLowPassRef.current.frequency.value = preset.lpf
    snareCompressorRef.current.threshold.value = preset.threshold
    snareCompressorRef.current.ratio.value = preset.ratio
    snareCompressorRef.current.attack.value = preset.attack
    snareCompressorRef.current.release.value = preset.release
  }, [snareTone])

  useEffect(() => {
    const preset = TOM_TONE_PRESETS[tomTone]
    const floorPreset = FLOOR_TOM_TONE_PRESETS[floorTomTone]
    const cymbalPreset = CYMBAL_TONE_PRESETS[cymbalTone]
    if (!preset || !floorPreset || !cymbalPreset) return

    setKitReady(false)
    let cancelled = false
    let pendingLoads = 2
    const markLoaded = () => {
      if (cancelled) return
      pendingLoads -= 1
      if (pendingLoads <= 0) setKitReady(true)
    }

    if (cymbalPlayerRef.current) {
      cymbalPlayerRef.current.stop()
      cymbalPlayerRef.current.dispose()
      cymbalPlayerRef.current = null
    }

    const players = new Tone.Players(
      {
        kick: 'kick.mp3',
        tom: preset.file,
        floorTom: floorPreset.file,
        cymbal: 'hihat.mp3',
      },
      {
        baseUrl: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/',
        fadeOut: 0.03,
        onload: markLoaded,
        onerror: (error) => {
          console.error('Kit sample load failed:', error)
          markLoaded()
        },
      }
    ).toDestination()
    players.volume.value = -4
    drumKitRef.current = players

    const cymbalPlayer = new Tone.Player({
      url: `${cymbalPreset.baseUrl}${cymbalPreset.file}`,
      fadeOut: 0.08,
      onload: markLoaded,
      onerror: (error) => {
        console.error('Cymbal sample load failed, fallback to hihat:', error)
        markLoaded()
      },
    }).toDestination()
    cymbalPlayerRef.current = cymbalPlayer

    return () => {
      cancelled = true
      players.stopAll()
      players.dispose()
      cymbalPlayer.stop()
      cymbalPlayer.dispose()
    }
  }, [tomTone, floorTomTone, cymbalTone])

  useEffect(() => {
    Tone.Transport.bpm.value = bpm
  }, [bpm])

  const getStepDuration = () => {
    if (noteType === '4th') return '4n'
    if (noteType === '8th') return '8n'
    return '16n'
  }

  const handlePlay = async () => {
    if (!patterns.length || !samplesReady) return

    await Tone.start()

    const mergedPattern = patterns.reduce(
      (acc, pattern) => {
        acc.accentRow.push(...pattern.accentRow)
        acc.kickRow.push(...pattern.kickRow)
        return acc
      },
      { accentRow: [], kickRow: [] }
    )
    const { accentRow, kickRow } = mergedPattern
    if (!accentRow.length) return

    const stepDuration = getStepDuration()

    Tone.Transport.stop()
    Tone.Transport.cancel()

    let stepIndex = 0

    playEventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const accent = accentRow[stepIndex]
      const kick = kickRow[stepIndex]
      const isRightHand = stepIndex % 2 === 0

      if (kick) {
        drumKitRef.current?.player('kick')?.start(time)
      }

      if (accent === '✕') {
        const cymbalPlayer = cymbalPlayerRef.current
        if (cymbalPlayer?.loaded) {
          cymbalPlayer.playbackRate = CYMBAL_TONE_PRESETS[cymbalTone].rate
          cymbalPlayer.volume.value = CYMBAL_TONE_PRESETS[cymbalTone].volume
          cymbalPlayer.start(time)
        } else {
          const fallbackCymbal = drumKitRef.current?.player('cymbal')
          if (fallbackCymbal) {
            fallbackCymbal.playbackRate = Math.max(0.75, CYMBAL_TONE_PRESETS[cymbalTone].rate)
            fallbackCymbal.start(time)
          }
        }
      } else if (accent === '△' || accent === '▲') {
        // RLRL基準: R=フロアタム, L=タム
        const tomKey = isRightHand ? 'floorTom' : 'tom'
        const tomPlayer = drumKitRef.current?.player(tomKey)
        if (tomPlayer) {
          tomPlayer.playbackRate = isRightHand
            ? FLOOR_TOM_TONE_PRESETS[floorTomTone].rate
            : TOM_TONE_PRESETS[tomTone].rate
          tomPlayer.start(time)
        }
      } else if (accent === '＜') {
        snarePlayerRef.current?.start(time, 0, undefined, 1)
      } else if (accent) {
        snarePlayerRef.current?.start(time, 0, undefined, 0.85)
      } else {
        snarePlayerRef.current?.start(time, 0, undefined, 0.62)
      }

      stepIndex += 1

      if (stepIndex >= accentRow.length) {
        Tone.Transport.stop()
        Tone.Transport.cancel()
        playEventIdRef.current = null
        setIsPlaying(false)
      }
    }, stepDuration)

    Tone.Transport.start()
    setIsPlaying(true)
  }

  const handleStop = () => {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    playEventIdRef.current = null
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

        <div className="control-item">
          <label>スネア音色</label>
          <select value={snareTone} onChange={(e) => setSnareTone(e.target.value)}>
            {SNARE_TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>タム音色</label>
          <select value={tomTone} onChange={(e) => setTomTone(e.target.value)}>
            {TOM_TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>フロアタム音色</label>
          <select value={floorTomTone} onChange={(e) => setFloorTomTone(e.target.value)}>
            {FLOOR_TOM_TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>シンバル音色</label>
          <select value={cymbalTone} onChange={(e) => setCymbalTone(e.target.value)}>
            {CYMBAL_TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="button-row no-print">
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>生成</button>
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>再生成</button>
        <button onClick={handlePlay} disabled={isPlaying || !samplesReady}>再生</button>
        <button onClick={handleStop} disabled={!isPlaying}>停止</button>

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

          <div className="abc-section">
            <h2>SVGプレビュー</h2>
            <div className="svg-preview-list">
              {patterns.map((pattern, index) => (
                <SvgNotationPreview
                  key={`preview-${refreshKey}-${index}`}
                  pattern={pattern}
                  noteType={noteType}
                  orchestration={orchestration}
                />
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
