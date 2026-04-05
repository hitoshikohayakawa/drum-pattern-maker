export function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
}

export function getProfileDisplayName(profile, user) {
  return profile?.display_name || profile?.username || user?.email || 'User'
}

export function formatProfileName(profile) {
  return profile?.display_name || profile?.username || 'Unknown Drummer'
}

export function getProfileInitial(profile, user) {
  const source = getProfileDisplayName(profile, user).trim()
  return source ? source.charAt(0).toUpperCase() : 'U'
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました。'))
    reader.readAsDataURL(file)
  })
}
