export const DPM_SCHEMA_VERSION = 2
export const DPM_PPQ = 192
export const DPM_TIME_SIGNATURE = Object.freeze({
  numerator: 4,
  denominator: 4,
})

export const FILL_LENGTH_RATIOS = Object.freeze({
  full_bar: 1,
  half_bar: 0.5,
  quarter_bar: 0.25,
})

export const GRID_PROFILES = Object.freeze({
  straight_4: Object.freeze({
    value: 'straight_4',
    resolution: '4th',
    stepsPerBar: 4,
    stepTick: DPM_PPQ,
    beamGroupSteps: 1,
  }),
  straight_8: Object.freeze({
    value: 'straight_8',
    resolution: '8th',
    stepsPerBar: 8,
    stepTick: DPM_PPQ / 2,
    beamGroupSteps: 2,
  }),
  triplet_8: Object.freeze({
    value: 'triplet_8',
    resolution: '8th_triplet',
    stepsPerBar: 12,
    stepTick: DPM_PPQ / 3,
    beamGroupSteps: 3,
  }),
  triplet_16: Object.freeze({
    value: 'triplet_16',
    resolution: '16th_triplet',
    stepsPerBar: 24,
    stepTick: DPM_PPQ / 6,
    beamGroupSteps: 6,
  }),
  straight_16: Object.freeze({
    value: 'straight_16',
    resolution: '16th',
    stepsPerBar: 16,
    stepTick: DPM_PPQ / 4,
    beamGroupSteps: 4,
  }),
  straight_32: Object.freeze({
    value: 'straight_32',
    resolution: '32nd',
    stepsPerBar: 32,
    stepTick: DPM_PPQ / 8,
    beamGroupSteps: 8,
  }),
})

export const GRID_PROFILE_BY_RESOLUTION = Object.freeze({
  '4th': GRID_PROFILES.straight_4,
  '8th': GRID_PROFILES.straight_8,
  '8th_triplet': GRID_PROFILES.triplet_8,
  '16th_triplet': GRID_PROFILES.triplet_16,
  '16th': GRID_PROFILES.straight_16,
  '32nd': GRID_PROFILES.straight_32,
})

export const DPM_INSTRUMENTS = Object.freeze([
  'hihat_close',
  'hihat_open',
  'foot_hihat',
  'ride',
  'crash',
  'snare',
  'hi_tom',
  'mid_tom',
  'low_tom',
  'floor_tom',
  'bass_drum',
])

export const NOTATION_TOKEN_BY_INSTRUMENT = Object.freeze({
  hihat_close: 'H',
  hihat_open: 'O',
  foot_hihat: 'P',
  ride: 'R',
  crash: 'C',
  snare: 'S',
  hi_tom: 'T',
  mid_tom: 'M',
  low_tom: 'L',
  floor_tom: 'F',
})

export function getGridProfile(profileOrResolution = 'straight_16') {
  if (GRID_PROFILES[profileOrResolution]) {
    return GRID_PROFILES[profileOrResolution]
  }
  return GRID_PROFILE_BY_RESOLUTION[profileOrResolution] || GRID_PROFILES.straight_16
}

export function getFillLengthRatio(fillLengthType = 'full_bar') {
  return FILL_LENGTH_RATIOS[fillLengthType] || FILL_LENGTH_RATIOS.full_bar
}

export function getBarTickLength(timeSignature = DPM_TIME_SIGNATURE, ppq = DPM_PPQ) {
  const beatValue = 4 / timeSignature.denominator
  return Math.round(timeSignature.numerator * ppq * beatValue)
}

export function getTotalTicks({
  fillLengthType = 'full_bar',
  timeSignature = DPM_TIME_SIGNATURE,
  ppq = DPM_PPQ,
} = {}) {
  return Math.round(getBarTickLength(timeSignature, ppq) * getFillLengthRatio(fillLengthType))
}

export function getTotalStepsForProfile(profileOrResolution = 'straight_16', fillLengthType = 'full_bar') {
  const profile = getGridProfile(profileOrResolution)
  return Math.round(profile.stepsPerBar * getFillLengthRatio(fillLengthType))
}

export function resolutionFromGridProfile(profileOrResolution = 'straight_16') {
  return getGridProfile(profileOrResolution).resolution
}

export function createCanonicalPattern({
  patternKind = 'fill',
  gridProfile = 'straight_16',
  fillLengthType = 'full_bar',
  totalTicks,
  events = [],
  metadata = {},
} = {}) {
  const resolvedProfile = getGridProfile(gridProfile)
  return {
    schemaVersion: DPM_SCHEMA_VERSION,
    patternKind,
    timeSignature: DPM_TIME_SIGNATURE,
    ppq: DPM_PPQ,
    gridProfile: resolvedProfile.value,
    fillLengthType,
    totalTicks: Number.isFinite(totalTicks)
      ? totalTicks
      : getTotalTicks({ fillLengthType }),
    events,
    metadata: {
      notationRuleSet: 'dpm_jp_v1',
      ...metadata,
    },
  }
}
