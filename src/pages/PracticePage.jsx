import { useEffect, useMemo, useState } from 'react'

import VexFlowNotationPreview from '../components/vexflow-notation-preview.jsx'
import TodayMixedNotationPreview from '../components/TodayMixedNotationPreview.jsx'
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
import { resolutionFromGridProfile } from '../constants/rhythmSchema.js'
import { createCanonicalPagePatterns } from '../utils/patternGenerator'
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient'
import {
  createTodayPracticeMenu,
  buildTodayMixedPlaybackSequence,
  createSelectedReadingPractice,
  getTodayPracticeHistory,
  recordTodayPracticeResult,
} from '../utils/todayPractice'

function isMissingPatternJsonColumn(error) {
  return String(error?.message || '').includes('pattern_json')
}

export default function PracticePage({ isMenuOpen, setIsMenuOpen }) {
  const [practiceView, setPracticeView] = useState('today')
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
  const [todayMenu, setTodayMenu] = useState(null)
  const [todayIndex, setTodayIndex] = useState(0)
  const [todayHistory, setTodayHistory] = useState(() => getTodayPracticeHistory())
  const [todayFeedback, setTodayFeedback] = useState('')
  const [todayDifficulty, setTodayDifficulty] = useState('normal')
  const [todayGeneration, setTodayGeneration] = useState(0)
  const [manualRests, setManualRests] = useState(false)
  const [manualSyncopation, setManualSyncopation] = useState(false)
  const [manualAccents, setManualAccents] = useState(false)
  const [manualTriplets, setManualTriplets] = useState(false)
  const [manualExerciseType, setManualExerciseType] = useState('reading')
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
    manualRests || manualSyncopation || manualAccents || manualTriplets || manualExerciseType !== 'reading'
      ? [createSelectedReadingPractice({
          noteValue: noteType,
          includeRests: manualRests,
          includeSyncopation: manualSyncopation,
          includeAccents: manualAccents,
          includeTriplets: manualTriplets,
          exerciseType: manualExerciseType,
        })]
      : createCanonicalPagePatterns(noteType, difficulty, bars, orchestration, kickSetting)
  ), [noteType, difficulty, bars, orchestration, kickSetting, refreshKey, manualRests, manualSyncopation, manualAccents, manualTriplets, manualExerciseType])

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
    () => resolutionFromGridProfile(canonicalFillPatterns[0]?.gridProfile || 'straight_16'),
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

  const playbackSteps = useMemo(() => (
    buildPlaybackSequenceFromCanonicalPatterns(
      practiceMode === 'fillin' ? canonicalFillPatterns : canonicalPatterns
    )
  ), [canonicalPatterns, canonicalFillPatterns, practiceMode])

  const todayExercise = todayMenu?.exercises?.[todayIndex] || null
  const todayPlaybackSteps = useMemo(() => (
    todayExercise ? buildTodayMixedPlaybackSequence(todayExercise.attributes.beatBlocks) : []
  ), [todayExercise])

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

  const startTodayPractice = () => {
    stopPlayback()
    setTodayMenu(createTodayPracticeMenu({
      history: todayHistory,
      difficulty: todayDifficulty,
      seed: `${new Date().toDateString()}-${todayGeneration}`,
    }))
    setTodayGeneration((current) => current + 1)
    setTodayIndex(0)
    setTodayFeedback('')
    setIsMenuOpen(false)
  }

  const recordTodayFeedback = (result) => {
    if (!todayExercise || !todayMenu) return
    stopPlayback()
    const nextHistory = recordTodayPracticeResult({
      menuId: todayMenu.id,
      exerciseId: todayExercise.id,
      exerciseType: todayExercise.exerciseType,
      result,
      tempo: todayExercise.tempo,
      difficulty: todayExercise.attributes.difficulty,
      completedAt: new Date().toISOString(),
    })
    setTodayHistory(nextHistory)
    setTodayFeedback(result)
  }

  const goToNextTodayExercise = () => {
    if (!todayMenu) return
    stopPlayback()
    setTodayIndex((current) => Math.min(current + 1, todayMenu.exercises.length - 1))
    setTodayFeedback('')
  }

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

  if (practiceView === 'today') {
    const isLastTodayExercise = Boolean(todayMenu && todayIndex === todayMenu.exercises.length - 1)

    return (
      <div className="workspace today-practice-workspace">
        <aside className={`settings-panel no-print ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="panel-scroll">
            <div className="panel-intro today-panel-intro">
              <p className="panel-kicker">Daily Rhythm Lab</p>
              <h2>{localize('今日の練習', "Today's Practice")}</h2>
              <p>{localize('譜面を選ばず、その日の状態に合わせた独自の練習メニューを順番に進めます。', 'No score picking—move through an original, adaptive practice menu one exercise at a time.')}</p>
            </div>

            <div className="practice-view-switch">
              <button className="practice-tab is-active" type="button">{localize('今日の練習', "Today's Practice")}</button>
              <button className="practice-tab" type="button" onClick={() => setPracticeView('choose')}>{localize('練習を選ぶ', 'Choose Practice')}</button>
            </div>

            <section className="today-menu-card">
              <div className="today-difficulty-control">
                <span>{localize('難易度', 'Difficulty')}</span>
                <div>
                  {[
                    ['easy', localize('簡単', 'Easy')],
                    ['normal', localize('普通', 'Normal')],
                    ['hard', localize('難しい', 'Hard')],
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={todayDifficulty === value ? 'is-selected' : ''} onClick={() => setTodayDifficulty(value)}>{label}</button>
                  ))}
                </div>
              </div>
              <p className="today-menu-duration">{todayMenu ? localize('16小節・約8分', '16 bars · about 8 minutes') : localize('A4 1ページ分の自動メニュー', 'An automatic A4-page practice menu')}</p>
              {todayMenu ? (
                <ol className="today-menu-list">
                  {todayMenu.exercises.map((exercise, index) => (
                    <li key={exercise.id} className={index === todayIndex ? 'is-current' : index < todayIndex ? 'is-done' : ''}>
                      <span>{index + 1}</span>
                      <div><strong>{exercise.title}</strong><small>{exercise.minutes}{localize('分', ' min')} · {exercise.tempo} BPM</small></div>
                    </li>
                  ))}
                </ol>
              ) : <p className="saved-pattern-empty">{localize('開始すると、4段×4小節の独自リズムリーディング譜を作成します。各拍で音価と3連符を組み合わせます。', 'Start to create an original four-row, 16-bar reading page that mixes note values and triplets beat by beat.')}</p>}
              <button className="today-start-button" type="button" onClick={startTodayPractice}>
                {todayMenu ? localize('今日のメニューを作り直す', 'Create a New Menu') : localize('今日の練習を始める', "Start Today's Practice")}
              </button>
            </section>

            <section className="control-panel today-sound-controls">
              <div className="control-item"><label>{localize('音源ライブラリ', 'Kit Library')}</label><select value={kitLibrary} onChange={(event) => setKitLibrary(event.target.value)}>{KIT_LIBRARY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{kitLibraryLabel(option.value)}</option>)}</select></div>
              <div className="control-item"><label>{localize('スネア音色', 'Snare Tone')}</label><select value={snareTone} onChange={(event) => setSnareTone(event.target.value)}>{SNARE_TONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{snareToneLabel(option.value)}</option>)}</select></div>
            </section>
          </div>
        </aside>

        <section className="sheet-area practice-sheet-area">
          <div className="practice-sheet-stack">
            {todayExercise ? (
              <>
                <div className="today-exercise-header no-print">
                  <p>{localize(`練習 ${todayExercise.order} / ${todayMenu.exercises.length}`, `Exercise ${todayExercise.order} / ${todayMenu.exercises.length}`)}</p>
                  <h2>{todayExercise.title}</h2>
                  <div className="today-exercise-meta"><span>{todayExercise.exerciseType}</span><span>{todayExercise.tempo} BPM</span><span>{todayExercise.minutes}{localize('分', ' min')}</span><span>{({ easy: localize('簡単', 'Easy'), normal: localize('普通', 'Normal'), hard: localize('難しい', 'Hard') }[todayMenu.difficulty])}</span><span>{todayExercise.attributes.triplets ? localize('3連符', 'Triplets') : todayExercise.attributes.syncopationLevel ? localize('シンコペーション', 'Syncopation') : todayExercise.attributes.noteValues.join(' + ')}</span></div>
                  <p className="today-instruction">{todayExercise.instruction}</p>
                </div>
                <div className="sheet-paper practice-sheet-paper is-accent-mode">
                  <div className="abc-section practice-score-section"><h2>{localize('練習譜', 'Practice Score')}</h2><TodayMixedNotationPreview beatBlocks={todayExercise.attributes.beatBlocks} /></div>
                </div>
                <section className="today-action-card no-print">
                  <div className="button-row">
                    <button onClick={() => playSequence(todayPlaybackSteps, '16th', todayExercise.exerciseType === 'accent' ? 'accent_exercise' : 'standard')} disabled={isPlaying || !samplesReady}>{localize('再生', 'Play')}</button>
                    <button onClick={stopPlayback} disabled={!isPlaying}>{localize('停止', 'Stop')}</button>
                  </div>
                  <p>{localize('終えた感触を記録すると、次回のテンポと譜面の複雑さに反映します。', 'Record how it felt; the next menu adapts its tempo and rhythm complexity.')}</p>
                  <div className="today-feedback-row">
                    <button className={todayFeedback === 'complete' ? 'is-selected' : ''} onClick={() => recordTodayFeedback('complete')}>{localize('完了', 'Complete')}</button>
                    <button className={todayFeedback === 'hard' ? 'is-selected' : ''} onClick={() => recordTodayFeedback('hard')}>{localize('難しかった', 'Too Hard')}</button>
                    <button className={todayFeedback === 'easy' ? 'is-selected' : ''} onClick={() => recordTodayFeedback('easy')}>{localize('簡単だった', 'Too Easy')}</button>
                    <button onClick={goToNextTodayExercise} disabled={!todayFeedback || isLastTodayExercise}>{isLastTodayExercise ? localize('今日の練習完了', 'Daily Practice Complete') : localize('次へ', 'Next')}</button>
                  </div>
                  {isLastTodayExercise && todayFeedback ? <p className="today-complete-message">{localize('今日の練習を記録しました。次回はこの結果に合わせて調整します。', 'Today is recorded. Your next menu will adapt to these results.')}</p> : null}
                </section>
              </>
            ) : (
              <div className="today-empty-state"><p className="panel-kicker">Ready when you are</p><h2>{localize('今日のリズムリーディングを始めよう', "Start today's rhythm reading")}</h2><p>{localize('A4 1ページ相当の16小節を、4分・8分・16分・3連符・休符・裏拍へ段階的に進めます。すべて独自の組合せで生成します。', 'Create an original 16-bar, A4-page practice score that progresses through quarters, eighths, sixteenths, triplets, rests, and offbeats.')}</p><button className="today-start-button" onClick={startTodayPractice}>{localize('今日の練習を始める', "Start Today's Practice")}</button></div>
            )}
          </div>
        </section>
      </div>
    )
  }

  return (
    <>
      <section className="mobile-action-panel no-print">
        {actionPanelContent}
      </section>

      <div className="workspace">
        <aside className={`settings-panel no-print ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="panel-scroll">
            <div className="practice-view-switch no-print">
              <button className="practice-tab" type="button" onClick={() => setPracticeView('today')}>{localize('今日の練習', "Today's Practice")}</button>
              <button className="practice-tab is-active" type="button">{localize('練習を選ぶ', 'Choose Practice')}</button>
            </div>
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

                  <div className="manual-reading-controls">
                    <p>{localize('リズムリーディング指定', 'Rhythm Reading Options')}</p>
                    <div className="control-item">
                      <label>{localize('練習タイプ', 'Exercise Type')}</label>
                      <select value={manualExerciseType} onChange={(event) => setManualExerciseType(event.target.value)}>
                        <option value="reading">Reading</option>
                        <option value="accent">Accent</option>
                        <option value="sticking">Sticking</option>
                        <option value="fill">Fill</option>
                        <option value="coordination">Coordination</option>
                      </select>
                    </div>
                    {[
                      ['rests', localize('休符を含める', 'Include rests'), manualRests, setManualRests],
                      ['syncopation', localize('シンコペーション', 'Syncopation'), manualSyncopation, setManualSyncopation],
                      ['accents', localize('アクセントを指定', 'Add accents'), manualAccents, setManualAccents],
                      ['triplets', localize('3連符を使う', 'Use triplets'), manualTriplets, setManualTriplets],
                    ].map(([id, label, enabled, setEnabled]) => (
                      <label className="manual-reading-option" key={id}>
                        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                        <span>{label}</span>
                      </label>
                    ))}
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
                  <VexFlowNotationPreview
                    key={`fill-preview-${refreshKey}`}
                    patterns={notationFillPatterns}
                    noteType="16th"
                    mode="fillin"
                    activeStepIndex={currentStep}
                  />
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
