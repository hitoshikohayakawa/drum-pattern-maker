import fillinImages from '../../docs/drum_pattern_maker_fillin_image_manifest.json'

export function getFillinImages() {
  return fillinImages.images || []
}

export function getFillinImageById(id) {
  const images = getFillinImages()
  return images.find((i) => i.id === id) || null
}

const generateCurriculum = () => {
  const transcriptions = {}
  
  for (let i = 1; i <= 100; i++) {
    let hand = []
    let kick = []
    let grooveBars = 3 // default 3 bars groove + 1 bar fill
    
    // Level 1: (No. 1-20) - 1 beat or 2 beat simple fills (Quarter / Half Bar Fills)
    if (i <= 20) {
      if (i <= 10) {
        // 1 beat fills (quarter bar) - last 4 steps of the 4th bar
        grooveBars = 3.75 // 3 bars + 3 beats
        const patterns = [
          ['S', 'S', 'S', 'S'], ['T', 'T', 'M', 'M'], ['S', '', 'S', ''],
          ['T', '', 'T', ''], ['S', 'T', 'M', 'F'], ['F', 'F', 'S', 'S'],
          ['S', '', 'T', 'M'], ['S', 'S', 'F', 'F'], ['T', 'S', 'T', 'S'], ['S', 'M', 'F', '']
        ]
        hand = patterns[(i - 1) % patterns.length]
        if (i % 3 === 0) kick = [0]
      } else {
        // 2 beat fills (half bar) - last 8 steps
        grooveBars = 3.5 // 3 bars + 2 beats
        const patterns = [
          ['S', 'S', 'S', 'S', 'T', 'T', 'T', 'T'], ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'F'],
          ['S', 'T', 'M', 'F', 'S', 'T', 'M', 'F'], ['T', 'T', 'M', 'M', 'F', 'F', 'S', 'S'],
          ['S', '', 'S', '', 'T', '', 'T', ''], ['S', 'S', 'S', 'S', 'F', 'F', 'F', 'F'],
          ['S', '', 'T', 'T', 'M', '', 'F', 'F'], ['T', 'M', 'F', '', 'S', 'S', 'S', ''],
          ['S', 'T', 'S', 'T', 'M', 'F', 'M', 'F'], ['S', '', '', '', 'T', 'T', 'F', 'F']
        ]
        hand = patterns[(i - 11) % patterns.length]
        if (i % 2 === 0) kick = [0, 4]
      }
    } 
    // Level 2: (No. 21-40) - 1 bar straightforward 16ths
    else if (i <= 40) {
      grooveBars = 3 // 1 entire bar fill
      const base = ['S', 'S', 'S', 'S']
      if (i <= 25) {
         hand = [...base, ...base, ...base, ...base]
         hand[14] = 'F'; hand[15] = 'F';
      } else if (i <= 30) {
         hand = ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'T', 'T', 'M', 'M', 'F', 'F']
      } else if (i <= 35) {
         hand = ['T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S']
      } else {
         hand = ['S', 'T', 'M', 'F', 'S', 'T', 'M', 'F', 'S', 'T', 'M', 'F', 'S', 'T', 'M', 'F']
      }
      if (i % 4 === 0) kick = [0, 8]
      if (i % 5 === 0) kick = [0, 4, 8, 12]
    }
    // Level 3: (No. 41-60) - Motown, Syncopations, Rests
    else if (i <= 60) {
      grooveBars = 3
      if (i <= 45) {
        hand = ['S', '', 'S', '', 'T', '', 'T', '', 'M', '', 'M', '', 'F', '', 'F', '']
        kick = [0, 4, 8, 12]
      } else if (i <= 50) {
        hand = ['', 'S', '', 'S', '', 'T', '', 'T', '', 'M', '', 'F', 'S', 'S', 'S', 'S']
        kick = [0, 8]
      } else if (i <= 55) {
        hand = ['S', '', 'T', 'S', '', 'M', 'S', '', 'F', 'S', '', 'T', 'S', '', 'M', 'S']
        kick = [1, 5, 9, 13]
      } else {
        hand = ['S', 'S', 'S', '', 'T', 'T', 'T', '', 'M', 'M', 'M', '', 'F', 'F', 'F', '']
        kick = [0, 4, 8, 12]
      }
    }
    // Level 4: (No. 61-80) - Mixed Kicks / Splat-boom style (Linear concepts)
    else if (i <= 80) {
      grooveBars = 3
      if (i <= 65) {
        hand = ['S', 'S', '', '', 'T', 'T', '', '', 'M', 'M', '', '', 'F', 'F', '', '']
        kick = [2, 3, 6, 7, 10, 11, 14, 15]
      } else if (i <= 70) {
        hand = ['S', '', '', 'T', 'M', '', '', 'F', 'S', 'S', '', 'T', 'M', 'M', '', 'F']
        kick = [1, 2, 5, 6, 10, 14]
      } else if (i <= 75) {
        hand = ['', 'T', 'T', '', '', 'M', 'M', '', 'S', 'S', 'S', 'S', 'F', 'F', 'F', 'F']
        kick = [0, 3, 4, 7]
      } else {
        hand = ['S', 'T', '', 'M', 'S', 'T', '', 'M', 'F', 'F', '', 'S', 'F', 'F', '', 'S']
        kick = [2, 6, 10, 14]
      }
    }
    // Level 5: (No. 81-100) - Paradiddles, Bonham influence, advanced combos
    else {
      if (i <= 90) { // Half bar heavy combos
        grooveBars = 3.5
        const rudiments = [
          ['S', 'T', 'S', 'S', 'M', 'F', 'M', 'M'], // paradiddle around kit
          ['S', '', 'S', 'S', 'T', '', 'T', 'T'], // drag/ruff feel
          ['T', 'M', 'F', '', 'S', 'T', 'M', 'F'], // linear push
          ['S', 'T', 'M', '', 'S', 'M', 'F', ''] // triplet feel converted
        ]
        hand = rudiments[(i - 81) % rudiments.length]
        kick = [3, 7]
      } else { // 1 bar grand finale fills
        grooveBars = 3
        const finales = [
          ['S', 'T', 'S', 'T', 'M', 'F', 'M', 'F', 'S', 'T', 'M', 'F', 'S', 'S', 'S', 'S'],
          ['T', 'F', '', 'S', 'T', 'F', '', 'S', 'T', 'F', '', 'S', 'S', 'S', 'S', 'S'],
          ['S', '', 'M', 'M', 'S', '', 'F', 'F', 'S', 'S', 'T', 'T', 'M', 'M', 'F', 'F'],
          ['S', 'T', 'M', 'F', 'T', 'M', 'F', 'S', 'M', 'F', 'S', 'T', 'F', 'S', 'T', 'M']
        ]
        hand = finales[(i - 91) % finales.length]
        kick = [2, 6, 10, 14]
      }
    }
    
    transcriptions[i] = { hand, kick, grooveBars }
  }
  
  return transcriptions
}

export const FILLIN_TRANSCRIPTIONS = generateCurriculum()

export function getTranscribedPattern(patternNo) {
  const pattern = FILLIN_TRANSCRIPTIONS[patternNo]
  if (pattern) return pattern
  return FILLIN_TRANSCRIPTIONS[1] // fallback
}
