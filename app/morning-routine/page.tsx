import type { Metadata } from "next"
import { getYesterdaySnapshot, getRhythmTrend } from "@/app/actions/rhythm"
import { getPrincipleReminder, getTodayFirstTask } from "@/app/actions/entropy-principles"
import { MorningRoutinePanel } from "@/components/morning-routine-panel"

export const metadata: Metadata = { title: "晨间启动" }

export default async function MorningRoutinePage() {
  const [snapshot, trend, principle, firstTask] = await Promise.all([
    getYesterdaySnapshot(),
    getRhythmTrend(7),
    getPrincipleReminder("morning"),
    getTodayFirstTask(),
  ])

  return (
    <main className="mx-auto w-full max-w-[42rem] px-6 py-8">
      <header className="border-b border-foreground/20 pb-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Entropy · Morning</p>
        <h1 className="font-serif text-3xl tracking-[0.02em] text-balance">晨间启动</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          不做选择,直接行动。今天的第一个 25 分钟,从这里开始。
        </p>
      </header>
      <div className="mt-6">
        <MorningRoutinePanel
          snapshot={{
            sleepTime: snapshot.sleepTime,
            wakeTime: snapshot.wakeTime,
            sleepHours: snapshot.sleepHours,
            recentWin: snapshot.recentWin,
            reviewSentence: snapshot.reviewSentence,
          }}
          trend={trend.map((t) => ({
            date: t.date,
            sleepTime: t.sleepTime,
            wakeTime: t.wakeTime,
            fatigueLevel: t.fatigueLevel,
          }))}
          principle={principle ? { ruleText: principle.ruleText, principleText: principle.principleText } : null}
          firstTask={firstTask}
        />
      </div>
    </main>
  )
}
