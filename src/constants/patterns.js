export const BASIC_EIGHT_BEAT_LIBRARY = {
  straight: [
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 8] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 10] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 12] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [2, 8] },
  ],
  syncopated: [
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 6, 10] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 7, 12] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 9, 14] },
  ],
  ride: [
    { hand: ['R', '', 'R', '', 'RS', '', 'R', '', 'R', '', 'R', '', 'RS', '', 'R', ''], kick: [0, 8] },
    { hand: ['R', '', 'R', '', 'RS', '', 'R', '', 'R', '', 'R', '', 'RS', '', 'R', ''], kick: [0, 10] },
    { hand: ['R', '', 'R', '', 'RS', '', 'R', '', 'R', '', 'R', '', 'RS', '', 'R', ''], kick: [2, 8] },
  ],
}

export const GENRE_GROOVE_LIBRARY = {
  rock: [
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 8] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 10] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 7, 8] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 8, 12] },
  ],
  pops: [
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 8] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 10] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [2, 8] },
    { hand: ['H', '', 'H', '', 'HS', '', 'H', '', 'H', '', 'H', '', 'HS', '', 'H', ''], kick: [0, 9] },
  ],
  blues: [
    { hand: ['H', '', 'H', 'H', 'HS', '', 'H', 'H', 'H', '', 'H', 'H', 'HS', '', 'H', 'H'], kick: [0, 8] },
    { hand: ['H', '', 'H', 'H', 'HS', '', 'H', 'H', 'H', '', 'H', 'H', 'HS', '', 'H', 'H'], kick: [0, 6, 8] },
    { hand: ['H', '', 'H', 'H', 'HS', '', 'H', 'H', 'H', '', 'H', 'H', 'HS', '', 'H', 'H'], kick: [0, 9, 12] },
    { hand: ['R', '', 'R', 'R', 'RS', '', 'R', 'R', 'R', '', 'R', 'R', 'RS', '', 'R', 'R'], kick: [0, 8] },
  ],
  jazz: [
    { hand: ['R', '', 'R', 'R', 'RS', '', 'R', 'R', 'R', '', 'R', 'R', 'RS', '', 'R', 'R'], kick: [0] },
    { hand: ['R', '', 'R', 'R', 'RS', '', 'R', 'R', 'R', '', 'R', 'R', 'RS', '', 'R', 'R'], kick: [0, 10] },
    { hand: ['R', '', 'R', 'R', 'RS', '', 'R', 'R', 'R', '', 'R', 'R', 'RS', '', 'R', 'R'], kick: [2, 10] },
    { hand: ['R', '', 'R', 'R', 'RS', '', 'R', 'R', 'R', '', 'R', 'R', 'RS', '', 'R', 'R'], kick: [0, 12] },
  ],
}

export const ONE_BAR_FILLS = [
  {
    name: 'Snare 16th Burst',
    hand: ['S', 'S', 'S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'M', 'T', 'S', 'S', 'F', 'C'],
    kick: [0, 8, 15],
  },
  {
    name: 'Classic Around Toms',
    hand: ['S', '', 'T', '', 'M', '', 'F', '', 'T', '', 'M', '', 'F', 'F', 'S', 'C'],
    kick: [0, 7, 14, 15],
  },
  {
    name: 'Linear Funk Fill',
    hand: ['S', '', 'H', 'S', '', 'T', '', 'M', '', 'S', 'H', '', 'F', '', 'S', 'C'],
    kick: [2, 6, 10, 14],
  },
  {
    name: 'Triplet-ish Motion',
    hand: ['S', 'S', '', 'T', 'T', '', 'M', 'M', '', 'F', 'F', '', 'S', 'S', 'F', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Descending Sweep',
    hand: ['S', '', 'S', '', 'T', '', 'T', '', 'M', '', 'M', '', 'F', 'F', 'S', 'C'],
    kick: [0, 6, 10, 15],
  },
  {
    name: 'Linear Drop',
    hand: ['S', '', 'H', '', 'T', '', 'S', '', 'M', '', 'H', '', 'F', '', 'S', 'C'],
    kick: [1, 5, 9, 13, 15],
  },
  {
    name: 'Tom Roll Ending',
    hand: ['T', 'T', 'M', 'M', 'F', 'F', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'F', 'C'],
    kick: [0, 8, 14, 15],
  },
  {
    name: 'Snare To Crash',
    hand: ['S', '', 'S', 'S', 'S', '', 'T', '', 'M', '', 'F', '', 'S', 'S', 'S', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Gallop Around Kit',
    hand: ['S', 'T', '', 'M', 'F', '', 'T', 'M', '', 'F', 'S', '', 'T', 'F', 'S', 'C'],
    kick: [0, 3, 6, 9, 12, 15],
  },
  {
    name: 'Backbeat Release',
    hand: ['S', '', 'H', '', 'S', '', 'T', '', 'M', '', 'F', '', 'S', '', 'S', 'C'],
    kick: [0, 7, 11, 15],
  },
  {
    name: 'Eight Stroke Around',
    hand: ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'T', 'T', 'M', 'F', 'S', 'C'],
    kick: [0, 8, 14, 15],
  },
  {
    name: 'Single Stroke Down',
    hand: ['S', '', 'T', '', 'M', '', 'F', '', 'S', '', 'T', '', 'M', '', 'F', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Paradiddle Color',
    hand: ['S', 'T', 'S', 'S', 'M', 'F', 'M', 'M', 'S', 'T', 'S', 'S', 'F', 'M', 'S', 'C'],
    kick: [0, 6, 10, 15],
  },
  {
    name: 'Two Voice Answer',
    hand: ['S', '', 'S', '', 'T', 'M', 'F', '', 'S', '', 'T', '', 'M', 'F', 'S', 'C'],
    kick: [1, 5, 9, 13, 15],
  },
  {
    name: 'Late Bar Push',
    hand: ['S', '', 'H', '', 'S', '', 'H', '', 'T', '', 'M', '', 'F', 'S', 'S', 'C'],
    kick: [0, 8, 12, 14, 15],
  },
  {
    name: 'Tom Cascade',
    hand: ['T', '', 'T', '', 'M', '', 'M', '', 'F', '', 'F', '', 'T', 'M', 'F', 'C'],
    kick: [0, 6, 10, 15],
  },
  {
    name: 'Snare Burst Resolve',
    hand: ['S', 'S', 'S', '', 'S', 'S', 'T', '', 'M', 'M', 'F', '', 'S', 'S', 'S', 'C'],
    kick: [0, 4, 8, 12, 15],
  },
  {
    name: 'Linear Trip Builder',
    hand: ['S', '', 'T', 'S', '', 'M', 'S', '', 'F', 'S', '', 'T', 'M', '', 'S', 'C'],
    kick: [1, 5, 9, 13, 15],
  },
  {
    name: 'One Bar Classic Down Resolve',
    hand: ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'T', 'T', 'M', 'F', 'S', 'S'],
    kick: [0, 4, 8, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Snare Roll Out',
    hand: ['S', 'S', 'S', 'S', 'S', 'S', 'T', 'T', 'M', 'M', 'F', 'F', 'S', 'S', 'S', 'S'],
    kick: [0, 6, 10, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Linear Resolve',
    hand: ['S', '', 'T', 'S', '', 'M', 'S', '', 'F', 'S', '', 'T', 'S', '', 'F', 'S'],
    kick: [1, 5, 9, 13],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Tom Ladder Resolve',
    hand: ['T', 'T', 'M', 'M', 'F', 'F', 'T', 'T', 'M', 'M', 'F', 'F', 'T', 'M', 'F', 'S'],
    kick: [0, 4, 8, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Pop Fill Resolve',
    hand: ['S', '', 'S', '', 'T', '', 'M', '', 'F', '', 'T', '', 'M', 'F', 'S', 'S'],
    kick: [0, 6, 10, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar RLRL Sweep Resolve',
    hand: ['T', 'M', 'F', 'S', 'T', 'M', 'F', 'S', 'T', 'M', 'F', 'S', 'T', 'M', 'F', 'S'],
    kick: [0, 4, 8, 12, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Bonham-ish Resolve',
    hand: ['S', '', 'S', 'T', 'F', '', 'S', 'T', 'M', '', 'F', 'S', 'T', '', 'F', 'S'],
    kick: [1, 4, 7, 10, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Double Stroke Resolve',
    hand: ['S', 'S', 'T', 'T', 'S', 'S', 'M', 'M', 'F', 'F', 'T', 'T', 'M', 'M', 'S', 'S'],
    kick: [0, 4, 8, 12, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Floor Drive Resolve',
    hand: ['F', 'F', 'M', 'T', 'F', 'F', 'M', 'T', 'F', 'M', 'T', 'S', 'F', 'M', 'T', 'S'],
    kick: [0, 3, 7, 11, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Drag Answer Resolve',
    hand: ['S', 'S', 'S', '', 'T', 'T', 'M', '', 'F', 'F', 'S', '', 'T', 'M', 'F', 'S'],
    kick: [0, 5, 9, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Gallop Resolve',
    hand: ['S', 'T', '', 'M', 'F', '', 'T', 'M', '', 'F', 'S', '', 'T', 'F', 'S', 'S'],
    kick: [0, 3, 6, 9, 12, 14],
    resolve: 'nextCrash',
  },
  {
    name: 'One Bar Classic Rock Resolve',
    hand: ['S', '', 'T', '', 'M', '', 'F', '', 'S', '', 'T', '', 'M', '', 'F', 'S'],
    kick: [0, 4, 8, 12, 14],
    resolve: 'nextCrash',
  },
]

export const BASIC_ONE_BAR_FILLS = [
  ONE_BAR_FILLS[0],
  ONE_BAR_FILLS[1],
  ONE_BAR_FILLS[4],
  ONE_BAR_FILLS[6],
  ONE_BAR_FILLS[7],
  ONE_BAR_FILLS[10],
  ONE_BAR_FILLS[18],
  ONE_BAR_FILLS[22],
  ONE_BAR_FILLS[25],
  ONE_BAR_FILLS[29],
]

export const HALF_BAR_FILLS = [
  { name: 'Half Snare Burst', hand: ['S', 'S', 'T', 'T', 'M', 'F', 'S', 'C'], kick: [0, 6, 7] },
  { name: 'Half Around Toms', hand: ['T', '', 'M', '', 'F', '', 'S', 'C'], kick: [0, 4, 7] },
  { name: 'Half Linear', hand: ['S', '', 'T', 'S', 'M', '', 'F', 'C'], kick: [1, 5, 7] },
  { name: 'Half Descend', hand: ['S', 'T', 'M', 'F', 'T', 'M', 'S', 'C'], kick: [0, 4, 7] },
  { name: 'Half Flam-ish', hand: ['S', '', 'S', 'T', 'M', 'F', 'S', 'C'], kick: [1, 6, 7] },
  { name: 'Half Push Fill', hand: ['T', '', 'T', 'M', 'F', '', 'S', 'C'], kick: [0, 3, 7] },
  { name: 'Half Snare Roll', hand: ['S', 'S', 'S', 'S', 'T', 'M', 'F', 'C'], kick: [0, 5, 7] },
  { name: 'Half Kit Answer', hand: ['S', 'T', '', 'M', '', 'F', 'S', 'C'], kick: [0, 2, 6, 7] },
  { name: 'Half Descend Burst', hand: ['S', 'T', 'M', 'F', 'S', 'T', 'F', 'C'], kick: [0, 4, 7] },
  { name: 'Half Double Stroke', hand: ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'C'], kick: [0, 6, 7] },
  { name: 'Half Syncopated Answer', hand: ['S', '', 'T', 'M', '', 'F', 'S', 'C'], kick: [1, 3, 6, 7] },
  { name: 'Half Floor Resolve', hand: ['T', 'M', 'F', 'F', 'S', '', 'S', 'C'], kick: [0, 4, 7] },
  { name: 'Half RL Accent', hand: ['S', 'T', 'S', 'M', 'S', 'F', 'S', 'C'], kick: [1, 5, 7] },
  { name: 'Half Late Crash', hand: ['S', '', 'S', '', 'T', 'M', 'F', 'C'], kick: [0, 5, 7] },
  { name: 'Half Five Stroke Flavor', hand: ['S', 'S', 'S', 'S', 'T', 'M', 'S', 'C'], kick: [0, 4, 7] },
  { name: 'Half Classic 16th Down', hand: ['S', 'S', 'T', 'T', 'M', 'M', 'F', 'S'], kick: [0, 6] , resolve: 'nextCrash' },
  { name: 'Half Bonham-ish Push', hand: ['S', '', 'S', 'T', 'F', '', 'F', 'S'], kick: [1, 4, 6], resolve: 'nextCrash' },
  { name: 'Half Snare Drag Down', hand: ['S', 'S', 'S', 'T', 'M', 'F', 'F', 'S'], kick: [0, 5], resolve: 'nextCrash' },
  { name: 'Half Tom Ladder', hand: ['T', 'T', 'M', 'M', 'F', 'F', 'M', 'S'], kick: [0, 4, 6], resolve: 'nextCrash' },
  { name: 'Half Gallop Resolve', hand: ['S', 'T', '', 'M', 'F', '', 'F', 'S'], kick: [0, 2, 4, 6], resolve: 'nextCrash' },
  { name: 'Half Double Kick Answer', hand: ['S', 'T', 'M', 'F', 'S', 'T', 'F', 'S'], kick: [0, 1, 4, 6], resolve: 'nextCrash' },
  { name: 'Half Four On Floor Fill', hand: ['S', '', 'T', 'M', 'F', 'M', 'T', 'S'], kick: [0, 2, 4, 6], resolve: 'nextCrash' },
  { name: 'Half RLRL Sweep', hand: ['T', 'M', 'F', 'S', 'T', 'M', 'F', 'S'], kick: [0, 4, 6], resolve: 'nextCrash' },
  { name: 'Half Snare Answer', hand: ['S', '', 'S', '', 'T', 'M', 'F', 'S'], kick: [1, 5, 6], resolve: 'nextCrash' },
  { name: 'Half Floor Tom Drive', hand: ['F', 'F', 'M', 'T', 'F', 'M', 'T', 'S'], kick: [0, 3, 6], resolve: 'nextCrash' },
  { name: 'Half Triplet Sweep', hand: ['S', 'T', 'M', 'S', 'T', 'M', 'F', 'S'], kick: [0, 3, 6], resolve: 'nextCrash' },
  { name: 'Half Classic Pop Ending', hand: ['S', '', 'T', '', 'M', 'F', 'S', 'S'], kick: [0, 4, 6], resolve: 'nextCrash' },
]

export const BASIC_HALF_BAR_FILLS = [
  HALF_BAR_FILLS[0],
  HALF_BAR_FILLS[1],
  HALF_BAR_FILLS[3],
  HALF_BAR_FILLS[8],
  HALF_BAR_FILLS[11],
  HALF_BAR_FILLS[13],
]

export const QUARTER_BAR_FILLS = [
  { name: 'Quarter Pickup', hand: ['T', 'M', 'F', 'C'], kick: [0, 3] },
  { name: 'Quarter Snap', hand: ['S', 'S', 'F', 'C'], kick: [1, 3] },
  { name: 'Quarter Flam-ish', hand: ['S', 'T', 'S', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Descend', hand: ['T', 'M', 'S', 'C'], kick: [0, 3] },
  { name: 'Quarter Burst', hand: ['S', 'S', 'S', 'C'], kick: [1, 3] },
  { name: 'Quarter Floor Lead', hand: ['F', 'F', 'S', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Tom Answer', hand: ['T', 'S', 'F', 'C'], kick: [1, 3] },
  { name: 'Quarter Single Sweep', hand: ['S', 'T', 'M', 'C'], kick: [0, 3] },
  { name: 'Quarter Trip Push', hand: ['S', 'M', 'F', 'C'], kick: [1, 3] },
  { name: 'Quarter Buzz Feel', hand: ['S', 'S', 'T', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Low Resolve', hand: ['M', 'F', 'S', 'C'], kick: [0, 3] },
  { name: 'Quarter Accent Drop', hand: ['T', 'F', 'S', 'C'], kick: [1, 3] },
  { name: 'Quarter Reverse Answer', hand: ['F', 'M', 'S', 'C'], kick: [0, 2, 3] },
  { name: 'Quarter Tight Pop', hand: ['S', 'T', 'S', 'C'], kick: [1, 3] },
  { name: 'Quarter Classic Down', hand: ['T', 'M', 'F', 'S'], kick: [0, 2], resolve: 'nextCrash' },
  { name: 'Quarter Snare Into Floor', hand: ['S', 'S', 'F', 'S'], kick: [1, 2], resolve: 'nextCrash' },
  { name: 'Quarter RL Sweep', hand: ['T', 'F', 'T', 'S'], kick: [0, 2], resolve: 'nextCrash' },
  { name: 'Quarter Tom Snap', hand: ['T', 'M', 'S', 'S'], kick: [0, 3], resolve: 'nextCrash' },
  { name: 'Quarter Drag Resolve', hand: ['S', 'S', 'T', 'S'], kick: [1, 2], resolve: 'nextCrash' },
  { name: 'Quarter Low Pop', hand: ['F', 'M', 'F', 'S'], kick: [0, 2], resolve: 'nextCrash' },
  { name: 'Quarter Single Stroke', hand: ['S', 'T', 'M', 'S'], kick: [0, 3], resolve: 'nextCrash' },
  { name: 'Quarter Kick Answer', hand: ['T', 'S', 'F', 'S'], kick: [0, 1, 3], resolve: 'nextCrash' },
  { name: 'Quarter Flam Touch', hand: ['S', 'T', 'S', 'S'], kick: [1, 3], resolve: 'nextCrash' },
  { name: 'Quarter Floor Lead Out', hand: ['F', 'F', 'M', 'S'], kick: [0, 2], resolve: 'nextCrash' },
  { name: 'Quarter Burst Resolve', hand: ['S', 'S', 'S', 'S'], kick: [1, 3], resolve: 'nextCrash' },
  { name: 'Quarter TMS Resolve', hand: ['T', 'M', 'S', 'S'], kick: [0, 2], resolve: 'nextCrash' },
]

export const BASIC_QUARTER_BAR_FILLS = [
  QUARTER_BAR_FILLS[0],
  QUARTER_BAR_FILLS[1],
  QUARTER_BAR_FILLS[3],
  QUARTER_BAR_FILLS[5],
  QUARTER_BAR_FILLS[6],
  QUARTER_BAR_FILLS[8],
]

export const FILL_GENRE_PROFILES = {
  rock: {
    grooveFallback: 'straight',
    groovePool: GENRE_GROOVE_LIBRARY.rock,
    fills: {
      basic: {
        '1bar': [0, 1, 4, 6, 10, 18, 22, 25],
        half: [0, 1, 3, 8, 15, 18, 21, 26],
        quarter: [0, 3, 6, 8, 14, 15, 18, 24],
      },
      random: {
        '1bar': [0, 1, 4, 6, 7, 8, 10, 11, 15, 18, 19, 20, 21, 22, 25, 29],
        half: [0, 1, 3, 6, 8, 9, 11, 13, 15, 18, 19, 21, 22, 24, 26],
        quarter: [0, 1, 3, 5, 6, 8, 10, 11, 14, 15, 16, 19, 21, 24, 25],
      },
    },
  },
  pops: {
    grooveFallback: 'straight',
    groovePool: GENRE_GROOVE_LIBRARY.pops,
    fills: {
      basic: {
        '1bar': [1, 4, 7, 11, 18, 21, 22, 29],
        half: [1, 2, 4, 7, 13, 19, 24, 26],
        quarter: [1, 3, 6, 8, 17, 18, 20, 26],
      },
      random: {
        '1bar': [1, 4, 7, 9, 11, 13, 15, 18, 20, 21, 22, 26, 29],
        half: [1, 2, 4, 7, 10, 12, 13, 15, 17, 19, 23, 24, 26],
        quarter: [1, 3, 4, 6, 8, 9, 12, 13, 17, 18, 20, 23, 26],
      },
    },
  },
  blues: {
    grooveFallback: 'syncopated',
    groovePool: GENRE_GROOVE_LIBRARY.blues,
    fills: {
      basic: {
        '1bar': [3, 7, 8, 13, 20, 24, 26, 28],
        half: [4, 6, 10, 13, 18, 22, 25, 27],
        quarter: [2, 8, 9, 12, 18, 22, 24, 25],
      },
      random: {
        '1bar': [2, 3, 7, 8, 9, 12, 13, 14, 17, 20, 24, 26, 27, 28],
        half: [4, 5, 6, 10, 12, 13, 14, 16, 18, 20, 22, 25, 27],
        quarter: [2, 4, 7, 8, 9, 10, 12, 13, 18, 22, 24, 25],
      },
    },
  },
  jazz: {
    grooveFallback: 'ride',
    groovePool: GENRE_GROOVE_LIBRARY.jazz,
    fills: {
      basic: {
        '1bar': [3, 5, 9, 13, 16, 17, 20, 27],
        half: [2, 4, 7, 10, 17, 18, 20, 25],
        quarter: [2, 6, 7, 8, 16, 18, 21, 27],
      },
      random: {
        '1bar': [2, 3, 5, 8, 9, 12, 13, 16, 17, 20, 23, 24, 27, 28],
        half: [2, 4, 7, 8, 10, 12, 17, 18, 20, 22, 25, 26],
        quarter: [2, 6, 7, 8, 10, 12, 16, 18, 19, 21, 22, 27],
      },
    },
  },
}
