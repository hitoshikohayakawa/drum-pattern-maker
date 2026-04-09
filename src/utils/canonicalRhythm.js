import {
  DPM_INSTRUMENTS,
  NOTATION_TOKEN_BY_INSTRUMENT,
  createCanonicalPattern,
  getGridProfile,
  getTotalStepsForProfile,
  resolutionFromGridProfile,
} from '../constants/rhythmSchema.js'

const FILL_INSTRUMENTS = new Set(DPM_INSTRUMENTS)

const LEGACY_TOKEN_TO_NOTES = Object.freeze({
  H: [{ instrument: 'hihat_close' }],
  O: [{ instrument: 'hihat_open', modifiers: { open: true } }],
  P: [{ instrument: 'foot_hihat' }],
  R: [{ instrument: 'ride' }],
  C: [{ instrument: 'crash' }],
  S: [{ instrument: 'snare' }],
  T: [{ instrument: 'hi_tom' }],
  M: [{ instrument: 'mid_tom' }],
  L: [{ instrument: 'low_tom' }],
  F: [{ instrument: 'floor_tom' }],
  '✕': [{ instrument: 'crash', modifiers: { accent: true } }, { instrument: 'snare', modifiers: { accent: true } }],
  '＜': [{ instrument: 'snare', modifiers: { accent: true } }],
  '△': [{ instrument: 'floor_tom', modifiers: { accent: true } }, { instrument: 'snare', modifiers: { accent: true } }],
  '▲': [{ instrument: 'floor_tom', modifiers: { accent: true } }, { instrument: 'snare', modifiers: { accent: true } }],
})

function makeEventId(prefix, index) {
  return `${prefix}-${index}`
}

function normalizeNote(note) {
  if (!note?.instrument || !FILL_INSTRUMENTS.has(note.instrument)) return null

  const modifiers = {}
  if (note.modifiers?.accent) modifiers.accent = true
  if (note.modifiers?.ghost) modifiers.ghost = true
  if (note.modifiers?.open) modifiers.open = true

  return {
    instrument: note.instrument,
    modifiers: Object.keys(modifiers).length ? modifiers : undefined,
  }
}

function dedupeNotes(notes) {
  const seen = new Map()
  notes.forEach((note) => {
    const normalized = normalizeNote(note)
    if (!normalized) return
    const key = normalized.instrument
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, normalized)
      return
    }

    seen.set(key, {
      instrument: normalized.instrument,
      modifiers: {
        ...(existing.modifiers || {}),
        ...(normalized.modifiers || {}),
      },
    })
  })

  return [...seen.values()]
}

function notesFromLegacyFillStep(step) {
  const source = Array.isArray(step?.instruments) ? step.instruments : []
  const accent = Boolean(step?.accent)
  const ghost = Boolean(step?.ghost)

  return dedupeNotes(source.map((instrument) => ({
    instrument,
    modifiers:
      instrument === 'snare' && ghost
        ? { ghost: true }
        : accent && instrument !== 'bass_drum'
          ? { accent: true }
          : undefined,
  })))
}

function notesFromLegacySymbol(symbol, isAccentExercise) {
  const chars = [...new Set(String(symbol || '').split(''))].filter(Boolean)
  const notes = chars.flatMap((char) => LEGACY_TOKEN_TO_NOTES[char] || [])

  if (!chars.length && isAccentExercise) {
    notes.push({ instrument: 'snare', modifiers: { ghost: true } })
  }

  if (isAccentExercise && chars.length && !notes.some((note) => note.instrument === 'snare')) {
    notes.push({ instrument: 'snare', modifiers: { accent: true } })
  }

  return dedupeNotes(notes)
}

function deriveProfileFromResolution(resolution = '16th') {
  if (resolution === '4th') return 'straight_4'
  if (resolution === '8th') return 'straight_8'
  if (resolution === '8th_triplet') return 'triplet_8'
  if (resolution === '16th_triplet') return 'triplet_16'
  return resolution === '32nd' ? 'straight_32' : 'straight_16'
}

function deriveProfileFromStepCount(stepsPerBar = 16) {
  if (stepsPerBar === 4) return 'straight_4'
  if (stepsPerBar === 8) return 'straight_8'
  if (stepsPerBar === 12) return 'triplet_8'
  if (stepsPerBar === 24) return 'triplet_16'
  if (stepsPerBar === 32) return 'straight_32'
  return 'straight_16'
}

function sortEvents(events) {
  return [...events].sort((a, b) => a.startTick - b.startTick)
}

export function legacyFillStepsToCanonical(
  rawSteps,
  fillLengthType = 'full_bar',
  resolution = '16th',
) {
  const profile = getGridProfile(deriveProfileFromResolution(resolution))
  const totalSteps = getTotalStepsForProfile(profile.value, fillLengthType)
  const events = []

  for (let index = 0; index < totalSteps; index += 1) {
    const step = Array.isArray(rawSteps) ? rawSteps.find((item) => item?.index === index) : null
    const startTick = index * profile.stepTick

    if (step?.isRest || step?.instruments?.includes('rest')) {
      events.push({
        id: makeEventId('fill-rest', index),
        startTick,
        durationTick: profile.stepTick,
        notes: [],
        isRest: true,
      })
      continue
    }

    const notes = notesFromLegacyFillStep(step)
    if (!notes.length) continue

    events.push({
      id: makeEventId('fill', index),
      startTick,
      durationTick: profile.stepTick,
      notes,
      isRest: false,
    })
  }

  return createCanonicalPattern({
    patternKind: 'fill',
    gridProfile: profile.value,
    fillLengthType,
    totalTicks: totalSteps * profile.stepTick,
    events: sortEvents(events),
    metadata: {
      source: 'legacy_steps',
    },
  })
}

export function legacyNotationPatternToCanonical(
  pattern,
  {
    patternKind = 'exercise',
    fillLengthType = 'full_bar',
    isAccentExercise = false,
    resolution,
  } = {},
) {
  const inferredResolution =
    resolution ||
    pattern?.resolution ||
    (pattern?.stepsPerBar
      ? getGridProfile(deriveProfileFromStepCount(pattern.stepsPerBar)).resolution
      : '16th')
  const profile = getGridProfile(deriveProfileFromResolution(inferredResolution))
  const totalSteps =
    Number.isFinite(pattern?.totalSteps) && pattern.totalSteps > 0
      ? pattern.totalSteps
      : getTotalStepsForProfile(profile.value, fillLengthType)

  const accentRow = Array.isArray(pattern?.accentRow) ? pattern.accentRow : []
  const kickRow = Array.isArray(pattern?.kickRow) ? pattern.kickRow : []
  const accentMarks = Array.isArray(pattern?.accentMarks) ? pattern.accentMarks : []
  const restMarks = Array.isArray(pattern?.restMarks) ? pattern.restMarks : []
  const events = []

  for (let index = 0; index < totalSteps; index += 1) {
    const startTick = index * profile.stepTick
    const rest = Boolean(restMarks[index])
    if (rest) {
      events.push({
        id: makeEventId('notation-rest', index),
        startTick,
        durationTick: profile.stepTick,
        notes: [],
        isRest: true,
      })
      continue
    }

    const upperNotes = notesFromLegacySymbol(accentRow[index], isAccentExercise)
    const lowerRow = String(kickRow[index] || '')
    const lowerNotes = [
      ...(lowerRow.includes('●') ? [{ instrument: 'bass_drum' }] : []),
      ...(lowerRow.includes('P') ? [{ instrument: 'foot_hihat' }] : []),
    ]

    const notes = dedupeNotes([
      ...upperNotes,
      ...lowerNotes,
    ]).map((note) => {
      if (!accentMarks[index] || note.instrument === 'bass_drum') return note
      return {
        ...note,
        modifiers: {
          ...(note.modifiers || {}),
          accent: true,
        },
      }
    })

    if (!notes.length) continue

    events.push({
      id: makeEventId('notation', index),
      startTick,
      durationTick: profile.stepTick,
      notes,
      isRest: false,
    })
  }

  return createCanonicalPattern({
    patternKind,
    gridProfile: profile.value,
    fillLengthType,
    totalTicks: totalSteps * profile.stepTick,
    events: sortEvents(events),
    metadata: {
      source: 'legacy_notation',
    },
  })
}

export function canonicalToNotationView(pattern) {
  const profile = getGridProfile(pattern?.gridProfile || 'straight_16')
  const totalSteps = Math.round((pattern?.totalTicks || 0) / profile.stepTick)
  const accentRow = Array(totalSteps).fill('')
  const kickRow = Array(totalSteps).fill('')
  const accentMarks = Array(totalSteps).fill(false)
  const ghostMarks = Array(totalSteps).fill(false)
  const restMarks = Array(totalSteps).fill(false)

  for (const event of pattern?.events || []) {
    const index = Math.round(event.startTick / profile.stepTick)
    if (index < 0 || index >= totalSteps) continue

    if (event.isRest) {
      restMarks[index] = true
      continue
    }

    const tokens = []
    for (const note of event.notes || []) {
      if (note.instrument === 'bass_drum') {
        kickRow[index] = `${kickRow[index]}●`
        continue
      }

      if (note.instrument === 'foot_hihat') {
        kickRow[index] = `${kickRow[index]}P`
        continue
      }

      const token = NOTATION_TOKEN_BY_INSTRUMENT[note.instrument]
      if (token) tokens.push(token)
      if (note.modifiers?.accent) accentMarks[index] = true
      if (note.instrument === 'snare' && note.modifiers?.ghost) ghostMarks[index] = true
    }

    accentRow[index] = [...new Set(tokens)].join('')
    kickRow[index] = [...new Set(String(kickRow[index] || '').split(''))].join('')
  }

  return {
    accentRow,
    kickRow,
    accentMarks,
    ghostMarks,
    restMarks,
    stepsPerBar: profile.stepsPerBar,
    totalSteps,
    resolution: resolutionFromGridProfile(profile.value),
    gridProfile: profile.value,
    tupletGroups: profile.value === 'triplet_8'
      ? Array.from({ length: Math.floor(totalSteps / 3) }, (_, index) => ({
          start: index * 3,
          end: index * 3 + 3,
          numNotes: 3,
          notesOccupied: 2,
        }))
      : profile.value === 'triplet_16'
        ? Array.from({ length: Math.floor(totalSteps / 6) }, (_, index) => ({
            start: index * 6,
            end: index * 6 + 6,
            numNotes: 6,
            notesOccupied: 4,
          }))
        : [],
  }
}

export function canonicalToPlaybackSequence(pattern) {
  const profile = getGridProfile(pattern?.gridProfile || 'straight_16')
  const totalSteps = Math.round((pattern?.totalTicks || 0) / profile.stepTick)
  const sequence = Array.from({ length: totalSteps }, (_, index) => ({
    index,
    startTick: index * profile.stepTick,
    durationTick: profile.stepTick,
    isRest: false,
    notes: [],
    instruments: [],
    accent: false,
    ghost: false,
  }))

  for (const event of pattern?.events || []) {
    const index = Math.round(event.startTick / profile.stepTick)
    if (index < 0 || index >= totalSteps) continue

    sequence[index] = {
      index,
      startTick: event.startTick,
      durationTick: event.durationTick,
      isRest: Boolean(event.isRest),
      notes: [...(event.notes || [])],
      instruments: (event.notes || []).map((note) => (
        note.instrument === 'snare' && note.modifiers?.ghost
          ? 'ghost_snare'
          : note.instrument
      )),
      accent: (event.notes || []).some((note) => Boolean(note.modifiers?.accent)),
      ghost: (event.notes || []).some((note) => Boolean(note.modifiers?.ghost)),
    }
  }

  return sequence
}

export function canonicalToPatternJson(pattern) {
  return JSON.stringify(pattern)
}

export function parseCanonicalPatternJson(value) {
  if (!value) return null
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function canonicalToLegacyFillSteps(pattern) {
  const profile = getGridProfile(pattern?.gridProfile || 'straight_16')
  const totalSteps = Math.round((pattern?.totalTicks || 0) / profile.stepTick)
  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    index,
    instruments: [],
    accent: false,
    ghost: false,
    isRest: false,
  }))

  for (const event of pattern?.events || []) {
    const index = Math.round(event.startTick / profile.stepTick)
    if (index < 0 || index >= totalSteps) continue

    if (event.isRest) {
      steps[index] = {
        index,
        instruments: [],
        accent: false,
        ghost: false,
        isRest: true,
      }
      continue
    }

    const instruments = []
    let accent = false
    let ghost = false

    for (const note of event.notes || []) {
      if (!FILL_INSTRUMENTS.has(note.instrument)) continue
      instruments.push(note.instrument)
      if (note.instrument === 'snare' && note.modifiers?.ghost) {
        ghost = true
      } else if (note.instrument !== 'bass_drum' && note.modifiers?.accent) {
        accent = true
      }
    }

    steps[index] = {
      index,
      instruments: [...new Set(instruments)],
      accent,
      ghost,
      isRest: false,
    }
  }

  return steps
}
