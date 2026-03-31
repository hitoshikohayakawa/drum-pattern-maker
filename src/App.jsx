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
  tight: { file: 'berklee/chime_1.mp3', baseUrl: 'https://tonejs.github.io/audio/', rate: 1.08, volume: -6.5 },
  open: { file: 'berklee/chime_1.mp3', baseUrl: 'https://tonejs.github.io/audio/', rate: 0.98, volume: -4.5 },
  dark: { file: 'berklee/gong_1.mp3', baseUrl: 'https://tonejs.github.io/audio/', rate: 0.9, volume: -6 },
}

const PRACTICE_MENU = [
  { value: 'accent', label: 'アクセント練習' },
  { value: 'fillin', label: 'フィルイン練習' },
]

const FILL_GROOVE_OPTIONS = [
  { value: 'random', label: 'ランダム（複数パターン）' },
  { value: 'straight', label: '基本8ビート' },
  { value: 'syncopated', label: 'シンコペ8ビート' },
  { value: 'ride', label: 'ライド8ビート' },
]

const FILL_LENGTH_OPTIONS = [
  { value: '1bar', label: '1小節フィル' },
  { value: 'half', label: '0.5小節フィル' },
  { value: 'quarter', label: '0.25小節フィル' },
]

const FILL_PATTERN_OPTIONS = [
  { value: 'basic', label: '基本パターン' },
  { value: 'random', label: 'ランダム' },
]

const FILL_BAR_COUNT_OPTIONS = [
  { value: '4', label: '4小節' },
  { value: '16', label: '16小節' },
]

const BASIC_EIGHT_BEAT_LIBRARY = {
  straight: [
    { hand: ['H', '', 'H', '', 'S', '', 'H', '', 'H', '', 'H', '', 'S', '', 'H', ''], kick: [0, 8] },
    { hand: ['H', '', 'H', '', 'S', '', 'H', '', 'H', '', 'H', '', 'S', '', 'H', ''], kick: [0, 10] },
    { hand: ['H', '', 'H', '', 'S', '', 'H', '', 'H', '', 'H', '', 'S', '', 'H', ''], kick: [0, 12] },
    { hand: ['H', '', 'H', '', 'S', '', 'H', '', 'H', '', 'H', '', 'S', '', 'H', ''], kick: [2, 8] },
  ],
  syncopated: [
    { hand: ['H', '', 'H', '', 'S', '', 'H', '', 'H', '', 'H', '', 'S', '', 'H', ''], kick: [0, 6, 10] },
    { hand: ['H', '', 'H', '', 'S', '', 'H', '', 'H', '', 'H', '', 'S', '', 'H', ''], kick: [0, 7, 12] },
    { hand: ['H', '', 'H', '', 'S', '', 'H', '', 'H', '', 'H', '', 'S', '', 'H', ''], kick: [0, 9, 14] },
  ],
  ride: [
    { hand: ['R', '', 'R', '', 'S', '', 'R', '', 'R', '', 'R', '', 'S', '', 'R', ''], kick: [0, 8] },
    { hand: ['R', '', 'R', '', 'S', '', 'R', '', 'R', '', 'R', '', 'S', '', 'R', ''], kick: [0, 10] },
    { hand: ['R', '', 'R', '', 'S', '', 'R', '', 'R', '', 'R', '', 'S', '', 'R', ''], kick: [2, 8] },
  ],
}

const ONE_BAR_FILLS = [
  {
    name: 'Snare 16th Burst',
    hand: ['S', 'S', 'S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'M', 'T', 'S', 'S', 'F', 'C'],
    kick: [0, 8, 15],
  },
  {
    name: 'Classic Around Toms',
    hand: ['S', '', 'T', '', 'M', '', 'F', '', 'T', '', 'M', '', 'F', 'F', 'S', 'C'],
    kick: [0, 7, 14, 15],
  },
  {
    name: 'Linear Funk Fill',
    hand: ['S', '', 'H', 'S', '', 'T', '', 'M', '', 'S', 'H', '', 'F', '', 'S', 'C'],
    kick: [2, 6, 10, 14],
  },
  {
    name: 'Triplet-ish Motion',
    hand: ['S', 'S', '', 'T', 'T', '', 'M', 'M', '', 'F', 'F', '', 'S', 'S', 'F', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Descending Sweep',
    hand: ['S', '', 'S', '', 'T', '', 'T', '', 'M', '', 'M', '', 'F', 'F', 'S', 'C'],
    kick: [0, 6, 10, 15],
  },
  {
    name: 'Linear Drop',
    hand: ['S', '', 'H', '', 'T', '', 'S', '', 'M', '', 'H', '', 'F', '', 'S', 'C'],
    kick: [1, 5, 9, 13, 15],
  },
  {
    name: 'Tom Roll Ending',
    hand: ['T', 'T', 'M', 'M', 'F', 'F', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'F', 'C'],
    kick: [0, 8, 14, 15],
  },
  {
    name: 'Snare To Crash',
    hand: ['S', '', 'S', 'S', 'S', '', 'T', '', 'M', '', 'F', '', 'S', 'S', 'S', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Gallop Around Kit',
    hand: ['S', 'T', '', 'M', 'F', '', 'T', 'M', '', 'F', 'S', '', 'T', 'F', 'S', 'C'],
    kick: [0, 3, 6, 9, 12, 15],
  },
  {
    name: 'Backbeat Release',
    hand: ['S', '', 'H', '', 'S', '', 'T', '', 'M', '', 'F', '', 'S', '', 'S', 'C'],
    kick: [0, 7, 11, 15],
  },
  {
    name: 'Eight Stroke Around',
    hand: ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'T', 'T', 'M', 'F', 'S', 'C'],
    kick: [0, 8, 14, 15],
  },
  {
    name: 'Single Stroke Down',
    hand: ['S', '', 'T', '', 'M', '', 'F', '', 'S', '', 'T', '', 'M', '', 'F', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Paradiddle Color',
    hand: ['S', 'T', 'S', 'S', 'M', 'F', 'M', 'M', 'S', 'T', 'S', 'S', 'F', 'M', 'S', 'C'],
    kick: [0, 6, 10, 15],
  },
  {
    name: 'Two Voice Answer',
    hand: ['S', '', 'S', '', 'T', 'M', 'F', '', 'S', '', 'T', '', 'M', 'F', 'S', 'C'],
    kick: [1, 5, 9, 13, 15],
  },
  {
    name: 'Late Bar Push',
    hand: ['S', '', 'H', '', 'S', '', 'H', '', 'T', '', 'M', '', 'F', 'S', 'S', 'C'],
    kick: [0, 8, 12, 14, 15],
  },
  {
    name: 'Tom Cascade',
    hand: ['T', '', 'T', '', 'M', '', 'M', '', 'F', '', 'F', '', 'T', 'M', 'F', 'C'],
    kick: [0, 6, 10, 15],
  },
  {
    name: 'Snare Burst Resolve',
    hand: ['S', 'S', 'S', '', 'S', 'S', 'T', '', 'M', 'M', 'F', '', 'S', 'S', 'S', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Linear Trip Builder',
    hand: ['S', '', 'T', 'S', '', 'M', 'S', '', 'F', 'S', '', 'T', 'M', '', 'S', 'C'],
    kick: [1, 5, 9, 13, 15],
  },
]

const BASIC_ONE_BAR_FILLS = [
  ONE_BAR_FILLS[0],
  ONE_BAR_FILLS[1],
  ONE_BAR_FILLS[4],
  ONE_BAR_FILLS[6],
  ONE_BAR_FILLS[7],
  ONE_BAR_FILLS[10],
]

const HALF_BAR_FILLS = [
  { name: 'Half Snare Burst', hand: ['S', 'S', 'T', 'T', 'M', 'F', 'S', 'C'], kick: [0, 6, 7] },
  { name: 'Half Around Toms', hand: ['T', '', 'M', '', 'F', '', 'S', 'C'], kick: [0, 4, 7] },
  { name: 'Half Linear', hand: ['S', '', 'T', 'S', 'M', '', 'F', 'C'], kick: [1, 5, 7] },
  { name: 'Half Descend', hand: ['S', 'T', 'M', 'F', 'T', 'M', 'S', 'C'], kick: [0, 4, 7] },
  { name: 'Half Flam-ish', hand: ['S', '', 'S', 'T', 'M', 'F', 'S', 'C'], kick: [1, 6, 7] },
  { name: 'Half Push Fill', hand: ['T', '', 'T', 'M', 'F', '', 'S', 'C'], kick: [0, 3, 7] },
  { name: 'Half Snare Roll', hand: ['S', 'S', 'S', 'S', 'T', 'M', 'F', 'C'], kick: [0, 5, 7] },
  { name: 'Half Kit Answer', hand: ['S', 'T', '', 'M', '', 'F', 'S', 'C'], kick: [0, 2, 6, 7] },
  { name: 'Half Descend Burst', hand: ['S', 'T', 'M', 'F', 'S', 'T', 'F', 'C'], kick: [0, 4, 7] },
  { name: 'Half Double Stroke', hand: ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'C'], kick: [0, 6, 7] },
  { name: 'Half Syncopated Answer', hand: ['S', '', 'T', 'M', '', 'F', 'S', 'C'], kick: [1, 3, 6, 7] },
  { name: 'Half Floor Resolve', hand: ['T', 'M', 'F', 'F', 'S', '', 'S', 'C'], kick: [0, 4, 7] },
  { name: 'Half RL Accent', hand: ['S', 'T', 'S', 'M', 'S', 'F', 'S', 'C'], kick: [1, 5, 7] },
  { name: 'Half Late Crash', hand: ['S', '', 'S', '', 'T', 'M', 'F', 'C'], kick: [0, 5, 7] },
  { name: 'Half Five Stroke Flavor', hand: ['S', 'S', 'S', 'S', 'T', 'M', 'S', 'C'], kick: [0, 4, 7] },
]

const BASIC_HALF_BAR_FILLS = [
  HALF_BAR_FILLS[0],
  HALF_BAR_FILLS[1],
  HALF_BAR_FILLS[3],
  HALF_BAR_FILLS[8],
  HALF_BAR_FILLS[11],
  HALF_BAR_FILLS[13],
]

const QUARTER_BAR_FILLS = [
  { name: 'Quarter Pickup', hand: ['T', 'M', 'F', 'C'], kick: [0, 3] },
  { name: 'Quarter Snap', hand: ['S', 'S', 'F', 'C'], kick: [1, 3] },
  { name: 'Quarter Flam-ish', hand: ['S', 'T', 'S', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Descend', hand: ['T', 'M', 'S', 'C'], kick: [0, 3] },
  { name: 'Quarter Burst', hand: ['S', 'S', 'S', 'C'], kick: [1, 3] },
  { name: 'Quarter Floor Lead', hand: ['F', 'F', 'S', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Tom Answer', hand: ['T', 'S', 'F', 'C'], kick: [1, 3] },
  { name: 'Quarter Single Sweep', hand: ['S', 'T', 'M', 'C'], kick: [0, 3] },
  { name: 'Quarter Trip Push', hand: ['S', 'M', 'F', 'C'], kick: [1, 3] },
  { name: 'Quarter Buzz Feel', hand: ['S', 'S', 'T', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Low Resolve', hand: ['M', 'F', 'S', 'C'], kick: [0, 3] },
  { name: 'Quarter Accent Drop', hand: ['T', 'F', 'S', 'C'], kick: [1, 3] },
  { name: 'Quarter Reverse Answer', hand: ['F', 'M', 'S', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Tight Pop', hand: ['S', 'T', 'S', 'C'], kick: [1, 3] },
]

const BASIC_QUARTER_BAR_FILLS = [
  QUARTER_BAR_FILLS[0],
  QUARTER_BAR_FILLS[1],
  QUARTER_BAR_FILLS[3],
  QUARTER_BAR_FILLS[5],
  QUARTER_BAR_FILLS[6],
  QUARTER_BAR_FILLS[8],
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

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function createBarFromGroove(groove) {
  const accentRow = Array(16).fill('')
  const kickRow = Array(16).fill('')
  groove.hand.forEach((symbol, index) => {
    accentRow[index] = symbol || ''
  })
  groove.kick.forEach((index) => {
    if (index >= 0 && index < 16) kickRow[index] = '●'
  })
  return { accentRow, kickRow }
}

function applySectionAtStep(accentRow, kickRow, startStep, section) {
  section.hand.forEach((symbol, i) => {
    accentRow[startStep + i] = symbol || ''
  })
  section.kick.forEach((index) => {
    const target = startStep + index
    if (target >= 0 && target < kickRow.length) kickRow[target] = '●'
  })
}

function applyFillToBars(accentRow, kickRow, startBar, fill) {
  const start = startBar * 16
  fill.hand.forEach((symbol, i) => {
    accentRow[start + i] = symbol || ''
  })
  fill.kick.forEach((index) => {
    const target = start + index
    if (target >= 0 && target < kickRow.length) kickRow[target] = '●'
  })
}

function getFillLibrary(fillLengthMode, fillPatternMode) {
  if (fillLengthMode === '1bar') {
    return fillPatternMode === 'basic' ? BASIC_ONE_BAR_FILLS : ONE_BAR_FILLS
  }
  if (fillLengthMode === 'half') {
    return fillPatternMode === 'basic' ? BASIC_HALF_BAR_FILLS : HALF_BAR_FILLS
  }
  return fillPatternMode === 'basic' ? BASIC_QUARTER_BAR_FILLS : QUARTER_BAR_FILLS
}

function createSingleFillPhrase(grooveKey, fillLengthMode, fillPatternMode) {
  const groovePool = (() => {
    if (grooveKey === 'random') {
      return [
        ...BASIC_EIGHT_BEAT_LIBRARY.straight,
        ...BASIC_EIGHT_BEAT_LIBRARY.syncopated,
        ...BASIC_EIGHT_BEAT_LIBRARY.ride,
      ]
    }
    return BASIC_EIGHT_BEAT_LIBRARY[grooveKey] || BASIC_EIGHT_BEAT_LIBRARY.straight
  })()
  const selectedGroove = randomPick(groovePool)
  const fillPool = getFillLibrary(fillLengthMode, fillPatternMode)

  const accentRow = Array(64).fill('')
  const kickRow = Array(64).fill('')

  for (let bar = 0; bar < 4; bar += 1) {
    const grooveBar = createBarFromGroove(selectedGroove)
    for (let i = 0; i < 16; i += 1) {
      const step = bar * 16 + i
      accentRow[step] = grooveBar.accentRow[i]
      kickRow[step] = grooveBar.kickRow[i]
    }
  }

  if (fillLengthMode === '1bar') {
    const fill = randomPick(fillPool)
    applyFillToBars(accentRow, kickRow, 3, fill)
  } else if (fillLengthMode === 'half') {
    const fill = randomPick(fillPool)
    applySectionAtStep(accentRow, kickRow, 56, fill)
  } else if (fillLengthMode === 'quarter') {
    const fill = randomPick(fillPool)
    applySectionAtStep(accentRow, kickRow, 60, fill)
  }

  return {
    accentRow,
    kickRow,
    stepsPerBar: 16,
    totalSteps: 64,
  }
}

function createFillInPracticePatterns(grooveKey, fillLengthMode, fillPatternMode, barCount) {
  const phraseCount = Math.max(1, Number(barCount) / 4)
  return Array.from({ length: phraseCount }, () =>
    createSingleFillPhrase(grooveKey, fillLengthMode, fillPatternMode)
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
  const [practiceMode, setPracticeMode] = useState('accent')
  const [noteType, setNoteType] = useState('8th')
  const [difficulty, setDifficulty] = useState('easy')
  const [bars, setBars] = useState('2')
  const [orchestration, setOrchestration] = useState('none')
  const [kickSetting, setKickSetting] = useState('2')
  const [fillGroove, setFillGroove] = useState('random')
  const [fillLengthMode, setFillLengthMode] = useState('1bar')
  const [fillPatternMode, setFillPatternMode] = useState('basic')
  const [fillBarCount, setFillBarCount] = useState('4')
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
  const fillPatterns = useMemo(() => {
    return createFillInPracticePatterns(fillGroove, fillLengthMode, fillPatternMode, fillBarCount)
  }, [fillGroove, fillLengthMode, fillPatternMode, fillBarCount, refreshKey])

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
        ride: 'hihat.mp3',
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
    if (!samplesReady) return

    await Tone.start()

    const mergedPattern =
      practiceMode === 'fillin'
        ? fillPatterns.reduce(
          (acc, pattern) => {
            acc.accentRow.push(...pattern.accentRow)
            acc.kickRow.push(...pattern.kickRow)
            return acc
          },
          { accentRow: [], kickRow: [] }
        )
        : patterns.reduce(
          (acc, pattern) => {
            acc.accentRow.push(...pattern.accentRow)
            acc.kickRow.push(...pattern.kickRow)
            return acc
          },
          { accentRow: [], kickRow: [] }
        )
    const { accentRow, kickRow } = mergedPattern
    if (!accentRow.length) return

    const stepDuration = practiceMode === 'fillin' ? '16n' : getStepDuration()

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
      } else if (accent === 'H') {
        const hihat = drumKitRef.current?.player('cymbal')
        if (hihat) {
          hihat.playbackRate = 1.08
          hihat.volume.value = -7
          hihat.start(time)
        }
      } else if (accent === 'C') {
        const crash = cymbalPlayerRef.current
        if (crash?.loaded) {
          crash.playbackRate = CYMBAL_TONE_PRESETS[cymbalTone].rate
          crash.volume.value = CYMBAL_TONE_PRESETS[cymbalTone].volume
          crash.start(time)
        }
      } else if (accent === 'R') {
        const ride = drumKitRef.current?.player('ride') || drumKitRef.current?.player('cymbal')
        if (ride) {
          ride.playbackRate = 1
          ride.volume.value = -8
          ride.start(time)
        }
      } else if (accent === 'T' || accent === 'M' || accent === 'F') {
        const isFloor = accent === 'F'
        const key = isFloor ? 'floorTom' : 'tom'
        const tomPlayer = drumKitRef.current?.player(key)
        if (tomPlayer) {
          if (isFloor) {
            tomPlayer.playbackRate = FLOOR_TOM_TONE_PRESETS[floorTomTone].rate
          } else if (accent === 'M') {
            tomPlayer.playbackRate = TOM_TONE_PRESETS[tomTone].rate * 0.96
          } else {
            tomPlayer.playbackRate = TOM_TONE_PRESETS[tomTone].rate * 1.12
          }
          tomPlayer.start(time)
        }
      } else if (accent === 'S') {
        snarePlayerRef.current?.start(time, 0, undefined, 0.86)
      } else if (accent === '＜') {
        snarePlayerRef.current?.start(time, 0, undefined, 1)
      } else if (accent) {
        snarePlayerRef.current?.start(time, 0, undefined, 0.85)
      } else {
        if (practiceMode === 'accent') {
          // アクセント練習は下段の連打表現に合わせてゴーストを鳴らす
          snarePlayerRef.current?.start(time, 0, undefined, 0.62)
        }
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
        <nav className="practice-nav no-print">
          {PRACTICE_MENU.map((item) => (
            <button
              key={item.value}
              className={`practice-tab ${practiceMode === item.value ? 'is-active' : ''}`}
              onClick={() => setPracticeMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="control-panel no-print">
        {practiceMode === 'accent' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="control-item">
              <label>基本8ビート</label>
              <select value={fillGroove} onChange={(e) => setFillGroove(e.target.value)}>
                {FILL_GROOVE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="control-item">
              <label>フィル長</label>
              <select value={fillLengthMode} onChange={(e) => setFillLengthMode(e.target.value)}>
                {FILL_LENGTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="control-item">
              <label>フィルパターン</label>
              <select value={fillPatternMode} onChange={(e) => setFillPatternMode(e.target.value)}>
                {FILL_PATTERN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="control-item">
              <label>生成小節数</label>
              <select value={fillBarCount} onChange={(e) => setFillBarCount(e.target.value)}>
                {FILL_BAR_COUNT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="control-item">
              <label>固定表示</label>
              <select value={fillBarCount} disabled>
                <option value={fillBarCount}>{fillBarCount}小節固定</option>
              </select>
            </div>
          </>
        )}

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
            {practiceMode === 'accent' ? (
              <>
                <div>音符: {NOTE_OPTIONS.find((item) => item.value === noteType)?.label}</div>
                <div>難易度: {DIFFICULTY_OPTIONS.find((item) => item.value === difficulty)?.label}</div>
                <div>固定小節: {BAR_OPTIONS.find((item) => item.value === bars)?.label}</div>
                <div>構成: {ORCHESTRATION_OPTIONS.find((item) => item.value === orchestration)?.label}</div>
                <div>キック: {KICK_OPTIONS.find((item) => item.value === kickSetting)?.label}</div>
              </>
            ) : (
              <>
                <div>モード: フィルイン練習</div>
                <div>基本ビート: {FILL_GROOVE_OPTIONS.find((item) => item.value === fillGroove)?.label}</div>
                <div>フィル長: {FILL_LENGTH_OPTIONS.find((item) => item.value === fillLengthMode)?.label}</div>
                <div>フィルパターン: {FILL_PATTERN_OPTIONS.find((item) => item.value === fillPatternMode)?.label}</div>
                <div>表示: {fillBarCount}小節固定</div>
              </>
            )}
          </div>

          <div className="abc-section">
            <h2>SVGプレビュー</h2>
            <div className="svg-preview-list">
              {practiceMode === 'accent' ? (
                patterns.map((pattern, index) => (
                  <SvgNotationPreview
                    key={`preview-${refreshKey}-${index}`}
                    pattern={pattern}
                    noteType={noteType}
                    orchestration={orchestration}
                    mode="accent"
                    showAccentMarks
                  />
                ))
              ) : (
                fillPatterns.map((pattern, index) => (
                  <SvgNotationPreview
                    key={`fill-preview-${refreshKey}-${index}`}
                    pattern={pattern}
                    noteType="16th"
                    orchestration="tomCymbal"
                    mode="fillin"
                    showAccentMarks={false}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
