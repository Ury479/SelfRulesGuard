import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, Check, Circle, FileText, Pencil, RotateCw, Zap } from "lucide-react"
import { getRule } from "@/app/actions/rules"

export const dynamic = "force-dynamic"

export default async function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ruleId = Number(id)
  if (!Number.isInteger(ruleId)) notFound()
  const rule = await getRule(ruleId)
  if (!rule) notFound()

  const date = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "medium", hour12: false }).format(new Date(rule.createdAt))
  const evidence = [
    { title: rule.helpfulCount > 0 ? "想起 · 遵守 · 结果改善" : "等待第一次验证", detail: rule.principleText ?? "记录一次遵守规则后的真实结果。", good: true },
    { title: rule.matchCount > rule.actedCount ? "未想起 · 未遵守" : "持续观察中", detail: rule.scenario ?? "规则将在匹配场景出现时提醒你。", good: false },
  ]

  return <div className="-mx-4 min-h-[calc(100dvh-5rem)] md:-mx-8 md:grid md:grid-cols-[1fr_18rem]">
    <main className="px-5 py-6 md:px-12 md:py-8">
      <header className="flex items-center justify-between gap-4">
        <Link href="/rules" className="inline-flex items-center gap-2 text-sm"><ArrowLeft className="size-5" />规则详情</Link>
        <button type="button" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Pencil className="size-4" />编辑</button>
      </header>

      <section className="mx-auto mt-12 max-w-3xl">
        <div className="grid gap-7 md:grid-cols-[9rem_1fr]">
          <div className="flex size-36 items-center justify-center rounded-md border-2 border-success text-success" aria-hidden="true"><RotateCw className="size-16" /></div>
          <div className="flex flex-col gap-6">
            <p className="flex items-center gap-3 text-sm font-semibold text-success"><Circle className="size-3 fill-current" />{rule.isActive ? "已启用 · 待观察" : "已暂停 · 待调整"}</p>
            <h1 className="font-serif text-3xl leading-relaxed tracking-wide text-balance md:text-4xl">{rule.ruleText}</h1>
            <Link href={`/rules/${rule.id}/confirm`} className="inline-flex min-h-12 w-fit items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground">记录一次验证</Link>
          </div>
        </div>

        <section className="mt-12 border-t border-border pt-6" aria-labelledby="evidence-title">
          <h2 id="evidence-title" className="font-serif text-xl">证据轨迹</h2>
          <ol className="mt-5 flex flex-col gap-5 border-l border-success pl-8">
            {evidence.map((item, index) => <li key={item.title} className={`relative rounded-lg border border-border bg-card p-5 ${item.good ? "border-l-4 border-l-success" : "border-l-4 border-l-warning"}`}>
              <span className={`absolute -left-[2.65rem] top-5 size-4 rounded-full border-2 bg-background ${item.good ? "border-success" : "border-warning"}`} />
              <h3 className={`font-semibold ${item.good ? "text-success" : "text-warning"}`}>{item.title}</h3>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{index === 0 ? date : "循环持续中"}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
            </li>)}
          </ol>
        </section>
      </section>
    </main>

    <aside className="border-l border-border bg-card/40 px-7 py-10">
      <InfoBlock title="状态"><p className="flex items-center gap-3 font-semibold text-success"><Circle className="size-3 fill-current" />{rule.isActive ? "已启用 · 待观察" : "已暂停"}</p><p className="mt-4 font-mono text-xs text-muted-foreground">自 {date} 启用</p></InfoBlock>
      <InfoBlock title="来源"><p className="flex items-start gap-3 text-sm"><CalendarDays className="mt-0.5 size-5" /><span>复盘<br/><span className="font-mono text-xs text-muted-foreground">{date}</span></span></p><p className="mt-5 flex items-start gap-3 text-sm"><FileText className="mt-0.5 size-5" /><span>{rule.principleText ?? "由真实事件沉淀出的行动规则"}</span></p></InfoBlock>
      <InfoBlock title="循环"><Legend icon={<Zap className="size-5" />} title="触发" text="与规则相关的情境出现。"/><Legend icon={<Circle className="size-5" />} title="想起" text="在触发时刻意识到规则。"/><Legend icon={<Check className="size-5" />} title="遵守" text="采取规则建议的行动。"/></InfoBlock>
    </aside>
  </div>
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-b border-border py-7 first:pt-0"><h2 className="mb-5 font-serif text-lg">{title}</h2>{children}</section> }
function Legend({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="mb-5 flex gap-3 text-success"><span>{icon}</span><p className="text-sm font-semibold">{title}<span className="mt-1 block font-normal leading-relaxed text-muted-foreground">{text}</span></p></div> }
