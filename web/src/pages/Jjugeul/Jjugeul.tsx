import "./Jjugeul.css"
import { useEffect, useRef } from "preact/hooks"
import haloImage from "../../assets/halo.webp"
import handImage from "../../assets/hand.webp"
import joogleImage from "../../assets/joogle.webp"
import suzumiImage from "../../assets/suzumi.webp"
import {
  fetchJjugeulLeaderboard,
  fetchJjugeulTotals,
  postJjugeulClicks,
  sendBeaconJjugeulClicks,
} from "../../services/jjugeulApi.ts"
import { playJjugeulAudio } from "../../services/jjugeulAudio.ts"
import {
  consumeJjugeulPendingDelta,
  jjugeulBurstSeed,
  jjugeulCount,
  jjugeulCountryCode,
  jjugeulCountryTotal,
  jjugeulGlobalTotal,
  jjugeulLeaderboard,
  jjugeulLeaderboardOpen,
  jjugeulPressed,
  pressJjugeul,
  releaseJjugeul,
  restoreJjugeulPendingDelta,
  setJjugeulLeaderboard,
  setJjugeulRemoteTotals,
  toggleJjugeulLeaderboard,
} from "../../stores/jjugeul.ts"

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

  return Boolean(target.closest("button, a, input, select, textarea"))
}

export function Jjugeul() {
  const isSyncingRef = useRef(false)
  const stageRef = useRef<HTMLButtonElement>(null)

  const syncLeaderboard = async () => {
    try {
      const response = await fetchJjugeulLeaderboard()
      setJjugeulLeaderboard(response.entries)
    } catch {
      return
    }
  }

  const handlePress = async () => {
    const didPress = pressJjugeul()
    if (!didPress) return

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
        if (jjugeulLeaderboardOpen.value) {
          await syncLeaderboard()
        }
      } catch {
        restoreJjugeulPendingDelta(delta)
      } finally {
        isSyncingRef.current = false
      }
    }

    void syncSnapshot()
    void syncLeaderboard()
    stageRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        releaseJjugeul()
        if (jjugeulLeaderboardOpen.value) {
          toggleJjugeulLeaderboard()
        }
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

    const leaderboardTimer = globalThis.setInterval(() => {
      if (jjugeulLeaderboardOpen.value) {
        void syncLeaderboard()
      }
    }, 4000)

    return () => {
      globalThis.clearInterval(syncTimer)
      globalThis.clearInterval(leaderboardTimer)
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
  }, [])

  return (
    <main class="jjugeul">
      <strong class="jjugeul__counter">{jjugeulCount.value}</strong>

      <button
        type="button"
        class="jjugeul__leaderboard-toggle"
        aria-label="Open leaderboard"
        aria-pressed={jjugeulLeaderboardOpen.value}
        onClick={() => {
          toggleJjugeulLeaderboard()

          if (!jjugeulLeaderboardOpen.value) return
          void syncLeaderboard()
        }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="jjugeul__leaderboard-icon"
        >
          <path d="M4 20V10H8V20H4ZM10 20V4H14V20H10ZM16 20V13H20V20H16Z" />
        </svg>
      </button>

      {jjugeulLeaderboardOpen.value && (
        <aside class="jjugeul__leaderboard" aria-label="Country leaderboard">
          <div class="jjugeul__leaderboard-head">
            <strong>Leaderboard</strong>
            <span>{jjugeulGlobalTotal.value}</span>
          </div>

          <div class="jjugeul__leaderboard-meta">
            <span>{jjugeulCountryCode.value}</span>
            <span>{jjugeulCountryTotal.value}</span>
          </div>

          <ol class="jjugeul__leaderboard-list">
            {jjugeulLeaderboard.value.map((entry) => (
              <li
                key={entry.countryCode}
                class={`jjugeul__leaderboard-item ${
                  entry.countryCode === jjugeulCountryCode.value
                    ? "jjugeul__leaderboard-item--current"
                    : ""
                }`}
              >
                <span>{entry.countryCode}</span>
                <span>{entry.total}</span>
              </li>
            ))}
          </ol>
        </aside>
      )}

      <button
        ref={stageRef}
        type="button"
        class={`jjugeul__stage ${
          jjugeulPressed.value ? "jjugeul__stage--impact" : ""
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
        <span class="jjugeul__mascot-frame" role="img" aria-label="쮸글 스즈미">
          <span
            class={`jjugeul__layer-set jjugeul__layer-set--character ${
              jjugeulPressed.value ? "jjugeul__layer-set--impact" : ""
            }`}
          >
            <img
              src={haloImage}
              alt=""
              aria-hidden="true"
              class={`jjugeul__layer jjugeul__layer--halo ${
                jjugeulPressed.value ? "jjugeul__layer--impact" : ""
              }`}
              draggable={false}
            />
            <img
              src={suzumiImage}
              alt=""
              aria-hidden="true"
              class={`jjugeul__layer jjugeul__layer--suzumi ${
                jjugeulPressed.value ? "jjugeul__layer--impact" : ""
              }`}
              draggable={false}
            />
          </span>

          <span
            class={`jjugeul__layer-set jjugeul__layer-set--press ${
              jjugeulPressed.value ? "jjugeul__layer-set--impact" : ""
            }`}
          >
            <img
              src={joogleImage}
              alt=""
              aria-hidden="true"
              class={`jjugeul__layer jjugeul__layer--joogle ${
                jjugeulPressed.value ? "jjugeul__layer--impact" : ""
              }`}
              draggable={false}
            />
            <img
              src={handImage}
              alt=""
              aria-hidden="true"
              class={`jjugeul__layer jjugeul__layer--hand ${
                jjugeulPressed.value ? "jjugeul__layer--impact" : ""
              }`}
              draggable={false}
            />
          </span>
        </span>
      </button>
    </main>
  )
}
