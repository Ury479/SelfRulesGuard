import Link from "next/link"
import { Suspense } from "react"
import { ArrowRight, Check, Circle, Diamond, Square } from "lucide-react"
import { getConfirmations } from "@/app/actions/confirmations"
import { getRules } from "@/app/actions/rules"
import { DayPhaseGate } from "@/components/day-phase-gate"

export const dynamic = "force-dynamic"

function formatDate(value: Date | string | null) {
  if (!value) return "时间待定"
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value))
}

export default async function DashboardPage() {
  const [confirmations, rules] = await Promise.all([getConfirmations(), getRules()])
  const active = confirmations.find((item) => ["pending", "armed", "checking"].includes(item.status))
  const recent = confirmations.slice(0, 3)
  const activeRules = rules.filter((rule) => rule.isActive)
  const completed = confirmations.filter((item) => item.status === "confirmed").length

  return (
    <main className="mx-auto w-full max-w-[46rem] px-6 pb-5 pt-1 lg:py-14">
      <Suspense fallback={null}>
        <DayPhaseGate />
      </Suspense>
      <section aria-labelledby="today-title" className="border-y border-foreground/20 py-6 md:py-8">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">RuleLoop · Today&apos;s Note</p>
        <h1 id="today-title" className="font-serif text-[3.25rem] font-medium leading-[1.18] tracking-[0.035em] text-balance">现在值得做的事</h1>
        <div className="mt-6 border-l-2 border-primary pl-5">
          <h2 className="font-serif text-[2.05rem] leading-[1.4] tracking-[0.025em] text-balance">{active?.title ?? "完成“文件误提交”的复盘"}</h2>
          <p className="mt-2 text-lg text-muted-foreground">因为： <span className="font-medium text-warning-foreground">高影响</span></p>
        </div>
        <Link href={active ? `/critical-confirmations/${active.id}` : "/spending-review"} className="mt-6 flex min-h-14 items-center justify-between rounded-md bg-primary px-5 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <span>继续复盘</span><ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </section>

      <section aria-label="当前进度" className="mx-auto mt-8 w-[88%]">
        <ol>
          <TimelineItem shape="circle" title="事件" detail={active?.title ?? "文件误提交"} meta={formatDate(active?.createdAt ?? new Date("2025-05-12T10:43:00"))} tone="primary" />
          <TimelineItem shape="diamond" title="复盘中" detail="归因与影响分析" meta="进行中  2/6" tone="warning" />
          <TimelineItem shape="square" title="规则" detail="待生成可执行规则" meta={`${activeRules.length} 条`} tone="success" />
          <TimelineItem shape="check" title="证据" detail="待收集支持证据" meta={`${completed} 条`} tone="success" last />
        </ol>
      </section>

      <section aria-labelledby="recent-title" className="mt-2 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <h2 id="recent-title" className="text-xl font-medium">最近轨迹</h2>
          <span className="text-base text-muted-foreground">本周期</span>
        </div>
        <ul className="mt-3">
          {(recent.length ? recent : [
            { id: -1, title: "文件误提交", status: "pending", createdAt: new Date("2025-05-12T10:43:00") },
            { id: -2, title: "需求范围变更", status: "reviewed", createdAt: new Date("2025-05-07T16:28:00") },
            { id: -3, title: "线上配置误改", status: "confirmed", createdAt: new Date("2025-05-03T09:11:00") },
          ]).map((item, index) => (
            <li key={item.id} className="border-b border-border">
              <Link href={item.id > 0 ? `/critical-confirmations/${item.id}` : "/spending-review"} className="flex min-h-16 items-center gap-4">
                <TrackMark index={index} />
                <span className="min-w-0 flex-1 truncate text-lg">{item.title}</span>
                <span className="hidden text-sm text-muted-foreground sm:block">{index === 0 ? "事件已记录" : index === 1 ? "复盘已完成 · 规则已生成" : "证据已收集 3/3"}</span>
                <time className="font-mono text-sm text-muted-foreground">{formatDate(item.createdAt)}</time>
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="本周期摘要" className="mt-5 rounded-xl border border-border border-l-[6px] border-l-success px-5 py-4">
        <div className="flex items-baseline gap-2"><h2 className="text-xl font-medium">本周期</h2><span className="text-sm text-muted-foreground">05-01 — 05-14</span></div>
        <dl className="mt-4 grid grid-cols-4 divide-x divide-border">
          <Stat label="事件" value={confirmations.length || 3} /><Stat label="复盘完成" value={completed || 2} /><Stat label="规则新增" value={activeRules.length || 1} /><Stat label="证据收集" value={completed || 3} />
        </dl>
      </section>
    </main>
  )
}

function TimelineItem({ shape, title, detail, meta, tone, last = false }: { shape: "circle" | "diamond" | "square" | "check"; title: string; detail: string; meta: string; tone: "primary" | "warning" | "success"; last?: boolean }) {
  const Icon = shape === "circle" ? Circle : shape === "diamond" ? Diamond : shape === "square" ? Square : Check
  const color = tone === "primary" ? "border-primary text-primary" : tone === "warning" ? "border-warning text-warning" : "border-success text-success"
  return <li className="flex min-h-[7.2rem] gap-6"><div className="flex w-12 flex-col items-center"><span className={`flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-background ${color}`}><Icon className="size-6" aria-hidden="true" /></span>{!last ? <span className="h-full border-l-2 border-dashed border-current opacity-70" aria-hidden="true" /> : null}</div><div className="pt-0.5"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-1 text-lg">{detail}</p><p className="mt-1 font-mono text-base text-muted-foreground">{meta}</p></div></li>
}

function TrackMark({ index }: { index: number }) { return index === 0 ? <Circle className="size-6 text-primary" /> : index === 1 ? <Diamond className="size-6 text-warning" /> : <Square className="size-6 text-success" /> }
function Stat({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-center gap-2 px-1"><dt className="text-sm">{label}</dt><dd className="font-mono text-lg font-semibold">{value}</dd></div> }
