import "./voice-search.css"
import { signal } from "@preact/signals"

type VoiceState = "idle" | "listening" | "processing" | "error"

const voiceState = signal<VoiceState>("idle")

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
}

interface SpeechRecognitionGlobal {
  webkitSpeechRecognition?: {
    new (): SpeechRecognitionInstance
  }
}

interface VoiceSearchProps {
  onResult: (transcript: string) => void
  locale?: "ko" | "ja" | "en"
}

export function VoiceSearch({ onResult, locale = "ko" }: VoiceSearchProps) {
  const speechRecognitionWindow = globalThis as
    & typeof globalThis
    & SpeechRecognitionGlobal

  const isSupported =
    typeof speechRecognitionWindow.webkitSpeechRecognition !== "undefined"

  const handleVoiceSearch = () => {
    if (!isSupported) return

    const SpeechRecognition = speechRecognitionWindow.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()

    const langMap = {
      ko: "ko-KR",
      ja: "ja-JP",
      en: "en-US",
    }

    recognition.lang = langMap[locale]
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      voiceState.value = "listening"
    }

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      voiceState.value = "processing"
      const transcript = event.results[0][0].transcript
      onResult(transcript)
      voiceState.value = "idle"
    }

    recognition.onerror = () => {
      voiceState.value = "error"
      setTimeout(() => {
        voiceState.value = "idle"
      }, 2000)
    }

    recognition.onend = () => {
      if (voiceState.value === "listening") {
        voiceState.value = "idle"
      }
    }

    recognition.start()
  }

  if (!isSupported) return null

  const ariaLabel = voiceState.value === "listening"
    ? "Listening..."
    : "Voice search"

  return (
    <button
      type="button"
      class={`voice-search ${
        voiceState.value === "listening" ? "voice-search--listening" : ""
      } ${voiceState.value === "error" ? "voice-search--error" : ""}`}
      onClick={handleVoiceSearch}
      aria-label={ariaLabel}
      disabled={voiceState.value === "listening"}
    >
      {voiceState.value === "listening"
        ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="20"
            height="20"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )
        : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="20"
            height="20"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
    </button>
  )
}
