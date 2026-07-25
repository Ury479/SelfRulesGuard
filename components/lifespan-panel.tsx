"use client"

import { useState, useTransition } from "react"
import { saveBirthDate, recordTodayQuality, type LifespanSummary } from "@/app/actions/lifespan"
import { useRouter } from "next/navigation"

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function LifespanPanel({ initial }: { initial: LifespanSummary }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [birthInput, setBirthInput] = useState("")
  const [score, setScore] = useState(initial.todayScore ?? 60)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── 未配置生日:内联引导 ──
  if (!initial.configured) {
    return (
      <section aria-labelledby="setup-title" className="rounded-lg border border-border bg-card p-6 shadow-card">
        <h2 id="setup-title" className="font-serif text-xl">
          先设置你的出生日期
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          倒计时基于出生日期与 80 岁基准计算。仅存储在你自己的数据库中。
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            startTransition(async () => {
              const res = await saveBirthDate(birthInput)
              if (!res.ok) setError(res.error ?? "保存失败")
              else router.refresh()
            })
          }}
        >
          <label className="sr-only" htmlFor="birth-date">
            出生日期
          </label>
          <input
            id="birth-date"
            type="date"
            required
            value={birthInput}
            onChange={(e) => setBirthInput(e.target.value)}
            className="min-h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button
            type="submit"
            disabled={isPending || !birthInput}
            className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "保存中…" : "开始倒计时"}
          </button>
        </form>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>
    )
  }

  const percent = initial.percentUsed

  return (
    <div className="flex flex-col gap-6">
      {/* 大字数据 */}
      <section aria-labelledby="countdown-title" className="border-b border-border pb-6">
        <h2 id="countdown-title" className="sr-only">
          倒计时数据
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">剩余天数</p>
            <p className="font-serif text-6xl font-medium tracking-tight tabular-nums">
              {initial.daysRemaining.toLocaleString()}
            </p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">已用天数</p>
              <p className="font-serif text-2xl tabular-nums">{initial.daysUsed.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">已消费</p>
              <p className="font-serif text-2xl tabular-nums">{percent}%</p>
            </div>
          </div>
        </div>
        <div className="mt-5" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="人生进度">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>

      {/* 有效寿命 */}
      <section aria-labelledby="effective-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 id="effective-title" className="font-serif text-lg">
          有效寿命
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">流逝无法阻止,但质量可以累积。</p>
        <dl className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">昨日</dt>
            <dd className="mt-1 font-serif text-xl tabular-nums text-primary">+{initial.yesterdayGain}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">连续天数</dt>
            <dd className="mt-1 font-serif text-xl tabular-nums">{initial.streakDays}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">累计</dt>
            <dd className="mt-1 font-serif text-xl tabular-nums">{initial.effectiveDaysTotal} 天</dd>
          </div>
        </dl>
      </section>

      {/* 今日打分 */}
      <section aria-labelledby="score-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 id="score-title" className="font-serif text-lg">
          今日质量分
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          为今天的专注与产出打分(0-100)。满分记 +0.5 天有效寿命。
        </p>
        <div className="mt-4 flex items-center gap-4">
          <label className="sr-only" htmlFor="quality-score">
            今日质量分
          </label>
          <input
            id="quality-score"
            type="range"
            min={0}
            max={100}
            step={5}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="w-12 text-right font-serif text-2xl tabular-nums">{score}</span>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setFeedback(null)
            setError(null)
            startTransition(async () => {
              const res = await recordTodayQuality(score, localToday())
              if (!res.ok) setError(res.error ?? "保存失败")
              else {
                setFeedback(`已记录。你今天让未来多了 ${res.gain?.toFixed(2)} 天。`)
                router.refresh()
              }
            })
          }}
          className="mt-4 min-h-11 w-full rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "记录中…" : initial.todayScore !== null ? "更新今日打分" : "记录今日打分"}
        </button>
        {feedback ? (
          <p role="status" className="mt-3 text-sm text-primary">
            {feedback}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  )
}
