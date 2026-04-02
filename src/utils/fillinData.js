import fillinImages from '../../docs/drum_pattern_maker_fillin_image_manifest.json'

// Manifest file mapping to patterns
export function getFillinImages() {
  return fillinImages.images || []
}

export function getFillinImageById(id) {
  const images = getFillinImages()
  return images.find((i) => i.id === id) || null
}

// 簡易的な原典パターンのトランスクリプション（後日完全拡充）
// キー: patternNo (1〜100)
// 値: { hand: string[], kick: number[], grooveBars: number }
export const FILLIN_TRANSCRIPTIONS = {
  1: {
    hand: ['S', '', 'S', '', 'S', '', 'S', '', 'S', '', 'S', '', 'S', '', 'S', ''], // 8分音符スネア
    kick: [],
    grooveBars: 3
  },
  2: {
    hand: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 16分音符スネア
    kick: [],
    grooveBars: 3
  },
  3: {
    hand: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'T', 'T', 'T', 'T', 'F', 'F', 'F', 'F'], // スネア→タム→フロア
    kick: [],
    grooveBars: 3
  },
  4: {
    hand: ['S', '', 'S', '', 'T', '', 'T', '', 'M', '', 'M', '', 'F', '', 'F', ''], // 8分で回す
    kick: [],
    grooveBars: 3
  },
  5: {
    hand: ['S', '', '', '', 'S', '', '', '', 'S', '', '', '', 'S', '', '', ''], // 4分音符スネア
    kick: [],
    grooveBars: 3
  }
}

export function getTranscribedPattern(patternNo) {
  if (FILLIN_TRANSCRIPTIONS[patternNo]) {
    return FILLIN_TRANSCRIPTIONS[patternNo]
  }
  // 未定義の場合は、その番号に基いてそれっぽいものをプロシージャルに返す
  const hand = Array(16).fill('')
  const kick = []
  
  if (patternNo % 2 === 0) {
    // 16分系
    for(let i=0; i<16; i++) hand[i] = 'S'
    if (patternNo % 3 === 0) {
      hand[12] = 'T'; hand[13] = 'T'; hand[14] = 'F'; hand[15] = 'F';
    }
  } else {
    // 8分系
    for(let i=0; i<16; i+=2) hand[i] = 'T'
  }
  
  return { hand, kick, grooveBars: 3 }
}
