import type { Metadata } from "next"
import { getLifespanSummary, getEntropyConfig } from "@/app/actions/lifespan"
import { getYesterdaySnapshot } from "@/app/actions/rhythm"
import { getPrincipleReminder } from "@/app/actions/entropy-principles"
import { NightRitualPanel } from "@/components/night-ritual-panel"

export const metadata: Metadata = { title: "夜间仪式" }

export default async function NightRitualPage() {
  const [summary, config, snapshot, principle] = await Promise.all([
    getLifespanSummary(),
    getEntropyConfig(),
    getYesterdaySnapshot(),
    getPrincipleReminder("night"),
  ])

  return (
    <main className="mx-auto w-full max-w-[42rem] px-6 py-8">
      <header className="border-b border-foreground/20 pb-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Entropy · Night</p>
        <h1 className="font-serif text-3xl tracking-[0.02em] text-balance">夜间仪式</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          一天的最后一小时,决定明天的第一小时。选择一个供给渠道,然后安心睡去。
        </p>
      </header>
      <div className="mt-6">
        <NightRitualPanel
          summary={summary}
          modelTreeUrl={config.modelTreeUrl}
          reviewSentence={snapshot.reviewSentence}
          principle={principle ? { ruleText: principle.ruleText, principleText: principle.principleText } : null}
        />
      </div>
    </main>
  )
}
