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

export function getStepsPerBar(noteType) {
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
      map[pos] = 'altTom'
      return
    }

    const roll = Math.random()
    if (roll < 0.45) {
      map[pos] = 'crash'
    } else {
      map[pos] = 'altTom'
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
    else if (type === 'altTom') accentRow[pos] = '△'
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

function clonePattern(pattern) {
  return {
    accentRow: [...pattern.accentRow],
    kickRow: [...pattern.kickRow],
    stepsPerBar: pattern.stepsPerBar,
    totalSteps: pattern.totalSteps,
  }
}

function appendPattern(target, source) {
  target.accentRow.push(...source.accentRow)
  target.kickRow.push(...source.kickRow)
  target.totalSteps += source.totalSteps
}

function createTwoBarAccentPattern(noteType, difficulty, orchestration, kickSetting) {
  return createFullPattern(noteType, difficulty, 2, orchestration, kickSetting)
}

function createAccentPagePatterns(noteType, difficulty, fixedBars, orchestration, kickSetting) {
  const normalizedFixedBars = Math.max(2, Number(fixedBars) || 16)
  const fixedBlockBars = Math.min(TOTAL_BARS_PER_PAGE, normalizedFixedBars)
  const stepsPerBar = getStepsPerBar(noteType)
  const repeatCountPerBlock = Math.max(1, fixedBlockBars / 2)
  const fullPagePattern = {
    accentRow: [],
    kickRow: [],
    stepsPerBar,
    totalSteps: 0,
  }

  for (let blockStart = 0; blockStart < TOTAL_BARS_PER_PAGE; blockStart += fixedBlockBars) {
    const seedPattern = createTwoBarAccentPattern(noteType, difficulty, orchestration, kickSetting)
    for (let repeatIndex = 0; repeatIndex < repeatCountPerBlock; repeatIndex += 1) {
      appendPattern(fullPagePattern, clonePattern(seedPattern))
    }
  }

  const barsPerRow = 4
  const rowTotalSteps = barsPerRow * stepsPerBar
  const rowCount = TOTAL_BARS_PER_PAGE / barsPerRow

  return Array.from({ length: rowCount }, (_, index) => {
    const start = index * rowTotalSteps
    const end = start + rowTotalSteps
    return {
      accentRow: fullPagePattern.accentRow.slice(start, end),
      kickRow: fullPagePattern.kickRow.slice(start, end),
      stepsPerBar,
      totalSteps: rowTotalSteps,
    }
  })
}

export function createPagePatterns(noteType, difficulty, bars, orchestration, kickSetting) {
  return createAccentPagePatterns(noteType, difficulty, bars, orchestration, kickSetting)
}
