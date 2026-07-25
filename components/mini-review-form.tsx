"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { submitMiniReview } from "@/app/actions/event-library"
import { Button } from "@/components/ui/button"
import { ROOT_CAUSES } from "@/lib/event-library-types"
import { cn } from "@/lib/utils"

// 五问极简复盘,单题分步,与 90% 检查/边界检查一致的交互
export function MiniReviewForm({ eventId }: { eventId: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [whatHappened, setWhatHappened] = useState("")
  const [whyNotDiscovered, setWhyNotDiscovered] = useState("")
  const [rootCause, setRootCause] = useState<string | null>(null)
  const [prevention, setPrevention] = useState("")
  const [systemRule, setSystemRule] = useState("")

  const totalSteps = 5

  function next() {
    setError(null)
    if (step === 0 && !whatHappened.trim()) {
      setError("请先写下发生了什么")
      return
    }
    if (step === 2 && !rootCause) {
      setError("请选择一个根因")
      return
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  function submit() {
    setError(null)
    if (!whatHappened.trim() || !rootCause) {
      setError("第 1 问和第 3 问是必答项")
      return
    }
    startTransition(async () => {
      const result = await submitMiniReview({
        eventId,
        whatHappened: whatHappened.trim(),
        whyNotDiscovered: whyNotDiscovered.trim() || null,
        rootCause,
        prevention: prevention.trim() || null,
        systemRule: systemRule.trim() || null,
      })
      if ("error" in result && result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const questions = [
    {
      q: "1. 发生了什么?*",
      hint: "只写事实,不写情绪。",
      body: (
        <textarea
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
          rows={3}
          placeholder="例如:训练结束后手机留在储物柜,走了 20 分钟才发现"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ),
    },
    {
      q: "2. 为什么没有立即发现?(选填)",
      hint: "当时注意力在哪里?",
      body: (
        <textarea
          value={whyNotDiscovered}
          onChange={(e) => setWhyNotDiscovered(e.target.value)}
          rows={3}
          placeholder="例如:着急赶车,注意力全在时间上"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ),
    },
    {
      q: "3. 真正的根因是什么?*",
      hint: "从分类中选择,这将用于模式聚合。",
      body: (
        <div className="flex flex-wrap gap-1.5">
          {ROOT_CAUSES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRootCause(r.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                rootCause === r.value
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:border-foreground/30"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      q: "4. 下次如何防止?(选填)",
      hint: "写具体动作,不写决心。",
      body: (
        <textarea
          value={prevention}
          onChange={(e) => setPrevention(e.target.value)}
          rows={3}
          placeholder="例如:离开储物柜前摸三样:手机、钱包、钥匙"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ),
    },
    {
      q: "5. 系统应该记住什么规则?(选填)",
      hint: "填写后会自动生成一条候选规则,并链接本案例。",
      body: (
        <textarea
          value={systemRule}
          onChange={(e) => setSystemRule(e.target.value)}
          rows={2}
          placeholder="例如:健身房离场前,检查手机/钱包/水杯再走"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ),
    },
  ]

  const current = questions[step]
  const isLast = step === totalSteps - 1

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      {/* 进度点 */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5" role="progressbar" aria-label="复盘进度" aria-valuenow={step + 1} aria-valuemax={totalSteps}>
          {questions.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-2 rounded-full",
                i < step ? "bg-foreground" : i === step ? "bg-foreground/50" : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {step + 1}/{totalSteps}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{current.q}</h3>
        <p className="text-xs text-muted-foreground">{current.hint}</p>
        {current.body}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
            上一问
          </Button>
        )}
        {isLast ? (
          <Button size="sm" onClick={submit} disabled={isPending}>
            {isPending ? "保存中…" : "完成复盘"}
          </Button>
        ) : (
          <Button size="sm" onClick={next}>
            下一问
          </Button>
        )}
      </div>
    </div>
  )
}
