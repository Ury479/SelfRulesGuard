import type { Metadata } from "next"
import { getLifespanSummary } from "@/app/actions/lifespan"
import { LifespanPanel } from "@/components/lifespan-panel"
import { LifeWeeksHeatmap } from "@/components/life-weeks-heatmap"

export const metadata: Metadata = { title: "寿命倒计时" }

export default async function LifespanPage() {
  const summary = await getLifespanSummary()

  return (
    <main className="mx-auto w-full max-w-[42rem] px-6 py-8">
      <header className="border-b border-foreground/20 pb-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Entropy · Lifespan</p>
        <h1 className="font-serif text-3xl tracking-[0.02em] text-balance">寿命倒计时</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          以 80 岁为基准。时间只会流逝,但高质量的一天,会为未来增加有效寿命。
        </p>
      </header>
      <div className="mt-6 flex flex-col gap-6">
        <LifespanPanel initial={summary} />
        {summary.configured ? <LifeWeeksHeatmap daysUsed={summary.daysUsed} /> : null}
      </div>
    </main>
  )
}
