import { useEffect, useMemo, useState } from 'react'

import VexFlowNotationPreview from '../components/vexflow-notation-preview.jsx'
import {
  BAR_OPTIONS,
  CYMBAL_TONE_OPTIONS,
  DIFFICULTY_OPTIONS,
  FILL_BAR_COUNT_OPTIONS,
  FILL_GENRE_OPTIONS,
  FILL_GROOVE_OPTIONS,
  FILL_GROOVE_LOCK_OPTIONS,
  FILL_LENGTH_OPTIONS,
  FILL_PATTERN_OPTIONS,
  FLOOR_TOM_TONE_OPTIONS,
  KIT_LIBRARY_OPTIONS,
  KICK_OPTIONS,
  NOTE_OPTIONS,
  ORCHESTRATION_OPTIONS,
  PRACTICE_MENU,
  SNARE_TONE_OPTIONS,
  TOM_TONE_OPTIONS,
} from '../constants/options'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useI18n } from '../contexts/I18nContext.jsx'
import { useDrumPlaybackEngine } from '../hooks/useDrumPlaybackEngine'
import { createCanonicalFillInPracticePatterns } from '../utils/fillGenerator'
import {
  buildNotationPatternsFromCanonicalPatterns,
  buildPlaybackSequenceFromCanonicalPatterns,
} from '../utils/fillEditorModel'
import { createCanonicalPagePatterns } from '../utils/patternGenerator'
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient'

function isMissingPatternJsonColumn(error) {
  return String(error?.message || '').includes('pattern_json')
}

export default function PracticePage({ isMenuOpen, setIsMenuOpen }) {
  const [practiceMode, setPracticeMode] = useState('accent')
  const [noteType, setNoteType] = useState('8th')
  const [difficulty, setDifficulty] = useState('easy')
  const [bars, setBars] = useState('16')
  const [orchestration, setOrchestration] = useState('none')
  const [kickSetting, setKickSetting] = useState('2')
  const [fillGroove, setFillGroove] = useState('random')
  const [fillGrooveLock, setFillGrooveLock] = useState('4bars')
  const [fillGenre, setFillGenre] = useState('rock')
  const [fillLengthMode, setFillLengthMode] = useState('1bar')
  const [fillPatternMode, setFillPatternMode] = useState('basic')
  const [fillBarCount, setFillBarCount] = useState('32')
  const [fillOpenHiHat, setFillOpenHiHat] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [bpm, setBpm] = useState(90)
  const [kitLibrary, setKitLibrary] = useState('pearlMaster')
  const [snareTone, setSnareTone] = useState('maple')
  const [tomTone, setTomTone] = useState('standard')
  const [floorTomTone, setFloorTomTone] = useState('standard')
  const [cymbalTone, setCymbalTone] = useState('tight')
  const [practiceEnabledCustomFills, setPracticeEnabledCustomFills] = useState([])
  const { user } = useAuth()
  const { language } = useI18n()
  const isJapanese = language === 'ja'
  const localize = (ja, en) => (isJapanese ? ja : en)

  const noteOptionLabel = (value) => ({
    '4th': localize('4部音符', 'Quarter Notes'),
    '8th': localize('8部音符', 'Eighth Notes'),
    '16th': localize('16部音符', 'Sixteenth Notes'),
  }[value] || value)

  const difficultyLabel = (value) => ({
    easy: localize('イージー', 'Easy'),
    normal: localize('ノーマル', 'Normal'),
    hard: localize('ハード', 'Hard'),
  }[value] || value)

  const barLabel = (value) => ({
    '16': localize('16小節固定', '16 Bars'),
    '8': localize('8小節固定', '8 Bars'),
    '4': localize('4小節固定', '4 Bars'),
    '2': localize('2小節固定', '2 Bars'),
  }[value] || value)

  const orchestrationLabel = (value) => ({
    none: localize('なし', 'None'),
    tom: localize('タム', 'Toms'),
    tomCymbal: localize('タム・シンバル', 'Toms + Cymbals'),
  }[value] || value)

  const kickLabel = (value) => ({
    none: localize('なし', 'None'),
    '1': localize('1拍', 'Beat 1'),
    '2': localize('2拍', 'Beat 2'),
    '3': localize('3拍', 'Beat 3'),
    '4': localize('4拍', 'Beat 4'),
  }[value] || value)

  const grooveLabel = (value) => ({
    random: localize('ランダム（複数パターン）', 'Random'),
    straight: localize('基本8ビート', 'Basic 8-Beat'),
    syncopated: localize('シンコペ8ビート', 'Syncopated 8-Beat'),
    ride: localize('ライド8ビート', 'Ride 8-Beat'),
    shake: localize('シェイクビート', 'Shake Beat'),
    dance: localize('ダンスビート', 'Dance Beat'),
    soca: localize('ソカ', 'Soca'),
  }[value] || value)

  const fillLengthLabel = (value) => ({
    '1bar': localize('1小節フィル', '1-Bar Fill'),
    half: localize('0.5小節フィル', 'Half-Bar Fill'),
    quarter: localize('0.25小節フィル', 'Quarter-Bar Fill'),
  }[value] || value)

  const fillGrooveLockLabel = (value) => ({
    '4bars': localize('4小節固定', 'Lock Every 4 Bars'),
    all: localize('全て固定', 'Lock All Bars'),
  }[value] || value)

  const fillPatternLabel = (value) => ({
    basic: localize('基本パターン', 'Basic Patterns'),
    random: localize('ランダム', 'Random'),
    created: localize('作成したもの', 'Created by Me'),
  }[value] || value)

  const fillBarCountLabel = (value) => ({
    '32': localize('32小節', '32 Bars'),
    '16': localize('16小節', '16 Bars'),
    '4': localize('4小節', '4 Bars'),
  }[value] || value)

  const fillGenreLabel = (value) => ({
    rock: 'ROCK',
    pops: 'POPS',
    blues: 'Blues',
    jazz: 'JAZZ',
  }[value] || value)

  const snareToneLabel = (value) => ({
    maple: localize('メープル（ウォーム）', 'Maple (Warm)'),
    bright: localize('ブライト', 'Bright'),
    fat: localize('ファット', 'Fat'),
  }[value] || value)

  const tomToneLabel = (value) => ({
    standard: localize('スタンダード', 'Standard'),
    tight: localize('タイト（高め）', 'Tight (High)'),
    deep: localize('ディープ（低め）', 'Deep (Low)'),
  }[value] || value)

  const floorTomToneLabel = tomToneLabel

  const cymbalToneLabel = (value) => ({
    tight: localize('タイト', 'Tight'),
    open: localize('オープン寄り', 'Open'),
    dark: localize('ダーク', 'Dark'),
  }[value] || value)

  const kitLibraryLabel = (value) => ({
    pearlMaster: 'Pearl Master Studio',
    webStandard: localize('Web標準キット', 'Web Standard Kit'),
  }[value] || value)
  const noteTypeMetaLabel = noteOptionLabel(noteType)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user?.id) {
      setPracticeEnabledCustomFills([])
      return
    }

    async function loadPracticeFills() {
      let { data, error } = await supabase
        .from('fill_patterns')
        .select('id, fill_length_type, resolution, include_in_practice, steps_json, pattern_json')
        .eq('owner_user_id', user.id)
        .eq('include_in_practice', true)

      if (isMissingPatternJsonColumn(error)) {
        ;({ data, error } = await supabase
          .from('fill_patterns')
          .select('id, fill_length_type, resolution, include_in_practice, steps_json')
          .eq('owner_user_id', user.id)
          .eq('include_in_practice', true))
      }

      if (error) {
        console.error('Failed to load custom practice fills:', error)
        setPracticeEnabledCustomFills([])
        return
      }

      setPracticeEnabledCustomFills(data || [])
    }

    loadPracticeFills()
  }, [user?.id, refreshKey])

  const canonicalPatterns = useMemo(() => (
    createCanonicalPagePatterns(noteType, difficulty, bars, orchestration, kickSetting)
  ), [noteType, difficulty, bars, orchestration, kickSetting, refreshKey])

  const canonicalFillPatterns = useMemo(() => (
    createCanonicalFillInPracticePatterns(fillGenre, fillGroove, fillLengthMode, fillPatternMode, fillBarCount, fillGrooveLock, fillOpenHiHat, 'vexflow', practiceEnabledCustomFills)
  ), [fillGenre, fillGroove, fillLengthMode, fillPatternMode, fillBarCount, fillGrooveLock, fillOpenHiHat, refreshKey, practiceEnabledCustomFills])

  const notationPatterns = useMemo(() => (
    buildNotationPatternsFromCanonicalPatterns(canonicalPatterns)
  ), [canonicalPatterns])

  const notationFillPatterns = useMemo(() => (
    buildNotationPatternsFromCanonicalPatterns(canonicalFillPatterns)
  ), [canonicalFillPatterns])

  const fillPlaybackResolution = useMemo(
    () => canonicalFillPatterns[0]?.resolution || '16th',
    [canonicalFillPatterns]
  )

  const activePatternOffsets = useMemo(() => {
    let offset = 0
    return notationPatterns.map((pattern) => {
      const start = offset
      offset += pattern.totalSteps || 0
      return start
    })
  }, [notationPatterns])

  const activeFillPatternOffsets = useMemo(() => {
    let offset = 0
    return notationFillPatterns.map((pattern) => {
      const start = offset
      offset += pattern.totalSteps || 0
      return start
    })
  }, [notationFillPatterns])

  const playbackSteps = useMemo(() => (
    buildPlaybackSequenceFromCanonicalPatterns(
      practiceMode === 'fillin' ? canonicalFillPatterns : canonicalPatterns
    )
  ), [canonicalPatterns, canonicalFillPatterns, practiceMode])

  const {
    samplesReady,
    isPlaying,
    currentStep,
    playSequence,
    stopPlayback,
  } = useDrumPlaybackEngine({
    kitLibrary,
    snareTone,
    tomTone,
    floorTomTone,
    cymbalTone,
    bpm,
  })

  useEffect(() => {
    setIsMenuOpen(false)
  }, [practiceMode])

  const playbackConfig = JSON.stringify({
    practiceMode,
    noteType,
    difficulty,
    bars,
    orchestration,
    kickSetting,
    fillGenre,
    fillGroove,
    fillGrooveLock,
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
    refreshKey,
  })

  useEffect(() => {
    if (isPlaying) {
      stopPlayback()
    }
  }, [playbackConfig])

  const practiceMenuButtons = PRACTICE_MENU.map((item) => (
    <button
      key={item.value}
      className={`practice-tab ${practiceMode === item.value ? 'is-active' : ''}`}
      onClick={() => {
        setPracticeMode(item.value)
        setIsMenuOpen(false)
      }}
    >
      {item.value === 'accent' ? localize('アクセント練習', 'Accent Practice') : localize('フィルイン練習', 'Fill Practice')}
    </button>
  ))

  const actionPanelContent = (
    <>
      <div className="button-row">
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>{localize('生成', 'Generate')}</button>
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>{localize('再生成', 'Regenerate')}</button>
        <button
          onClick={() => playSequence(
            playbackSteps,
            practiceMode === 'fillin' ? fillPlaybackResolution : noteType,
            practiceMode === 'accent' ? 'accent_exercise' : 'standard'
          )}
          disabled={isPlaying || !samplesReady}
        >
          {localize('再生', 'Play')}
        </button>
        <button onClick={stopPlayback} disabled={!isPlaying}>{localize('停止', 'Stop')}</button>
      </div>

      <div className="utility-row">
        <label className="bpm-control">
          <span>BPM</span>
          <input
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
          />
        </label>

        <button className="ghost-button" onClick={() => window.print()}>{localize('印刷 / PDF保存', 'Print / Save PDF')}</button>
      </div>
    </>
  )

  return (
    <>
      <section className="mobile-action-panel no-print">
        {actionPanelContent}
      </section>

      <div className="workspace">
        <aside className={`settings-panel no-print ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="panel-scroll">
            <div className="mobile-practice-nav">
              {practiceMenuButtons}
            </div>

          <div className="panel-intro">
              <p className="panel-kicker">{practiceMode === 'accent' ? 'Accent Lab' : 'Fill Lab'}</p>
              <h2>{practiceMode === 'accent' ? localize('アクセント練習を組み立てる', 'Build Accent Practice') : localize('フィルイン練習をデザインする', 'Design Fill Practice')}</h2>
              <p>{localize('音価、ジャンル、音色を調整して、印刷しやすいドラム譜へ整えます。', 'Adjust note values, genres, and tones to shape printable drum notation.')}</p>
            </div>

            <div className="practice-nav practice-nav-inline">
              {practiceMenuButtons}
            </div>

            <section className="control-panel">
              {practiceMode === 'accent' ? (
                <>
                  <div className="control-item">
                    <label>{localize('音符パターン', 'Note Pattern')}</label>
                    <select value={noteType} onChange={(event) => setNoteType(event.target.value)}>
                      {NOTE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{noteOptionLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('難易度', 'Difficulty')}</label>
                    <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{difficultyLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('固定小節', 'Bars')}</label>
                    <select value={bars} onChange={(event) => setBars(event.target.value)}>
                      {BAR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{barLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('タム・シンバル構成', 'Tom / Cymbal Layout')}</label>
                    <select value={orchestration} onChange={(event) => setOrchestration(event.target.value)}>
                      {ORCHESTRATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{orchestrationLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('キック設定', 'Kick Pattern')}</label>
                    <select value={kickSetting} onChange={(event) => setKickSetting(event.target.value)}>
                      {KICK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{kickLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="control-item">
                    <label>{localize('ジャンル', 'Genre')}</label>
                    <select value={fillGenre} onChange={(event) => setFillGenre(event.target.value)}>
                      {FILL_GENRE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{fillGenreLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('基本ビート', 'Base Groove')}</label>
                    <select value={fillGroove} onChange={(event) => setFillGroove(event.target.value)}>
                      {FILL_GROOVE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{grooveLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('基本ビート固定', 'Base Groove Lock')}</label>
                    <select value={fillGrooveLock} onChange={(event) => setFillGrooveLock(event.target.value)}>
                      {FILL_GROOVE_LOCK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{fillGrooveLockLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('フィル長', 'Fill Length')}</label>
                    <select value={fillLengthMode} onChange={(event) => setFillLengthMode(event.target.value)}>
                      {FILL_LENGTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{fillLengthLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('フィルパターン', 'Fill Pattern')}</label>
                    <select value={fillPatternMode} onChange={(event) => setFillPatternMode(event.target.value)}>
                      {FILL_PATTERN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{fillPatternLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>{localize('生成小節数', 'Generated Bars')}</label>
                    <select value={fillBarCount} onChange={(event) => setFillBarCount(event.target.value)}>
                      {FILL_BAR_COUNT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{fillBarCountLabel(option.value)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item control-item-checkbox">
                    <label>
                      <span>{localize('ハイハットオープン', 'Open Hi-Hat')}</span>
                      <button
                        type="button"
                        className={`toggle-switch ${fillOpenHiHat ? 'is-on' : 'is-off'}`}
                        aria-pressed={fillOpenHiHat}
                        aria-label={fillOpenHiHat ? localize('ハイハットオープンをオフにする', 'Turn open hi-hat off') : localize('ハイハットオープンをオンにする', 'Turn open hi-hat on')}
                        onClick={() => setFillOpenHiHat((prev) => !prev)}
                      >
                        <span className="toggle-switch-thumb" />
                      </button>
                    </label>
                  </div>
                </>
              )}

              <div className="control-item">
                <label>{localize('音源ライブラリ', 'Kit Library')}</label>
                <select value={kitLibrary} onChange={(event) => setKitLibrary(event.target.value)}>
                  {KIT_LIBRARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{kitLibraryLabel(option.value)}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>{localize('スネア音色', 'Snare Tone')}</label>
                <select value={snareTone} onChange={(event) => setSnareTone(event.target.value)}>
                  {SNARE_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{snareToneLabel(option.value)}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>{localize('タム音色', 'Tom Tone')}</label>
                <select value={tomTone} onChange={(event) => setTomTone(event.target.value)}>
                  {TOM_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{tomToneLabel(option.value)}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>{localize('フロアタム音色', 'Floor Tom Tone')}</label>
                <select value={floorTomTone} onChange={(event) => setFloorTomTone(event.target.value)}>
                  {FLOOR_TOM_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{floorTomToneLabel(option.value)}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>{localize('シンバル音色', 'Cymbal Tone')}</label>
                <select value={cymbalTone} onChange={(event) => setCymbalTone(event.target.value)}>
                  {CYMBAL_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{cymbalToneLabel(option.value)}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="action-panel desktop-action-panel">
              {actionPanelContent}
            </section>
          </div>
        </aside>

        <section className="sheet-area practice-sheet-area">
          <div className="practice-sheet-stack">
            <div className="sheet-meta sheet-meta-outside no-print">
              {practiceMode === 'accent' ? (
                <>
                  <div>{localize('音符', 'Notes')}: {noteTypeMetaLabel}</div>
                  <div>{localize('難易度', 'Difficulty')}: {difficultyLabel(difficulty)}</div>
                  <div>{localize('固定小節', 'Bars')}: {barLabel(bars)}</div>
                  <div>{localize('構成', 'Layout')}: {orchestrationLabel(orchestration)}</div>
                  <div>{localize('キック', 'Kick')}: {kickLabel(kickSetting)}</div>
                </>
              ) : (
                <>
                  <div>{localize('モード', 'Mode')}: {localize('フィルイン練習', 'Fill Practice')}</div>
                  <div>{localize('ジャンル', 'Genre')}: {fillGenreLabel(fillGenre)}</div>
                  <div>{localize('基本ビート', 'Base Groove')}: {grooveLabel(fillGroove)}</div>
                  <div>{localize('基本ビート固定', 'Base Groove Lock')}: {fillGrooveLockLabel(fillGrooveLock)}</div>
                  <div>{localize('フィル長', 'Fill Length')}: {fillLengthLabel(fillLengthMode)}</div>
                  <div>{localize('フィルパターン', 'Fill Pattern')}: {fillPatternLabel(fillPatternMode)}</div>
                  <div>{localize('生成小節数', 'Generated Bars')}: {fillBarCountLabel(fillBarCount)}</div>
                  <div>{localize('ハイハットオープン', 'Open Hi-Hat')}: {fillOpenHiHat ? localize('あり', 'On') : localize('なし', 'Off')}</div>
                </>
              )}
            </div>

            <div className={`sheet-paper practice-sheet-paper ${practiceMode === 'accent' ? 'is-accent-mode' : 'is-fillin-mode'}`}>
            <div className="abc-section practice-score-section">
              <h2>{practiceMode === 'accent' ? localize('アクセント譜', 'Accent Score') : localize('フィルイン譜', 'Fill-In Score')}</h2>
              <div className="svg-preview-list">
                {practiceMode === 'accent' ? (
                  notationPatterns.map((pattern, index) => (
                    <VexFlowNotationPreview
                      key={`preview-${refreshKey}-${index}`}
                      pattern={pattern}
                      noteType={noteType}
                      mode="accent"
                      activeStepIndex={currentStep == null ? null : currentStep - activePatternOffsets[index]}
                    />
                  ))
                ) : (
                  notationFillPatterns.map((pattern, index) => (
                    <VexFlowNotationPreview
                      key={`fill-preview-${refreshKey}-${index}`}
                      pattern={pattern}
                      noteType="16th"
                      mode="fillin"
                      activeStepIndex={currentStep == null ? null : currentStep - activeFillPatternOffsets[index]}
                    />
                  ))
                )}
              </div>
            </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
