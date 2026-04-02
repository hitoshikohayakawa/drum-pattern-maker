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
  const candidateIndexes = []

  nextHand.forEach((symbol, index) => {
    if (symbol === 'H' || symbol === 'HS') candidateIndexes.push(index)
  })

  if (candidateIndexes.length) {
    const targetIndex = randomPick(candidateIndexes)
    nextHand[targetIndex] = replaceHiHatWithOpen(nextHand[targetIndex])
    return { ...fill, hand: nextHand }
  }

  return fill
}

function maybeOpenHiHatInGrooveBar(accentRow, grooveKey, allowOpenHiHat) {
  if (!allowOpenHiHat || grooveKey === 'ride') return accentRow
  const nextAccentRow = [...accentRow]
  const preferredIndexes = Math.random() < 0.5 ? [14] : [6, 14]

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

function createBarFromGroove(groove, grooveKey, allowOpenHiHat = false) {
  let accentRow = Array(16).fill('')
  const kickRow = Array(16).fill('')
  groove.hand.forEach((symbol, index) => {
    accentRow[index] = symbol || ''
  })
  accentRow = maybeOpenHiHatInGrooveBar(accentRow, grooveKey, allowOpenHiHat)
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

function addCrashToPhraseStart(pattern) {
  if (!pattern?.accentRow?.length) return pattern
  const nextAccentRow = [...pattern.accentRow]
  nextAccentRow[0] = 'C'
  return {
    ...pattern,
    accentRow: nextAccentRow,
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

function getGenreGroovePool(fillGenre, grooveKey) {
  const genreProfile = getGenreProfile(fillGenre)
  if (grooveKey === 'random') return genreProfile.groovePool
  if (grooveKey === 'straight') return GENRE_GROOVE_LIBRARY[fillGenre] || genreProfile.groovePool
  return BASIC_EIGHT_BEAT_LIBRARY[grooveKey] || genreProfile.groovePool
}

function getFillLibrary(fillGenre, fillLengthMode, fillPatternMode) {
  const genreProfile = getGenreProfile(fillGenre)
  const fillIndexes = genreProfile.fills[fillPatternMode]?.[fillLengthMode] || []
  const source = getBaseFillCollection(fillLengthMode)
  const selected = fillIndexes
    .map((index) => source[index])
    .filter(Boolean)

  if (selected.length) return selected

  if (fillLengthMode === '1bar') {
    return fillPatternMode === 'basic' ? BASIC_ONE_BAR_FILLS : ONE_BAR_FILLS
  }
  if (fillLengthMode === 'half') {
    return fillPatternMode === 'basic' ? BASIC_HALF_BAR_FILLS : HALF_BAR_FILLS
  }
  return fillPatternMode === 'basic' ? BASIC_QUARTER_BAR_FILLS : QUARTER_BAR_FILLS
}

function createSingleFillPhrase(fillGenre, grooveKey, fillLengthMode, fillPatternMode, allowOpenHiHat) {
  const groovePool = getGenreGroovePool(fillGenre, grooveKey)
  const selectedGroove = randomPick(groovePool)
  const fillPool = getFillLibrary(fillGenre, fillLengthMode, fillPatternMode)

  let accentRow = Array(64).fill('')
  const kickRow = Array(64).fill('')

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
    applyFillToBars(accentRow, kickRow, 3, fill)
    return {
      accentRow,
      kickRow,
      stepsPerBar: 16,
      totalSteps: 64,
      needsNextCrash: fill.resolve === 'nextCrash',
    }
  } else if (fillLengthMode === 'half') {
    const fill = maybeOpenHiHatInFill(randomPick(fillPool), allowOpenHiHat)
    accentRow = maybeOpenHiHatBeforeFill(accentRow, fillLengthMode, allowOpenHiHat)
    applySectionAtStep(accentRow, kickRow, 56, fill)
    return {
      accentRow,
      kickRow,
      stepsPerBar: 16,
      totalSteps: 64,
      needsNextCrash: fill.resolve === 'nextCrash',
    }
  } else if (fillLengthMode === 'quarter') {
    const fill = maybeOpenHiHatInFill(randomPick(fillPool), allowOpenHiHat)
    accentRow = maybeOpenHiHatBeforeFill(accentRow, fillLengthMode, allowOpenHiHat)
    applySectionAtStep(accentRow, kickRow, 60, fill)
    return {
      accentRow,
      kickRow,
      stepsPerBar: 16,
      totalSteps: 64,
      needsNextCrash: fill.resolve === 'nextCrash',
    }
  }

  return {
    accentRow,
    kickRow,
    stepsPerBar: 16,
    totalSteps: 64,
    needsNextCrash: false,
  }
}

export function createFillInPracticePatterns(fillGenre, grooveKey, fillLengthMode, fillPatternMode, barCount, allowOpenHiHat) {
  const phraseCount = Math.max(1, Number(barCount) / 4)
  const phrases = []

  for (let index = 0; index < phraseCount; index += 1) {
    let phrase = createSingleFillPhrase(fillGenre, grooveKey, fillLengthMode, fillPatternMode, allowOpenHiHat)
    const previousPhrase = phrases[index - 1]
    if (previousPhrase?.needsNextCrash) {
      phrase = addCrashToPhraseStart(phrase)
    }
    phrases.push(phrase)
  }

  return phrases
}
