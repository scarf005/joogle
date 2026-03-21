import { createJjugeulRandom, randomBetween } from "../utils/jjugeulRandom.ts"

const CLICK_SOUND_PATH = "/jjugeul.mp3"
const MASTER_GAIN = 0.1875
const DRY_GAIN = 0.75
const WET_GAIN = 1.1
const CLICK_OFFSET = 0.1
const ATTACK_TIME = 0.0012

let audioContext: AudioContext | null = null
let clickBufferPromise: Promise<AudioBuffer> | null = null
let impulseBuffer: AudioBuffer | null = null

const getAudioContext = () => {
  if (typeof globalThis === "undefined" || !("AudioContext" in globalThis)) {
    return null
  }

  if (!audioContext) {
    audioContext = new globalThis.AudioContext()
  }

  return audioContext
}

const getImpulseBuffer = (options: { context: AudioContext }) => {
  if (impulseBuffer) return impulseBuffer

  const length = Math.floor(options.context.sampleRate * 1.6)
  const buffer = options.context.createBuffer(
    2,
    length,
    options.context.sampleRate,
  )

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)

    for (let index = 0; index < length; index += 1) {
      const decay = Math.pow(1 - index / length, 1.4)
      data[index] = (Math.random() * 2 - 1) * decay
    }
  }

  impulseBuffer = buffer
  return buffer
}

const loadClickBuffer = async (options: { context: AudioContext }) => {
  if (!clickBufferPromise) {
    clickBufferPromise = fetch(CLICK_SOUND_PATH)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) =>
        options.context.decodeAudioData(arrayBuffer.slice(0))
      )
  }

  return await clickBufferPromise
}

export const playJjugeulAudio = async (_options: { seed: number }) => {
  const context = getAudioContext()
  if (!context) return

  if (context.state === "suspended") {
    await context.resume()
  }

  const buffer = await loadClickBuffer({ context })
  const random = createJjugeulRandom({ seed: _options.seed })
  const dryLevel = MASTER_GAIN * DRY_GAIN * randomBetween({
    random,
    min: 0.82,
    max: 1,
  })
  const wetLevel = MASTER_GAIN * WET_GAIN * randomBetween({
    random,
    min: 0.78,
    max: 1.18,
  })
  const source = new AudioBufferSourceNode(context, { buffer })
  const dryGain = new GainNode(context, { gain: 0 })
  const wetGain = new GainNode(context, { gain: 0 })
  const convolver = new ConvolverNode(context, {
    buffer: getImpulseBuffer({ context }),
  })
  const now = context.currentTime

  dryGain.gain.setValueAtTime(0, now)
  wetGain.gain.setValueAtTime(0, now)
  dryGain.gain.exponentialRampToValueAtTime(
    Math.max(dryLevel, 0.0001),
    now + ATTACK_TIME,
  )
  wetGain.gain.exponentialRampToValueAtTime(
    Math.max(wetLevel, 0.0001),
    now + ATTACK_TIME,
  )

  source.connect(dryGain)
  source.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(context.destination)
  wetGain.connect(context.destination)

  source.start(now, CLICK_OFFSET)
}
