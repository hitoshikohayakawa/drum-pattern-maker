import { useEffect, useMemo, useState } from 'react'

import VexFlowNotationPreview from '../components/VexFlowNotationPreview.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useDrumPlaybackEngine } from '../hooks/useDrumPlaybackEngine'
import {
  FILL_LENGTH_OPTIONS,
  FILL_RESOLUTION_OPTIONS,
  buildNotationPatternFromFillSteps,
  buildPlaybackSequenceFromFillSteps,
  parseStoredStepsJson,
} from '../utils/fillEditorModel'
import { formatProfileName, getProfileInitial } from '../utils/profileUtils'
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient'

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

function buildPublicFillViewModel(patterns, profiles, likes, currentUserId) {
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]))
  const likeMap = new Map()

  ;(likes || []).forEach((like) => {
    const item = likeMap.get(like.fill_pattern_id) || { count: 0, likedByMe: false }
    item.count += 1
    if (currentUserId && like.user_id === currentUserId) {
      item.likedByMe = true
    }
    likeMap.set(like.fill_pattern_id, item)
  })

  return (patterns || []).map((item) => {
    const parsedSteps = parseStoredStepsJson(
      item.steps_json,
      item.fill_length_type || 'full_bar',
      item.resolution || '16th'
    )

    return {
      ...item,
      author: profileMap.get(item.owner_user_id) || null,
      notationPattern: buildNotationPatternFromFillSteps(
        parsedSteps,
        item.fill_length_type || 'full_bar',
        item.resolution || '16th'
      ),
      playbackSequence: buildPlaybackSequenceFromFillSteps(
        parsedSteps,
        item.fill_length_type || 'full_bar',
        item.resolution || '16th'
      ),
      likeCount: likeMap.get(item.id)?.count || 0,
      likedByMe: likeMap.get(item.id)?.likedByMe || false,
    }
  })
}

export default function PublicFillsPage({ navigate }) {
  const { profile, user } = useAuth()
  const [publicFills, setPublicFills] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activePatternId, setActivePatternId] = useState(null)
  const [bpm, setBpm] = useState(90)

  const {
    samplesReady,
    isPlaying,
    currentStep,
    playSequence,
    stopPlayback,
  } = useDrumPlaybackEngine({
    kitLibrary: 'pearlMaster',
    snareTone: 'maple',
    tomTone: 'standard',
    floorTomTone: 'standard',
    cymbalTone: 'tight',
    bpm,
  })

  const loadPublicFills = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Supabase が未設定のため、公開フィルを取得できません。')
      setPublicFills([])
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    const { data: patternData, error: patternError } = await supabase
      .from('fill_patterns')
      .select('id, owner_user_id, title, fill_length_type, resolution, steps_json, created_at, updated_at, visibility')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

    if (patternError) {
      setErrorMessage(patternError.message)
      setPublicFills([])
      setIsLoading(false)
      return
    }

    const ownerIds = [...new Set((patternData || []).map((item) => item.owner_user_id).filter(Boolean))]
    const patternIds = (patternData || []).map((item) => item.id)

    const [{ data: profileData, error: profileError }, { data: likeData, error: likeError }] = await Promise.all([
      ownerIds.length
        ? supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', ownerIds)
        : Promise.resolve({ data: [], error: null }),
      patternIds.length
        ? supabase
            .from('fill_pattern_likes')
            .select('fill_pattern_id, user_id')
            .in('fill_pattern_id', patternIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (profileError || likeError) {
      setErrorMessage(profileError?.message || likeError?.message || '公開フィルの取得に失敗しました。')
      setPublicFills([])
      setIsLoading(false)
      return
    }

    setPublicFills(buildPublicFillViewModel(patternData, profileData, likeData, user?.id))
    setIsLoading(false)
  }

  useEffect(() => {
    loadPublicFills()
  }, [user?.id])

  useEffect(() => {
    if (!isPlaying) {
      setActivePatternId(null)
    }
  }, [isPlaying])

  const handleLikeToggle = async (item) => {
    if (!user?.id) {
      navigate('/login')
      return
    }

    if (!supabase) return

    const query = item.likedByMe
      ? supabase
          .from('fill_pattern_likes')
          .delete()
          .eq('fill_pattern_id', item.id)
          .eq('user_id', user.id)
      : supabase
          .from('fill_pattern_likes')
          .insert({ fill_pattern_id: item.id, user_id: user.id })

    const { error } = await query
    if (error) {
      setErrorMessage(error.message)
      return
    }

    await loadPublicFills()
  }

  const handleSaveCopy = async (item) => {
    if (!user?.id || !profile?.username) {
      navigate('/login')
      return
    }

    if (!supabase) return

    const { error } = await supabase
      .from('fill_patterns')
      .insert({
        owner_user_id: user.id,
        title: item.title,
        description: '',
        category: 'fill_in',
        fill_length_type: item.fill_length_type || 'full_bar',
        time_signature: '4/4',
        resolution: item.resolution || '16th',
        notation_rule_set: 'dpm_jp_v1',
        visibility: 'private',
        include_in_practice: false,
        steps_json: item.steps_json,
      })

    if (error) {
      setErrorMessage(error.message)
      return
    }

    await loadPublicFills()
  }

  const cards = useMemo(() => publicFills, [publicFills])

  return (
    <main className="community-shell">
      <section className="community-hero">
        <p className="panel-kicker">Community Shelf</p>
        <h2>みんなのフィルイン</h2>
        <p>公開されたフィルをその場で再生しながら眺めて、気に入ったものは自分のライブラリへ保存できます。</p>
        <label className="community-bpm">
          <span>BPM</span>
          <input
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
          />
        </label>
      </section>

      {errorMessage ? <p className="editor-error">{errorMessage}</p> : null}

      <section className="community-grid">
        {isLoading ? (
          <article className="community-empty-card">公開フィルを読み込んでいます…</article>
        ) : cards.length === 0 ? (
          <article className="community-empty-card">まだ公開されたフィルインはありません。</article>
        ) : (
          cards.map((item) => (
            <article className="community-card" key={item.id}>
              <div className="community-card-top">
                <div className="community-author">
                  <div className="avatar-preview community-avatar">
                    {item.author?.avatar_url ? (
                      <img src={item.author.avatar_url} alt={`${formatProfileName(item.author)} のアイコン`} />
                    ) : (
                      <span>{getProfileInitial(item.author, null)}</span>
                    )}
                  </div>
                  <div>
                    <p className="community-author-name">{formatProfileName(item.author)}</p>
                    <p className="community-date">{formatDate(item.created_at)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`community-like-button ${item.likedByMe ? 'is-liked' : ''}`}
                  onClick={() => handleLikeToggle(item)}
                  aria-pressed={item.likedByMe}
                >
                  <span>♡</span>
                  <strong>{item.likeCount}</strong>
                </button>
              </div>

              <div className="community-card-heading">
                <h3>{item.title}</h3>
                <p>
                  {FILL_LENGTH_OPTIONS.find((option) => option.value === (item.fill_length_type || 'full_bar'))?.label}
                  {' / '}
                  {FILL_RESOLUTION_OPTIONS.find((option) => option.value === (item.resolution || '16th'))?.label}
                </p>
              </div>

              <div className="community-score">
                <VexFlowNotationPreview
                  pattern={item.notationPattern}
                  noteType="16th"
                  mode="fillin"
                  activeStepIndex={activePatternId === item.id ? currentStep : null}
                  fillResolution={item.resolution || '16th'}
                />
              </div>

              <div className="community-card-actions">
                <button
                  type="button"
                  onClick={() => {
                    setActivePatternId(item.id)
                    playSequence(item.playbackSequence, item.resolution || '16th')
                  }}
                  disabled={!samplesReady || isPlaying}
                >
                  再生
                </button>
                <button type="button" onClick={stopPlayback} disabled={!isPlaying || activePatternId !== item.id}>
                  停止
                </button>
                <button type="button" className="ghost-button" onClick={() => handleSaveCopy(item)}>
                  保存する
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
