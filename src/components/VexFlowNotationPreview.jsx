import { useEffect, useRef, useState } from 'react'

function getDurationCode(noteType, mode, resolution = '16th') {
  if (mode === 'fillin') return resolution === '32nd' ? '32' : '16'
  if (noteType === '4th') return '4'
  if (noteType === '8th') return '8'
  return '16'
}

function getStepCountForBar(noteType, mode, resolution = '16th') {
  if (mode === 'fillin') return resolution === '32nd' ? 32 : 16
  if (noteType === '4th') return 4
  if (noteType === '8th') return 8
  return 16
}

function getBeamGroupFractions(vexflow, noteType, mode) {
  const { Fraction } = vexflow

  if (mode === 'fillin') {
    return [new Fraction(1, 4)]
  }
  if (noteType === '8th') {
    return [new Fraction(2, 4)]
  }
  if (noteType === '16th') {
    return [new Fraction(1, 4)]
  }
  return [new Fraction(1, 4)]
}

function getVoice1Keys(symbol, mode, stepIndex = 0) {
  const keys = []
  const str = String(symbol || '')
  const isRightHand = stepIndex % 2 === 0
  
  if (str.includes('✕') || str.includes('C')) keys.push('g/5/cx') // Crash/Cymbal
  if (str.includes('H') || str.includes('O')) keys.push('g/5/x2') // Hihat
  if (str.includes('R')) keys.push('f/5/x2') // Ride
  if (str.includes('S') || str.includes('＜')) keys.push('c/5') // Snare
  if (str.includes('T')) keys.push('e/5') // Tom
  if (str.includes('M')) keys.push('d/5') // Mid Tom
  if (str.includes('L')) keys.push('b/4') // Low Tom
  if (str.includes('F')) keys.push('a/4') // Floor Tom
  if (str.includes('△') || str.includes('▲')) {
    keys.push(isRightHand ? 'a/4' : 'e/5')
  }

  if (keys.length === 0 && mode === 'accent') {
    keys.push('c/5') // アクセント練習モードの空枠はゴーストスネアとして扱う
  }

  return [...new Set(keys)]
}

function getVoice2Keys(symbol) {
  if (!symbol) return []
  const str = String(symbol)
  const keys = []
  if (str.includes('●')) keys.push('f/4') // Kick
  return keys
}

function createGhostNote(vexflow, duration) {
  const { GhostNote } = vexflow
  return new GhostNote({ duration })
}

function getDurationForSpan(baseDuration, span) {
  if (baseDuration === '32') {
    if (span === 8) return '4'
    if (span === 4) return '8'
    if (span === 2) return '16'
    return '32'
  }
  if (baseDuration === '16') {
    if (span === 4) return '4'
    if (span === 2) return '8'
    return '16'
  }
  if (baseDuration === '8') {
    if (span === 2) return '4'
    return '8'
  }
  return '4'
}

function getSpanCandidates(baseDuration) {
  if (baseDuration === '32') return [8, 4, 2, 1]
  if (baseDuration === '16') return [4, 2, 1]
  if (baseDuration === '8') return [2, 1]
  return [1]
}

function getLargestSpan(startIndex, barStartIndex, maxSpanSteps, slots, getKeys, baseDuration) {
  const offsetInBar = startIndex - barStartIndex
  const candidates = getSpanCandidates(baseDuration)

  for (const span of candidates) {
    if (span > maxSpanSteps) continue
    // ドラム譜特有の視認性向上: オフビートであっても後続が空白なら吸収して4分音符等の形にし、邪魔な旗を消す
    if (offsetInBar % span !== 0) continue 

    let valid = true
    for (let index = 1; index < span; index += 1) {
      if (getKeys(slots[startIndex + index], startIndex + index).length > 0) {
        valid = false
        break
      }
    }

    if (valid) return { span, duration: getDurationForSpan(baseDuration, span) }
  }

  return { span: 1, duration: getDurationForSpan(baseDuration, 1) }
}

function buildVoiceData({
  vexflow,
  slots,
  stepsPerBar,
  barCount,
  activeStepIndex,
  getKeys,
  stemDirection,
  baseDuration,
  mode,
  preserveStepTiming = false,
  accentMarks = null,
  restMarks = null,
}) {
  const tickables = []
  const beamGroups = Array.from({ length: barCount }, () => [])
  const tickablesByBar = Array.from({ length: barCount }, () => [])
  const accentNotesByBar = Array.from({ length: barCount }, () => [])
  const noteEntriesByBar = Array.from({ length: barCount }, () => [])
  
  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const barStartIndex = barIndex * stepsPerBar
    const barEndIndex = barStartIndex + stepsPerBar
    let stepIndex = barStartIndex

    while (stepIndex < barEndIndex) {
      const symbol = slots[stepIndex]
      const keys = getKeys(symbol, stepIndex)
      const isExplicitRest = Boolean(restMarks?.[stepIndex])
      const maxSpanSteps = barEndIndex - stepIndex
      const { span, duration } = preserveStepTiming
        ? { span: 1, duration: baseDuration }
        : getLargestSpan(
            stepIndex,
            barStartIndex,
            maxSpanSteps,
            slots,
            getKeys,
            baseDuration
          )

      if (keys.length > 0) {
        const { StaveNote, Articulation, ModifierPosition } = vexflow
        const note = new StaveNote({
          keys,
          duration,
          clef: 'percussion',
          stem_direction: stemDirection
        })

        // ドラム譜の視認性向上: タイミングが8分/16分でも単発音符は4分音符の見た目に寄せる
        note.hasFlag = () => false
        note.shouldDrawFlag = () => false
        note.drawFlag = () => {}

        if (typeof note.setStemLength === 'function') {
          note.setStemLength(24)
        }

        if (stemDirection === 1) {
          const strSym = String(symbol || '')
          // アクセント練習モードまたは通常の明示的なアクセント記号がある場合
          const isAccent = Boolean(accentMarks?.[stepIndex]) || strSym === '＜' || strSym.includes('＜')
          if (isAccent) {
            accentNotesByBar[barIndex].push(note)
          }
          if (strSym.includes('O')) {
             note.addModifier(
               new Articulation('ah')
                 .setPosition(ModifierPosition.ABOVE)
                 .setYShift(-6),
               0
             )
          }
        }

        tickables.push(note)
        tickablesByBar[barIndex].push(note)
        beamGroups[barIndex].push(note)
        noteEntriesByBar[barIndex].push({ note, start: stepIndex, end: stepIndex + span })
      } else if (isExplicitRest) {
        const { StaveNote } = vexflow
        const restNote = new StaveNote({
          keys: ['b/4'],
          duration: `${duration}r`,
          clef: 'percussion',
          stem_direction: stemDirection,
        })
        tickables.push(restNote)
        tickablesByBar[barIndex].push(restNote)
        noteEntriesByBar[barIndex].push({ note: restNote, start: stepIndex, end: stepIndex + span })
      } else {
        const ghostNote = createGhostNote(vexflow, duration)
        tickables.push(ghostNote)
        tickablesByBar[barIndex].push(ghostNote)
      }

      stepIndex += span
    }
  }

  return { tickables, beamGroups, tickablesByBar, accentNotesByBar, noteEntriesByBar }
}

export default function VexFlowNotationPreview({
  pattern,
  noteType,
  mode = 'accent',
  activeStepIndex = null,
  fillResolution = '16th',
}) {
  const containerRef = useRef(null)
  const noteElementsRef = useRef([])
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const container = containerRef.current
    if (!container || !pattern?.stepsPerBar) return

    let cancelled = false
    container.innerHTML = ''
    noteElementsRef.current = []
    setErrorMessage('')

    async function renderPreview() {
      try {
        const vexflow = await import('../../vendor/vexflow/src/index.ts')
        const { loadBravura } = await import('../../vendor/vexflow/src/fonts/load_bravura.ts')
        if (cancelled || !containerRef.current) return

        const { Beam, Flow, Formatter, Renderer, Stave, Voice } = vexflow
        loadBravura()
        Flow.setMusicFont('Bravura')

        const resolvedFillResolution = pattern.resolution || fillResolution
        const baseDuration = getDurationCode(noteType, mode, resolvedFillResolution)
        const stepsPerBar = pattern.stepsPerBar || getStepCountForBar(noteType, mode, resolvedFillResolution)
        const totalSteps = pattern.totalSteps || stepsPerBar
        const accentRow = (pattern.accentRow || []).slice(0, totalSteps)
        const kickRow = (pattern.kickRow || []).slice(0, totalSteps)
        const barCount = Math.max(1, Math.ceil(totalSteps / stepsPerBar))

        const leftPadding = 20
        const firstBarExtraWidth = 82
        const rightPadding = 28
        const interBarGap = 6
        const minWidthPerBar = baseDuration === '32' ? 620 : baseDuration === '16' ? 370 : baseDuration === '8' ? 250 : 190
        const minTotalWidth =
          leftPadding +
          firstBarExtraWidth +
          rightPadding +
          barCount * minWidthPerBar +
          Math.max(0, barCount - 1) * interBarGap
        const containerWidth = container.parentElement.clientWidth || 1120
        const width = Math.max(minTotalWidth, containerWidth - 8)
        
        const topPadding = mode === 'accent' ? 34 : 18
        const height = mode === 'accent' ? 244 : 212
        const staveY = mode === 'accent' ? 74 : 50
        const availableBarWidth =
          width -
          leftPadding -
          rightPadding -
          firstBarExtraWidth -
          Math.max(0, barCount - 1) * interBarGap
        const barWidth = availableBarWidth / barCount

        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG)
        renderer.resize(width, height)
        const context = renderer.getContext()
        context.setFont('Arial', 10, '')

        // Make the SVG responsive and able to scale down for A4 print
        const svg = context.svg
        if (svg) {
          svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
          svg.style.width = '100%'
          svg.style.height = 'auto'
        }

        const renderActiveStepIndex = activeStepIndex
        const voice1Data = buildVoiceData({
          vexflow,
          slots: accentRow,
          stepsPerBar,
          barCount,
          activeStepIndex: renderActiveStepIndex,
          getKeys: (sym, stepIndex) => getVoice1Keys(sym, mode, stepIndex),
          stemDirection: 1,
          baseDuration,
          mode,
          accentMarks: pattern.accentMarks || null,
          restMarks: pattern.restMarks || null,
        })

        const voice2Data = buildVoiceData({
          vexflow,
          slots: kickRow,
          stepsPerBar,
          barCount,
          activeStepIndex: renderActiveStepIndex,
          getKeys: getVoice2Keys,
          stemDirection: -1,
          baseDuration,
          preserveStepTiming: true,
        })

        let currentX = leftPadding
        const beamGroupsFraction = getBeamGroupFractions(vexflow, noteType, mode)
        for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
          const currentBarWidth = barIndex === 0 ? barWidth + firstBarExtraWidth : barWidth
          const stave = new Stave(currentX, staveY, currentBarWidth)
          if (barIndex === 0) {
            stave.addClef('percussion').addTimeSignature('4/4')
          }
          stave.setContext(context).draw()

          const voice1 = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)
          const voice2 = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)
          voice1.addTickables(voice1Data.tickablesByBar[barIndex])
          voice2.addTickables(voice2Data.tickablesByBar[barIndex])

          const formatter = new Formatter()
          formatter.joinVoices([voice1, voice2]).formatToStave([voice1, voice2], stave)

          let beams = []
          if (baseDuration !== '4') {
            const flatBeamOffset = stave.getYForLine(0) - 20
            beams = Beam.generateBeams(voice1Data.beamGroups[barIndex], {
              groups: beamGroupsFraction,
              beam_rests: false,
              show_stemlets: false,
              maintain_stem_directions: true,
              flat_beams: true,
              flat_beam_offset: flatBeamOffset,
            })
          }

          voice1.draw(context, stave)
          voice2.draw(context, stave)
          beams.forEach((beam) => beam.setContext(context).draw())

          ;[...voice1Data.noteEntriesByBar[barIndex], ...voice2Data.noteEntriesByBar[barIndex]].forEach(({ note, start, end }) => {
            const element = note.getSVGElement?.()
            if (element) {
              noteElementsRef.current.push({ element, start, end })
            }
          })

          const accentNotes = voice1Data.accentNotesByBar[barIndex]
          if (accentNotes.length) {
            context.save()
            context.setFont('Arial', 18, '700')
            context.setFillStyle('#111')
            accentNotes.forEach((note) => {
              const x = typeof note.getStemX === 'function' ? note.getStemX() : note.getAbsoluteX()
              const y = Math.max(topPadding, Math.min(...note.getYs()) - 34)
              const metrics = context.measureText('>')
              context.fillText('>', x - metrics.width / 2, y)
            })
            context.restore()
          }

          currentX += currentBarWidth + interBarGap
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
      noteElementsRef.current = []
    }
  }, [pattern, noteType, mode, fillResolution])

  useEffect(() => {
    noteElementsRef.current.forEach(({ element, start, end }) => {
      const isActive = activeStepIndex !== null && activeStepIndex >= start && activeStepIndex < end
      element.setAttribute('opacity', isActive ? '1' : '1')
      element.querySelectorAll('path, rect, ellipse, circle, line, polygon, polyline').forEach((node) => {
        node.setAttribute('stroke', isActive ? '#9acd32' : '#111')
        if (node.tagName !== 'line') {
          node.setAttribute('fill', isActive ? '#9acd32' : '#111')
        }
      })
    })
  }, [activeStepIndex])

  if (errorMessage) {
    return (
      <div className="abc-preview vexflow-preview">
        <p style={{ margin: 0, color: '#8b1e3f', fontWeight: 700 }}>VexFlow beta error</p>
        <p style={{ margin: '6px 0 0', color: '#44516b' }}>{errorMessage}</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
      <div ref={containerRef} className="abc-preview vexflow-preview" style={{ minWidth: 'min-content' }} />
    </div>
  )
}
