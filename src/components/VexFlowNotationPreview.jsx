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

function getVoice1Keys(symbol, mode) {
  const keys = []
  const str = String(symbol || '')
  
  if (str.includes('✕') || str.includes('C')) keys.push('g/5/cx') // Crash/Cymbal
  if (str.includes('H') || str.includes('O')) keys.push('g/5/x2') // Hihat
  if (str.includes('R')) keys.push('f/5/x2') // Ride
  if (str.includes('S') || str.includes('＜')) keys.push('c/5') // Snare
  if (str.includes('T') || str.includes('△')) keys.push('e/5') // Tom
  if (str.includes('M')) keys.push('d/5') // Mid Tom
  if (str.includes('F') || str.includes('▲')) keys.push('a/4') // Floor Tom

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
      if (getKeys(slots[startIndex + index]).length > 0) {
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
}) {
  const tickables = []
  const beamGroups = Array.from({ length: barCount }, () => [])
  
  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const barStartIndex = barIndex * stepsPerBar
    const barEndIndex = barStartIndex + stepsPerBar
    let stepIndex = barStartIndex

    while (stepIndex < barEndIndex) {
      const symbol = slots[stepIndex]
      const keys = getKeys(symbol)
      const maxSpanSteps = barEndIndex - stepIndex
      const { span, duration } = getLargestSpan(
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

        // ドラム譜の視認性向上: 単発音符に旗を出さず、常に4分音符のように見せる
        note.hasFlag = () => false

        if (typeof note.setStemLength === 'function') {
          note.setStemLength(24)
        }

        const isAct = activeStepIndex !== null && activeStepIndex >= stepIndex && activeStepIndex < stepIndex + span
        if (isAct) {
          note.setStyle({ fillStyle: '#9acd32', strokeStyle: '#9acd32' })
        }

        if (stemDirection === 1) {
          const strSym = String(symbol || '')
          // アクセント練習モードまたは通常の明示的なアクセント記号がある場合
          const isAccent = strSym === '＜' || strSym.includes('＜')
          if (isAccent) {
            note.addModifier(new Articulation('a>').setPosition(ModifierPosition.ABOVE), 0)
          }
          if (strSym.includes('O')) {
             note.addModifier(new Articulation('ah').setPosition(ModifierPosition.ABOVE), 0)
          }
        }

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

export default function VexFlowNotationPreview({
  pattern,
  noteType,
  mode = 'accent',
  activeStepIndex = null,
}) {
  const containerRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')

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

        const { Beam, Flow, Formatter, Renderer, Stave, Voice, Fraction } = vexflow
        loadBravura()
        Flow.setMusicFont('Bravura')

        const baseDuration = getDurationCode(noteType, mode)
        const stepsPerBar = pattern.stepsPerBar || getStepCountForBar(noteType, mode)
        const totalSteps = pattern.totalSteps || stepsPerBar
        const accentRow = (pattern.accentRow || []).slice(0, totalSteps)
        const kickRow = (pattern.kickRow || []).slice(0, totalSteps)
        const barCount = Math.max(1, Math.ceil(totalSteps / stepsPerBar))

        const minWidthPerBar = baseDuration === '16' ? 320 : 200
        const minTotalWidth = barCount * minWidthPerBar + 40
        const containerWidth = container.parentElement.clientWidth || 1120
        const width = Math.max(minTotalWidth, containerWidth - 8)
        
        const height = 164
        const staveWidth = width - 40
        const barWidth = staveWidth / barCount

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

        const stave = new Stave(20, 22, staveWidth)
        stave.addClef('percussion').addTimeSignature('4/4')
        stave.setContext(context).draw()

        const voice1Data = buildVoiceData({
          vexflow,
          slots: accentRow,
          stepsPerBar,
          barCount,
          activeStepIndex,
          getKeys: (sym) => getVoice1Keys(sym, mode),
          stemDirection: 1,
          baseDuration,
          mode,
        })

        const voice2Data = buildVoiceData({
          vexflow,
          slots: kickRow,
          stepsPerBar,
          barCount,
          activeStepIndex,
          getKeys: getVoice2Keys,
          stemDirection: -1,
          baseDuration,
        })

        const voice1 = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)
        const voice2 = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)

        voice1.addTickables(voice1Data.tickables)
        voice2.addTickables(voice2Data.tickables)

        const allBeams = []
        if (baseDuration !== '4') {
          const beamGroupsFraction = [new Fraction(1, 4)]
          voice1Data.beamGroups.forEach((notesInBar) => {
            const beams = Beam.generateBeams(notesInBar, {
              groups: beamGroupsFraction,
              beam_rests: false,
              show_stemlets: false,
              maintain_stem_directions: true,
            })
            allBeams.push(...beams)
          })

          voice2Data.beamGroups.forEach((notesInBar) => {
            const beams = Beam.generateBeams(notesInBar, {
              groups: beamGroupsFraction,
              beam_rests: false,
              show_stemlets: false,
              maintain_stem_directions: true,
            })
            allBeams.push(...beams)
          })
        }

        new Formatter().joinVoices([voice1, voice2]).formatToStave([voice1, voice2], stave)

        voice1.draw(context, stave)
        voice2.draw(context, stave)
        allBeams.forEach((beam) => beam.setContext(context).draw())

        for (let barIndex = 1; barIndex < barCount; barIndex += 1) {
          const x = 20 + barWidth * barIndex
          context.beginPath()
          context.moveTo(x, 22)
          context.lineTo(x, 22 + 40)
          context.stroke()
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
  }, [pattern, noteType, mode, activeStepIndex])

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
