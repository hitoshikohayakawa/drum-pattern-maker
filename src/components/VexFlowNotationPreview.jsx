import { useEffect, useRef, useState } from 'react'

function getDurationCode(noteType, mode) {
  if (mode === 'fillin') return '16'
  if (noteType === '4th') return '4'
  if (noteType === '8th') return '8'
  return '16'
}

function getStepCountForBar(noteType, mode) {
  if (mode === 'fillin') return 16
  if (noteType === '4th') return 4
  if (noteType === '8th') return 8
  return 16
}

function getAccentChord(symbol) {
  if (symbol === '✕') return ['g/5/cx']
  if (symbol === '△') return ['e/5']
  if (symbol === '▲') return ['b/4']
  return ['c/5']
}

function getUpperFillChord(symbol) {
  if (!symbol) return null
  if (symbol === '✕' || symbol === 'C' || symbol === 'R') return ['g/5/cx']
  if (symbol === 'H' || symbol === 'O') return ['g/5/x2']

  if (typeof symbol === 'string') {
    if (symbol.includes('R')) return ['g/5/cx']
    if (symbol.includes('C') || symbol.includes('✕')) return ['g/5/cx']
    if (symbol.includes('H') || symbol.includes('O')) return ['g/5/x2']
  }

  return null
}

function getLowerFillChord(symbol, hasKick = false) {
  const keys = []
  const normalized = typeof symbol === 'string' ? symbol : ''

  if (normalized === 'S' || normalized === '＜') keys.push('c/5')
  if (normalized === 'T' || normalized === '△') keys.push('e/5')
  if (normalized === 'M') keys.push('d/5')
  if (normalized === 'F' || normalized === '▲') keys.push('b/4')

  if (normalized.includes('S')) keys.push('c/5')
  if (normalized.includes('T')) keys.push('e/5')
  if (normalized.includes('M')) keys.push('d/5')
  if (normalized.includes('F')) keys.push('b/4')
  if (normalized.includes('△')) keys.push('e/5')
  if (normalized.includes('▲')) keys.push('b/4')

  if (hasKick) keys.push('f/4')

  return [...new Set(keys)]
}

function createGhostNote(vexflow, duration) {
  const { GhostNote } = vexflow
  return new GhostNote({ duration })
}

function applyStemTuning(note, stemDirection, stemLength = 30) {
  note.setStemDirection(stemDirection)
  if (typeof note.setStemLength === 'function') {
    note.setStemLength(stemLength)
  }
  return note
}

function isUpperSymbolFilled(symbol) {
  return Boolean(getUpperFillChord(symbol))
}

function getActiveWithinSpan(activeStepIndex, startIndex, span) {
  if (activeStepIndex == null) return false
  return activeStepIndex >= startIndex && activeStepIndex < startIndex + span
}

function getLargestSpan(startIndex, barStartIndex, maxSpanSteps, slots, isFilled) {
  const offsetInBar = startIndex - barStartIndex
  const candidates = [
    { span: 4, duration: '4' },
    { span: 2, duration: '8' },
    { span: 1, duration: '16' },
  ]

  for (const candidate of candidates) {
    if (candidate.span > maxSpanSteps) continue
    if (offsetInBar % candidate.span !== 0) continue

    let valid = true
    for (let index = 1; index < candidate.span; index += 1) {
      if (isFilled(slots[startIndex + index])) {
        valid = false
        break
      }
    }

    if (valid) return candidate
  }

  return { span: 1, duration: '16' }
}

function buildCompactedVoice({
  vexflow,
  slots,
  stepsPerBar,
  barCount,
  activeStepIndex,
  isFilled,
  createVisibleNote,
}) {
  const tickables = []
  const beamGroups = Array.from({ length: barCount }, () => [])

  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const barStartIndex = barIndex * stepsPerBar
    const barEndIndex = barStartIndex + stepsPerBar
    let stepIndex = barStartIndex

    while (stepIndex < barEndIndex) {
      const symbol = slots[stepIndex]
      const filled = isFilled(symbol)
      const maxSpanSteps = barEndIndex - stepIndex
      const { span, duration } = getLargestSpan(
        stepIndex,
        barStartIndex,
        maxSpanSteps,
        slots,
        isFilled
      )

      if (filled) {
        const note = createVisibleNote(
          symbol,
          duration,
          getActiveWithinSpan(activeStepIndex, stepIndex, span)
        )
        tickables.push(note)
        beamGroups[barIndex].push(note)
      } else {
        tickables.push(createGhostNote(vexflow, duration))
      }

      stepIndex += span
    }
  }

  return { tickables, beamGroups }
}

function getBeamGroupFractions(vexflow, noteType, mode) {
  const { Fraction } = vexflow

  if (mode === 'fillin') {
    return [new Fraction(1, 4)]
  }

  if (noteType === '8th') {
    return [new Fraction(1, 4)]
  }

  if (noteType === '16th') {
    return [new Fraction(1, 4)]
  }

  return null
}

function createUpperNote(vexflow, symbol, duration, isActive) {
  const { Articulation, ModifierPosition, StaveNote } = vexflow
  const keys = getUpperFillChord(symbol)
  if (!keys) return createGhostNote(vexflow, duration)

  const note = applyStemTuning(new StaveNote({
    keys,
    duration,
    clef: 'percussion',
    stem_direction: 1,
  }), 1, duration === '16' ? 26 : 30)

  if (symbol === '＜') {
    note.addModifier(new Articulation('a>').setPosition(ModifierPosition.ABOVE), 0)
  }

  if (symbol === 'O' || (typeof symbol === 'string' && symbol.includes('O'))) {
    note.addModifier(new Articulation('ah').setPosition(ModifierPosition.ABOVE), 0)
  }

  if (isActive) {
    note.setStyle({
      fillStyle: '#9acd32',
      strokeStyle: '#9acd32',
    })
  }

  return note
}

function createLowerFillNote(vexflow, symbol, hasKick, duration, isActive) {
  const { Articulation, ModifierPosition, StaveNote } = vexflow
  const keys = getLowerFillChord(symbol, hasKick)
  if (!keys.length) return createGhostNote(vexflow, duration)

  const hasDrumHeadAboveKick = keys.some((key) => key !== 'f/4')
  const stemDirection = hasDrumHeadAboveKick ? 1 : -1
  const stemLength = duration === '16' ? 24 : 28

  const note = applyStemTuning(new StaveNote({
    keys,
    duration,
    clef: 'percussion',
    stem_direction: stemDirection,
  }), stemDirection, stemLength)

  if (symbol === '＜' || (typeof symbol === 'string' && symbol.includes('＜'))) {
    note.addModifier(new Articulation('a>').setPosition(ModifierPosition.ABOVE), 0)
  }

  if (isActive) {
    note.setStyle({
      fillStyle: '#9acd32',
      strokeStyle: '#9acd32',
    })
  }

  return note
}

function createAccentNote(vexflow, symbol, duration, isActive) {
  const { Articulation, ModifierPosition, StaveNote } = vexflow
  const normalizedSymbol = symbol || ''
  const note = applyStemTuning(new StaveNote({
    keys: getAccentChord(normalizedSymbol),
    duration,
    clef: 'percussion',
    stem_direction: 1,
  }), 1, duration === '16' ? 26 : 30)

  if (normalizedSymbol) {
    note.addModifier(new Articulation('a>').setPosition(ModifierPosition.ABOVE), 0)
  }

  if (isActive) {
    note.setStyle({
      fillStyle: '#9acd32',
      strokeStyle: '#9acd32',
    })
  }

  return note
}

function createKickNote(vexflow, hasKick, duration, isActive) {
  const { StaveNote } = vexflow
  if (!hasKick) return createGhostNote(vexflow, duration)

  const note = applyStemTuning(new StaveNote({
    keys: ['f/4'],
    duration,
    clef: 'percussion',
    stem_direction: -1,
  }), -1, duration === '16' ? 24 : 28)

  if (hasKick && isActive) {
    note.setStyle({
      fillStyle: '#9acd32',
      strokeStyle: '#9acd32',
    })
  }

  return note
}

export default function VexFlowNotationPreview({
  pattern,
  noteType,
  mode = 'accent',
  activeStepIndex = null,
}) {
  const containerRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateWidth = () => {
      setContainerWidth(node.clientWidth || 0)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !pattern?.stepsPerBar) return

    let cancelled = false
    container.innerHTML = ''
    setErrorMessage('')

    async function renderPreview() {
      try {
        const vexflow = await import('../../vendor/vexflow/src/index.ts')
        const { loadBravura } = await import('../../vendor/vexflow/src/fonts/load_bravura.ts')
        if (cancelled || !containerRef.current) return

        const { Beam, Flow, Formatter, Renderer, Stave, Voice } = vexflow
        loadBravura()
        Flow.setMusicFont('Bravura')

        const duration = getDurationCode(noteType, mode)
        const stepsPerBar = pattern.stepsPerBar || getStepCountForBar(noteType, mode)
        const totalSteps = pattern.totalSteps || stepsPerBar
        const accentRow = (pattern.accentRow || []).slice(0, totalSteps)
        const kickRow = (pattern.kickRow || []).slice(0, totalSteps)
        const barCount = Math.max(1, Math.ceil(totalSteps / stepsPerBar))
        const width = Math.max(720, (containerWidth || 1120) - 8)
        const height = 164
        const staveWidth = width - 40
        const barWidth = staveWidth / barCount
        const beamGroups = getBeamGroupFractions(vexflow, noteType, mode)

        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG)
        renderer.resize(width, height)
        const context = renderer.getContext()
        context.setFont('Arial', 10, '')

        const stave = new Stave(20, 22, staveWidth)
        stave.addClef('percussion').addTimeSignature('4/4')
        stave.setContext(context).draw()

        const accentVoice =
          mode === 'accent'
            ? (() => {
              const tickables = accentRow.map((symbol, index) =>
                createAccentNote(vexflow, symbol || '', duration, activeStepIndex === index)
              )
              const beamGroups = Array.from({ length: barCount }, (_, barIndex) =>
                tickables.slice(barIndex * stepsPerBar, (barIndex + 1) * stepsPerBar)
              )
              return { tickables, beamGroups }
            })()
            : buildCompactedVoice({
              vexflow,
              slots: accentRow,
              stepsPerBar,
              barCount,
              activeStepIndex,
              isFilled: isUpperSymbolFilled,
              createVisibleNote: (symbol, noteDuration, isActive) =>
                createUpperNote(vexflow, symbol || '', noteDuration, isActive),
            })

        const lowerVoiceData =
          mode === 'accent'
            ? {
              tickables: kickRow.map((symbol, index) =>
                createKickNote(vexflow, Boolean(symbol), duration, activeStepIndex === index)
              ),
            }
            : buildCompactedVoice({
              vexflow,
              slots: Array.from({ length: totalSteps }, (_, index) => ({
                symbol: accentRow[index] || '',
                hasKick: Boolean(kickRow[index]),
              })),
              stepsPerBar,
              barCount,
              activeStepIndex,
              isFilled: (slot) => Boolean(getLowerFillChord(slot.symbol, slot.hasKick).length),
              createVisibleNote: (slot, noteDuration, isActive) =>
                createLowerFillNote(vexflow, slot.symbol, slot.hasKick, noteDuration, isActive),
            })

        const upperVoice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)
        const lowerVoice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)

        upperVoice.addTickables(accentVoice.tickables)
        lowerVoice.addTickables(lowerVoiceData.tickables)

        new Formatter().joinVoices([upperVoice, lowerVoice]).formatToStave([upperVoice, lowerVoice], stave)

        upperVoice.draw(context, stave)
        lowerVoice.draw(context, stave)

        for (let barIndex = 1; barIndex < barCount; barIndex += 1) {
          const x = 20 + barWidth * barIndex
          context.beginPath()
          context.moveTo(x, 22)
          context.lineTo(x, 22 + 40)
          context.stroke()
        }

        if (duration !== '4' && beamGroups) {
          if (mode === 'accent') {
            accentVoice.beamGroups.forEach((notesInBar) => {
              Beam.generateBeams(notesInBar, {
                groups: beamGroups,
                beam_rests: false,
                show_stemlets: false,
              }).forEach((beam) => {
                beam.setContext(context).draw()
              })
            })
          }

          if (mode === 'fillin' && lowerVoiceData.beamGroups) {
            lowerVoiceData.beamGroups.forEach((notesInBar) => {
              Beam.generateBeams(notesInBar, {
                groups: beamGroups,
                beam_rests: false,
                show_stemlets: false,
              }).forEach((beam) => {
                beam.setContext(context).draw()
              })
            })
          }
        }
      } catch (error) {
        console.error('VexFlow preview failed:', error)
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unknown VexFlow error')
        }
      }
    }

    renderPreview()

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [pattern, noteType, mode, activeStepIndex, containerWidth])

  if (errorMessage) {
    return (
      <div className="abc-preview vexflow-preview">
        <p style={{ margin: 0, color: '#8b1e3f', fontWeight: 700 }}>VexFlow beta error</p>
        <p style={{ margin: '6px 0 0', color: '#44516b' }}>{errorMessage}</p>
      </div>
    )
  }

  return <div ref={containerRef} className="abc-preview vexflow-preview" />
}
