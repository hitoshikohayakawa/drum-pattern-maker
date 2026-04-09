import {
  BASIC_EIGHT_BEAT_LIBRARY,
  GENRE_GROOVE_LIBRARY,
  ONE_BAR_FILLS,
  BASIC_ONE_BAR_FILLS,
  HALF_BAR_FILLS,
  BASIC_HALF_BAR_FILLS,
  QUARTER_BAR_FILLS,
  BASIC_QUARTER_BAR_FILLS,
  FILL_GENRE_PROFILES,
} from '../constants/patterns'
import { createCanonicalPattern, getGridProfile } from '../constants/rhythmSchema.js'
import { legacyNotationPatternToCanonical } from './canonicalRhythm.js'
import {
  buildCanonicalPatternFromStoredPatternRecord,
  buildFillPhraseFromStoredPattern,
} from './fillEditorModel'

const RESOLVE_CYMBAL_INSTRUMENTS = new Set(['hihat_close', 'hihat_open', 'ride', 'crash'])
const LOWER_VOICE_BASS = '●'
const LOWER_VOICE_FOOT_HIHAT = 'P'

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function replaceHiHatWithOpen(symbol) {
  if (symbol === 'H') return 'O'
  if (symbol === 'HS') return 'OS'
  return symbol
}

function maybeOpenHiHatInFill(fill, allowOpenHiHat) {
  if (!allowOpenHiHat || !fill?.hand) return fill
  const nextHand = [...fill.hand]
  let targetIndex = -1

  nextHand.forEach((symbol, index) => {
    if (symbol === 'H' || symbol === 'HS') targetIndex = index
  })

  if (targetIndex >= 0) {
    nextHand[targetIndex] = replaceHiHatWithOpen(nextHand[targetIndex])
    return { ...fill, hand: nextHand }
  }

  return fill
}

function maybeOpenHiHatInGrooveBar(accentRow, grooveKey, allowOpenHiHat) {
  if (!allowOpenHiHat || grooveKey === 'ride') return accentRow
  const nextAccentRow = [...accentRow]
  const preferredIndexes = [14]

  preferredIndexes.forEach((index) => {
    const symbol = nextAccentRow[index]
    if (symbol === 'H' || symbol === 'HS') {
      nextAccentRow[index] = replaceHiHatWithOpen(symbol)
    }
  })

  return nextAccentRow
}

function maybeOpenHiHatBeforeFill(accentRow, fillLengthMode, allowOpenHiHat) {
  if (!allowOpenHiHat) return accentRow
  const nextAccentRow = [...accentRow]
  const targetIndex = fillLengthMode === '1bar' ? 46 : fillLengthMode === 'half' ? 54 : 58
  const symbol = nextAccentRow[targetIndex]

  if (symbol === 'H' || symbol === 'HS') {
    nextAccentRow[targetIndex] = replaceHiHatWithOpen(symbol)
  } else if (!symbol) {
    nextAccentRow[targetIndex] = 'O'
  }

  return nextAccentRow
}

function appendLowerVoiceToken(currentValue, token) {
  const source = String(currentValue || '')
  return source.includes(token) ? source : `${source}${token}`
}

function createEmptyGrooveBar() {
  return {
    accentRow: Array(16).fill(''),
    kickRow: Array(16).fill(''),
  }
}

function createBarFromGroove(groove, grooveKey, allowOpenHiHat = false) {
  let accentRow = Array(16).fill('')
  const kickRow = Array(16).fill('')
  groove.hand.forEach((symbol, index) => {
    accentRow[index] = symbol || ''
  })
  accentRow = maybeOpenHiHatInGrooveBar(accentRow, grooveKey, allowOpenHiHat)
  groove.kick.forEach((index) => {
    if (index >= 0 && index < 16) kickRow[index] = appendLowerVoiceToken(kickRow[index], LOWER_VOICE_BASS)
  })
  ;(groove.foot || []).forEach((index) => {
    if (index >= 0 && index < 16) kickRow[index] = appendLowerVoiceToken(kickRow[index], LOWER_VOICE_FOOT_HIHAT)
  })
  return { accentRow, kickRow }
}

function applySectionAtStep(accentRow, kickRow, startStep, section) {
  for (let i = 0; i < section.hand.length; i += 1) {
    accentRow[startStep + i] = ''
    kickRow[startStep + i] = ''
  }
  section.hand.forEach((symbol, i) => {
    accentRow[startStep + i] = symbol || ''
  })
  section.kick.forEach((index) => {
    const target = startStep + index
    if (target >= 0 && target < kickRow.length) kickRow[target] = appendLowerVoiceToken(kickRow[target], LOWER_VOICE_BASS)
  })
}

function normalizeCustomFill(fill) {
  if (!fill?.hand || !fill?.kick) return null
  return {
    hand: fill.hand,
    kick: fill.kick,
    rest: fill.rest || [],
    resolve: fill.resolve || 'nextCrash',
    fill_length_type: fill.fill_length_type,
  }
}

function applyRestMarks(restMarks, startStep, fill) {
  if (!Array.isArray(fill.rest)) return
  fill.rest.forEach((index) => {
    const target = startStep + index
    if (target >= 0 && target < restMarks.length) {
      restMarks[target] = true
    }
  })
}

function applyFillToBars(accentRow, kickRow, restMarks, startBar, fill) {
  const start = startBar * 16
  for (let i = 0; i < fill.hand.length; i += 1) {
    accentRow[start + i] = ''
    kickRow[start + i] = ''
    restMarks[start + i] = false
  }
  fill.hand.forEach((symbol, i) => {
    accentRow[start + i] = symbol || ''
  })
  fill.kick.forEach((index) => {
    const target = start + index
    if (target >= 0 && target < kickRow.length) kickRow[target] = appendLowerVoiceToken(kickRow[target], LOWER_VOICE_BASS)
  })
  applyRestMarks(restMarks, start, fill)
}

function addResolveHitToPhraseStart(pattern) {
  if (!pattern?.accentRow?.length) return pattern
  const nextAccentRow = [...pattern.accentRow]
  const nextKickRow = Array.isArray(pattern.kickRow) ? [...pattern.kickRow] : []
  nextAccentRow[0] = 'C'
  return {
    ...pattern,
    accentRow: nextAccentRow,
    kickRow: nextKickRow.map((value, index) => (index === 0 ? appendLowerVoiceToken(value, LOWER_VOICE_BASS) : value)),
  }
}

function dedupeResolveNotes(notes = []) {
  const noteMap = new Map()

  notes.forEach((note) => {
    if (!note?.instrument) return
    const existing = noteMap.get(note.instrument)
    if (!existing) {
      noteMap.set(note.instrument, {
        ...note,
        modifiers: note.modifiers ? { ...note.modifiers } : undefined,
      })
      return
    }

    noteMap.set(note.instrument, {
      ...existing,
      modifiers: {
        ...(existing.modifiers || {}),
        ...(note.modifiers || {}),
      },
    })
  })

  return [...noteMap.values()]
}

function addResolveHitToCanonicalPhraseStart(pattern) {
  if (!pattern?.gridProfile) return pattern

  const profile = getGridProfile(pattern.gridProfile)
  const baseNotes = [{ instrument: 'crash' }, { instrument: 'bass_drum' }]
  let foundStartEvent = false

  const nextEvents = (pattern.events || []).map((event, index) => {
    if (event.startTick !== 0) return { ...event, notes: [...(event.notes || [])] }

    foundStartEvent = true
    const retainedNotes = (event.notes || []).filter((note) => !RESOLVE_CYMBAL_INSTRUMENTS.has(note.instrument))
    return {
      ...event,
      id: event.id || `resolve-${index}`,
      durationTick: event.durationTick || profile.stepTick,
      isRest: false,
      notes: dedupeResolveNotes([...retainedNotes, ...baseNotes]),
    }
  })

  if (!foundStartEvent) {
    nextEvents.push({
      id: 'resolve-0',
      startTick: 0,
      durationTick: profile.stepTick,
      isRest: false,
      notes: baseNotes,
    })
  }

  return {
    ...pattern,
    events: nextEvents.sort((a, b) => a.startTick - b.startTick),
  }
}

function getBaseFillCollection(fillLengthMode) {
  if (fillLengthMode === '1bar') return ONE_BAR_FILLS
  if (fillLengthMode === 'half') return HALF_BAR_FILLS
  return QUARTER_BAR_FILLS
}

function getGenreProfile(fillGenre) {
  return FILL_GENRE_PROFILES[fillGenre] || FILL_GENRE_PROFILES.rock
}

function createLegacyJazzGuideGroove() {
  return {
    hand: ['R', '', 'R', '', 'R', '', 'R', '', 'R', '', 'R', '', 'R', '', 'R', ''],
    kick: [0, 4, 8, 12],
    foot: [4, 12],
  }
}

function getGenreGroovePool(fillGenre, grooveKey) {
  const genreProfile = getGenreProfile(fillGenre)
  if (fillGenre === 'blues') {
    return genreProfile.groovePool
  }
  if (fillGenre === 'jazz') {
    return [createLegacyJazzGuideGroove()]
  }
  if (grooveKey === 'random') {
    return [
      ...genreProfile.groovePool,
      ...Object.values(BASIC_EIGHT_BEAT_LIBRARY).flat(),
    ]
  }
  if (grooveKey === 'straight') return GENRE_GROOVE_LIBRARY[fillGenre] || genreProfile.groovePool
  return BASIC_EIGHT_BEAT_LIBRARY[grooveKey] || genreProfile.groovePool
}

function getFillLibrary(fillGenre, fillLengthMode, fillPatternMode, customFillLibrary = []) {
  const genreProfile = getGenreProfile(fillGenre)
  const fillIndexes = genreProfile.fills[fillPatternMode]?.[fillLengthMode] || []
  const source = getBaseFillCollection(fillLengthMode)
  const targetLengthType = getTargetLengthType(fillLengthMode)
  const matchingCustomFills = customFillLibrary
    .filter((fill) => fill?.fill_length_type === targetLengthType)
    .map(buildFillPhraseFromStoredPattern)
    .filter(Boolean)
  const selected = fillIndexes
    .map((index) => source[index])
    .filter(Boolean)

  if (fillPatternMode === 'created') {
    if (matchingCustomFills.length) return matchingCustomFills
    if (fillLengthMode === '1bar') return BASIC_ONE_BAR_FILLS
    if (fillLengthMode === 'half') return BASIC_HALF_BAR_FILLS
    return BASIC_QUARTER_BAR_FILLS
  }
  if (selected.length || matchingCustomFills.length) return [...selected, ...matchingCustomFills]

  if (fillLengthMode === '1bar') {
    return fillPatternMode === 'basic' ? BASIC_ONE_BAR_FILLS : ONE_BAR_FILLS
  }
  if (fillLengthMode === 'half') {
    return fillPatternMode === 'basic' ? BASIC_HALF_BAR_FILLS : HALF_BAR_FILLS
  }
  return fillPatternMode === 'basic' ? BASIC_QUARTER_BAR_FILLS : QUARTER_BAR_FILLS
}

function getTargetLengthType(fillLengthMode) {
  return fillLengthMode === '1bar'
    ? 'full_bar'
    : fillLengthMode === 'half'
      ? 'half_bar'
      : 'quarter_bar'
}

function getCreatedCanonicalFillPool(fillLengthMode, customFillLibrary = []) {
  const targetLengthType = getTargetLengthType(fillLengthMode)
  return customFillLibrary
    .filter((fill) => fill?.fill_length_type === targetLengthType)
    .map((fill) => buildCanonicalPatternFromStoredPatternRecord(fill, fill.fill_length_type, fill.resolution))
    .filter((pattern) => pattern?.events?.length)
}

function createCanonicalPatternsFromCreatedFillLibrary(fillGenre, fillLengthMode, barCount, grooveKey, customFillLibrary = []) {
  const phraseCount = Math.max(1, Number(barCount) / 4)
  const createdPool = getCreatedCanonicalFillPool(fillLengthMode, customFillLibrary)

  if (!createdPool.length) return []

  return Array.from({ length: phraseCount }, (_, index) => {
    const picked = randomPick(createdPool)
    const phrase = wrapCreatedFillAsPracticePhrase(picked, fillGenre, grooveKey)
    return index > 0 ? addResolveHitToCanonicalPhraseStart(phrase) : phrase
  })
}

function cloneEventsWithOffset(events, tickOffset, prefix) {
  return (events || []).map((event, index) => ({
    ...event,
    id: `${prefix}-${event.id || index}`,
    startTick: event.startTick + tickOffset,
    notes: [...(event.notes || [])],
  }))
}

function getGroovePulseStepInterval(profile) {
  if (profile.value === 'triplet_8') return 1
  if (profile.value === 'triplet_16') return 2
  if (profile.value === 'straight_32') return 4
  return 2
}

function mapGrooveStepToProfileStep(sourceStep, profile, fillGenre) {
  const sourceStepsPerBeat = 4
  const targetStepsPerBeat = profile.stepsPerBar / 4
  const beatIndex = Math.floor(sourceStep / sourceStepsPerBeat)
  const offsetInBeat = sourceStep % sourceStepsPerBeat

  if (profile.value === 'triplet_8') {
    const mappedOffset = fillGenre === 'blues'
      ? [0, 1, 2, 2][offsetInBeat]
      : [0, 1, 1, 2][offsetInBeat]
    return beatIndex * targetStepsPerBeat + mappedOffset
  }

  if (profile.value === 'triplet_16') {
    const mappedOffset = fillGenre === 'blues'
      ? [0, 1, 4, 5][offsetInBeat]
      : [0, 2, 3, 5][offsetInBeat]
    return beatIndex * targetStepsPerBeat + mappedOffset
  }

  return Math.round(sourceStep * (profile.stepsPerBar / 16))
}

function getBluesTripletPulseOffsets(profile) {
  if (profile.value === 'triplet_16') return [0, 2, 4]
  return [0, 1, 2]
}

function createGrooveEventsForSelectedGroove(profile, groove, grooveKey, fillGenre, barCount = 4) {
  if (fillGenre === 'jazz' && profile.value === 'triplet_8') {
    return createTripletGenreGrooveEventsForBars(profile, fillGenre, grooveKey, barCount)
  }

  if (!groove?.hand?.length) {
    return createSimpleGrooveEventsForBars(profile, grooveKey, fillGenre, barCount)
  }

  const eventMap = new Map()
  const barTickLength = profile.stepsPerBar * profile.stepTick

  const upsertEvent = (startTick, note) => {
    const existing = eventMap.get(startTick)
    if (existing) {
      existing.notes.push(note)
      return
    }

    eventMap.set(startTick, {
      id: `groove-${startTick}`,
      startTick,
      durationTick: profile.stepTick,
      notes: [note],
      isRest: false,
    })
  }

  const handNotes = Array.isArray(groove.hand) ? groove.hand : []
  const kickSteps = Array.isArray(groove.kick) ? groove.kick : []
  const footSteps = Array.isArray(groove.foot) ? groove.foot : []

  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const barTickOffset = barIndex * barTickLength

    handNotes.forEach((symbol, sourceStep) => {
      if (!symbol) return
      const targetStep = mapGrooveStepToProfileStep(sourceStep, profile, fillGenre)
      const startTick = barTickOffset + targetStep * profile.stepTick
      const beatIndex = Math.floor(sourceStep / 4)
      const beatStartStep = beatIndex * (profile.stepsPerBar / 4)
      const isTripletProfile = profile.value === 'triplet_8' || profile.value === 'triplet_16'
      const isBluesCymbalSymbol = fillGenre === 'blues' && isTripletProfile && (symbol.includes('H') || symbol.includes('O') || symbol.includes('R'))

      if (isBluesCymbalSymbol) {
        const cymbalInstrument = symbol.includes('R') ? 'ride' : symbol.includes('O') ? 'hihat_open' : 'hihat_close'
        getBluesTripletPulseOffsets(profile).forEach((pulseOffset) => {
          upsertEvent(
            barTickOffset + (beatStartStep + pulseOffset) * profile.stepTick,
            { instrument: cymbalInstrument }
          )
        })
      } else {
        if (symbol.includes('R')) upsertEvent(startTick, { instrument: 'ride' })
        if (symbol.includes('O')) upsertEvent(startTick, { instrument: 'hihat_open' })
        else if (symbol.includes('H')) upsertEvent(startTick, { instrument: 'hihat_close' })
      }

      if (symbol.includes('S')) upsertEvent(startTick, { instrument: 'snare' })
    })

    kickSteps.forEach((sourceStep) => {
      const targetStep = mapGrooveStepToProfileStep(sourceStep, profile, fillGenre)
      upsertEvent(barTickOffset + targetStep * profile.stepTick, { instrument: 'bass_drum' })
    })

    footSteps.forEach((sourceStep) => {
      const targetStep = mapGrooveStepToProfileStep(sourceStep, profile, fillGenre)
      upsertEvent(barTickOffset + targetStep * profile.stepTick, { instrument: 'foot_hihat' })
    })
  }

  return [...eventMap.values()].map((event) => ({
    ...event,
    notes: dedupeResolveNotes(event.notes),
  })).sort((a, b) => a.startTick - b.startTick)
}

function getTripletLateOffset(stepsPerBeat) {
  return Math.max(1, Math.round((stepsPerBeat * 2) / 3))
}

function getJazzRideOffsetsForBeat(beatIndex, stepsPerBeat) {
  const lateOffset = getTripletLateOffset(stepsPerBeat)

  if (beatIndex % 2 === 0) return [0]
  return [0, lateOffset]
}

function getJazzRideStepArrayForBar(stepsPerBeat) {
  return Array.from({ length: 4 }, (_, beatIndex) => getJazzRideOffsetsForBeat(beatIndex, stepsPerBeat))
}

function getJazzRideStepSetForBar(stepsPerBeat) {
  const stepSet = new Set()

  getJazzRideStepArrayForBar(stepsPerBeat).forEach((offsets, beatIndex) => {
    const beatStart = beatIndex * stepsPerBeat
    offsets.forEach((stepOffset) => {
      stepSet.add(beatStart + stepOffset)
    })
  })

  return stepSet
}

function createTripletGenreGrooveEventsForBars(profile, fillGenre, grooveKey, barCount = 4) {
  const eventMap = new Map()
  const stepsPerBeat = profile.stepsPerBar / 4
  const barTickLength = profile.stepsPerBar * profile.stepTick
  const cymbalInstrument = fillGenre === 'jazz' || grooveKey === 'ride' ? 'ride' : 'hihat_close'
  const lateOffset = getTripletLateOffset(stepsPerBeat)
  const jazzRideStepSetForBar = fillGenre === 'jazz' ? getJazzRideStepSetForBar(stepsPerBeat) : null

  const upsertEvent = (startTick, note) => {
    const existing = eventMap.get(startTick)
    if (existing) {
      existing.notes.push(note)
      return
    }
    eventMap.set(startTick, {
      id: `groove-${startTick}`,
      startTick,
      durationTick: profile.stepTick,
      notes: [note],
      isRest: false,
    })
  }

  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const barTickOffset = barIndex * barTickLength

    for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
      const beatStart = barTickOffset + beatIndex * stepsPerBeat * profile.stepTick

      if (fillGenre === 'blues') {
        upsertEvent(beatStart, { instrument: cymbalInstrument })
        upsertEvent(beatStart + lateOffset * profile.stepTick, { instrument: cymbalInstrument })
      } else if (fillGenre === 'jazz') {
        for (let stepOffset = 0; stepOffset < stepsPerBeat; stepOffset += 1) {
          const stepInBar = beatIndex * stepsPerBeat + stepOffset
          if (!jazzRideStepSetForBar.has(stepInBar)) continue
          upsertEvent(beatStart + stepOffset * profile.stepTick, { instrument: 'ride' })
        }
        upsertEvent(beatStart, { instrument: 'bass_drum' })
        if (beatIndex === 1 || beatIndex === 3) {
          upsertEvent(beatStart, { instrument: 'foot_hihat' })
        }
      } else {
        upsertEvent(beatStart, { instrument: cymbalInstrument })
      }
    }

    if (fillGenre !== 'jazz') {
      ;[0, 2].forEach((beatIndex) => {
        upsertEvent(
          barTickOffset + beatIndex * stepsPerBeat * profile.stepTick,
          { instrument: 'bass_drum' }
        )
      })

      ;[1, 3].forEach((beatIndex) => {
        upsertEvent(
          barTickOffset + beatIndex * stepsPerBeat * profile.stepTick,
          { instrument: 'snare' }
        )
      })
    }
  }

  return [...eventMap.values()].map((event) => ({
    ...event,
    notes: dedupeResolveNotes(event.notes),
  })).sort((a, b) => a.startTick - b.startTick)
}

function createSimpleGrooveEventsForBars(profile, grooveKey, fillGenre = 'rock', barCount = 4) {
  if (profile.value === 'triplet_8' || profile.value === 'triplet_16') {
    return createTripletGenreGrooveEventsForBars(profile, fillGenre, grooveKey, barCount)
  }

  const eventMap = new Map()
  const stepsPerBeat = profile.stepsPerBar / 4
  const barTickLength = profile.stepsPerBar * profile.stepTick
  const cymbalInstrument = fillGenre === 'jazz' || grooveKey === 'ride' ? 'ride' : 'hihat_close'
  const pulseInterval = getGroovePulseStepInterval(profile)

  const upsertEvent = (startTick, note) => {
    const existing = eventMap.get(startTick)
    if (existing) {
      existing.notes.push(note)
      return
    }
    eventMap.set(startTick, {
      id: `groove-${startTick}`,
      startTick,
      durationTick: profile.stepTick,
      notes: [note],
      isRest: false,
    })
  }

  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const barTickOffset = barIndex * barTickLength

    for (let step = 0; step < profile.stepsPerBar; step += pulseInterval) {
      upsertEvent(
        barTickOffset + step * profile.stepTick,
        { instrument: cymbalInstrument }
      )
    }

    if (fillGenre === 'jazz') {
      ;[0, 1, 2, 3].forEach((beatIndex) => {
        upsertEvent(
          barTickOffset + beatIndex * stepsPerBeat * profile.stepTick,
          { instrument: 'bass_drum' }
        )
      })

      ;[1, 3].forEach((beatIndex) => {
        upsertEvent(
          barTickOffset + beatIndex * stepsPerBeat * profile.stepTick,
          { instrument: 'foot_hihat' }
        )
      })

      continue
    }

    ;[0, 2].forEach((beatIndex) => {
      upsertEvent(
        barTickOffset + beatIndex * stepsPerBeat * profile.stepTick,
        { instrument: 'bass_drum' }
      )
    })

    ;[1, 3].forEach((beatIndex) => {
      upsertEvent(
        barTickOffset + beatIndex * stepsPerBeat * profile.stepTick,
        { instrument: 'snare' }
      )
    })
  }

  return [...eventMap.values()].sort((a, b) => a.startTick - b.startTick)
}

function wrapCreatedFillAsPracticePhrase(fillPattern, fillGenre = 'rock', grooveKey = 'straight') {
  const profile = getGridProfile(fillPattern.gridProfile)
  const practiceBarCount = 4
  const barTickLength = profile.stepsPerBar * profile.stepTick
  const totalTicks = barTickLength * practiceBarCount
  const fillTotalTicks = fillPattern.totalTicks || barTickLength
  const fillStartTick = Math.max(0, totalTicks - fillTotalTicks)
  const groovePool = getGenreGroovePool(fillGenre, grooveKey)
  const selectedGroove = randomPick(groovePool)

  const grooveEvents = createGrooveEventsForSelectedGroove(
    profile,
    selectedGroove,
    grooveKey,
    fillGenre,
    practiceBarCount
  )
    .filter((event) => event.startTick < fillStartTick)

  const shiftedFillEvents = cloneEventsWithOffset(
    fillPattern.events || [],
    fillStartTick,
    'created-fill'
  )

  return createCanonicalPattern({
    patternKind: 'fill',
    gridProfile: profile.value,
    fillLengthType: 'full_bar',
    totalTicks,
    events: [...grooveEvents, ...shiftedFillEvents].sort((a, b) => a.startTick - b.startTick),
    metadata: {
      ...(fillPattern.metadata || {}),
      source: 'custom_fill_library',
      practiceWrapped: true,
    },
  })
}

function createSingleFillPhrase(fillGenre, grooveKey, fillLengthMode, fillPatternMode, allowOpenHiHat, customFillLibrary = []) {
  const groovePool = getGenreGroovePool(fillGenre, grooveKey)
  const selectedGroove = randomPick(groovePool)
  const fillPool = getFillLibrary(fillGenre, fillLengthMode, fillPatternMode, customFillLibrary)

  let accentRow = Array(64).fill('')
  const kickRow = Array(64).fill('')
  const restMarks = Array(64).fill(false)

  for (let bar = 0; bar < 4; bar += 1) {
    const grooveBar = createBarFromGroove(selectedGroove, grooveKey, allowOpenHiHat)
    for (let i = 0; i < 16; i += 1) {
      const step = bar * 16 + i
      accentRow[step] = grooveBar.accentRow[i]
      kickRow[step] = grooveBar.kickRow[i]
    }
  }

  if (fillLengthMode === '1bar') {
    const fill = maybeOpenHiHatInFill(randomPick(fillPool), allowOpenHiHat)
    accentRow = maybeOpenHiHatBeforeFill(accentRow, fillLengthMode, allowOpenHiHat)
    applyFillToBars(accentRow, kickRow, restMarks, 3, fill)
    return {
      accentRow,
      kickRow,
      restMarks,
      stepsPerBar: 16,
      totalSteps: 64,
      needsNextCrash: fill.resolve === 'nextCrash',
    }
  } else if (fillLengthMode === 'half') {
    const fill = maybeOpenHiHatInFill(randomPick(fillPool), allowOpenHiHat)
    accentRow = maybeOpenHiHatBeforeFill(accentRow, fillLengthMode, allowOpenHiHat)
    applySectionAtStep(accentRow, kickRow, 56, fill)
    applyRestMarks(restMarks, 56, fill)
    return {
      accentRow,
      kickRow,
      restMarks,
      stepsPerBar: 16,
      totalSteps: 64,
      needsNextCrash: fill.resolve === 'nextCrash',
    }
  } else if (fillLengthMode === 'quarter') {
    const fill = maybeOpenHiHatInFill(randomPick(fillPool), allowOpenHiHat)
    accentRow = maybeOpenHiHatBeforeFill(accentRow, fillLengthMode, allowOpenHiHat)
    applySectionAtStep(accentRow, kickRow, 60, fill)
    applyRestMarks(restMarks, 60, fill)
    return {
      accentRow,
      kickRow,
      restMarks,
      stepsPerBar: 16,
      totalSteps: 64,
      needsNextCrash: fill.resolve === 'nextCrash',
    }
  }

  return {
    accentRow,
    kickRow,
    restMarks,
    stepsPerBar: 16,
    totalSteps: 64,
    needsNextCrash: false,
  }
}

function mergeNotationToken(existingValue, nextValue) {
  const combined = `${existingValue || ''}${nextValue || ''}`
  return [...new Set(combined.split('').filter(Boolean))].join('')
}

function getGrooveSectionBeatCount(fillLengthMode) {
  if (fillLengthMode === 'half') return 14
  if (fillLengthMode === 'quarter') return 15
  return 12
}

function getBeatCymbalToken(accentRow, beatStartStep, stepsPerBeat) {
  const beatSymbols = Array.from({ length: stepsPerBeat }, (_, offset) => String(accentRow?.[beatStartStep + offset] || ''))

  if (beatSymbols.some((symbol) => symbol.includes('O'))) return 'O'
  if (beatSymbols.some((symbol) => symbol.includes('R'))) return 'R'
  if (beatSymbols.some((symbol) => symbol.includes('H'))) return 'H'
  return ''
}

function applyFullBluesTripletCymbalPulse(accentRow, targetProfile, fillLengthMode) {
  if (!Array.isArray(accentRow) || targetProfile.value !== 'triplet_8') return accentRow

  const nextAccentRow = [...accentRow]
  const targetStepsPerBeat = targetProfile.stepsPerBar / 4
  const grooveBeatCount = getGrooveSectionBeatCount(fillLengthMode)

  for (let beatIndex = 0; beatIndex < grooveBeatCount; beatIndex += 1) {
    const targetBeatStart = beatIndex * targetStepsPerBeat
    const cymbalToken = getBeatCymbalToken(accentRow, targetBeatStart, targetStepsPerBeat)
    if (!cymbalToken) continue

    for (let pulseOffset = 0; pulseOffset < targetStepsPerBeat; pulseOffset += 1) {
      const targetIndex = targetBeatStart + pulseOffset
      nextAccentRow[targetIndex] = mergeNotationToken(nextAccentRow[targetIndex], cymbalToken)
    }
  }

  return nextAccentRow
}

function applyJazzTripletRideGroove(accentRow, kickRow, restMarks, targetProfile, fillLengthMode) {
  if (!Array.isArray(accentRow) || !Array.isArray(kickRow) || targetProfile.value !== 'triplet_8') {
    return { accentRow, kickRow, restMarks }
  }

  const nextAccentRow = [...accentRow]
  const nextKickRow = [...kickRow]
  const nextRestMarks = Array.isArray(restMarks) ? [...restMarks] : Array(accentRow.length).fill(false)
  const stepsPerBeat = targetProfile.stepsPerBar / 4
  const grooveBeatCount = getGrooveSectionBeatCount(fillLengthMode)
  const jazzRideStepSetForBar = getJazzRideStepSetForBar(stepsPerBeat)

  for (let beatIndex = 0; beatIndex < grooveBeatCount; beatIndex += 1) {
    const beatStart = beatIndex * stepsPerBeat
    const beatInBar = beatIndex % 4

    for (let stepOffset = 0; stepOffset < stepsPerBeat; stepOffset += 1) {
      nextAccentRow[beatStart + stepOffset] = ''
      nextKickRow[beatStart + stepOffset] = ''
      nextRestMarks[beatStart + stepOffset] = false
    }

    for (let stepOffset = 0; stepOffset < stepsPerBeat; stepOffset += 1) {
      const stepInBar = beatInBar * stepsPerBeat + stepOffset
      if (!jazzRideStepSetForBar.has(stepInBar)) continue
      nextAccentRow[beatStart + stepOffset] = mergeNotationToken(nextAccentRow[beatStart + stepOffset], 'R')
    }

    nextKickRow[beatStart] = appendLowerVoiceToken(nextKickRow[beatStart], LOWER_VOICE_BASS)

    if (beatIndex % 4 === 1 || beatIndex % 4 === 3) {
      nextKickRow[beatStart] = appendLowerVoiceToken(nextKickRow[beatStart], LOWER_VOICE_FOOT_HIHAT)
    }
  }

  return {
    accentRow: nextAccentRow,
    kickRow: nextKickRow,
    restMarks: nextRestMarks,
  }
}

function remapLegacyPhraseToResolution(pattern, targetResolution, fillGenre, fillLengthMode) {
  if (!pattern?.stepsPerBar || !targetResolution) return pattern

  const targetProfile = getGridProfile(targetResolution)
  const sourceStepsPerBar = pattern.stepsPerBar || 16
  if (targetProfile.stepsPerBar === sourceStepsPerBar) {
    return {
      ...pattern,
      resolution: targetResolution,
    }
  }

  const barCount = Math.max(1, Math.ceil((pattern.totalSteps || pattern.accentRow?.length || 0) / sourceStepsPerBar))
  const totalSteps = barCount * targetProfile.stepsPerBar
  const accentRow = Array(totalSteps).fill('')
  const kickRow = Array(totalSteps).fill('')
  const restMarks = Array(totalSteps).fill(false)

  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    for (let sourceStep = 0; sourceStep < sourceStepsPerBar; sourceStep += 1) {
      const sourceIndex = barIndex * sourceStepsPerBar + sourceStep
      const targetStep = mapGrooveStepToProfileStep(sourceStep, targetProfile, fillGenre)
      const targetIndex = barIndex * targetProfile.stepsPerBar + targetStep

      accentRow[targetIndex] = mergeNotationToken(accentRow[targetIndex], pattern.accentRow?.[sourceIndex] || '')
      kickRow[targetIndex] = mergeNotationToken(kickRow[targetIndex], pattern.kickRow?.[sourceIndex] || '')
      restMarks[targetIndex] = restMarks[targetIndex] || Boolean(pattern.restMarks?.[sourceIndex])
    }
  }

  if (fillGenre === 'blues') {
    const perPhraseSourceSteps = pattern.totalSteps || pattern.accentRow?.length || 0
    const phraseCount = Math.max(1, Math.round(perPhraseSourceSteps / 64))

    for (let phraseIndex = 0; phraseIndex < phraseCount; phraseIndex += 1) {
      const phraseStart = phraseIndex * targetProfile.stepsPerBar * 4
      const phraseSlice = accentRow.slice(phraseStart, phraseStart + targetProfile.stepsPerBar * 4)
      const adjustedSlice = applyFullBluesTripletCymbalPulse(phraseSlice, targetProfile, fillLengthMode)
      adjustedSlice.forEach((value, index) => {
        accentRow[phraseStart + index] = value
      })
    }
  }

  if (fillGenre === 'jazz' && targetProfile.value === 'triplet_8') {
    const jazzGroove = applyJazzTripletRideGroove(accentRow, kickRow, restMarks, targetProfile, fillLengthMode)
    jazzGroove.accentRow.forEach((value, index) => {
      accentRow[index] = value
    })
    jazzGroove.kickRow.forEach((value, index) => {
      kickRow[index] = value
    })
    jazzGroove.restMarks.forEach((value, index) => {
      restMarks[index] = value
    })
  }

  return {
    ...pattern,
    accentRow,
    kickRow,
    restMarks,
    stepsPerBar: targetProfile.stepsPerBar,
    totalSteps,
    resolution: targetResolution,
  }
}

import { getTranscribedPattern } from './fillinData'

function createCurriculumPhrase(patternNo, fillGenre, grooveKey, allowOpenHiHat) {
  const transcribed = getTranscribedPattern(patternNo)
  const groovePool = getGenreGroovePool(fillGenre, grooveKey)
  const selectedGroove = randomPick(groovePool)

  let accentRow = Array(64).fill('')
  const kickRow = Array(64).fill('')

  // 100連発カリキュラムの基本は固定グルーヴ（デフォルト3小節）＋フィル
  const grooveBars = transcribed.grooveBars || 3
  
  for (let bar = 0; bar < 4; bar += 1) {
    const grooveBar = createBarFromGroove(selectedGroove, grooveKey, allowOpenHiHat)
    for (let i = 0; i < 16; i += 1) {
      const step = bar * 16 + i
      accentRow[step] = grooveBar.accentRow[i]
      kickRow[step] = grooveBar.kickRow[i]
    }
  }

  // フィルイン部分の上書き
  const fillStart = grooveBars * 16
  const fillLength = transcribed.hand.length
  
  for (let i = 0; i < fillLength; i += 1) {
    if (transcribed.hand[i] !== undefined && fillStart + i < 64) {
      accentRow[fillStart + i] = transcribed.hand[i]
    }
    if (fillStart + i < 64) {
      kickRow[fillStart + i] = ''
    }
  }
  
  transcribed.kick.forEach(k => {
    if (k >= 0 && fillStart + k < 64) {
      kickRow[fillStart + k] = '●'
    }
  })

  return {
    accentRow,
    kickRow,
    stepsPerBar: 16,
    totalSteps: 64,
    needsNextCrash: true,
  }
}

export function createFillInPracticePatterns(fillGenre, grooveKey, fillLengthMode, fillPatternMode, barCount, allowOpenHiHat, notationEngine, customFillLibrary = []) {
  const phraseCount = Math.max(1, Number(barCount) / 4)
  const phrases = []

  for (let index = 0; index < phraseCount; index += 1) {
    let phrase
    
    // 画像モード（100連発カリキュラム）の場合は専用のトランスクリプトを使用し、長さを画像に合わせる
    if (notationEngine === 'image') {
      const patternNo = (index % 100) + 1
      phrase = createCurriculumPhrase(patternNo, fillGenre, grooveKey, allowOpenHiHat)
      // カリキュラムは原則クラッシュを着地点とする
      if (index === 0) phrase = addResolveHitToPhraseStart(phrase)
    } 
    // それ以外のVexFlow/SVGモードの場合は、ユーザーの「0.5小節」等のフィル長指定とジェネレーターを正しく適用する
    else {
      phrase = createSingleFillPhrase(fillGenre, grooveKey, fillLengthMode, fillPatternMode, allowOpenHiHat, customFillLibrary)
    }

    if (index > 0) {
      phrase = addResolveHitToPhraseStart(phrase)
    }
    
    phrases.push(phrase)
  }

  return phrases
}

export function createCanonicalFillInPracticePatterns(
  fillGenre,
  grooveKey,
  fillLengthMode,
  fillPatternMode,
  barCount,
  allowOpenHiHat,
  notationEngine,
  customFillLibrary = []
) {
  if (fillPatternMode === 'created') {
    const createdPatterns = createCanonicalPatternsFromCreatedFillLibrary(
      fillGenre,
      fillLengthMode,
      barCount,
      grooveKey,
      customFillLibrary
    )
    if (createdPatterns.length) return createdPatterns
  }

  const targetResolution = fillGenre === 'blues' || fillGenre === 'jazz' ? '8th_triplet' : '16th'

  return createFillInPracticePatterns(
    fillGenre,
    grooveKey,
    fillLengthMode,
    fillPatternMode,
    barCount,
    allowOpenHiHat,
    notationEngine,
    customFillLibrary
  ).map((pattern) => remapLegacyPhraseToResolution(pattern, targetResolution, fillGenre, fillLengthMode))
    .map((pattern) => legacyNotationPatternToCanonical(pattern, {
    patternKind: 'fill',
    isAccentExercise: false,
    fillLengthType: 'full_bar',
    resolution: targetResolution,
  }))
}
