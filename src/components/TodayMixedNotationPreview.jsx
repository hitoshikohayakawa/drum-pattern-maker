import { useEffect, useRef, useState } from 'react'

const DURATIONS_BY_BLOCK = {
  quarter: ['q'],
  eighths: ['8', '8'],
  sixteenths: ['16', '16', '16', '16'],
  tattara: ['8', '16', '16'],
  taratta: ['16', '16', '8'],
  triplet: ['8', '8', '8'],
}

export default function TodayMixedNotationPreview({ beatBlocks = [] }) {
  const containerRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const container = containerRef.current
    if (!container || beatBlocks.length !== 16) return undefined
    let cancelled = false
    container.innerHTML = ''
    setErrorMessage('')

    async function render() {
      try {
        const vexflow = await import('vexflow4')
        if (cancelled || !containerRef.current) return

        const { Beam, Flow, Formatter, Renderer, Stave, Tuplet, Voice } = vexflow
        Flow.setMusicFont('Bravura')
        const width = Math.max(900, container.parentElement?.clientWidth || 1100)
        const rowHeight = 170
        const renderer = new Renderer(container, Renderer.Backends.SVG)
        renderer.resize(width, rowHeight * 4)
        const context = renderer.getContext()
        const left = 20
        const right = 24
        const firstExtra = 72
        const gap = 8
        const barWidth = (width - left - right - firstExtra - gap * 3) / 4

        for (let row = 0; row < 4; row += 1) {
          let x = left
          const y = 55 + row * rowHeight
          for (let column = 0; column < 4; column += 1) {
            const barIndex = row * 4 + column
            const staveWidth = barWidth + (column === 0 ? firstExtra : 0)
            const stave = new Stave(x, y, staveWidth)
            if (column === 0) stave.addClef('percussion').addTimeSignature('4/4')
            stave.setContext(context).draw()

            const upper = []
            const lower = []
            const beams = []
            const tuplets = []
            ;(beatBlocks[barIndex] || []).forEach((block) => {
              const durations = DURATIONS_BY_BLOCK[block.type] || DURATIONS_BY_BLOCK.quarter
              const notes = durations.map((duration) => new vexflow.StaveNote({
                keys: ['c/5'], duration, clef: 'percussion', stem_direction: 1,
              }))
              notes.forEach((note) => {
                note.hasFlag = () => false
                note.shouldDrawFlag = () => false
                note.drawFlag = () => {}
              })
              upper.push(...notes)
              lower.push(new vexflow.StaveNote({ keys: ['f/4'], duration: 'q', clef: 'percussion', stem_direction: -1 }))

              if (notes.length > 1) {
                const beam = new Beam(notes)
                beam.render_options.flat_beams = true
                beam.render_options.flat_beam_offset = stave.getYForLine(0) - 20
                beams.push(beam)
              }
              if (block.type === 'triplet') {
                tuplets.push(new Tuplet(notes, { num_notes: 3, notes_occupied: 2, bracketed: true, ratioed: false }))
              }
            })

            const voice1 = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)
            const voice2 = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT)
            voice1.addTickables(upper)
            voice2.addTickables(lower)
            new Formatter().joinVoices([voice1, voice2]).formatToStave([voice1, voice2], stave)
            voice1.draw(context, stave)
            voice2.draw(context, stave)
            beams.forEach((beam) => beam.setContext(context).draw())
            tuplets.forEach((tuplet) => tuplet.setContext(context).draw())
            x += staveWidth + gap
          }
        }
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : 'Notation rendering failed')
      }
    }
    render()
    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [beatBlocks])

  if (errorMessage) return <p className="today-notation-error">{errorMessage}</p>
  return <div className="today-mixed-notation" ref={containerRef} />
}
