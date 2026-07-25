"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Sunrise, ArrowRight } from "lucide-react"
import { upsertRhythmLog } from "@/app/actions/rhythm"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { RhythmTrendChart } from "@/components/rhythm-trend-chart"

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function nowHHmm(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export type TrendPoint = {
  date: string
  sleepTime: string | null
  wakeTime: string | null
  fatigueLevel: number | null
}

export function MorningRoutinePanel({
  snapshot,
  trend,
  principle,
  firstTask,
}: {
  snapshot: {
    sleepTime: string | null
    wakeTime: string | null
    sleepHours: number | null
    recentWin: string | null
    reviewSentence: string | null
  }
  trend: TrendPoint[]
  principle: { ruleText: string; principleText: string | null } | null
  firstTask: { id: number; title: string; priority: string; progress: number } | null
}) {
  const [isPending, startTransition] = useTransition()
  const [wakeRecorded, setWakeRecorded] = useState<string | null>(null)
  const [fatigue, setFatigue] = useState(5)
  const [fatigueSaved, setFatigueSaved] = useState(false)

  // 打点:晨间模式已使用
  useEffect(() => {
    upsertRhythmLog({ date: localToday(), morningModeUsed: true })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* 今日第一任务 + 番茄钟 */}
      <section aria-labelledby="first-task-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 id="first-task-title" className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          今日第一任务
        </h2>
        {firstTask ? (
          <div className="mt-2">
            <p className="font-serif text-xl leading-relaxed text-pretty">
              <span className="mr-2 inline-block rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                {firstTask.priority}
              </span>
              {firstTask.title}
            </p>
            <Link
              href="/tasks"
              className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              查看任务树
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            没有待办的 P0/P1 任务。
            <Link href="/tasks" className="underline underline-offset-4 transition-colors hover:text-primary">
              去任务树添加一条
            </Link>
          </p>
        )}
        <div className="mt-6">
          <PomodoroTimer taskTitle={firstTask?.title} />
        </div>
      </section>

      {/* 昨日快照 */}
      <section aria-labelledby="snapshot-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 id="snapshot-title" className="font-serif text-lg">
          昨日快照
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">入睡</dt>
            <dd className="mt-1 font-serif text-xl tabular-nums">{snapshot.sleepTime ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">起床</dt>
            <dd className="mt-1 font-serif text-xl tabular-nums">{wakeRecorded ?? snapshot.wakeTime ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">时长</dt>
            <dd className="mt-1 font-serif text-xl tabular-nums">
              {snapshot.sleepHours !== null ? `${snapshot.sleepHours} 小时` : "—"}
            </dd>
          </div>
        </dl>
        {snapshot.recentWin ? (
          <p className="mt-4 text-sm leading-relaxed">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">昨日小胜利</span>
            <br />
            {snapshot.recentWin}
          </p>
        ) : null}
        <button
          type="button"
          disabled={isPending || !!wakeRecorded}
          onClick={() => {
            const time = nowHHmm()
            startTransition(async () => {
              const res = await upsertRhythmLog({ date: localToday(), wakeTime: time, morningModeUsed: true })
              if (res.ok) setWakeRecorded(time)
            })
          }}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-primary px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          <Sunrise className="size-4" aria-hidden="true" />
          {wakeRecorded ? `已记录起床 ${wakeRecorded}` : isPending ? "记录中…" : "记录起床时间"}
        </button>
      </section>

      {/* 原则提醒 */}
      {principle ? (
        <section aria-labelledby="principle-title" className="border-l-2 border-primary py-1 pl-4">
          <h2 id="principle-title" className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            今日原则
          </h2>
          <p className="mt-1 font-serif text-base leading-relaxed text-pretty">{principle.ruleText}</p>
          {principle.principleText ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{principle.principleText}</p>
          ) : null}
        </section>
      ) : null}

      {/* 节律趋势 + 疲劳打分 */}
      <section aria-labelledby="trend-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 id="trend-title" className="font-serif text-lg">
          近 7 天节律
        </h2>
        <div className="mt-3">
          <RhythmTrendChart data={trend} />
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <label htmlFor="fatigue" className="text-sm font-medium">
            当前疲劳度(1 精力充沛 – 10 极度疲惫)
          </label>
          <div className="mt-2 flex items-center gap-4">
            <input
              id="fatigue"
              type="range"
              min={1}
              max={10}
              value={fatigue}
              onChange={(e) => {
                setFatigue(Number(e.target.value))
                setFatigueSaved(false)
              }}
              className="flex-1 accent-primary"
            />
            <span className="w-8 text-right font-serif text-xl tabular-nums">{fatigue}</span>
            <button
              type="button"
              disabled={isPending || fatigueSaved}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertRhythmLog({ date: localToday(), fatigueLevel: fatigue })
                  if (res.ok) setFatigueSaved(true)
                })
              }
              className="min-h-11 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {fatigueSaved ? "已保存" : "保存"}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
