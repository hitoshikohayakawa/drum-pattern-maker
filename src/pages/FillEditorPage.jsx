import { useEffect, useMemo, useState } from 'react'

import VexFlowNotationPreview from '../components/vexflow-notation-preview.jsx'
import {
  CYMBAL_TONE_OPTIONS,
  FLOOR_TOM_TONE_OPTIONS,
  KIT_LIBRARY_OPTIONS,
  SNARE_TONE_OPTIONS,
  TOM_TONE_OPTIONS,
} from '../constants/options'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useDrumPlaybackEngine } from '../hooks/useDrumPlaybackEngine'
import {
  FILL_EDITOR_INSTRUMENTS,
  FILL_LENGTH_OPTIONS,
  FILL_RESOLUTION_OPTIONS,
  buildCanonicalPatternFromFillSteps,
  buildNotationPatternFromFillSteps,
  buildPlaybackSequenceFromFillSteps,
  buildPlaybackSequenceFromStoredPatternRecord,
  createEmptyFillSteps,
  getTotalSteps,
  parseStoredPatternRecordToFillSteps,
  parseStoredStepsJson,
  toggleAccentInFillSteps,
  toggleGhostInFillSteps,
  toggleInstrumentInFillSteps,
} from '../utils/fillEditorModel'
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient'

const FIXED_FILL_META = {
  category: 'fill_in',
  time_signature: '4/4',
  notation_rule_set: 'dpm_jp_v1',
}

function isMissingPatternJsonColumn(error) {
  return String(error?.message || '').includes('pattern_json')
}

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function FillEditorPage({ navigate }) {
  const { profile, user } = useAuth()
  const [title, setTitle] = useState('My Fill Pattern')
  const [fillLengthType, setFillLengthType] = useState('full_bar')
  const [resolution, setResolution] = useState('16th')
  const [steps, setSteps] = useState(() => createEmptyFillSteps('full_bar', '16th'))
  const [editingId, setEditingId] = useState(null)
  const [savedPatterns, setSavedPatterns] = useState([])
  const [bpm, setBpm] = useState(90)
  const [kitLibrary, setKitLibrary] = useState('pearlMaster')
  const [snareTone, setSnareTone] = useState('maple')
  const [tomTone, setTomTone] = useState('standard')
  const [floorTomTone, setFloorTomTone] = useState('standard')
  const [cymbalTone, setCymbalTone] = useState('tight')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [includeInPractice, setIncludeInPractice] = useState(false)
  const [visibility, setVisibility] = useState('private')

  const notationPattern = useMemo(
    () => buildNotationPatternFromFillSteps(steps, fillLengthType, resolution),
    [steps, fillLengthType, resolution]
  )
  const playbackSequence = useMemo(
    () => buildPlaybackSequenceFromFillSteps(steps, fillLengthType, resolution),
    [steps, fillLengthType, resolution]
  )
  const stepCount = useMemo(
    () => getTotalSteps(fillLengthType, resolution),
    [fillLengthType, resolution]
  )

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
    setSteps((current) => parseStoredStepsJson(current, fillLengthType, resolution))
  }, [fillLengthType, resolution])

  const loadSavedPatterns = async () => {
    if (!isSupabaseConfigured || !supabase || !user?.id) {
      setSavedPatterns([])
      return
    }

    setIsLoadingList(true)
    setErrorMessage('')

    let { data, error } = await supabase
      .from('fill_patterns')
      .select('id, owner_user_id, title, description, category, fill_length_type, time_signature, resolution, notation_rule_set, visibility, include_in_practice, steps_json, pattern_json, created_at, updated_at')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })

    if (isMissingPatternJsonColumn(error)) {
      ;({ data, error } = await supabase
        .from('fill_patterns')
        .select('id, owner_user_id, title, description, category, fill_length_type, time_signature, resolution, notation_rule_set, visibility, include_in_practice, steps_json, created_at, updated_at')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false }))
    }

    if (error) {
      setErrorMessage(error.message)
      setSavedPatterns([])
      setIsLoadingList(false)
      return
    }

    setSavedPatterns(data || [])
    setIsLoadingList(false)
  }

  useEffect(() => {
    loadSavedPatterns()
  }, [user?.id])

  const handleReset = () => {
    stopPlayback()
    setEditingId(null)
    setTitle('My Fill Pattern')
    setFillLengthType('full_bar')
    setResolution('16th')
    setSteps(createEmptyFillSteps('full_bar', '16th'))
    setIncludeInPractice(false)
    setVisibility('private')
  }

  const handleSave = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Supabase の環境変数が未設定です。保存前に .env.local を設定してください。')
      return
    }

    if (!user?.id) {
      setErrorMessage('保存にはログインが必要です。')
      navigate('/login')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    const payload = {
      owner_user_id: user.id,
      title: title.trim() || 'Untitled Fill',
      description: '',
      category: FIXED_FILL_META.category,
      fill_length_type: fillLengthType,
      time_signature: FIXED_FILL_META.time_signature,
      resolution,
      notation_rule_set: FIXED_FILL_META.notation_rule_set,
      visibility,
      include_in_practice: includeInPractice,
      steps_json: steps,
      pattern_json: buildCanonicalPatternFromFillSteps(steps, fillLengthType, resolution),
    }

    const query = editingId
      ? supabase.from('fill_patterns').update(payload).eq('id', editingId).eq('owner_user_id', user.id).select('id').single()
      : supabase.from('fill_patterns').insert(payload).select('id').single()

    let { data, error } = await query

    if (isMissingPatternJsonColumn(error)) {
      const legacyPayload = { ...payload }
      delete legacyPayload.pattern_json
      ;({ data, error } = editingId
        ? await supabase.from('fill_patterns').update(legacyPayload).eq('id', editingId).eq('owner_user_id', user.id).select('id').single()
        : await supabase.from('fill_patterns').insert(legacyPayload).select('id').single())
    }

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    if (data?.id) setEditingId(data.id)
    await loadSavedPatterns()
    setIsSaving(false)
  }

  const handleLoadPattern = (item) => {
    stopPlayback()
    const nextLengthType = item.fill_length_type || 'full_bar'
    const nextResolution = item.resolution || '16th'
    setEditingId(item.id)
    setTitle(item.title || 'Untitled Fill')
    setFillLengthType(nextLengthType)
    setResolution(nextResolution)
    setIncludeInPractice(Boolean(item.include_in_practice))
    setVisibility(item.visibility || 'private')
    setSteps(parseStoredPatternRecordToFillSteps(item, nextLengthType, nextResolution))
  }

  const handleDeletePattern = async (id) => {
    if (!isSupabaseConfigured || !supabase || !user?.id) return

    const { error } = await supabase
      .from('fill_patterns')
      .delete()
      .eq('id', id)
      .eq('owner_user_id', user.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    if (editingId === id) handleReset()
    await loadSavedPatterns()
  }

  const canSave = Boolean(user?.id && profile?.username && !isSaving)

  return (
    <div className="workspace">
      <aside className="settings-panel no-print fill-editor-sidebar">
        <div className="panel-scroll">
          <div className="panel-intro">
            <p className="panel-kicker">Fill Editor MVP</p>
            <h2>フィルインパターンを作成</h2>
            <p>0.25 / 0.5 / 1小節と 16分 / 32分を切り替えて、その場で再生・保存できます。</p>
          </div>

          <section className="control-panel">
            <div className="control-item">
              <label htmlFor="fill-title">パターン名</label>
              <input
                id="fill-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="フィルイン名"
              />
            </div>

            <div className="control-item">
              <label>フィル長</label>
              <select value={fillLengthType} onChange={(event) => setFillLengthType(event.target.value)}>
                {FILL_LENGTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="control-item">
              <label>分解能</label>
              <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
                {FILL_RESOLUTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

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

            <div className="control-item">
              <label>BPM</label>
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
              />
            </div>

          </section>

          <section className="action-panel desktop-action-panel">
            <div className="button-row">
              <button onClick={() => playSequence(playbackSequence, resolution, 'standard')} disabled={isPlaying || !samplesReady}>再生</button>
              <button onClick={stopPlayback} disabled={!isPlaying}>停止</button>
              <button onClick={handleSave} disabled={!canSave}>{editingId ? '更新保存' : '保存'}</button>
              <button className="ghost-button" onClick={handleReset}>新規作成</button>
            </div>
          </section>

          {!user ? (
            <div className="auth-inline-card">
              <p>保存と一覧表示はログイン後に有効になります。</p>
              <button type="button" onClick={() => navigate('/login')}>ログインへ進む</button>
            </div>
          ) : null}
          {user && !profile?.username ? (
            <div className="auth-inline-card">
              <p>保存を始める前にユーザー名登録が必要です。</p>
              <button type="button" onClick={() => navigate('/onboarding')}>オンボーディングへ</button>
            </div>
          ) : null}
          {!isSupabaseConfigured ? (
            <p className="editor-hint">Supabase未設定のため、保存一覧はまだ無効です。</p>
          ) : null}
          {errorMessage ? <p className="editor-error">{errorMessage}</p> : null}
        </div>
      </aside>

      <section className="sheet-area fill-editor-area">
        <div className="sheet-paper">
          <div className="sheet-meta">
            <div>モード: フィルインパターン作成</div>
            <div>拍子: 4/4 固定</div>
            <div>分解能: {FILL_RESOLUTION_OPTIONS.find((item) => item.value === resolution)?.label}</div>
            <div>長さ: {FILL_LENGTH_OPTIONS.find((item) => item.value === fillLengthType)?.label}</div>
            <div>記譜ルール: dpm_jp_v1</div>
            <div>保存: {visibility === 'public' ? 'public' : 'private'}</div>
          </div>

          <div className="abc-section">
            <h2>Editing Score</h2>
            <VexFlowNotationPreview
              pattern={notationPattern}
              noteType="16th"
              mode="fillin"
              activeStepIndex={currentStep}
              fillResolution={resolution}
            />
          </div>

          <section className="fill-grid-card">
            <div className="fill-grid-header">
              <h3>Step Grid</h3>
              <p>セルをクリックで配置 / 再クリックで削除。休符はそのステップを無音にします。</p>
            </div>

            <div className="fill-grid-wrap">
              <div className={`fill-grid ${stepCount > 16 ? 'is-dense' : ''}`}>
                <div className="fill-grid-row fill-grid-accent-row">
                  <div className="fill-grid-label">Accent</div>
                  {steps.map((step) => (
                    <button
                      key={`accent-${step.index}`}
                      className={`fill-grid-cell accent-cell ${step.accent ? 'is-active' : ''} ${currentStep === step.index ? 'is-playing' : ''}`}
                      onClick={() => setSteps((current) => toggleAccentInFillSteps(current, step.index))}
                    >
                      &gt;
                    </button>
                  ))}
                </div>

                <div className="fill-grid-row fill-grid-ghost-row">
                  <div className="fill-grid-label">Ghost</div>
                  {steps.map((step) => (
                    <button
                      key={`ghost-${step.index}`}
                      className={`fill-grid-cell ghost-cell ${step.ghost ? 'is-active' : ''} ${currentStep === step.index ? 'is-playing' : ''}`}
                      onClick={() => setSteps((current) => toggleGhostInFillSteps(current, step.index))}
                    >
                      ()
                    </button>
                  ))}
                </div>

                {FILL_EDITOR_INSTRUMENTS.map((instrument) => (
                  <div className="fill-grid-row" key={instrument.id}>
                    <div className="fill-grid-label">{instrument.label}</div>
                    {steps.map((step) => {
                      const active = instrument.id === 'rest'
                        ? step.isRest
                        : step.instruments.includes(instrument.id)

                      return (
                        <button
                          key={`${instrument.id}-${step.index}`}
                          className={`fill-grid-cell ${active ? 'is-active' : ''} ${currentStep === step.index ? 'is-playing' : ''}`}
                          onClick={() => setSteps((current) => toggleInstrumentInFillSteps(current, step.index, instrument.id))}
                        >
                          {active ? (instrument.id === 'rest' ? '𝄽' : '●') : ''}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <p className="editor-hint">現在のステップ数: {stepCount}</p>
          </section>

          <section className="saved-patterns-card">
            <div className="fill-grid-header">
              <h3>保存済みフィルイン</h3>
              <p>{!user ? 'ログイン後に表示' : isLoadingList ? '読み込み中...' : `${savedPatterns.length} 件`}</p>
            </div>

            <div className="saved-pattern-list">
              {!user ? (
                <div className="saved-pattern-empty">保存済みフィルインを見るにはログインしてください。</div>
              ) : savedPatterns.length === 0 ? (
                <div className="saved-pattern-empty">保存済みフィルインはまだありません。</div>
              ) : (
                savedPatterns.map((item) => (
                  <article className="saved-pattern-item" key={item.id}>
                    <div>
                      <h4>{item.title}</h4>
                      <p>作成日時: {formatDate(item.created_at)}</p>
                      <p>長さ: {FILL_LENGTH_OPTIONS.find((option) => option.value === (item.fill_length_type || 'full_bar'))?.label} / 分解能: {FILL_RESOLUTION_OPTIONS.find((option) => option.value === (item.resolution || '16th'))?.label}</p>
                      <div className="saved-pattern-toggle-row">
                        <span>公開</span>
                        <button
                          type="button"
                          className={`toggle-switch ${item.visibility === 'public' ? 'is-on' : 'is-off'}`}
                          aria-pressed={item.visibility === 'public'}
                          aria-label={`公開設定を${item.visibility === 'public' ? '非公開' : '公開'}にする`}
                          onClick={async () => {
                            if (!supabase || !user?.id) return
                            const nextVisibility = item.visibility === 'public' ? 'private' : 'public'
                            const { error } = await supabase
                              .from('fill_patterns')
                              .update({ visibility: nextVisibility })
                              .eq('id', item.id)
                              .eq('owner_user_id', user.id)
                            if (error) {
                              setErrorMessage(error.message)
                              return
                            }
                            if (editingId === item.id) {
                              setVisibility(nextVisibility)
                            }
                            await loadSavedPatterns()
                          }}
                        >
                          <span className="toggle-switch-thumb" />
                        </button>
                      </div>
                      <div className="saved-pattern-toggle-row">
                        <span>練習組み込み</span>
                        <button
                          type="button"
                          className={`toggle-switch ${item.include_in_practice ? 'is-on' : 'is-off'}`}
                          aria-pressed={item.include_in_practice}
                          aria-label={`練習組み込みを${item.include_in_practice ? 'オフ' : 'オン'}にする`}
                          onClick={async () => {
                            if (!supabase || !user?.id) return
                            const nextValue = !item.include_in_practice
                            const { error } = await supabase
                              .from('fill_patterns')
                              .update({ include_in_practice: nextValue })
                              .eq('id', item.id)
                              .eq('owner_user_id', user.id)
                            if (error) {
                              setErrorMessage(error.message)
                              return
                            }
                            if (editingId === item.id) {
                              setIncludeInPractice(nextValue)
                            }
                            await loadSavedPatterns()
                          }}
                        >
                          <span className="toggle-switch-thumb" />
                        </button>
                      </div>
                    </div>
                    <div className="saved-pattern-actions">
                      <button
                        onClick={() => playSequence(
                          buildPlaybackSequenceFromStoredPatternRecord(
                            item,
                            item.fill_length_type || 'full_bar',
                            item.resolution || '16th',
                          ),
                          item.resolution || '16th',
                          'standard'
                        )}
                        disabled={!samplesReady || isPlaying}
                      >
                        再生
                      </button>
                      <button onClick={() => handleLoadPattern(item)}>読み込み</button>
                      <button className="ghost-button" onClick={() => handleDeletePattern(item.id)}>削除</button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
