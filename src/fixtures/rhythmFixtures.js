import {
  canonicalToNotationView,
  canonicalToPlaybackSequence,
  legacyFillStepsToCanonical,
  legacyNotationPatternToCanonical,
} from '../utils/canonicalRhythm.js'

export const LEGACY_FILL_STEPS_16TH_FIXTURE = [
  { index: 0, instruments: ['hihat_close', 'bass_drum'], accent: false, isRest: false },
  { index: 2, instruments: ['snare'], accent: true, isRest: false },
  { index: 3, instruments: [], accent: false, isRest: true },
  { index: 4, instruments: ['hihat_open'], accent: false, isRest: false },
  { index: 6, instruments: ['mid_tom', 'bass_drum'], accent: false, isRest: false },
]

export const LEGACY_FILL_32ND_FIXTURE = [
  { index: 0, instruments: ['snare'], accent: true, isRest: false },
  { index: 1, instruments: ['hi_tom'], accent: false, isRest: false },
  { index: 2, instruments: ['mid_tom'], accent: false, isRest: false },
  { index: 3, instruments: ['floor_tom', 'bass_drum'], accent: false, isRest: false },
]

export const LEGACY_PRACTICE_PATTERN_FIXTURE = {
  accentRow: ['＜', '', '', '', '△', '', '', '✕', '', '', '', '', '＜', '', '', ''],
  kickRow: ['●', '', '', '', '', '', '', '', '●', '', '', '', '', '', '', ''],
  accentMarks: [true, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
  restMarks: Array(16).fill(false),
  stepsPerBar: 16,
  totalSteps: 16,
}

export const CANONICAL_FILL_16TH_FIXTURE = legacyFillStepsToCanonical(
  LEGACY_FILL_STEPS_16TH_FIXTURE,
  'full_bar',
  '16th'
)

export const CANONICAL_FILL_32ND_FIXTURE = legacyFillStepsToCanonical(
  LEGACY_FILL_32ND_FIXTURE,
  'quarter_bar',
  '32nd'
)

export const CANONICAL_PRACTICE_FIXTURE = legacyNotationPatternToCanonical(
  LEGACY_PRACTICE_PATTERN_FIXTURE,
  {
    patternKind: 'exercise',
    isAccentExercise: true,
  }
)

export const CANONICAL_FILL_16TH_NOTATION_FIXTURE = canonicalToNotationView(CANONICAL_FILL_16TH_FIXTURE)
export const CANONICAL_FILL_16TH_PLAYBACK_FIXTURE = canonicalToPlaybackSequence(CANONICAL_FILL_16TH_FIXTURE)
