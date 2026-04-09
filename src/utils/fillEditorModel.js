import {
  canonicalToLegacyFillSteps,
  canonicalToNotationView,
  canonicalToPlaybackSequence,
  legacyFillStepsToCanonical,
  legacyNotationPatternToCanonical,
  parseCanonicalPatternJson,
} from './canonicalRhythm.js'

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
  { value: '8th_triplet', label: '8分3連' },
  { value: '16th_triplet', label: '16分3連' },
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
  if (resolution === '8th_triplet') return 12
  if (resolution === '16th_triplet') return 24
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
    ghost: false,
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
      ghost: Boolean(step.ghost),
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
        : { ...step, isRest: true, instruments: [], accent: false, ghost: false }
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

export function toggleGhostInFillSteps(steps, stepIndex) {
  return steps.map((step) => (
    step.index === stepIndex
      ? { ...step, ghost: step.isRest ? false : !step.ghost }
      : step
  ))
}

export function buildNotationPatternFromFillSteps(
  steps,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  return canonicalToNotationView(
    legacyFillStepsToCanonical(steps, fillLengthType, resolution)
  )
}

export function buildPlaybackSequenceFromFillSteps(
  steps,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  return canonicalToPlaybackSequence(
    legacyFillStepsToCanonical(steps, fillLengthType, resolution)
  )
}

export function buildFillPhraseFromStoredPattern(patternRecord) {
  const fillLengthType = patternRecord?.fill_length_type || 'full_bar'
  const resolution = patternRecord?.resolution || '16th'

  const notationPattern = buildNotationPatternFromStoredPatternRecord(
    patternRecord,
    fillLengthType,
    resolution
  )
  const totalSteps = notationPattern.totalSteps || getTotalSteps(fillLengthType, resolution)
  const accentRow = Array.from({ length: totalSteps }, (_, index) => notationPattern.accentRow?.[index] || '')
  const kickRow = Array.from({ length: totalSteps }, (_, index) => notationPattern.kickRow?.[index] || '')
  const restMarks = Array.from({ length: totalSteps }, (_, index) => Boolean(notationPattern.restMarks?.[index]))

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
  let globalIndexOffset = 0

  return patterns.flatMap((pattern) => {
    const canonicalPattern = legacyNotationPatternToCanonical(pattern, {
      patternKind: practiceMode === 'fillin' ? 'fill' : 'exercise',
      isAccentExercise: practiceMode === 'accent',
      fillLengthType: 'full_bar',
    })

    const playbackSequence = canonicalToPlaybackSequence(canonicalPattern)
    const offsetSequence = playbackSequence.map((step) => ({
      ...step,
      index: step.index + globalIndexOffset,
    }))

    globalIndexOffset += playbackSequence.length
    return offsetSequence
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

export function buildCanonicalPatternFromFillSteps(
  steps,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  return legacyFillStepsToCanonical(steps, fillLengthType, resolution)
}

export function buildPatternJsonFromFillSteps(
  steps,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  return buildCanonicalPatternFromFillSteps(steps, fillLengthType, resolution)
}

export function buildCanonicalPatternFromStoredPatternRecord(
  patternRecord,
  fallbackFillLengthType = 'full_bar',
  fallbackResolution = '16th',
) {
  const fillLengthType = patternRecord?.fill_length_type || fallbackFillLengthType
  const resolution = patternRecord?.resolution || fallbackResolution
  const canonicalPattern = parseCanonicalPatternJson(patternRecord?.pattern_json)

  if (canonicalPattern?.events) {
    return canonicalPattern
  }

  return buildCanonicalPatternFromFillSteps(
    parseStoredStepsJson(patternRecord?.steps_json, fillLengthType, resolution),
    fillLengthType,
    resolution
  )
}

export function parseStoredPatternRecordToFillSteps(
  patternRecord,
  fallbackFillLengthType = 'full_bar',
  fallbackResolution = '16th',
) {
  const fillLengthType = patternRecord?.fill_length_type || fallbackFillLengthType
  const resolution = patternRecord?.resolution || fallbackResolution
  const canonicalPattern = buildCanonicalPatternFromStoredPatternRecord(
    patternRecord,
    fillLengthType,
    resolution
  )

  return normalizeFillSteps(
    canonicalToLegacyFillSteps(canonicalPattern),
    fillLengthType,
    resolution
  )
}

export function buildNotationPatternFromStoredPatternRecord(
  patternRecord,
  fallbackFillLengthType = 'full_bar',
  fallbackResolution = '16th',
) {
  const fillLengthType = patternRecord?.fill_length_type || fallbackFillLengthType
  const resolution = patternRecord?.resolution || fallbackResolution
  return canonicalToNotationView(
    buildCanonicalPatternFromStoredPatternRecord(
      patternRecord,
      fillLengthType,
      resolution
    )
  )
}

export function buildPlaybackSequenceFromStoredPatternRecord(
  patternRecord,
  fallbackFillLengthType = 'full_bar',
  fallbackResolution = '16th',
) {
  const fillLengthType = patternRecord?.fill_length_type || fallbackFillLengthType
  const resolution = patternRecord?.resolution || fallbackResolution
  return canonicalToPlaybackSequence(
    buildCanonicalPatternFromStoredPatternRecord(
      patternRecord,
      fillLengthType,
      resolution
    )
  )
}

export function buildNotationPatternFromPracticePattern(
  pattern,
  practiceMode,
) {
  return canonicalToNotationView(
    buildCanonicalPatternFromPracticePattern(pattern, practiceMode)
  )
}

export function buildCanonicalPatternFromPracticePattern(
  pattern,
  practiceMode,
) {
  return legacyNotationPatternToCanonical(pattern, {
    patternKind: practiceMode === 'fillin' ? 'fill' : 'exercise',
    isAccentExercise: practiceMode === 'accent',
    fillLengthType: 'full_bar',
  })
}

export function buildNotationPatternsFromCanonicalPatterns(patterns = []) {
  return patterns.map((pattern) => canonicalToNotationView(pattern))
}

export function buildPlaybackSequenceFromCanonicalPatterns(patterns = []) {
  let globalIndexOffset = 0
  let globalTickOffset = 0

  return patterns.flatMap((pattern) => {
    const playbackSequence = canonicalToPlaybackSequence(pattern)
    const offsetSequence = playbackSequence.map((step) => ({
      ...step,
      index: step.index + globalIndexOffset,
      startTick: step.startTick + globalTickOffset,
    }))

    globalIndexOffset += playbackSequence.length
    globalTickOffset += pattern?.totalTicks || 0
    return offsetSequence
  })
}
