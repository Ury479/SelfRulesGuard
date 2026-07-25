"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { BookOpen, Network, Bot, Moon, ExternalLink } from "lucide-react"
import { externalNavigator, type SupplyTarget } from "@/lib/navigate"
import { upsertRhythmLog } from "@/app/actions/rhythm"
import type { LifespanSummary } from "@/app/actions/lifespan"

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function nowHHmm(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const CHECKLIST = [
  { key: "phone", label: "手机放到充电位,离开床头" },
  { key: "laptop", label: "合上电脑,今天到此为止" },
  { key: "light", label: "调暗灯光,给大脑降噪" },
] as const

export function NightRitualPanel({
  summary,
  reviewSentence,
  principle,
}: {
  summary: LifespanSummary
  modelTreeUrl: string | null
  reviewSentence: string | null
  principle: { ruleText: string; principleText: string | null } | null
}) {
  const [isPending, startTransition] = useTransition()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState("")
  const [sleepRecorded, setSleepRecorded] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)

  // 打点:夜间模式已使用
  useEffect(() => {
    upsertRhythmLog({ date: localToday(), nightModeUsed: true })
  }, [])

  const supplies: { target: SupplyTarget; title: string; desc: string; icon: typeof BookOpen }[] = [
    { target: "weread", title: "微信读书", desc: "睡前读几页,替代刷手机", icon: BookOpen },
    { target: "model-tree", title: "模型树", desc: "回顾今天的知识节点", icon: Network },
    { target: "zcode", title: "zCode Agent", desc: "给明天的自己留一个任务", icon: Bot },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* 情感锚点 */}
      <section aria-labelledby="anchor-title" className="border-b border-border pb-6">
        <h2 id="anchor-title" className="sr-only">
          情感锚点
        </h2>
        {summary.configured ? (
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">剩余天数</p>
            <p className="font-serif text-5xl font-medium tracking-tight tabular-nums">
              {summary.daysRemaining.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.todayScore !== null
                ? `今天为未来增加了 +${((summary.todayScore / 100) * 0.5).toFixed(2)} 天有效寿命`
                : "今天还没有打分,睡前可以去打一分"}
              {" · "}
              <Link href="/lifespan" className="underline underline-offset-4 transition-colors hover:text-primary">
                查看寿命
              </Link>
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            尚未设置出生日期,
            <Link href="/lifespan" className="underline underline-offset-4 transition-colors hover:text-primary">
              去开启寿命倒计时
            </Link>
          </p>
        )}
        {reviewSentence ? (
          <blockquote className="mt-4 border-l-2 border-primary pl-4 font-serif text-base leading-relaxed text-pretty">
            {reviewSentence}
          </blockquote>
        ) : null}
        {principle ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <span className="font-mono text-xs uppercase tracking-[0.14em]">原则</span> · {principle.ruleText}
          </p>
        ) : null}
      </section>

      {/* 三选一供给渠道 */}
      <section aria-labelledby="supply-title">
        <h2 id="supply-title" className="font-serif text-lg">
          今晚的供给,三选一
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">与其被动消耗,不如主动选择一种输入。</p>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {supplies.map(({ target, title, desc, icon: Icon }) => {
            const url = externalNavigator.urlOf(target)
            const content = (
              <>
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {title}
                  <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {url ? desc : "尚未配置链接,点击查看说明"}
                </span>
              </>
            )

            return (
              <li key={target}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      // 交给门面统一处理 iframe 环境与弹窗拦截
                      e.preventDefault()
                      externalNavigator.open(target)
                    }}
                    className="group flex min-h-11 w-full flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary"
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNotConfigured(true)}
                    className="group flex min-h-11 w-full flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary"
                  >
                    {content}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {notConfigured ? (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            zCode Agent 尚未配置可访问的官网链接。
          </p>
        ) : null}
      </section>

      {/* 就寝清单 */}
      <section aria-labelledby="checklist-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 id="checklist-title" className="font-serif text-lg">
          就寝检查
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {CHECKLIST.map((item) => (
            <li key={item.key}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 transition-colors hover:bg-muted/60">
                <input
                  type="checkbox"
                  checked={!!checked[item.key]}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                  className="size-4 accent-primary"
                />
                <span className={`text-sm leading-relaxed ${checked[item.key] ? "text-muted-foreground line-through" : ""}`}>
                  {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <label htmlFor="night-note" className="mt-4 block text-sm font-medium">
          睡前一句话(可选)
        </label>
        <textarea
          id="night-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="今天最值得记住的一件事…"
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed"
        />
        <button
          type="button"
          disabled={isPending || !!sleepRecorded}
          onClick={() => {
            const time = nowHHmm()
            startTransition(async () => {
              const res = await upsertRhythmLog({
                date: localToday(),
                sleepTime: time,
                nightModeUsed: true,
                ...(note.trim() ? { note: note.trim() } : {}),
              })
              if (res.ok) setSleepRecorded(time)
            })
          }}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Moon className="size-4" aria-hidden="true" />
          {sleepRecorded ? `已记录入睡 ${sleepRecorded}` : isPending ? "记录中…" : "记录入睡时间,晚安"}
        </button>
      </section>
    </div>
  )
}
