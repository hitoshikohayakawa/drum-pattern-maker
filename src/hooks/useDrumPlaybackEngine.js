import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

import {
  FLOOR_TOM_TONE_PRESETS,
  getInstrumentSampleMap,
  SNARE_LIBRARY_RATE_OVERRIDES,
  SNARE_LIBRARY_SOURCES,
  SNARE_TONE_PRESETS,
  TOM_TONE_PRESETS,
  getCymbalSource,
  getKitConfig,
} from '../constants/kitConfig'
import { stopAndStartPlayer, unlockAudioContext } from '../utils/audioUtils'

const CANONICAL_PPQ = 192

function getToneStepDuration(stepUnit) {
  if (stepUnit === '4th') return '4n'
  if (stepUnit === '8th') return '8n'
  if (stepUnit === '8th_triplet') return '8t'
  if (stepUnit === '16th_triplet') return '16t'
  if (stepUnit === '32nd') return '32n'
  return '16n'
}

function getAccentVolume(baseVolume, accent) {
  return accent ? (baseVolume ?? 0) + 2 : baseVolume
}

function getSnareVolumeOffset(kind, playbackMode = 'standard') {
  if (playbackMode === 'accent_exercise') {
    if (kind === 'accent') return 3
    if (kind === 'ghost') return -18
    return -11
  }

  if (kind === 'accent') return 8
  if (kind === 'ghost') return -18
  return 0
}

export function useDrumPlaybackEngine({
  kitLibrary,
  snareTone,
  tomTone,
  floorTomTone,
  cymbalTone,
  bpm,
}) {
  const drumKitRef = useRef(null)
  const cymbalPlayerRef = useRef(null)
  const footHiHatPlayerRef = useRef(null)
  const snarePlayersRef = useRef({
    accent: [],
    normal: [],
    ghost: [],
  })
  const snareVoiceIndexRef = useRef({
    accent: 0,
    normal: 0,
    ghost: 0,
  })
  const snareHighPassRef = useRef(null)
  const snareLowPassRef = useRef(null)
  const snareCompressorRef = useRef(null)
  const playEventIdRef = useRef(null)
  const playbackModeRef = useRef('standard')

  const [kitReady, setKitReady] = useState(false)
  const [snareReady, setSnareReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)

  const samplesReady = kitReady && snareReady

  useEffect(() => {
    snareHighPassRef.current = new Tone.Filter(140, 'highpass')
    snareLowPassRef.current = new Tone.Filter(4700, 'lowpass')
    snareCompressorRef.current = new Tone.Compressor({
      threshold: -22,
      ratio: 3,
      attack: 0.003,
      release: 0.12,
    }).toDestination()

    snareHighPassRef.current.connect(snareLowPassRef.current)
    snareLowPassRef.current.connect(snareCompressorRef.current)
    Tone.Transport.bpm.value = bpm

    return () => {
      Tone.Transport.stop()
      Tone.Transport.cancel()
      cymbalPlayerRef.current?.stop()
      cymbalPlayerRef.current?.dispose()
      footHiHatPlayerRef.current?.stop()
      footHiHatPlayerRef.current?.dispose()
      snareHighPassRef.current?.dispose()
      snareLowPassRef.current?.dispose()
      snareCompressorRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    Tone.Transport.bpm.value = bpm
  }, [bpm])

  useEffect(() => {
    const unlockFromGesture = () => {
      unlockAudioContext()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        unlockAudioContext()
      }
    }

    const handlePageShow = () => {
      unlockAudioContext()
    }

    window.addEventListener('touchstart', unlockFromGesture, { passive: true })
    window.addEventListener('pointerdown', unlockFromGesture, { passive: true })
    window.addEventListener('click', unlockFromGesture, { passive: true })
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('touchstart', unlockFromGesture)
      window.removeEventListener('pointerdown', unlockFromGesture)
      window.removeEventListener('click', unlockFromGesture)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const snareUrl = SNARE_LIBRARY_SOURCES[kitLibrary]?.[snareTone]
    if (!snareUrl || !snareHighPassRef.current) return

    setSnareReady(false)
    let loadedCount = 0
    const markLoaded = () => {
      loadedCount += 1
      if (loadedCount >= 12) setSnareReady(true)
    }

    const createSnarePlayer = () => {
      const player = new Tone.Player({
        url: snareUrl,
        fadeOut: kitLibrary === 'pearlMaster' ? 0.08 : 0.02,
        onload: markLoaded,
        onerror: () => markLoaded(),
      })
      player.connect(snareHighPassRef.current)
      return player
    }

    const createSnarePool = () => Array.from({ length: 4 }, () => createSnarePlayer())
    const nextPlayers = {
      accent: createSnarePool(),
      normal: createSnarePool(),
      ghost: createSnarePool(),
    }

    const previousPlayers = snarePlayersRef.current
    snarePlayersRef.current = nextPlayers
    snareVoiceIndexRef.current = {
      accent: 0,
      normal: 0,
      ghost: 0,
    }

    return () => {
      Object.values(previousPlayers || {}).flat().forEach((player) => {
        player?.stop()
        player?.dispose()
      })
      Object.values(nextPlayers).flat().forEach((player) => {
        player.stop()
        player.dispose()
      })
    }
  }, [kitLibrary, snareTone])

  useEffect(() => {
    const preset = SNARE_TONE_PRESETS[snareTone]
    if (!preset) return
    if (!snarePlayersRef.current || !snareHighPassRef.current || !snareLowPassRef.current || !snareCompressorRef.current) return

    const libraryRate = SNARE_LIBRARY_RATE_OVERRIDES[kitLibrary]?.[snareTone] ?? preset.rate
    const players = snarePlayersRef.current
    if (!players.accent.length || !players.normal.length || !players.ghost.length) return

    players.accent.forEach((player) => {
      player.playbackRate = libraryRate
      player.volume.value = preset.volume + getSnareVolumeOffset('accent', playbackModeRef.current)
    })
    players.normal.forEach((player) => {
      player.playbackRate = libraryRate
      player.volume.value = preset.volume + getSnareVolumeOffset('normal', playbackModeRef.current)
    })
    players.ghost.forEach((player) => {
      player.playbackRate = libraryRate
      player.volume.value = preset.volume + getSnareVolumeOffset('ghost', playbackModeRef.current)
    })

    snareHighPassRef.current.frequency.value = preset.hpf
    snareLowPassRef.current.frequency.value = preset.lpf
    snareCompressorRef.current.threshold.value = preset.threshold
    snareCompressorRef.current.ratio.value = preset.ratio
    snareCompressorRef.current.attack.value = preset.attack
    snareCompressorRef.current.release.value = preset.release
  }, [snareTone, kitLibrary])

  useEffect(() => {
    const cymbalSource = getCymbalSource(kitLibrary, cymbalTone)
    const kitConfig = getKitConfig(kitLibrary, tomTone, floorTomTone)
    const instrumentSampleMap = getInstrumentSampleMap(kitLibrary, tomTone, floorTomTone, cymbalTone)
    if (!cymbalSource || !kitConfig || !instrumentSampleMap.foot_hihat?.url) return

    setKitReady(false)
    let cancelled = false
    let pendingLoads = 3
    const markLoaded = () => {
      if (cancelled) return
      pendingLoads -= 1
      if (pendingLoads <= 0) setKitReady(true)
    }

    if (cymbalPlayerRef.current) {
      cymbalPlayerRef.current.stop()
      cymbalPlayerRef.current.dispose()
      cymbalPlayerRef.current = null
    }

    if (footHiHatPlayerRef.current) {
      footHiHatPlayerRef.current.stop()
      footHiHatPlayerRef.current.dispose()
      footHiHatPlayerRef.current = null
    }

    const players = new Tone.Players(
      kitConfig.files,
      {
        baseUrl: kitConfig.baseUrl,
        fadeOut: 0.03,
        onload: markLoaded,
        onerror: () => markLoaded(),
      }
    ).toDestination()
    players.volume.value = kitConfig.volume
    drumKitRef.current = players

    const cymbalPlayer = new Tone.Player({
      url: cymbalSource.url,
      fadeOut: cymbalSource.fadeOut,
      onload: markLoaded,
      onerror: () => markLoaded(),
    }).toDestination()
    cymbalPlayerRef.current = cymbalPlayer

    const footHiHatPlayer = new Tone.Player({
      url: instrumentSampleMap.foot_hihat.url,
      fadeOut: instrumentSampleMap.foot_hihat.fadeOut,
      onload: markLoaded,
      onerror: () => markLoaded(),
    }).toDestination()
    footHiHatPlayerRef.current = footHiHatPlayer

    return () => {
      cancelled = true
      players.stopAll()
      players.dispose()
      cymbalPlayer.stop()
      cymbalPlayer.dispose()
      footHiHatPlayer.stop()
      footHiHatPlayer.dispose()
    }
  }, [kitLibrary, tomTone, floorTomTone, cymbalTone])

  const stopPlayback = () => {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    playEventIdRef.current = null
    drumKitRef.current?.stopAll?.()
    cymbalPlayerRef.current?.stop()
    footHiHatPlayerRef.current?.stop()
    Object.values(snarePlayersRef.current).flat().forEach((player) => {
      player?.stop()
    })
    setCurrentStep(null)
    setIsPlaying(false)
  }

  const triggerSnare = (kind, time, playbackMode = 'standard') => {
    const pool = snarePlayersRef.current[kind]
    if (!pool?.length) return
    const voiceIndex = snareVoiceIndexRef.current[kind] % pool.length
    const player = pool[voiceIndex]
    const preset = SNARE_TONE_PRESETS[snareTone]
    const libraryRate = SNARE_LIBRARY_RATE_OVERRIDES[kitLibrary]?.[snareTone] ?? preset?.rate
    snareVoiceIndexRef.current[kind] = (voiceIndex + 1) % pool.length
    if (preset) {
      player.playbackRate = libraryRate
      player.volume.value = preset.volume + getSnareVolumeOffset(kind, playbackMode)
    }
    stopAndStartPlayer(player, time)
  }

  const triggerKitPlayer = (playerName, time, options = {}) => {
    const player = drumKitRef.current?.player(playerName)
    if (!player) return
    stopAndStartPlayer(player, time, options.playbackRate, options.volume)
  }

  const triggerCrash = (time, accent = false) => {
    const cymbalPlayer = cymbalPlayerRef.current
    const cymbalSource = getCymbalSource(kitLibrary, cymbalTone)
    if (!cymbalPlayer?.loaded) return
    stopAndStartPlayer(
      cymbalPlayer,
      time,
      cymbalSource.rate,
      getAccentVolume(cymbalSource.volume, accent)
    )
  }

  const triggerFootHiHat = (time, accent = false) => {
    const sampleMap = getInstrumentSampleMap(kitLibrary, tomTone, floorTomTone, cymbalTone)
    const footHiHatSource = sampleMap.foot_hihat
    const footHiHatPlayer = footHiHatPlayerRef.current
    if (!footHiHatPlayer?.loaded || !footHiHatSource?.url) return

    stopAndStartPlayer(
      footHiHatPlayer,
      time,
      footHiHatSource.rate,
      getAccentVolume(footHiHatSource.volume, accent)
    )
  }

  const triggerStep = (step, time) => {
    const kitConfig = getKitConfig(kitLibrary, tomTone, floorTomTone)
    const accent = Boolean(step?.accent)
    const instruments = step?.instruments || []
    const playbackMode = playbackModeRef.current

    if (instruments.includes('bass_drum')) {
      triggerKitPlayer('kick', time)
    }
    if (instruments.includes('ghost_snare')) {
      triggerSnare('ghost', time, playbackMode)
    }
    if (instruments.includes('snare')) {
      triggerSnare(accent ? 'accent' : 'normal', time, playbackMode)
    }
    if (instruments.includes('hihat_close')) {
      triggerKitPlayer('hihat', time, {
        playbackRate: kitConfig.hihat.rate,
        volume: getAccentVolume(kitConfig.hihat.volume, accent),
      })
    }
    if (instruments.includes('foot_hihat')) {
      triggerFootHiHat(time, accent)
    }
    if (instruments.includes('hihat_open')) {
      triggerKitPlayer('hihatOpen', time, {
        playbackRate: kitConfig.hihatOpen.rate,
        volume: getAccentVolume(kitConfig.hihatOpen.volume, accent),
      })
    }
    if (instruments.includes('ride')) {
      triggerKitPlayer('ride', time, {
        playbackRate: kitConfig.ride.rate,
        volume: getAccentVolume(kitConfig.ride.volume, accent),
      })
    }
    if (instruments.includes('crash')) {
      triggerCrash(time, accent)
    }
    if (instruments.includes('hi_tom')) {
      triggerKitPlayer('tom', time, {
        playbackRate: TOM_TONE_PRESETS[tomTone].rate * 1.12,
        volume: accent ? -1 : undefined,
      })
    }
    if (instruments.includes('mid_tom')) {
      triggerKitPlayer('midTom', time, {
        playbackRate: TOM_TONE_PRESETS[tomTone].rate * 0.96,
        volume: accent ? -1 : undefined,
      })
    }
    if (instruments.includes('low_tom')) {
      triggerKitPlayer('lowTom', time, {
        playbackRate: FLOOR_TOM_TONE_PRESETS[floorTomTone].rate * 0.97,
        volume: accent ? -1 : undefined,
      })
    }
    if (instruments.includes('floor_tom')) {
      triggerKitPlayer('floorTom', time, {
        playbackRate: FLOOR_TOM_TONE_PRESETS[floorTomTone].rate,
        volume: accent ? -1 : undefined,
      })
    }
  }

  const playSequence = async (steps, stepUnit = '16th', playbackMode = 'standard') => {
    if (!samplesReady || !Array.isArray(steps) || steps.length === 0) return

    await unlockAudioContext()
    stopPlayback()
    playbackModeRef.current = playbackMode

    const hasTickTiming = steps.every((step) => Number.isFinite(step?.startTick) && Number.isFinite(step?.durationTick))

    if (hasTickTiming) {
      const secondsPerTick = 60 / Tone.Transport.bpm.value / CANONICAL_PPQ
      const lastStep = steps[steps.length - 1]
      const endTick = lastStep.startTick + lastStep.durationTick

      steps.forEach((step) => {
        Tone.Transport.scheduleOnce((time) => {
          Tone.Draw.schedule(() => {
            setCurrentStep(step.index)
          }, time)

          triggerStep(step, time)
        }, step.startTick * secondsPerTick)
      })

      Tone.Transport.scheduleOnce((time) => {
        Tone.Draw.schedule(() => {
          setCurrentStep(null)
          setIsPlaying(false)
        }, time)
        Tone.Transport.stop(time)
      }, endTick * secondsPerTick)

      Tone.Transport.start()
      setIsPlaying(true)
      return
    }

    let cursor = 0
    const duration = getToneStepDuration(stepUnit)

    playEventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const step = steps[cursor]

      Tone.Draw.schedule(() => {
        setCurrentStep(step.index)
      }, time)

      triggerStep(step, time)
      cursor += 1

      if (cursor >= steps.length) {
        stopPlayback()
      }
    }, duration)

    Tone.Transport.start()
    setIsPlaying(true)
  }

  return {
    samplesReady,
    isPlaying,
    currentStep,
    playSequence,
    stopPlayback,
  }
}
