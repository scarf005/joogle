let audioContext: AudioContext | null = null

function getAudioContext() {
  if (typeof globalThis === "undefined" || !("AudioContext" in globalThis)) {
    return null
  }

  if (!audioContext) {
    audioContext = new globalThis.AudioContext()
  }

  return audioContext
}

export async function playJjugeulAudio(seed: number) {
  const context = getAudioContext()
  if (!context) return

  if (context.state === "suspended") {
    await context.resume()
  }

  const now = context.currentTime
  const baseFrequency = 180 + (seed % 4) * 25

  const oscillator = new OscillatorNode(context, {
    type: "triangle",
    frequency: baseFrequency,
  })

  const overtone = new OscillatorNode(context, {
    type: "sine",
    frequency: baseFrequency * 1.85,
  })

  const filter = new BiquadFilterNode(context, {
    type: "lowpass",
    frequency: 1100 + (seed % 3) * 120,
    Q: 1,
  })

  const gain = new GainNode(context, { gain: 0.0001 })

  oscillator.connect(filter)
  overtone.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)

  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)

  oscillator.frequency.exponentialRampToValueAtTime(
    baseFrequency * 0.65,
    now + 0.1,
  )
  overtone.frequency.exponentialRampToValueAtTime(
    baseFrequency * 1.2,
    now + 0.1,
  )

  oscillator.start(now)
  overtone.start(now)
  oscillator.stop(now + 0.12)
  overtone.stop(now + 0.12)
}
