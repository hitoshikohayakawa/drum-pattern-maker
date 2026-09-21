import { createCanonicalPattern, getGridProfile } from '../constants/rhythmSchema.js'

export const TODAY_PRACTICE_HISTORY_KEY = 'dpm_today_practice_history_v1'

const EXERCISE_COPY = {
  warmup: {
    title: 'ウォームアップ',
    instruction: 'すべてスネアで、均一な音量とリラックスした動きを保って叩きます。',
  },
  reading: {
    title: 'リズムリーディング',
    instruction: '譜面を声に出して数えてから、スネアだけで正確に読みます。',
  },
  syncopation: {
    title: 'シンコペーション',
    instruction: '休符も拍の一部として数え、鳴らす音を裏拍まで安定させます。',
  },
  accent: {
    title: 'アクセント応用',
    instruction: '音符はスネアで、アクセント以外は低い音量で叩き分けます。',
  },
  fill: {
    title: 'フィルイン応用',
    instruction: '前半はハイハット＋スネア、最後の1小節だけをタムでフィルにします。',
  },
}

const TICKS_BY_BLOCK = {
  quarter: [192],
  eighths: [96, 96],
  sixteenths: [48, 48, 48, 48],
  tattara: [96, 48, 48],
  taratta: [48, 48, 96],
  triplet: [64, 64, 64],
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function createSeededRandom(seed) {
  let state = [...String(seed)].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 2166136261)
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function getTodayPracticeHistory() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TODAY_PRACTICE_HISTORY_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function recordTodayPracticeResult(result) {
  const history = getTodayPracticeHistory()
  const nextHistory = [...history, result].slice(-80)
  window.localStorage.setItem(TODAY_PRACTICE_HISTORY_KEY, JSON.stringify(nextHistory))
  return nextHistory
}

export function buildTodayMixedPlaybackSequence(beatBlocks = []) {
  let index = 0
  return beatBlocks.flatMap((barBlocks, barIndex) => (
    (barBlocks || []).flatMap((block, beatIndex) => {
      let offset = 0
      const startTick = barIndex * 768 + beatIndex * 192
      return (TICKS_BY_BLOCK[block.type] || TICKS_BY_BLOCK.quarter).map((durationTick, noteIndex) => {
        const step = {
          index: index++,
          startTick: startTick + offset,
          durationTick,
          isRest: false,
          instruments: noteIndex === 0 ? ['snare', 'bass_drum'] : ['snare'],
          accent: false,
          ghost: false,
        }
        offset += durationTick
        return step
      })
    })
  ))
}

export function getAdaptivePracticeProfile(history = []) {
  const recent = history.slice(-8)
  const easy = recent.filter((item) => item.result === 'easy').length
  const hard = recent.filter((item) => item.result === 'hard').length
  const adjustment = easy - hard

  return {
    level: clamp(2 + adjustment, 1, 4),
    tempoAdjustment: clamp(adjustment * 5, -15, 15),
    recentFeedback: { easy, hard },
  }
}

function createPattern({ id, profileName = 'straight_16', bars = 4, hits = [], rests = [], metadata = {}, addQuarterKick = true }) {
  const profile = getGridProfile(profileName)
  const totalSteps = profile.stepsPerBar * bars
  const restIndexes = new Set(rests)
  const notesByStep = new Map()
  const events = []

  hits.forEach((hit) => {
    if (restIndexes.has(hit.step)) return
    notesByStep.set(hit.step, [...(notesByStep.get(hit.step) || []), ...(hit.notes || [])])
  })

  if (addQuarterKick) {
    const stepsPerBeat = profile.stepsPerBar / 4
    for (let step = 0; step < totalSteps; step += stepsPerBeat) {
      // A downbeat remains audible even when the upper voice contains a rest.
      restIndexes.delete(step)
      notesByStep.set(step, [...(notesByStep.get(step) || []), { instrument: 'bass_drum' }])
    }
  }

  for (let step = 0; step < totalSteps; step += 1) {
    const notes = notesByStep.get(step)
    if (notes?.length) {
      events.push({ id: `${id}-hit-${step}`, startTick: step * profile.stepTick, durationTick: profile.stepTick, notes, isRest: false })
    } else if (restIndexes.has(step)) {
      events.push({ id: `${id}-rest-${step}`, startTick: step * profile.stepTick, durationTick: profile.stepTick, notes: [], isRest: true })
    }
  }

  return createCanonicalPattern({
    patternKind: 'exercise',
    gridProfile: profileName,
    fillLengthType: 'full_bar',
    totalTicks: totalSteps * profile.stepTick,
    events: events.sort((a, b) => a.startTick - b.startTick),
    metadata: { source: 'daily_practice_generator', ...metadata },
  })
}

function snare(step, modifiers) {
  return { step, notes: [{ instrument: 'snare', modifiers }] }
}

function createWarmup(level, random) {
  const hits = []
  for (let bar = 0; bar < 4; bar += 1) {
    for (let beat = 0; beat < 4; beat += 1) {
      hits.push(snare(bar * 16 + beat * 4))
      hits.push(snare(bar * 16 + beat * 4 + 2))
    }
  }
  if (level >= 3 && random() > 0.5) hits.push(snare(62, { accent: true }))
  return createPattern({ id: 'warmup', hits, metadata: { noteValues: ['8th'], rests: false, syncopationLevel: 0, accents: level >= 3, triplets: false } })
}

function createReading(level, random) {
  const hits = []
  const sixteenthBeats = level >= 2 ? [1, 3] : [1]
  for (let bar = 0; bar < 4; bar += 1) {
    for (let beat = 0; beat < 4; beat += 1) {
      const start = bar * 16 + beat * 4
      hits.push(snare(start))
      if (sixteenthBeats.includes(beat) || (level >= 3 && random() > 0.55)) {
        hits.push(snare(start + 2))
        hits.push(snare(start + 3))
      } else {
        hits.push(snare(start + 2))
      }
    }
  }
  return createPattern({ id: 'reading', hits, metadata: { noteValues: level >= 2 ? ['8th', '16th'] : ['8th'], rests: false, syncopationLevel: 0, accents: false, triplets: false } })
}

function createSyncopation(level, random) {
  const hits = []
  const rests = []
  for (let bar = 0; bar < 4; bar += 1) {
    const offset = bar * 16
    ;[0, 3, 6, 10, 14].forEach((step) => hits.push(snare(offset + step)))
    rests.push(offset + 1, offset + 5, offset + 9, offset + 13)
    if (level >= 3 && random() > 0.4) hits.push(snare(offset + 11))
  }
  return createPattern({ id: 'syncopation', hits, rests, metadata: { noteValues: level >= 3 ? ['8th', '16th'] : ['8th'], rests: true, syncopationLevel: level >= 3 ? 3 : 2, accents: false, triplets: false } })
}

function createAccent(level) {
  const hits = []
  for (let step = 0; step < 64; step += 2) {
    const accent = level >= 3 ? step % 10 === 0 : step % 8 === 0
    hits.push(snare(step, accent ? { accent: true } : undefined))
  }
  return createPattern({ id: 'accent', hits, metadata: { noteValues: ['8th'], rests: false, syncopationLevel: 0, accents: true, triplets: false } })
}

function createFill(level, random) {
  const hits = []
  for (let bar = 0; bar < 3; bar += 1) {
    for (let step = 0; step < 16; step += 2) {
      hits.push({ step: bar * 16 + step, notes: [{ instrument: 'hihat_close' }, ...(step % 8 === 4 ? [{ instrument: 'snare' }] : [])] })
    }
  }
  const toms = ['snare', 'hi_tom', 'mid_tom', 'floor_tom']
  for (let step = 48; step < 64; step += level >= 3 ? 1 : 2) {
    if (step === 63) continue
    const instrument = toms[Math.floor((step - 48) / (level >= 3 ? 2 : 4)) % toms.length]
    hits.push({ step, notes: [{ instrument, modifiers: step === 63 ? { accent: true } : undefined }] })
  }
  hits.push({ step: 63, notes: [{ instrument: 'floor_tom' }, { instrument: 'crash', modifiers: { accent: true } }, { instrument: 'bass_drum' }] })
  return createPattern({ id: 'fill', hits, metadata: { noteValues: level >= 3 ? ['8th', '16th'] : ['8th'], rests: false, syncopationLevel: 1, accents: true, triplets: false, variation: random() } })
}

function createTripletVariation(level) {
  const hits = []
  const rests = []
  for (let bar = 0; bar < 4; bar += 1) {
    for (let beat = 0; beat < 4; beat += 1) {
      const start = bar * 12 + beat * 3
      hits.push(snare(start))
      hits.push(snare(start + 2, level >= 3 && beat === 3 ? { accent: true } : undefined))
      rests.push(start + 1)
    }
  }
  return createPattern({ id: 'triplet', profileName: 'triplet_8', hits, rests, metadata: { noteValues: ['8th_triplet'], rests: true, syncopationLevel: 2, accents: level >= 3, triplets: true } })
}

function slicePatternBars(pattern, startBar, barCount) {
  const profile = getGridProfile(pattern.gridProfile)
  const barTicks = profile.stepsPerBar * profile.stepTick
  const startTick = startBar * barTicks
  const endTick = startTick + barCount * barTicks

  return {
    ...pattern,
    totalTicks: barCount * barTicks,
    events: pattern.events
      .filter((event) => event.startTick >= startTick && event.startTick < endTick)
      .map((event) => ({ ...event, startTick: event.startTick - startTick })),
  }
}

function createMixedBeatBlocks(level, random) {
  if (level <= 1) {
    const easyTemplates = [
      ['quarter', 'eighths', 'quarter', 'eighths'],
      ['quarter', 'sixteenths', 'quarter', 'quarter'],
      ['quarter', 'eighths', 'quarter', 'quarter'],
      ['quarter', 'triplet', 'quarter', 'triplet'],
    ]
    const templateOffset = Math.floor(random() * easyTemplates.length)
    return Array.from({ length: 16 }, (_, barIndex) => (
      easyTemplates[(Math.floor(barIndex / 4) + templateOffset) % easyTemplates.length].map((type) => ({ type }))
    ))
  }

  const pools = level >= 4
    ? ['quarter', 'eighths', 'sixteenths', 'tattara', 'taratta', 'sixteenths']
    : ['quarter', 'eighths', 'sixteenths', 'tattara', 'taratta']
  const tripletBeatCount = level >= 4 ? 8 : 4
  const tripletBeatIndexes = new Set()
  while (tripletBeatIndexes.size < tripletBeatCount) {
    tripletBeatIndexes.add(Math.floor(random() * 64))
  }

  return Array.from({ length: 16 }, (_, barIndex) => {
    const blocks = Array.from({ length: 4 }, () => ({ type: pools[Math.floor(random() * pools.length)] }))
    blocks.forEach((block, beatIndex) => {
      if (tripletBeatIndexes.has(barIndex * 4 + beatIndex)) block.type = 'triplet'
    })
    return blocks
  })
}

function createProgressiveReadingPage(level, random) {
  // Each entry is a one-bar rhythmic cell on a 16th-note grid. These are
  // purpose-built building blocks, not transcriptions or derivatives of a book.
  const cellPools = [
    [[0, 2, 4, 6, 8, 10, 12, 14], [0, 2, 4, 6, 8, 10, 12, 13], [0, 2, 4, 6, 8, 10, 11, 14]],
    // Quarter notes, 16th-note groups, and the two common mixed cells:
    // "ta-ta-ra" = eighth + two sixteenths; "ta-ra-ta" = two sixteenths + eighth.
    [[0, 4, 8, 12], [0, 2, 4, 5, 8, 10, 12, 14], [0, 1, 2, 3, 4, 8, 9, 10, 11, 12], [0, 1, 3, 4, 6, 7, 8, 10, 12, 13, 15]],
    [[0, 3, 6, 8, 10, 13, 14], [0, 2, 5, 6, 8, 11, 12, 14], [0, 3, 4, 6, 9, 10, 12, 15]],
    [[0, 1, 3, 4, 6, 8, 10, 11, 13, 14], [0, 2, 3, 5, 6, 8, 9, 11, 12, 14], [0, 1, 2, 4, 6, 7, 8, 10, 12, 13, 15]],
    [[0, 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 14, 15], [0, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 15], [0, 1, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15]],
  ]
  const easyCells = [
    [0, 2, 4, 6, 8, 9, 10, 11, 12, 14],
    [0, 2, 4, 5, 6, 7, 8, 10, 12, 14],
    [0, 2, 4, 6, 8, 10, 12, 13, 14, 15],
  ]
  const hits = []
  const rests = []
  const straightBarCount = 12

  for (let bar = 0; bar < straightBarCount; bar += 1) {
    const stage = level <= 1
      ? 0
      : Math.min(level >= 4 ? 4 : 3, Math.floor(bar / 4) + Math.max(0, level - 2))
    const pool = level <= 1 ? easyCells : cellPools[stage]
    const cell = pool[Math.floor(random() * pool.length)]
    const cellSet = new Set(cell)

    for (let step = 0; step < 16; step += 1) {
      const absoluteStep = bar * 16 + step
      if (cellSet.has(step)) {
        hits.push(snare(absoluteStep, level >= 4 && stage >= 3 && step % 4 === 0 ? { accent: true } : undefined))
      } else if (step % 4 !== 0 && (stage >= 2 || random() > 0.55)) {
        rests.push(absoluteStep)
      }
    }
  }

  const straightPattern = createPattern({
    id: 'progressive-reading-page',
    bars: straightBarCount,
    hits,
    rests,
    metadata: {
      noteValues: ['8th', '16th'],
      rests: true,
      syncopationLevel: level <= 1 ? 0 : Math.min(4, level + 1),
      accents: level >= 4,
      triplets: false,
    },
  })

  const tripletHits = []
  const tripletRests = []
  const tripletPools = level <= 2
    // Every beat has all three triplet notes: this makes the triplet subdivision
    // unambiguous before rests and displaced accents are introduced at hard level.
    ? [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]
    : level >= 4
    ? [[0, 1, 2, 3, 5, 6, 7, 8, 10, 11], [0, 2, 3, 4, 5, 7, 8, 9, 10], [0, 1, 3, 4, 6, 7, 8, 10, 11]]
    : [[0, 2, 3, 5, 6, 8, 9, 11], [0, 2, 4, 5, 6, 8, 10, 11], [0, 1, 3, 5, 6, 8, 9, 11]]

  for (let bar = 0; bar < 4; bar += 1) {
    const cell = tripletPools[Math.floor(random() * tripletPools.length)]
    const cellSet = new Set(cell)
    for (let step = 0; step < 12; step += 1) {
      const absoluteStep = bar * 12 + step
      if (cellSet.has(step)) {
        tripletHits.push(snare(absoluteStep, level >= 4 && step % 3 === 0 ? { accent: true } : undefined))
      } else if (step % 3 !== 0) {
        tripletRests.push(absoluteStep)
      }
    }
  }

  const tripletPattern = createPattern({
    id: 'progressive-reading-triplets',
    profileName: 'triplet_8',
    bars: 4,
    hits: tripletHits,
    rests: tripletRests,
    metadata: {
      noteValues: ['8th_triplet'],
      rests: true,
      syncopationLevel: level >= 4 ? 4 : 3,
      accents: level >= 4,
      triplets: true,
    },
  })

  // A single canonical pattern has one grid profile. Splitting at bar boundaries
  // lets the score place binary subdivision and triplet subdivision side by side.
  const interleavedPatterns = Array.from({ length: 4 }, (_, rowIndex) => [
    slicePatternBars(straightPattern, rowIndex * 3, 3),
    slicePatternBars(tripletPattern, rowIndex, 1),
  ]).flat()

  return {
    patterns: interleavedPatterns,
    metadata: {
      ...straightPattern.metadata,
      noteValues: ['4th', '8th', '16th', '8th_triplet'],
      triplets: true,
      accents: level >= 4,
      bars: 16,
      pageLayout: 'a4_16_bar_progression',
      beatBlocks: createMixedBeatBlocks(level, random),
    },
  }
}

export function createTodayPracticeMenu({ history = [], seed = new Date().toDateString(), difficulty = 'normal' } = {}) {
  const adaptive = getAdaptivePracticeProfile(history)
  const random = createSeededRandom(`${seed}-${history.length}`)
  const selectedLevel = { easy: 1, normal: 2, hard: 4 }[difficulty] || 2
  const baseTempo = { easy: 65, normal: 70, hard: 75 }[difficulty] || 70
  const progressivePage = createProgressiveReadingPage(selectedLevel, random)
  const exercises = [
    { id: 'progressive-page', exerciseType: 'reading', minutes: 8, tempo: baseTempo, patterns: progressivePage.patterns },
  ].map((exercise, index) => ({
    ...exercise,
    order: index + 1,
    title: '16小節 プログレッシブ・リズムリーディング',
    instruction: '各拍をひとつの読譜ブロックとして読みます。4分・8分・16分・タッタラ・タラッタ・3連符を同じ小節内で切り替え、各拍のバスドラムを土台に上段のスネア譜を読みます。',
    attributes: {
      ...progressivePage.metadata,
      tempo: exercise.tempo,
      bars: 16,
      difficulty,
      exerciseType: exercise.exerciseType,
    },
  }))

  return { id: `daily-${seed}-${history.length}`, createdAt: new Date().toISOString(), adaptive, difficulty, exercises }
}

// Used by the "Choose Practice" screen. It deliberately derives every score from
// a small set of rhythm rules rather than storing or reproducing published material.
export function createSelectedReadingPractice({
  noteValue = '8th',
  includeRests = false,
  includeSyncopation = false,
  includeAccents = false,
  includeTriplets = false,
  exerciseType = 'reading',
} = {}) {
  const profileName = includeTriplets ? 'triplet_8' : 'straight_16'
  const stepsPerBar = includeTriplets ? 12 : 16
  const stepInterval = includeTriplets ? 2 : noteValue === '4th' ? 4 : noteValue === '16th' ? 1 : 2
  const hits = []
  const rests = []

  for (let bar = 0; bar < 4; bar += 1) {
    for (let step = 0; step < stepsPerBar; step += stepInterval) {
      const absoluteStep = bar * stepsPerBar + step
      const isSyncopatedRest = includeSyncopation && step % (stepInterval * 3) === 0 && step > 0
      const isRegularRest = includeRests && step % (stepInterval * 5) === 0 && step > 0
      if (isSyncopatedRest || isRegularRest) {
        rests.push(absoluteStep)
        continue
      }

      const isFillBar = exerciseType === 'fill' && bar === 3
      const instruments = isFillBar
        ? [{ instrument: ['snare', 'hi_tom', 'mid_tom', 'floor_tom'][Math.floor(step / stepInterval) % 4] }]
        : exerciseType === 'coordination'
          ? [{ instrument: 'hihat_close' }, ...(step % (stepInterval * 2) === 0 ? [{ instrument: 'bass_drum' }] : [])]
          : [{ instrument: 'snare', modifiers: includeAccents && step % (stepInterval * 4) === 0 ? { accent: true } : undefined }]
      hits.push({ step: absoluteStep, notes: instruments })
    }
  }

  return createPattern({
    id: 'selected-reading',
    profileName,
    hits,
    rests,
    metadata: {
      noteValues: [includeTriplets ? '8th_triplet' : noteValue],
      rests: includeRests,
      syncopationLevel: includeSyncopation ? 2 : 0,
      accents: includeAccents,
      triplets: includeTriplets,
      exerciseType,
    },
  })
}
