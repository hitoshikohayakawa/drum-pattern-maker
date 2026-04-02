import * as Tone from 'tone'

export function hasLayer(symbol, target) {
  return typeof symbol === 'string' && symbol.includes(target)
}

export function stopAndStartPlayer(player, time, playbackRate, volume) {
  if (!player) return
  if (typeof playbackRate === 'number') player.playbackRate = playbackRate
  if (typeof volume === 'number') player.volume.value = volume
  player.stop(time)
  player.start(time)
}

export async function unlockAudioContext() {
  try {
    await Tone.start()
    const context = Tone.getContext()
    if (context.state !== 'running') {
      await context.resume()
    }
  } catch (error) {
    console.error('Audio context unlock failed:', error)
  }
}
