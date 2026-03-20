import "./Jjugeul.css"
import { useEffect, useRef } from "preact/hooks"
import haloImage from "../../assets/halo.webp"
import handImage from "../../assets/hand.webp"
import joogleImage from "../../assets/joogle.webp"
import suzumiImage from "../../assets/suzumi.webp"
import {
  consumeJjugeulPendingDelta,
  jjugeulBurstSeed,
  jjugeulCount,
  jjugeulMuted,
  jjugeulPressed,
  pressJjugeul,
  releaseJjugeul,
  restoreJjugeulPendingDelta,
  setJjugeulRemoteTotals,
} from "../../stores/jjugeul.ts"
import {
  fetchJjugeulTotals,
  postJjugeulClicks,
  sendBeaconJjugeulClicks,
} from "../../services/jjugeulApi.ts"
import { playJjugeulAudio } from "../../services/jjugeulAudio.ts"

interface JjugeulProps {
  onNavigateToHome: () => void
}

function isHandledKeyboardPress(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return false

  const ignoredKeys = new Set([
    "Alt",
    "CapsLock",
    "Control",
    "Escape",
    "Meta",
    "NumLock",
    "ScrollLock",
    "Shift",
    "Tab",
  ])

  return !ignoredKeys.has(event.key)
}

function isControlTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  const control = target.closest(
    "a, button, input, select, textarea, summary, [role='button']",
  )

  return Boolean(control && !control.hasAttribute("data-jjugeul-stage"))
}

export function Jjugeul({ onNavigateToHome }: JjugeulProps) {
  const isSyncingRef = useRef(false)
  const stageRef = useRef<HTMLButtonElement>(null)
  const burstVariant = (jjugeulBurstSeed.value % 3) + 1

  const handlePress = async () => {
    const didPress = pressJjugeul()
    if (!didPress || jjugeulMuted.value) return

    await playJjugeulAudio(jjugeulBurstSeed.value)
  }

  useEffect(() => {
    const syncSnapshot = async () => {
      try {
        setJjugeulRemoteTotals(await fetchJjugeulTotals())
      } catch {
        return
      }
    }

    const flushPending = async () => {
      if (isSyncingRef.current) return

      const delta = consumeJjugeulPendingDelta()
      if (delta === 0) return

      isSyncingRef.current = true

      try {
        setJjugeulRemoteTotals(await postJjugeulClicks(delta))
      } catch {
        restoreJjugeulPendingDelta(delta)
      } finally {
        isSyncingRef.current = false
      }
    }

    void syncSnapshot()
    stageRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        releaseJjugeul()
        onNavigateToHome()
        return
      }

      if (event.repeat || !isHandledKeyboardPress(event)) return
      if (isControlTarget(event.target)) return

      event.preventDefault()
      void handlePress()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isHandledKeyboardPress(event)) return
      releaseJjugeul()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const delta = consumeJjugeulPendingDelta()
        if (delta > 0 && !sendBeaconJjugeulClicks(delta)) {
          restoreJjugeulPendingDelta(delta)
        }

        releaseJjugeul()
      }
    }

    const handleWindowBlur = () => {
      releaseJjugeul()
    }

    globalThis.addEventListener("keydown", handleKeyDown)
    globalThis.addEventListener("keyup", handleKeyUp)
    globalThis.addEventListener("pointerup", handleWindowBlur)
    globalThis.addEventListener("pointercancel", handleWindowBlur)
    globalThis.addEventListener("blur", handleWindowBlur)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const syncTimer = globalThis.setInterval(() => {
      void flushPending()
    }, 800)

    return () => {
      globalThis.clearInterval(syncTimer)
      globalThis.removeEventListener("keydown", handleKeyDown)
      globalThis.removeEventListener("keyup", handleKeyUp)
      globalThis.removeEventListener("pointerup", handleWindowBlur)
      globalThis.removeEventListener("pointercancel", handleWindowBlur)
      globalThis.removeEventListener("blur", handleWindowBlur)
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      const delta = consumeJjugeulPendingDelta()
      if (delta > 0 && !sendBeaconJjugeulClicks(delta)) {
        restoreJjugeulPendingDelta(delta)
      }

      releaseJjugeul()
    }
  }, [onNavigateToHome])

  return (
    <main class="jjugeul">
      <strong class="jjugeul__counter">{jjugeulCount.value}</strong>

      <button
        ref={stageRef}
        type="button"
        class={`jjugeul__stage ${
          jjugeulPressed.value ? "jjugeul__stage--pressed" : ""
        }`}
        onPointerDown={() => {
          void handlePress()
        }}
        onPointerLeave={releaseJjugeul}
        onPointerCancel={releaseJjugeul}
        onPointerUp={releaseJjugeul}
        aria-label="쮸글"
        data-jjugeul-stage
      >
        {jjugeulPressed.value && (
          <span class={`jjugeul__burst jjugeul__burst--${burstVariant}`}>
            쮸글
          </span>
        )}

        <span class="jjugeul__mascot-frame" role="img" aria-label="쮸글 스즈미">
          <span class="jjugeul__layer-set jjugeul__layer-set--character">
            <img
              src={haloImage}
              alt=""
              aria-hidden="true"
              class="jjugeul__layer jjugeul__layer--halo"
              draggable={false}
            />
            <img
              src={suzumiImage}
              alt=""
              aria-hidden="true"
              class="jjugeul__layer jjugeul__layer--suzumi"
              draggable={false}
            />
          </span>

          <span class="jjugeul__layer-set jjugeul__layer-set--press">
            <img
              src={joogleImage}
              alt=""
              aria-hidden="true"
              class="jjugeul__layer jjugeul__layer--joogle"
              draggable={false}
            />
            <img
              src={handImage}
              alt=""
              aria-hidden="true"
              class="jjugeul__layer jjugeul__layer--hand"
              draggable={false}
            />
          </span>
        </span>
      </button>
    </main>
  )
}
