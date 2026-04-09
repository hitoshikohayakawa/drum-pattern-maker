export type DpmInstrument =
  | 'hihat_close'
  | 'hihat_open'
  | 'foot_hihat'
  | 'ride'
  | 'crash'
  | 'snare'
  | 'hi_tom'
  | 'mid_tom'
  | 'low_tom'
  | 'floor_tom'
  | 'bass_drum'

export type DpmGridProfile = 'straight_4' | 'straight_8' | 'triplet_8' | 'straight_16' | 'triplet_16' | 'straight_32'
export type DpmFillLengthType = 'full_bar' | 'half_bar' | 'quarter_bar'
export type DpmPatternKind = 'fill' | 'exercise'

export type DpmNoteModifier = {
  accent?: boolean
  ghost?: boolean
  open?: boolean
}

export type DpmNoteEvent = {
  instrument: DpmInstrument
  modifiers?: DpmNoteModifier
}

export type DpmRhythmEvent = {
  id: string
  startTick: number
  durationTick: number
  notes: DpmNoteEvent[]
  isRest?: boolean
}

export type DpmCanonicalPattern = {
  schemaVersion: 2
  patternKind: DpmPatternKind
  timeSignature: {
    numerator: 4
    denominator: 4
  }
  ppq: 192
  gridProfile: DpmGridProfile
  fillLengthType: DpmFillLengthType
  totalTicks: number
  events: DpmRhythmEvent[]
  metadata?: {
    notationRuleSet?: 'dpm_jp_v1'
    source?: 'fill_editor' | 'practice_generator' | 'legacy_steps' | 'legacy_notation'
    [key: string]: unknown
  }
}

export type DpmNotationView = {
  accentRow: string[]
  kickRow: string[]
  accentMarks: boolean[]
  ghostMarks?: boolean[]
  restMarks: boolean[]
  stepsPerBar: number
  totalSteps: number
  resolution: '4th' | '8th' | '8th_triplet' | '16th' | '16th_triplet' | '32nd'
}

export type DpmPlaybackStep = {
  index: number
  startTick: number
  durationTick: number
  isRest: boolean
  notes: DpmNoteEvent[]
  instruments: Array<DpmInstrument | 'ghost_snare'>
  accent: boolean
  ghost: boolean
}
