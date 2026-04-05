export const NOTE_OPTIONS = [
  { value: '4th', label: '4部音符' },
  { value: '8th', label: '8部音符' },
  { value: '16th', label: '16部音符' },
]

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'イージー' },
  { value: 'normal', label: 'ノーマル' },
  { value: 'hard', label: 'ハード' },
]

export const BAR_OPTIONS = [
  { value: '16', label: '16小節固定' },
  { value: '8', label: '8小節固定' },
  { value: '4', label: '4小節固定' },
  { value: '2', label: '2小節固定' },
]

export const ORCHESTRATION_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: 'tom', label: 'タム' },
  { value: 'tomCymbal', label: 'タム・シンバル' },
]

export const KICK_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: '1', label: '1拍' },
  { value: '2', label: '2拍' },
  { value: '3', label: '3拍' },
  { value: '4', label: '4拍' },
]

export const SNARE_TONE_OPTIONS = [
  { value: 'maple', label: 'メープル（ウォーム）' },
  { value: 'bright', label: 'ブライト' },
  { value: 'fat', label: 'ファット' },
]

export const TOM_TONE_OPTIONS = [
  { value: 'standard', label: 'スタンダード' },
  { value: 'tight', label: 'タイト（高め）' },
  { value: 'deep', label: 'ディープ（低め）' },
]

export const FLOOR_TOM_TONE_OPTIONS = [
  { value: 'standard', label: 'スタンダード' },
  { value: 'tight', label: 'タイト（高め）' },
  { value: 'deep', label: 'ディープ（低め）' },
]

export const CYMBAL_TONE_OPTIONS = [
  { value: 'tight', label: 'タイト' },
  { value: 'open', label: 'オープン寄り' },
  { value: 'dark', label: 'ダーク' },
]

export const KIT_LIBRARY_OPTIONS = [
  { value: 'pearlMaster', label: 'Pearl Master Studio' },
  { value: 'webStandard', label: 'Web標準キット' },
]

export const NOTATION_ENGINE_OPTIONS = [
  { value: 'svg', label: 'SVG（標準）' },
  { value: 'vexflow', label: 'VexFlow（ベータ）' },
  { value: 'image', label: '原典画像 (Image)' },
]

export const PRACTICE_MENU = [
  { value: 'accent', label: 'アクセント練習' },
  { value: 'fillin', label: 'フィルイン練習' },
]

export const FILL_GROOVE_OPTIONS = [
  { value: 'random', label: 'ランダム（複数パターン）' },
  { value: 'straight', label: '基本8ビート' },
  { value: 'syncopated', label: 'シンコペ8ビート' },
  { value: 'ride', label: 'ライド8ビート' },
  { value: 'shake', label: 'シェイクビート' },
  { value: 'dance', label: 'ダンスビート' },
  { value: 'soca', label: 'ソカ' },
]

export const FILL_GENRE_OPTIONS = [
  { value: 'rock', label: 'ROCK' },
  { value: 'pops', label: 'POPS' },
  { value: 'blues', label: 'Blues' },
  { value: 'jazz', label: 'JAZZ' },
]

export const FILL_LENGTH_OPTIONS = [
  { value: '1bar', label: '1小節フィル' },
  { value: 'half', label: '0.5小節フィル' },
  { value: 'quarter', label: '0.25小節フィル' },
]

export const FILL_PATTERN_OPTIONS = [
  { value: 'basic', label: '基本パターン' },
  { value: 'random', label: 'ランダム' },
  { value: 'created', label: '作成したもの' },
]

export const FILL_BAR_COUNT_OPTIONS = [
  { value: '32', label: '32小節' },
  { value: '16', label: '16小節' },
  { value: '4', label: '4小節' },
]
