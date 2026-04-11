export const ANNOUNCEMENTS_STORAGE_KEY = 'app_updates_last_read'

export const ANNOUNCEMENTS = Object.freeze([
  {
    id: '2026-04-10-release',
    date: '2026/4/10',
    published: '2026-04-10T00:00:00.000Z',
    type: 'feature',
    title: {
      ja: '新機能が追加されました',
      en: 'New features have been added',
    },
    summary: {
      ja: 'Jazz / Blues の調整、3連フィル対応、フットハイハット音源追加を行いました。',
      en: 'Jazz and blues patterns were refined, triplet fills were added, and a new foot hi-hat sound source is now available.',
    },
    body: {
      ja: [
        'jazzやBluesでのビートパターンが調整されました',
        '3連を活用したフィルパターンが作成できるようになりました',
        'フットハイハットの音源を追加しました',
      ],
      en: [
        'Beat patterns for jazz and blues have been refined',
        'You can now create fill patterns using triplets',
        'A new foot hi-hat sound source has been added',
      ],
    },
  },
])

export function getPublishedAnnouncements() {
  return [...ANNOUNCEMENTS]
    .filter((item) => item?.published)
    .sort((left, right) => new Date(right.published).getTime() - new Date(left.published).getTime())
}

export function getLatestPublishedAnnouncement() {
  return getPublishedAnnouncements()[0] || null
}