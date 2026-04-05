import { useEffect, useMemo, useState } from 'react'

import VexFlowNotationPreview from '../components/vexflow-notation-preview.jsx'
import {
  BAR_OPTIONS,
  CYMBAL_TONE_OPTIONS,
  DIFFICULTY_OPTIONS,
  FILL_BAR_COUNT_OPTIONS,
  FILL_GENRE_OPTIONS,
  FILL_GROOVE_OPTIONS,
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
import { useDrumPlaybackEngine } from '../hooks/useDrumPlaybackEngine'
import { createFillInPracticePatterns } from '../utils/fillGenerator'
import { buildFillPhraseFromStoredPattern, buildSequenceFromPracticePatterns } from '../utils/fillEditorModel'
import { createPagePatterns } from '../utils/patternGenerator'
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient'

export default function PracticePage({ isMenuOpen, setIsMenuOpen }) {
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
  const [refreshKey, setRefreshKey] = useState(0)
  const [bpm, setBpm] = useState(90)
  const [kitLibrary, setKitLibrary] = useState('pearlMaster')
  const [snareTone, setSnareTone] = useState('maple')
  const [tomTone, setTomTone] = useState('standard')
  const [floorTomTone, setFloorTomTone] = useState('standard')
  const [cymbalTone, setCymbalTone] = useState('tight')
  const [practiceEnabledCustomFills, setPracticeEnabledCustomFills] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user?.id) {
      setPracticeEnabledCustomFills([])
      return
    }

    async function loadPracticeFills() {
      const { data, error } = await supabase
        .from('fill_patterns')
        .select('id, fill_length_type, resolution, include_in_practice, steps_json')
        .eq('owner_user_id', user.id)
        .eq('include_in_practice', true)

      if (error) {
        console.error('Failed to load custom practice fills:', error)
        setPracticeEnabledCustomFills([])
        return
      }

      setPracticeEnabledCustomFills((data || []).map(buildFillPhraseFromStoredPattern).filter(Boolean))
    }

    loadPracticeFills()
  }, [user?.id, refreshKey])

  const patterns = useMemo(() => (
    createPagePatterns(noteType, difficulty, bars, orchestration, kickSetting)
  ), [noteType, difficulty, bars, orchestration, kickSetting, refreshKey])

  const fillPatterns = useMemo(() => (
    createFillInPracticePatterns(fillGenre, fillGroove, fillLengthMode, fillPatternMode, fillBarCount, fillOpenHiHat, 'vexflow', practiceEnabledCustomFills)
  ), [fillGenre, fillGroove, fillLengthMode, fillPatternMode, fillBarCount, fillOpenHiHat, refreshKey, practiceEnabledCustomFills])

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

  const playbackSteps = useMemo(() => (
    buildSequenceFromPracticePatterns(
      practiceMode === 'fillin' ? fillPatterns : patterns,
      practiceMode
    )
  ), [patterns, fillPatterns, practiceMode])

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
      {item.label}
    </button>
  ))

  const actionPanelContent = (
    <>
      <div className="button-row">
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>生成</button>
        <button onClick={() => setRefreshKey((prev) => prev + 1)}>再生成</button>
        <button onClick={() => playSequence(playbackSteps, practiceMode === 'fillin' ? '16th' : noteType)} disabled={isPlaying || !samplesReady}>再生</button>
        <button onClick={stopPlayback} disabled={!isPlaying}>停止</button>
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

        <button className="ghost-button" onClick={() => window.print()}>印刷 / PDF保存</button>
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
              <h2>{practiceMode === 'accent' ? 'アクセント練習を組み立てる' : 'フィルイン練習をデザインする'}</h2>
              <p>音価、ジャンル、音色を調整して、印刷しやすいドラム譜へ整えます。</p>
            </div>

            <div className="practice-nav practice-nav-inline">
              {practiceMenuButtons}
            </div>

            <section className="control-panel">
              {practiceMode === 'accent' ? (
                <>
                  <div className="control-item">
                    <label>音符パターン</label>
                    <select value={noteType} onChange={(event) => setNoteType(event.target.value)}>
                      {NOTE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>難易度</label>
                    <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>固定小節</label>
                    <select value={bars} onChange={(event) => setBars(event.target.value)}>
                      {BAR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>タム・シンバル構成</label>
                    <select value={orchestration} onChange={(event) => setOrchestration(event.target.value)}>
                      {ORCHESTRATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>キック設定</label>
                    <select value={kickSetting} onChange={(event) => setKickSetting(event.target.value)}>
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
                    <select value={fillGenre} onChange={(event) => setFillGenre(event.target.value)}>
                      {FILL_GENRE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>基本ビート</label>
                    <select value={fillGroove} onChange={(event) => setFillGroove(event.target.value)}>
                      {FILL_GROOVE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>フィル長</label>
                    <select value={fillLengthMode} onChange={(event) => setFillLengthMode(event.target.value)}>
                      {FILL_LENGTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>フィルパターン</label>
                    <select value={fillPatternMode} onChange={(event) => setFillPatternMode(event.target.value)}>
                      {FILL_PATTERN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>生成小節数</label>
                    <select value={fillBarCount} onChange={(event) => setFillBarCount(event.target.value)}>
                      {FILL_BAR_COUNT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item control-item-checkbox">
                    <label>
                      <span>ハイハットオープン</span>
                      <button
                        type="button"
                        className={`toggle-switch ${fillOpenHiHat ? 'is-on' : 'is-off'}`}
                        aria-pressed={fillOpenHiHat}
                        aria-label={`ハイハットオープンを${fillOpenHiHat ? 'オフ' : 'オン'}にする`}
                        onClick={() => setFillOpenHiHat((prev) => !prev)}
                      >
                        <span className="toggle-switch-thumb" />
                      </button>
                    </label>
                  </div>
                </>
              )}

              <div className="control-item">
                <label>音源ライブラリ</label>
                <select value={kitLibrary} onChange={(event) => setKitLibrary(event.target.value)}>
                  {KIT_LIBRARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>スネア音色</label>
                <select value={snareTone} onChange={(event) => setSnareTone(event.target.value)}>
                  {SNARE_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>タム音色</label>
                <select value={tomTone} onChange={(event) => setTomTone(event.target.value)}>
                  {TOM_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>フロアタム音色</label>
                <select value={floorTomTone} onChange={(event) => setFloorTomTone(event.target.value)}>
                  {FLOOR_TOM_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>シンバル音色</label>
                <select value={cymbalTone} onChange={(event) => setCymbalTone(event.target.value)}>
                  {CYMBAL_TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
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

            <div className={`sheet-paper practice-sheet-paper ${practiceMode === 'accent' ? 'is-accent-mode' : 'is-fillin-mode'}`}>
            <div className="abc-section practice-score-section">
              <h2>{practiceMode === 'accent' ? 'Accent Score' : 'Fill-In Score'}</h2>
              <div className="svg-preview-list">
                {practiceMode === 'accent' ? (
                  patterns.map((pattern, index) => (
                    <VexFlowNotationPreview
                      key={`preview-${refreshKey}-${index}`}
                      pattern={pattern}
                      noteType={noteType}
                      mode="accent"
                      activeStepIndex={currentStep == null ? null : currentStep - activePatternOffsets[index]}
                    />
                  ))
                ) : (
                  fillPatterns.map((pattern, index) => (
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
