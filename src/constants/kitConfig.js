const TONEJS_BASE_URL = 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/'
const TONEJS_AUDIO_BASE_URL = 'https://tonejs.github.io/audio/'
const PEARL_MASTER_BASE_URL = 'https://oramics.github.io/sampled/DRUMS/pearl-master-studio/samples/'

export const SNARE_TONE_PRESETS = {
  maple: { hpf: 130, lpf: 4200, threshold: -24, ratio: 2.8, attack: 0.004, release: 0.14, volume: -6, rate: 0.94 },
  bright: { hpf: 210, lpf: 7600, threshold: -19, ratio: 3.4, attack: 0.002, release: 0.1, volume: -4, rate: 1.05 },
  fat: { hpf: 100, lpf: 3600, threshold: -26, ratio: 2.2, attack: 0.005, release: 0.18, volume: -5, rate: 0.9 },
}

export const SNARE_LIBRARY_RATE_OVERRIDES = {
  pearlMaster: {
    maple: 1,
    bright: 1.04,
    fat: 0.97,
  },
}

export const TOM_TONE_PRESETS = {
  standard: { webFile: 'tom1.mp3', pearlFile: 'tom-01.wav', rate: 1 },
  tight: { webFile: 'tom1.mp3', pearlFile: 'tom-01.wav', rate: 1.1 },
  deep: { webFile: 'tom2.mp3', pearlFile: 'tom-02.wav', rate: 0.92 },
}

export const FLOOR_TOM_TONE_PRESETS = {
  standard: { webFile: 'tom3.mp3', pearlFile: 'tom-03.wav', rate: 1 },
  tight: { webFile: 'tom2.mp3', pearlFile: 'tom-02.wav', rate: 1.06 },
  deep: { webFile: 'tom3.mp3', pearlFile: 'tom-03.wav', rate: 0.9 },
}

const CYMBAL_TONE_PRESETS = {
  tight: { webFile: 'berklee/chime_1.mp3', webBaseUrl: TONEJS_AUDIO_BASE_URL, pearlFile: 'crash-01.wav', pearlBaseUrl: PEARL_MASTER_BASE_URL, rate: 1.08, volume: -6.5 },
  open: { webFile: 'berklee/chime_1.mp3', webBaseUrl: TONEJS_AUDIO_BASE_URL, pearlFile: 'crash-02.wav', pearlBaseUrl: PEARL_MASTER_BASE_URL, rate: 0.98, volume: -4.5 },
  dark: { webFile: 'berklee/gong_1.mp3', webBaseUrl: TONEJS_AUDIO_BASE_URL, pearlFile: 'crash-02.wav', pearlBaseUrl: PEARL_MASTER_BASE_URL, rate: 0.88, volume: -6 },
}

export const KIT_LIBRARY_META = {
  pearlMaster: {
    label: 'Pearl Master Studio',
    license: 'CC BY 3.0',
    source: 'Sampled / Pearl Master Studio Pack 1 by enoe',
  },
  webStandard: {
    label: 'Web標準キット',
    license: 'デモ用サンプル',
    source: 'Tone.js audio demo kit',
  },
}

export const SNARE_LIBRARY_SOURCES = {
  pearlMaster: {
    maple: `${PEARL_MASTER_BASE_URL}snare-02.wav`,
    bright: `${PEARL_MASTER_BASE_URL}snare-01.wav`,
    fat: `${PEARL_MASTER_BASE_URL}snare-03.wav`,
  },
  webStandard: {
    maple: `${TONEJS_BASE_URL}snare.mp3`,
    bright: `${TONEJS_BASE_URL}snare.mp3`,
    fat: `${TONEJS_BASE_URL}snare.mp3`,
  },
}

function getTomFile(kitLibrary, preset) {
  return kitLibrary === 'pearlMaster' ? preset.pearlFile : preset.webFile
}

export function getCymbalSource(kitLibrary, cymbalTone) {
  const preset = CYMBAL_TONE_PRESETS[cymbalTone]
  if (!preset) return null

  if (kitLibrary === 'pearlMaster') {
    return {
      url: `${preset.pearlBaseUrl}${preset.pearlFile}`,
      fadeOut: 1.8,
      rate: preset.rate,
      volume: preset.volume,
    }
  }

  return {
    url: `${preset.webBaseUrl}${preset.webFile}`,
    fadeOut: 0.08,
    rate: preset.rate,
    volume: preset.volume,
  }
}

export function getKitConfig(kitLibrary, tomTone, floorTomTone) {
  const tomPreset = TOM_TONE_PRESETS[tomTone]
  const floorTomPreset = FLOOR_TOM_TONE_PRESETS[floorTomTone]
  if (kitLibrary === 'pearlMaster') {
    return {
      baseUrl: PEARL_MASTER_BASE_URL,
      volume: -2.5,
      files: {
        kick: 'kick-01.wav',
        tom: getTomFile(kitLibrary, tomPreset),
        midTom: 'tom-02.wav',
        floorTom: getTomFile(kitLibrary, floorTomPreset),
        hihat: 'hihat-closed.wav',
        ride: 'ride-01.wav',
      },
      hihat: { rate: 1, volume: -8.5 },
      ride: { rate: 0.98, volume: -9 },
    }
  }

  return {
    baseUrl: TONEJS_BASE_URL,
    volume: -4,
    files: {
      kick: 'kick.mp3',
      tom: getTomFile(kitLibrary, tomPreset),
      midTom: 'tom2.mp3',
      floorTom: getTomFile(kitLibrary, floorTomPreset),
      hihat: 'hihat.mp3',
      ride: 'hihat.mp3',
    },
    hihat: { rate: 1.08, volume: -7 },
    ride: { rate: 1, volume: -8 },
  }
}
