const TONEJS_BASE_URL = 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/'
const TONEJS_AUDIO_BASE_URL = 'https://tonejs.github.io/audio/'
const PEARL_MASTER_BASE_URL = 'https://oramics.github.io/sampled/DRUMS/pearl-master-studio/samples/'
const FOOT_HIHAT_EXTERNAL_URL = `${TONEJS_BASE_URL}hihat.mp3`

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

export function getInstrumentSampleMap(kitLibrary, tomTone, floorTomTone, cymbalTone) {
  const cymbalSource = getCymbalSource(kitLibrary, cymbalTone)
  const tomPreset = TOM_TONE_PRESETS[tomTone]
  const floorTomPreset = FLOOR_TOM_TONE_PRESETS[floorTomTone]

  if (kitLibrary === 'pearlMaster') {
    return {
      kick: { playerName: 'kick', url: `${PEARL_MASTER_BASE_URL}kick-01.wav` },
      tom: { playerName: 'tom', url: `${PEARL_MASTER_BASE_URL}${getTomFile(kitLibrary, tomPreset)}` },
      midTom: { playerName: 'midTom', url: `${PEARL_MASTER_BASE_URL}tom-02.wav` },
      lowTom: { playerName: 'lowTom', url: `${PEARL_MASTER_BASE_URL}tom-03.wav` },
      floorTom: { playerName: 'floorTom', url: `${PEARL_MASTER_BASE_URL}${getTomFile(kitLibrary, floorTomPreset)}` },
      hihat_close: { playerName: 'hihat', url: `${PEARL_MASTER_BASE_URL}hihat-closed.wav`, rate: 1, volume: -8.5 },
      hihat_open: { playerName: 'hihatOpen', url: `${PEARL_MASTER_BASE_URL}hihat-open.wav`, rate: 1, volume: -6.5 },
      ride: { playerName: 'ride', url: `${PEARL_MASTER_BASE_URL}ride-01.wav`, rate: 0.98, volume: -9 },
      crash: { playerName: 'crash', url: cymbalSource?.url, rate: cymbalSource?.rate, volume: cymbalSource?.volume, fadeOut: cymbalSource?.fadeOut },
      foot_hihat: { playerName: 'footHiHat', url: FOOT_HIHAT_EXTERNAL_URL, rate: 0.9, volume: -10, fadeOut: 0.04 },
    }
  }

  return {
    kick: { playerName: 'kick', url: `${TONEJS_BASE_URL}kick.mp3` },
    tom: { playerName: 'tom', url: `${TONEJS_BASE_URL}${getTomFile(kitLibrary, tomPreset)}` },
    midTom: { playerName: 'midTom', url: `${TONEJS_BASE_URL}tom2.mp3` },
    lowTom: { playerName: 'lowTom', url: `${TONEJS_BASE_URL}tom3.mp3` },
    floorTom: { playerName: 'floorTom', url: `${TONEJS_BASE_URL}${getTomFile(kitLibrary, floorTomPreset)}` },
    hihat_close: { playerName: 'hihat', url: `${TONEJS_BASE_URL}hihat.mp3`, rate: 1.08, volume: -7 },
    hihat_open: { playerName: 'hihatOpen', url: `${TONEJS_BASE_URL}hihat.mp3`, rate: 0.9, volume: -4.5 },
    ride: { playerName: 'ride', url: `${TONEJS_BASE_URL}hihat.mp3`, rate: 1, volume: -8 },
    crash: { playerName: 'crash', url: cymbalSource?.url, rate: cymbalSource?.rate, volume: cymbalSource?.volume, fadeOut: cymbalSource?.fadeOut },
    foot_hihat: { playerName: 'footHiHat', url: FOOT_HIHAT_EXTERNAL_URL, rate: 0.9, volume: -10, fadeOut: 0.04 },
  }
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
  const instrumentMap = getInstrumentSampleMap(kitLibrary, tomTone, floorTomTone, 'tight')
  const tomPreset = TOM_TONE_PRESETS[tomTone]
  const floorTomPreset = FLOOR_TOM_TONE_PRESETS[floorTomTone]
  if (kitLibrary === 'pearlMaster') {
    return {
      baseUrl: PEARL_MASTER_BASE_URL,
      volume: -2.5,
      files: {
        kick: instrumentMap.kick.url.replace(PEARL_MASTER_BASE_URL, ''),
        tom: instrumentMap.tom.url.replace(PEARL_MASTER_BASE_URL, ''),
        midTom: instrumentMap.midTom.url.replace(PEARL_MASTER_BASE_URL, ''),
        lowTom: instrumentMap.lowTom.url.replace(PEARL_MASTER_BASE_URL, ''),
        floorTom: instrumentMap.floorTom.url.replace(PEARL_MASTER_BASE_URL, ''),
        hihat: instrumentMap.hihat_close.url.replace(PEARL_MASTER_BASE_URL, ''),
        hihatOpen: instrumentMap.hihat_open.url.replace(PEARL_MASTER_BASE_URL, ''),
        ride: instrumentMap.ride.url.replace(PEARL_MASTER_BASE_URL, ''),
      },
      hihat: { rate: instrumentMap.hihat_close.rate, volume: instrumentMap.hihat_close.volume },
      hihatOpen: { rate: instrumentMap.hihat_open.rate, volume: instrumentMap.hihat_open.volume },
      ride: { rate: instrumentMap.ride.rate, volume: instrumentMap.ride.volume },
    }
  }

  return {
    baseUrl: TONEJS_BASE_URL,
    volume: -4,
    files: {
        kick: instrumentMap.kick.url.replace(TONEJS_BASE_URL, ''),
        tom: instrumentMap.tom.url.replace(TONEJS_BASE_URL, ''),
        midTom: instrumentMap.midTom.url.replace(TONEJS_BASE_URL, ''),
        lowTom: instrumentMap.lowTom.url.replace(TONEJS_BASE_URL, ''),
        floorTom: instrumentMap.floorTom.url.replace(TONEJS_BASE_URL, ''),
        hihat: instrumentMap.hihat_close.url.replace(TONEJS_BASE_URL, ''),
        hihatOpen: instrumentMap.hihat_open.url.replace(TONEJS_BASE_URL, ''),
        ride: instrumentMap.ride.url.replace(TONEJS_BASE_URL, ''),
    },
      hihat: { rate: instrumentMap.hihat_close.rate, volume: instrumentMap.hihat_close.volume },
      hihatOpen: { rate: instrumentMap.hihat_open.rate, volume: instrumentMap.hihat_open.volume },
      ride: { rate: instrumentMap.ride.rate, volume: instrumentMap.ride.volume },
  }
}
