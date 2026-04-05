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
  for (let i = 0; i < section.hand.length; i += 1) {
    accentRow[startStep + i] = ''
    kickRow[startStep + i] = ''
  }
  section.hand.forEach((symbol, i) => {
    accentRow[startStep + i] = symbol || ''
  })
  section.kick.forEach((index) => {
    const target = startStep + index
    if (target >= 0 && target < kickRow.length) kickRow[target] = '●'
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
    if (target >= 0 && target < kickRow.length) kickRow[target] = '●'
  })
  applyRestMarks(restMarks, start, fill)
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
  const targetLengthType =
    fillLengthMode === '1bar' ? 'full_bar' : fillLengthMode === 'half' ? 'half_bar' : 'quarter_bar'
  const matchingCustomFills = customFillLibrary
    .filter((fill) => fill?.fill_length_type === targetLengthType)
    .map(normalizeCustomFill)
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
      if (index === 0) phrase = addCrashToPhraseStart(phrase)
    } 
    // それ以外のVexFlow/SVGモードの場合は、ユーザーの「0.5小節」等のフィル長指定とジェネレーターを正しく適用する
    else {
      phrase = createSingleFillPhrase(fillGenre, grooveKey, fillLengthMode, fillPatternMode, allowOpenHiHat, customFillLibrary)
    }

    const previousPhrase = phrases[index - 1]
    if (previousPhrase?.needsNextCrash) {
      phrase = addCrashToPhraseStart(phrase)
    } else if (notationEngine === 'image' && index > 0) {
      phrase = addCrashToPhraseStart(phrase)
    }
    
    phrases.push(phrase)
  }

  return phrases
}
