// Manifest file mapping to patterns
import fillinImages from '../../docs/drum_pattern_maker_fillin_image_manifest.json'

export function getFillinImages() {
  return fillinImages.images || []
}

export function getFillinImageById(id) {
  const images = getFillinImages()
  return images.find((i) => i.id === id) || null
}
