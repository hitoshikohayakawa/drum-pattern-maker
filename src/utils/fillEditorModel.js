const TOKEN_BY_INSTRUMENT = {
  hihat_close: 'H',
  hihat_open: 'O',
  ride: 'R',
  crash: 'C',
  snare: 'S',
  hi_tom: 'T',
  mid_tom: 'M',
  low_tom: 'L',
  floor_tom: 'F',
}

export const FILL_RESOLUTION_OPTIONS = [
  { value: '16th', label: '16分固定' },
  { value: '32nd', label: '32分固定' },
]

export const FILL_LENGTH_OPTIONS = [
  { value: 'full_bar', label: '1小節' },
  { value: 'half_bar', label: '0.5小節' },
  { value: 'quarter_bar', label: '0.25小節' },
]

const INSTRUMENT_BY_TOKEN = Object.entries(TOKEN_BY_INSTRUMENT).reduce((acc, [instrument, token]) => {
  acc[token] = instrument
  return acc
}, {})

export const FILL_LENGTH_CONFIG = {
  full_bar: { label: '1小節', barFraction: 1 },
  half_bar: { label: '0.5小節', barFraction: 0.5 },
  quarter_bar: { label: '0.25小節', barFraction: 0.25 },
}

export const FILL_EDITOR_INSTRUMENTS = [
  { id: 'rest', label: 'Rest', lane: 'rest' },
  { id: 'hihat_close', label: 'HH Close', lane: 'cymbal' },
  { id: 'hihat_open', label: 'HH Open', lane: 'cymbal' },
  { id: 'ride', label: 'Ride', lane: 'cymbal' },
  { id: 'crash', label: 'Crash', lane: 'cymbal' },
  { id: 'snare', label: 'Snare', lane: 'drum' },
  { id: 'hi_tom', label: 'Hi Tom', lane: 'drum' },
  { id: 'mid_tom', label: 'Mid Tom', lane: 'drum' },
  { id: 'low_tom', label: 'Low Tom', lane: 'drum' },
  { id: 'floor_tom', label: 'Floor Tom', lane: 'drum' },
  { id: 'bass_drum', label: 'Bass Drum', lane: 'kick' },
]

export function getStepsPerBarForResolution(resolution = '16th') {
  return resolution === '32nd' ? 32 : 16
}

export function getTotalSteps(fillLengthType = 'full_bar', resolution = '16th') {
  const lengthConfig = FILL_LENGTH_CONFIG[fillLengthType] || FILL_LENGTH_CONFIG.full_bar
  return Math.max(1, Math.round(getStepsPerBarForResolution(resolution) * lengthConfig.barFraction))
}

export function createEmptyFillSteps(fillLengthType = 'full_bar', resolution = '16th') {
  const totalSteps = getTotalSteps(fillLengthType, resolution)
  return Array.from({ length: totalSteps }, (_, index) => ({
    index,
    instruments: [],
    accent: false,
    isRest: false,
  }))
}

export function normalizeFillSteps(rawSteps, fillLengthType = 'full_bar', resolution = '16th') {
  const totalSteps = getTotalSteps(fillLengthType, resolution)
  const base = createEmptyFillSteps(fillLengthType, resolution)
  if (!Array.isArray(rawSteps)) return base

  rawSteps.forEach((step) => {
    if (typeof step?.index !== 'number') return
    if (step.index < 0 || step.index >= totalSteps) return
    base[step.index] = {
      index: step.index,
      instruments: Array.isArray(step.instruments)
        ? step.instruments.filter((instrument) => instrument === 'bass_drum' || TOKEN_BY_INSTRUMENT[instrument])
        : [],
      accent: Boolean(step.accent),
      isRest: Boolean(step.isRest || step.instruments?.includes('rest')),
    }
  })

  return base
}

export function toggleInstrumentInFillSteps(steps, stepIndex, instrumentId) {
  return steps.map((step) => {
    if (step.index !== stepIndex) return step

    if (instrumentId === 'rest') {
      return step.isRest
        ? { ...step, isRest: false }
        : { ...step, isRest: true, instruments: [], accent: false }
    }

    const exists = step.instruments.includes(instrumentId)
    return {
      ...step,
      isRest: false,
      instruments: exists
        ? step.instruments.filter((instrument) => instrument !== instrumentId)
        : [...step.instruments, instrumentId],
    }
  })
}

export function toggleAccentInFillSteps(steps, stepIndex) {
  return steps.map((step) => (
    step.index === stepIndex
      ? { ...step, accent: step.isRest ? false : !step.accent }
      : step
  ))
}

export function buildNotationPatternFromFillSteps(
  steps,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  const totalSteps = getTotalSteps(fillLengthType, resolution)
  const normalized = normalizeFillSteps(steps, fillLengthType, resolution)
  const accentRow = Array(totalSteps).fill('')
  const kickRow = Array(totalSteps).fill('')
  const accentMarks = Array(totalSteps).fill(false)
  const restMarks = Array(totalSteps).fill(false)

  normalized.forEach((step) => {
    if (step.isRest) {
      restMarks[step.index] = true
      return
    }

    const upperTokens = step.instruments
      .filter((instrument) => instrument !== 'bass_drum')
      .map((instrument) => TOKEN_BY_INSTRUMENT[instrument])
      .filter(Boolean)

    accentRow[step.index] = [...new Set(upperTokens)].join('')
    kickRow[step.index] = step.instruments.includes('bass_drum') ? '●' : ''
    accentMarks[step.index] = step.accent
  })

  return {
    accentRow,
    kickRow,
    accentMarks,
    restMarks,
    resolution,
    stepsPerBar: getStepsPerBarForResolution(resolution),
    totalSteps,
  }
}

export function buildPlaybackSequenceFromFillSteps(
  steps,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  const normalized = normalizeFillSteps(steps, fillLengthType, resolution)

  return normalized.map((step) => ({
    index: step.index,
    instruments: step.isRest ? [] : [...step.instruments],
    accent: step.isRest ? false : step.accent,
    isRest: step.isRest,
  }))
}

export function buildFillPhraseFromStoredPattern(patternRecord) {
  const fillLengthType = patternRecord?.fill_length_type || 'full_bar'
  const resolution = patternRecord?.resolution || '16th'
  if (resolution !== '16th') return null

  const totalSteps = getTotalSteps(fillLengthType, resolution)
  const normalized = parseStoredStepsJson(patternRecord?.steps_json, fillLengthType, resolution)
  const accentRow = Array(totalSteps).fill('')
  const kickRow = Array(totalSteps).fill('')
  const restMarks = Array(totalSteps).fill(false)

  normalized.forEach((step) => {
    if (step.isRest) {
      restMarks[step.index] = true
      return
    }
    const upperTokens = step.instruments
      .filter((instrument) => instrument !== 'bass_drum')
      .map((instrument) => TOKEN_BY_INSTRUMENT[instrument])
      .filter(Boolean)

    accentRow[step.index] = [...new Set(upperTokens)].join('')
    if (step.instruments.includes('bass_drum')) {
      kickRow[step.index] = '●'
    }
  })

  return {
    hand: accentRow,
    kick: kickRow.map((value, index) => (value === '●' ? index : -1)).filter((index) => index >= 0),
    rest: restMarks.map((value, index) => (value ? index : -1)).filter((index) => index >= 0),
    resolve: 'nextCrash',
    source: 'user',
    fill_length_type: fillLengthType,
  }
}

export function buildSequenceFromPracticePatterns(patterns, practiceMode) {
  const mergedAccentRow = []
  const mergedKickRow = []
  const mergedAccentMarks = []

  patterns.forEach((pattern) => {
    mergedAccentRow.push(...(pattern.accentRow || []))
    mergedKickRow.push(...(pattern.kickRow || []))
    if (Array.isArray(pattern.accentMarks)) {
      mergedAccentMarks.push(...pattern.accentMarks)
    } else {
      mergedAccentMarks.push(...Array(pattern.totalSteps || pattern.accentRow?.length || 0).fill(false))
    }
  })

  return mergedAccentRow.map((symbol, index) => {
    const instruments = []
    const upper = String(symbol || '')
    const kick = String(mergedKickRow[index] || '')
    const accent = Boolean(mergedAccentMarks[index] || upper.includes('＜') || (practiceMode === 'accent' && upper))

    if (practiceMode === 'accent') {
      if (upper.includes('✕') || upper.includes('C')) instruments.push('crash')
      if (upper.includes('△') || upper.includes('▲')) {
        instruments.push(index % 2 === 0 ? 'floor_tom' : 'hi_tom')
      }
      if (!upper) {
        instruments.push('ghost_snare')
      } else if (!instruments.includes('snare')) {
        instruments.push('snare')
      }
    } else {
      Object.entries(INSTRUMENT_BY_TOKEN).forEach(([token, instrument]) => {
        if (upper.includes(token)) instruments.push(instrument)
      })
      if ((upper.includes('△') || upper.includes('▲')) && !instruments.includes('floor_tom')) {
        instruments.push(index % 2 === 0 ? 'floor_tom' : 'hi_tom')
      }
    }

    if (kick.includes('●')) instruments.push('bass_drum')

    return {
      index,
      instruments: [...new Set(instruments)],
      accent,
    }
  })
}

export function parseStoredStepsJson(
  value,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  if (Array.isArray(value)) {
    return normalizeFillSteps(value, fillLengthType, resolution)
  }

  if (typeof value !== 'string') {
    return createEmptyFillSteps(fillLengthType, resolution)
  }

  try {
    return normalizeFillSteps(JSON.parse(value), fillLengthType, resolution)
  } catch {
    return createEmptyFillSteps(fillLengthType, resolution)
  }
}
