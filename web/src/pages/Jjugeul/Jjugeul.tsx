import "./Jjugeul.css"
import { useEffect, useRef, useState } from "preact/hooks"
import haloImage from "../../assets/halo.webp"
import handImage from "../../assets/hand.webp"
import joogleImage from "../../assets/joogle.webp"
import suzumiImage from "../../assets/suzumi.webp"
import { getJjugeulStudent } from "../../data/students.ts"
import {
  createJjugeulWebSocket,
  fetchJjugeulSnapshot,
  type JjugeulCountryLeaderboardEntry,
  type JjugeulLiveResponse,
  postJjugeulClicks,
  sendBeaconJjugeulClicks,
} from "../../services/jjugeulApi.ts"
import { playJjugeulAudio } from "../../services/jjugeulAudio.ts"
import {
  consumeJjugeulPendingClicks,
  getJjugeulActiveStudent,
  getJjugeulActiveStudentTotal,
  hydrateJjugeulPreferences,
  jjugeulActiveStudentId,
  jjugeulBurstSeed,
  jjugeulCount,
  jjugeulCountryCode,
  jjugeulCountryLeaderboard,
  jjugeulCountryTotal,
  jjugeulGlobalTotal,
  jjugeulLeaderboardOpen,
  jjugeulPressed,
  jjugeulStudentLeaderboard,
  pressJjugeul,
  releaseJjugeul,
  restoreJjugeulPendingClicks,
  setJjugeulLeaderboards,
  setJjugeulRemoteTotals,
  toggleJjugeulLeaderboard,
} from "../../stores/jjugeul.ts"
import {
  createJjugeulRandom,
  randomBetween,
} from "../../utils/jjugeulRandom.ts"

const compactNumber = new Intl.NumberFormat("en-US")

const isHandledKeyboardPress = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return false
  if (event.isComposing) return false

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

  if (ignoredKeys.has(event.key)) return false

  return event.key === " " || event.key.length === 1
}

const isControlTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(target.closest("button, a, input, select, textarea"))
}

const getCountryPosition = (
  entries: JjugeulCountryLeaderboardEntry[],
  countryCode: string,
) => {
  const index = entries.findIndex((entry) => entry.countryCode === countryCode)
  return index >= 0 ? index + 1 : null
}

export const Jjugeul = () => {
  const isDisposedRef = useRef(false)
  const isSyncingRef = useRef(false)
  const stageRef = useRef<HTMLButtonElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const [, setRevision] = useState(0)

  const refresh = () => {
    setRevision((value) => value + 1)
  }

  const applyLiveMessage = (options: { message: JjugeulLiveResponse }) => {
    setJjugeulRemoteTotals({ ...options.message.totals })
    setJjugeulLeaderboards({
      countryEntries: options.message.countryLeaderboard,
      studentEntries: options.message.studentLeaderboard,
    })
    refresh()
  }

  const handleRelease = () => {
    releaseJjugeul()
    refresh()
  }

  const handleLeaderboardToggle = () => {
    toggleJjugeulLeaderboard()
    refresh()
  }

  const currentStudent = getJjugeulActiveStudent()
  const random = createJjugeulRandom({ seed: jjugeulBurstSeed.value })
  const impactOffsetX = randomBetween({ random, min: -1.4, max: 1.4 })
  const impactOffsetY = randomBetween({ random, min: 0.8, max: 2.1 })
  const bodySquishX = randomBetween({ random, min: 1.04, max: 1.1 })
  const bodySquishY = randomBetween({ random, min: 0.86, max: 0.94 })
  const suzumiSquishX = randomBetween({ random, min: 1.05, max: 1.11 })
  const suzumiSquishY = randomBetween({ random, min: 0.84, max: 0.92 })
  const handOffsetX = randomBetween({ random, min: -0.6, max: 1.2 })
  const handOffsetY = randomBetween({ random, min: 16.2, max: 21.3 })
  const handRotation = randomBetween({ random, min: 0.6, max: 2.7 })
  const joogleOffsetY = randomBetween({ random, min: 8.2, max: 10.6 })
  const stageStyle = {
    "--jjugeul-impact-offset-x": `${impactOffsetX.toFixed(3)}%`,
    "--jjugeul-impact-offset-y": `${impactOffsetY.toFixed(3)}%`,
    "--jjugeul-body-squish-x": bodySquishX.toFixed(3),
    "--jjugeul-body-squish-y": bodySquishY.toFixed(3),
    "--jjugeul-suzumi-squish-x": suzumiSquishX.toFixed(3),
    "--jjugeul-suzumi-squish-y": suzumiSquishY.toFixed(3),
    "--jjugeul-hand-impact-x": `${handOffsetX.toFixed(3)}%`,
    "--jjugeul-hand-impact-y": `${handOffsetY.toFixed(3)}%`,
    "--jjugeul-hand-impact-rotate": `${handRotation.toFixed(3)}deg`,
    "--jjugeul-joogle-impact-y": `${joogleOffsetY.toFixed(3)}%`,
  } as const

  const syncSnapshot = async () => {
    try {
      applyLiveMessage({ message: await fetchJjugeulSnapshot() })
    } catch {
      return
    }
  }

  const flushPending = async () => {
    if (isSyncingRef.current) return

    const clicks = consumeJjugeulPendingClicks()
    if (clicks.length === 0) return

    isSyncingRef.current = true

    try {
      applyLiveMessage({ message: await postJjugeulClicks({ clicks }) })
    } catch {
      restoreJjugeulPendingClicks({ clicks })
      refresh()
    } finally {
      isSyncingRef.current = false
    }
  }

  const connectLive = () => {
    const socket = createJjugeulWebSocket()
    if (!socket) return

    socket.onmessage = (event) => {
      try {
        applyLiveMessage({
          message: JSON.parse(event.data) as JjugeulLiveResponse,
        })
      } catch {
        return
      }
    }

    socket.onclose = () => {
      socketRef.current = null

      if (isDisposedRef.current) {
        return
      }

      globalThis.setTimeout(() => {
        if (!socketRef.current) {
          connectLive()
        }
      }, 1500)
    }

    socketRef.current = socket
  }

  const handlePress = async () => {
    const didPress = pressJjugeul()
    if (!didPress) return

    refresh()
    await playJjugeulAudio({ seed: jjugeulBurstSeed.value })
  }

  useEffect(() => {
    isDisposedRef.current = false
    hydrateJjugeulPreferences()
    refresh()
    void syncSnapshot()
    connectLive()
    stageRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleRelease()

        if (jjugeulLeaderboardOpen.value) {
          handleLeaderboardToggle()
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
      handleRelease()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) return

      const clicks = consumeJjugeulPendingClicks()
      if (clicks.length > 0 && !sendBeaconJjugeulClicks({ clicks })) {
        restoreJjugeulPendingClicks({ clicks })
      }

      handleRelease()
    }

    globalThis.addEventListener("keydown", handleKeyDown)
    globalThis.addEventListener("keyup", handleKeyUp)
    globalThis.addEventListener("pointerup", handleRelease)
    globalThis.addEventListener("pointercancel", handleRelease)
    globalThis.addEventListener("blur", handleRelease)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const syncTimer = globalThis.setInterval(() => {
      void flushPending()
    }, 800)

    return () => {
      isDisposedRef.current = true
      globalThis.clearInterval(syncTimer)
      globalThis.removeEventListener("keydown", handleKeyDown)
      globalThis.removeEventListener("keyup", handleKeyUp)
      globalThis.removeEventListener("pointerup", handleRelease)
      globalThis.removeEventListener("pointercancel", handleRelease)
      globalThis.removeEventListener("blur", handleRelease)
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      const clicks = consumeJjugeulPendingClicks()
      if (clicks.length > 0 && !sendBeaconJjugeulClicks({ clicks })) {
        restoreJjugeulPendingClicks({ clicks })
      }

      socketRef.current?.close()
      releaseJjugeul()
    }
  }, [])

  return (
    <main class="jjugeul">
      <header class="jjugeul__hud">
        <div class="jjugeul__summary-grid">
          <article class="jjugeul__summary-card">
            <span>WORLD</span>
            <strong>{compactNumber.format(jjugeulGlobalTotal.value)}</strong>
          </article>

          <article class="jjugeul__summary-card">
            <span>{jjugeulCountryCode.value}</span>
            <strong>{compactNumber.format(jjugeulCountryTotal.value)}</strong>
          </article>

          <article class="jjugeul__summary-card">
            <span>{currentStudent.name}</span>
            <strong>
              {compactNumber.format(getJjugeulActiveStudentTotal())}
            </strong>
          </article>
        </div>

        <button
          type="button"
          class="jjugeul__leaderboard-toggle"
          aria-label="BOARD"
          aria-pressed={jjugeulLeaderboardOpen.value}
          onClick={handleLeaderboardToggle}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            class="jjugeul__leaderboard-icon"
          >
            <path d="M4 20V10H8V20H4ZM10 20V4H14V20H10ZM16 20V13H20V20H16Z" />
          </svg>
        </button>
      </header>

      <strong class="jjugeul__counter">{jjugeulCount.value}</strong>

      {jjugeulLeaderboardOpen.value && (
        <aside class="jjugeul__leaderboard" aria-label="Leaderboards">
          <div class="jjugeul__leaderboard-head">
            <strong>BOARD</strong>
            <span>
              #{getCountryPosition(
                jjugeulCountryLeaderboard.value,
                jjugeulCountryCode.value,
              ) ?? "-"}
            </span>
          </div>

          <div class="jjugeul__leaderboard-columns">
            <section>
              <div class="jjugeul__leaderboard-meta">
                <span>COUNTRY</span>
                <span>{jjugeulCountryCode.value}</span>
              </div>

              <ol class="jjugeul__leaderboard-list">
                {jjugeulCountryLeaderboard.value.map((entry) => (
                  <li
                    key={entry.countryCode}
                    class={`jjugeul__leaderboard-item ${
                      entry.countryCode === jjugeulCountryCode.value
                        ? "jjugeul__leaderboard-item--current"
                        : ""
                    }`}
                  >
                    <span>{entry.countryCode}</span>
                    <span>{compactNumber.format(entry.total)}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <div class="jjugeul__leaderboard-meta">
                <span>STUDENT</span>
                <span>{currentStudent.name}</span>
              </div>

              <ol class="jjugeul__leaderboard-list">
                {jjugeulStudentLeaderboard.value.map((entry) => {
                  const student = getJjugeulStudent(entry.studentId)

                  return (
                    <li
                      key={entry.studentId}
                      class={`jjugeul__leaderboard-item ${
                        entry.studentId === jjugeulActiveStudentId.value
                          ? "jjugeul__leaderboard-item--current"
                          : ""
                      }`}
                    >
                      <span>{student.name}</span>
                      <span>{compactNumber.format(entry.total)}</span>
                    </li>
                  )
                })}
              </ol>
            </section>
          </div>
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
        onPointerLeave={handleRelease}
        onPointerCancel={handleRelease}
        onPointerUp={handleRelease}
        aria-label="JOOGLE"
        data-jjugeul-stage
        style={stageStyle}
      >
        <span class="jjugeul__spotlight" aria-hidden="true" />
        <span class="jjugeul__mascot-frame" role="img" aria-label="JOOGLE">
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
