import { useEffect, useRef } from 'react'
import {
  Articulation,
  Beam,
  Formatter,
  ModifierPosition,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from '../../vendor/vexflow/src/index.ts'

function getDurationCode(noteType, mode) {
  if (mode === 'fillin') return '16'
  if (noteType === '4th') return '4'
  if (noteType === '8th') return '8'
  return '16'
}

function getUpperKeys(symbol, mode) {
  if (mode === 'accent') {
    if (symbol === '✕') return ['g/5/cx']
    if (symbol === '△') return ['e/5']
    if (symbol === '▲') return ['c/5']
    return ['c/5']
  }

  if (!symbol) return null
  if (symbol === 'C' || symbol === '✕') return ['g/5/cx']
  if (symbol === 'R' || (typeof symbol === 'string' && symbol.includes('R'))) return ['g/5/cx']
  if (symbol === 'H' || symbol === 'O') return ['f/5/x2']
  if (typeof symbol === 'string' && (symbol.includes('H') || symbol.includes('O'))) {
    const keys = ['f/5/x2']
    if (symbol.includes('S') || symbol === '＜') keys.push('c/5')
    return keys
  }
  if (symbol === 'S' || symbol === '＜') return ['c/5']
  if (symbol === 'T' || symbol === '△') return ['e/5']
  if (symbol === 'M') return ['d/5']
  if (symbol === 'F' || symbol === '▲') return ['b/4']
  return ['c/5']
}

function createRest(duration) {
  return new StaveNote({
    keys: ['b/4'],
    duration: `${duration}r`,
  })
}

function createUpperNote(symbol, duration, mode, isActive) {
  const keys = getUpperKeys(symbol, mode)
  const note = keys
    ? new StaveNote({
      keys,
      duration,
      stem_direction: 1,
      clef: 'percussion',
    })
    : createRest(duration)

  if (keys) {
    if (symbol === '＜') {
      note.addModifier(new Articulation('a>').setPosition(ModifierPosition.ABOVE), 0)
    }

    if (symbol === 'O' || (typeof symbol === 'string' && symbol.includes('O'))) {
      note.addModifier(new Articulation('a@a').setPosition(ModifierPosition.ABOVE), 0)
    }
  }

  if (isActive) {
    note.setStyle({
      fillStyle: '#9acd32',
      strokeStyle: '#9acd32',
    })
  }

  return note
}

function createKickNote(hasKick, duration, isActive) {
  const note = hasKick
    ? new StaveNote({
      keys: ['f/4'],
      duration,
      stem_direction: -1,
      clef: 'percussion',
    })
    : createRest(duration)

  if (hasKick && isActive) {
    note.setStyle({
      fillStyle: '#9acd32',
      strokeStyle: '#9acd32',
    })
  }

  return note
}

function buildBeams(notes, duration) {
  if (duration === '4') return []
  return Beam.generateBeams(notes.filter((note) => !note.isRest()), {
    beam_rests: false,
    show_stemlets: false,
  })
}

export default function VexFlowNotationPreview({
  pattern,
  noteType,
  mode = 'accent',
  activeStepIndex = null,
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !pattern?.totalSteps || !pattern?.stepsPerBar) return

    container.innerHTML = ''

    const totalSteps = pattern.totalSteps
    const stepsPerBar = pattern.stepsPerBar
    const barCount = totalSteps / stepsPerBar
    const duration = getDurationCode(noteType, mode)
    const width = mode === 'accent' ? 1180 : 1260
    const barWidth = Math.max(170, Math.floor((width - 32) / barCount))
    const height = 148

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(width, height)
    const context = renderer.getContext()
    context.setFont('Arial', 10, '')

    const upperVoices = []
    const lowerVoices = []
    const allBeams = []

    for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
      const start = barIndex * stepsPerBar
      const end = start + stepsPerBar
      const staveX = 10 + barIndex * barWidth
      const stave = new Stave(staveX, 18, barWidth)

      if (barIndex === 0) {
        stave.addClef('percussion').addTimeSignature('4/4')
      }

      stave.setContext(context).draw()

      const upperNotes = []
      const lowerNotes = []

      for (let step = start; step < end; step += 1) {
        const symbol = pattern.accentRow?.[step] || ''
        const hasKick = Boolean(pattern.kickRow?.[step])
        const isActive = activeStepIndex === step
        upperNotes.push(createUpperNote(symbol, duration, mode, isActive))
        lowerNotes.push(createKickNote(hasKick, duration, isActive))
      }

      const upperVoice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)
      const lowerVoice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)

      upperVoice.addTickables(upperNotes)
      lowerVoice.addTickables(lowerNotes)

      new Formatter().joinVoices([upperVoice, lowerVoice]).formatToStave([upperVoice, lowerVoice], stave)

      upperVoice.draw(context, stave)
      lowerVoice.draw(context, stave)

      buildBeams(upperNotes, duration).forEach((beam) => {
        beam.setContext(context).draw()
        allBeams.push(beam)
      })

      upperVoices.push(upperVoice)
      lowerVoices.push(lowerVoice)
    }

    return () => {
      container.innerHTML = ''
    }
  }, [pattern, noteType, mode, activeStepIndex])

  return <div ref={containerRef} className="abc-preview vexflow-preview" />
}
