import { useMemo, useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import SvgNotationPreview from './components/SvgNotationPreview'
import VexFlowNotationPreview from './components/VexFlowNotationPreview.jsx'

import {
  NOTE_OPTIONS,
  DIFFICULTY_OPTIONS,
  BAR_OPTIONS,
  ORCHESTRATION_OPTIONS,
  KICK_OPTIONS,
  SNARE_TONE_OPTIONS,
  TOM_TONE_OPTIONS,
  FLOOR_TOM_TONE_OPTIONS,
  CYMBAL_TONE_OPTIONS,
  KIT_LIBRARY_OPTIONS,
  NOTATION_ENGINE_OPTIONS,
  PRACTICE_MENU,
  FILL_GROOVE_OPTIONS,
  FILL_GENRE_OPTIONS,
  FILL_LENGTH_OPTIONS,
  FILL_PATTERN_OPTIONS,
  FILL_BAR_COUNT_OPTIONS,
} from './constants/options'

import {
  SNARE_TONE_PRESETS,
  SNARE_LIBRARY_RATE_OVERRIDES,
  TOM_TONE_PRESETS,
  FLOOR_TOM_TONE_PRESETS,
  SNARE_LIBRARY_SOURCES,
  getCymbalSource,
  getKitConfig,
} from './constants/kitConfig'

import { createPagePatterns } from './utils/patternGenerator'
import { createFillInPracticePatterns } from './utils/fillGenerator'
import { hasLayer, stopAndStartPlayer, unlockAudioContext } from './utils/audioUtils'

export default function App() {
  const [practiceMode, setPracticeMode] = useState('accent')
  const [noteType, setNoteType] = useState('8th')
  const [difficulty, setDifficulty] = useState('easy')
  const [bars, setBars] = useState('16')
  const [orchestration, setOrchestration] = useState('none')
  const [kickSetting, setKickSetting] = useState('2')
  const [fillGroove, setFillGroove] = useState('random')
  const [fillGenre, setFillGenre] = useState('rock')
  const [fillLengthMode, setFillLengthMode] = useState('1bar')
  const [fillPatternMode, setFillPatternMode] = useState('basic')
  const [fillBarCount, setFillBarCount] = useState('32')
  const [fillOpenHiHat, setFillOpenHiHat] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [bpm, setBpm] = useState(90)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaybackStep, setCurrentPlaybackStep] = useState(null)
  const [kitLibrary, setKitLibrary] = useState('pearlMaster')
  const [snareTone, setSnareTone] = useState('maple')
  const [tomTone, setTomTone] = useState('standard')
  const [floorTomTone, setFloorTomTone] = useState('standard')
  const [cymbalTone, setCymbalTone] = useState('tight')
  const [kitReady, setKitReady] = useState(false)
  const [snareReady, setSnareReady] = useState(false)
  const [notationEngine, setNotationEngine] = useState('svg')

  const patterns = useMemo(() => {
    return createPagePatterns(noteType, difficulty, bars, orchestration, kickSetting)
  }, [noteType, difficulty, bars, orchestration, kickSetting, refreshKey])
  const fillPatterns = useMemo(() => {
    return createFillInPracticePatterns(fillGenre, fillGroove, fillLengthMode, fillPatternMode, fillBarCount, fillOpenHiHat)
  }, [fillGenre, fillGroove, fillLengthMode, fillPatternMode, fillBarCount, fillOpenHiHat, refreshKey])

  const drumKitRef = useRef(null)
  const cymbalPlayerRef = useRef(null)
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
  const playbackConfigRef = useRef(null)
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
      snareHighPassRef.current?.dispose()
      snareLowPassRef.current?.dispose()
      snareCompressorRef.current?.dispose()
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
        onerror: (error) => {
          console.error('Snare sample load failed:', error)
          markLoaded()
        },
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
      player.volume.value = preset.volume + 3
    })
    players.normal.forEach((player) => {
      player.playbackRate = libraryRate
      player.volume.value = preset.volume - 11
    })
    players.ghost.forEach((player) => {
      player.playbackRate = libraryRate
      player.volume.value = preset.volume - 18
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
    if (!cymbalSource || !kitConfig) return

    setKitReady(false)
    let cancelled = false
    let pendingLoads = 2
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

    const players = new Tone.Players(
      kitConfig.files,
      {
        baseUrl: kitConfig.baseUrl,
        fadeOut: 0.03,
        onload: markLoaded,
        onerror: (error) => {
          console.error('Kit sample load failed:', error)
          markLoaded()
        },
      }
    ).toDestination()
    players.volume.value = kitConfig.volume
    drumKitRef.current = players

    const cymbalPlayer = new Tone.Player({
      url: cymbalSource.url,
      fadeOut: cymbalSource.fadeOut,
      onload: markLoaded,
      onerror: (error) => {
        console.error('Cymbal sample load failed, fallback to hihat:', error)
        markLoaded()
      },
    }).toDestination()
    cymbalPlayerRef.current = cymbalPlayer

    return () => {
      cancelled = true
      players.stopAll()
      players.dispose()
      cymbalPlayer.stop()
      cymbalPlayer.dispose()
    }
  }, [kitLibrary, tomTone, floorTomTone, cymbalTone])

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

  const getStepDuration = () => {
    if (noteType === '4th') return '4n'
    if (noteType === '8th') return '8n'
    return '16n'
  }

  const stopAllAudio = () => {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    playEventIdRef.current = null
    drumKitRef.current?.stopAll?.()
    cymbalPlayerRef.current?.stop()
    Object.values(snarePlayersRef.current).flat().forEach((player) => {
      player?.stop()
    })
    setCurrentPlaybackStep(null)
    setIsPlaying(false)
  }

  const triggerSnare = (kind, time) => {
    const pool = snarePlayersRef.current[kind]
    if (!pool?.length) return
    const voiceIndex = snareVoiceIndexRef.current[kind] % pool.length
    const player = pool[voiceIndex]
    snareVoiceIndexRef.current[kind] = (voiceIndex + 1) % pool.length
    stopAndStartPlayer(player, time)
  }

  const handlePlay = async () => {
    if (!samplesReady) return

    await unlockAudioContext()
    setCurrentPlaybackStep(null)

    const mergedPattern =
      practiceMode === 'fillin'
        ? fillPatterns.reduce(
          (acc, pattern) => {
            acc.accentRow.push(...pattern.accentRow)
            acc.kickRow.push(...pattern.kickRow)
            return acc
          },
          { accentRow: [], kickRow: [] }
        )
        : patterns.reduce(
          (acc, pattern) => {
            acc.accentRow.push(...pattern.accentRow)
            acc.kickRow.push(...pattern.kickRow)
            return acc
          },
          { accentRow: [], kickRow: [] }
        )
    const { accentRow, kickRow } = mergedPattern
    if (!accentRow.length) return

    const stepDuration = practiceMode === 'fillin' ? '16n' : getStepDuration()

    stopAllAudio()

    let stepIndex = 0

    playEventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const currentStep = stepIndex
      Tone.Draw.schedule(() => {
        setCurrentPlaybackStep(currentStep)
      }, time)

      const accent = accentRow[stepIndex]
      const kick = kickRow[stepIndex]
      const isRightHand = stepIndex % 2 === 0
      const hasHiHatLayer = hasLayer(accent, 'H')
      const hasOpenHiHatLayer = accent === 'O' || hasLayer(accent, 'O')
      const hasRideLayer = hasLayer(accent, 'R')
      const hasSnareLayer = accent === 'S' || accent === '＜' || hasLayer(accent, 'S')

      if (kick) {
        stopAndStartPlayer(drumKitRef.current?.player('kick'), time)
      }

      if (accent === '✕') {
        const cymbalPlayer = cymbalPlayerRef.current
        const cymbalSource = getCymbalSource(kitLibrary, cymbalTone)
        if (cymbalPlayer?.loaded) {
          stopAndStartPlayer(cymbalPlayer, time, cymbalSource.rate, cymbalSource.volume)
        } else {
          const fallbackCymbal = drumKitRef.current?.player('hihat')
          if (fallbackCymbal) {
            stopAndStartPlayer(fallbackCymbal, time, 1)
          }
        }
      } else if (accent === '△' || accent === '▲') {
        // RLRL基準: R=フロアタム, L=タム
        const tomKey = isRightHand ? 'floorTom' : 'tom'
        const tomPlayer = drumKitRef.current?.player(tomKey)
        if (tomPlayer) {
          stopAndStartPlayer(
            tomPlayer,
            time,
            isRightHand
              ? FLOOR_TOM_TONE_PRESETS[floorTomTone].rate
              : TOM_TONE_PRESETS[tomTone].rate
          )
        }
      } else if (accent === 'C') {
        const crash = cymbalPlayerRef.current
        const cymbalSource = getCymbalSource(kitLibrary, cymbalTone)
        if (crash?.loaded) {
          stopAndStartPlayer(crash, time, cymbalSource.rate, cymbalSource.volume)
        }
      } else if (accent === 'T' || accent === 'M' || accent === 'F') {
        const isFloor = accent === 'F'
        const key = isFloor ? 'floorTom' : accent === 'M' ? 'midTom' : 'tom'
        const tomPlayer = drumKitRef.current?.player(key)
        if (tomPlayer) {
          stopAndStartPlayer(
            tomPlayer,
            time,
            isFloor
              ? FLOOR_TOM_TONE_PRESETS[floorTomTone].rate
              : accent === 'M'
                ? TOM_TONE_PRESETS[tomTone].rate * 0.96
                : TOM_TONE_PRESETS[tomTone].rate * 1.12
          )
        }
      } else {
        if (practiceMode === 'accent') {
          // アクセント練習はアクセントとの差が聞き取りやすいよう、かなり小さめにする
          triggerSnare('ghost', time)
        }
      }

      if (hasHiHatLayer || accent === 'H') {
        const kitConfig = getKitConfig(kitLibrary, tomTone, floorTomTone)
        const hihat = drumKitRef.current?.player('hihat')
        if (hihat) {
          stopAndStartPlayer(hihat, time, kitConfig.hihat.rate, kitConfig.hihat.volume)
        }
      }

      if (hasOpenHiHatLayer) {
        const hihat = drumKitRef.current?.player('hihat')
        if (hihat) {
          stopAndStartPlayer(hihat, time, 0.9, -4.5)
        }
      }

      if (hasRideLayer || accent === 'R') {
        const kitConfig = getKitConfig(kitLibrary, tomTone, floorTomTone)
        const ride = drumKitRef.current?.player('ride') || drumKitRef.current?.player('hihat')
        if (ride) {
          stopAndStartPlayer(ride, time, kitConfig.ride.rate, kitConfig.ride.volume)
        }
      }

      if (accent === '＜') {
        triggerSnare('accent', time)
      } else if (hasSnareLayer) {
        triggerSnare(practiceMode === 'accent' ? 'normal' : 'accent', time)
      } else if (accent && practiceMode === 'accent') {
        triggerSnare('normal', time)
      }

      stepIndex += 1

      if (stepIndex >= accentRow.length) {
        stopAllAudio()
        Tone.Draw.schedule(() => {
          setCurrentPlaybackStep(null)
        }, time)
      }
    }, stepDuration)

    Tone.Transport.start()
    setIsPlaying(true)
  }

  const handleStop = () => {
    stopAllAudio()
  }

  useEffect(() => {
    const nextConfig = JSON.stringify({
      practiceMode,
      noteType,
      difficulty,
      bars,
      orchestration,
      kickSetting,
      fillGenre,
      fillGroove,
      fillLengthMode,
      fillPatternMode,
      fillBarCount,
      fillOpenHiHat,
      kitLibrary,
      snareTone,
      tomTone,
      floorTomTone,
      cymbalTone,
      bpm,
    })

    if (playbackConfigRef.current == null) {
      playbackConfigRef.current = nextConfig
      return
    }

    if (playbackConfigRef.current !== nextConfig) {
      playbackConfigRef.current = nextConfig
      if (isPlaying) stopAllAudio()
    }
  }, [
    practiceMode,
    noteType,
    difficulty,
    bars,
    orchestration,
    kickSetting,
    fillGenre,
    fillGroove,
    fillLengthMode,
    fillPatternMode,
    fillBarCount,
    fillOpenHiHat,
    kitLibrary,
    snareTone,
    tomTone,
    floorTomTone,
    cymbalTone,
    bpm,
    isPlaying,
  ])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [practiceMode])

  const activePatternOffsets = useMemo(() => {
    let offset = 0
    return patterns.map((pattern) => {
      const start = offset
      offset += pattern.totalSteps || 0
      return start
    })
  }, [patterns])

  const activeFillPatternOffsets = useMemo(() => {
    let offset = 0
    return fillPatterns.map((pattern) => {
      const start = offset
      offset += pattern.totalSteps || 0
      return start
    })
  }, [fillPatterns])

  const PreviewComponent = notationEngine === 'vexflow' ? VexFlowNotationPreview : SvgNotationPreview

  const practiceMenuButtons = PRACTICE_MENU.map((item) => (
    <button
      key={item.value}
      className={`practice-tab ${practiceMode === item.value ? 'is-active' : ''}`}
      onClick={() => {
        setPracticeMode(item.value)
        setIsMenuOpen(false)
      }}
    >
      {item.label}
    </button>
  ))

  return (
    <div className="app">
      <header className="site-header no-print">
        <div className="brand-lockup">
          <img src="/drumpattern_logo.svg" alt="Drum Pattern Maker" className="brand-logo" />
          <div className="brand-text">
            <p className="brand-eyebrow">Digital Practice Studio</p>
            <h1>Drum Pattern Maker</h1>
          </div>
        </div>

        <nav className="practice-nav desktop-nav">
          {practiceMenuButtons}
        </nav>

        <button
          className={`menu-toggle ${isMenuOpen ? 'is-open' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="メニューを開く"
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div className="app-backdrop" />

      <div className="workspace">
        <aside className={`settings-panel no-print ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="panel-scroll">
            <div className="mobile-practice-nav">
              {practiceMenuButtons}
            </div>

            <div className="panel-intro">
              <p className="panel-kicker">{practiceMode === 'accent' ? 'Accent Lab' : 'Fill Lab'}</p>
              <h2>{practiceMode === 'accent' ? 'アクセント練習を組み立てる' : 'フィルイン練習をデザインする'}</h2>
              <p>音価、ジャンル、音色を調整して、印刷しやすいドラム譜へ整えます。</p>
            </div>

            <section className="control-panel">
              {practiceMode === 'accent' ? (
                <>
                  <div className="control-item">
                    <label>音符パターン</label>
                    <select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                      {NOTE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>難易度</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>固定小節</label>
                    <select value={bars} onChange={(e) => setBars(e.target.value)}>
                      {BAR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>タム・シンバル構成</label>
                    <select value={orchestration} onChange={(e) => setOrchestration(e.target.value)}>
                      {ORCHESTRATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>キック設定</label>
                    <select value={kickSetting} onChange={(e) => setKickSetting(e.target.value)}>
                      {KICK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="control-item">
                    <label>ジャンル</label>
                    <select value={fillGenre} onChange={(e) => setFillGenre(e.target.value)}>
                      {FILL_GENRE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>基本8ビート</label>
                    <select value={fillGroove} onChange={(e) => setFillGroove(e.target.value)}>
                      {FILL_GROOVE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>フィル長</label>
                    <select value={fillLengthMode} onChange={(e) => setFillLengthMode(e.target.value)}>
                      {FILL_LENGTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>フィルパターン</label>
                    <select value={fillPatternMode} onChange={(e) => setFillPatternMode(e.target.value)}>
                      {FILL_PATTERN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>生成小節数</label>
                    <select value={fillBarCount} onChange={(e) => setFillBarCount(e.target.value)}>
                      {FILL_BAR_COUNT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item control-item-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={fillOpenHiHat}
                        onChange={(e) => setFillOpenHiHat(e.target.checked)}
                      />
                      ハイハットオープン
                    </label>
                  </div>
                </>
              )}

              <div className="control-item">
                <label>音源ライブラリ</label>
                <select value={kitLibrary} onChange={(e) => setKitLibrary(e.target.value)}>
                  {KIT_LIBRARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>スネア音色</label>
                <select value={snareTone} onChange={(e) => setSnareTone(e.target.value)}>
                  {SNARE_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>タム音色</label>
                <select value={tomTone} onChange={(e) => setTomTone(e.target.value)}>
                  {TOM_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>フロアタム音色</label>
                <select value={floorTomTone} onChange={(e) => setFloorTomTone(e.target.value)}>
                  {FLOOR_TOM_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>シンバル音色</label>
                <select value={cymbalTone} onChange={(e) => setCymbalTone(e.target.value)}>
                  {CYMBAL_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>楽譜エンジン</label>
                <select value={notationEngine} onChange={(e) => setNotationEngine(e.target.value)}>
                  {NOTATION_ENGINE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="action-panel">
              <div className="button-row">
                <button onClick={() => setRefreshKey((prev) => prev + 1)}>生成</button>
                <button onClick={() => setRefreshKey((prev) => prev + 1)}>再生成</button>
                <button onClick={handlePlay} disabled={isPlaying || !samplesReady}>再生</button>
                <button onClick={handleStop} disabled={!isPlaying}>停止</button>
              </div>

              <div className="utility-row">
                <label className="bpm-control">
                  <span>BPM</span>
                  <input
                    type="number"
                    min="40"
                    max="240"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                  />
                </label>

                <button className="ghost-button" onClick={() => window.print()}>印刷 / PDF保存</button>
              </div>
            </section>
          </div>
        </aside>

        <section className="sheet-area">
          <div className="sheet-paper">
          <div className="sheet-meta">
            {practiceMode === 'accent' ? (
              <>
                <div>音符: {NOTE_OPTIONS.find((item) => item.value === noteType)?.label}</div>
                <div>難易度: {DIFFICULTY_OPTIONS.find((item) => item.value === difficulty)?.label}</div>
                <div>固定小節: {BAR_OPTIONS.find((item) => item.value === bars)?.label}</div>
                <div>構成: {ORCHESTRATION_OPTIONS.find((item) => item.value === orchestration)?.label}</div>
                <div>キック: {KICK_OPTIONS.find((item) => item.value === kickSetting)?.label}</div>
              </>
            ) : (
              <>
                <div>モード: フィルイン練習</div>
                <div>ジャンル: {FILL_GENRE_OPTIONS.find((item) => item.value === fillGenre)?.label}</div>
                <div>基本ビート: {FILL_GROOVE_OPTIONS.find((item) => item.value === fillGroove)?.label}</div>
                <div>フィル長: {FILL_LENGTH_OPTIONS.find((item) => item.value === fillLengthMode)?.label}</div>
                <div>フィルパターン: {FILL_PATTERN_OPTIONS.find((item) => item.value === fillPatternMode)?.label}</div>
                <div>生成小節数: {FILL_BAR_COUNT_OPTIONS.find((item) => item.value === fillBarCount)?.label}</div>
                <div>ハイハットオープン: {fillOpenHiHat ? 'あり' : 'なし'}</div>
              </>
            )}
          </div>

          <div className="abc-section">
            <h2>{practiceMode === 'accent' ? 'Accent Score' : 'Fill-In Score'}</h2>
            <div className="svg-preview-list">
              {practiceMode === 'accent' ? (
                patterns.map((pattern, index) => (
                  <PreviewComponent
                    key={`preview-${refreshKey}-${index}`}
                    pattern={pattern}
                    noteType={noteType}
                    orchestration={orchestration}
                    mode="accent"
                    showAccentMarks
                    activeStepIndex={currentPlaybackStep == null ? null : currentPlaybackStep - activePatternOffsets[index]}
                  />
                ))
              ) : (
                fillPatterns.map((pattern, index) => (
                  <PreviewComponent
                    key={`fill-preview-${refreshKey}-${index}`}
                    pattern={pattern}
                    noteType="16th"
                    orchestration="tomCymbal"
                    mode="fillin"
                    showAccentMarks={false}
                    activeStepIndex={currentPlaybackStep == null ? null : currentPlaybackStep - activeFillPatternOffsets[index]}
                  />
                ))
              )}
            </div>
          </div>

          </div>
        </section>
      </div>
    </div>
  )
}
