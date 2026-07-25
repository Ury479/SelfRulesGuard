"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createEventCase } from "@/app/actions/event-library"
import { Button } from "@/components/ui/button"
import { EVENT_TYPES, EVENT_SCENES, EVENT_STATUSES } from "@/lib/event-library-types"
import { cn } from "@/lib/utils"

const DRAFT_KEY = "event-quick-record-draft"

type Draft = {
  title: string
  eventType: string
  scene: string
  status: string
  itemName: string
  moneyLoss: string
  searchMinutes: string
  tags: string
}

const EMPTY: Draft = {
  title: "",
  eventType: "lost_item",
  scene: "transportation",
  status: "searching",
  itemName: "",
  moneyLoss: "",
  searchMinutes: "",
  tags: "",
}

export function EventQuickRecordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [restored, setRestored] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 挂载时恢复草稿。localStorage 仅客户端可读,不能放进 useState 初始化
  // (会造成 SSR 水合不一致),只能在挂载后一次性 setState,该渲染发生在绘制前。
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Draft
        if (parsed.title || parsed.itemName) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDraft({ ...EMPTY, ...parsed })
          setRestored(true)
        }
      }
    } catch {}
  }, [])

  function update(patch: Partial<Draft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
          setSaved(true)
        } catch {}
      }, 400)
      return next
    })
  }

  function clearDraft() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
  }

  function handleSubmit() {
    setError(null)
    if (!draft.title.trim()) {
      setError("标题不能为空")
      return
    }
    startTransition(async () => {
      const result = await createEventCase({
        title: draft.title.trim(),
        eventType: draft.eventType,
        scene: draft.scene,
        status: draft.status,
        itemName: draft.itemName.trim() || null,
        moneyLoss: Number.parseInt(draft.moneyLoss, 10) || 0,
        searchMinutes: Number.parseInt(draft.searchMinutes, 10) || 0,
        tags: draft.tags.trim() || null,
      })
      if ("error" in result && result.error) {
        setError(result.error)
        return
      }
      clearDraft()
      if ("eventCase" in result && result.eventCase) {
        router.push(`/event-library/${result.eventCase.id}`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {restored && (
        <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
          已恢复上次未提交的草稿,内容不会丢失。
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ev-title" className="text-sm font-medium">
          发生了什么?*
        </label>
        <input
          id="ev-title"
          type="text"
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="例如:手机落在健身房储物柜"
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">事件类型*</legend>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ eventType: t.value })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                draft.eventType === t.value
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:border-foreground/30"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">场景*</legend>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_SCENES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => update({ scene: s.value })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                draft.scene === s.value
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:border-foreground/30"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">当前状态*</legend>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => update({ status: s.value })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                draft.status === s.value
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:border-foreground/30"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => setShowOptional((v) => !v)}
        className="self-start text-xs text-muted-foreground underline underline-offset-2"
      >
        {showOptional ? "收起选填项" : "展开选填项(物品/损失/耗时/标签)"}
      </button>

      {showOptional && (
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ev-item" className="text-sm font-medium">
              涉及物品
            </label>
            <input
              id="ev-item"
              type="text"
              value={draft.itemName}
              onChange={(e) => update({ itemName: e.target.value })}
              placeholder="例如:手机"
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ev-loss" className="text-sm font-medium">
                金钱损失(元)
              </label>
              <input
                id="ev-loss"
                type="number"
                min={0}
                value={draft.moneyLoss}
                onChange={(e) => update({ moneyLoss: e.target.value })}
                placeholder="0"
                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ev-minutes" className="text-sm font-medium">
                寻找耗时(分钟)
              </label>
              <input
                id="ev-minutes"
                type="number"
                min={0}
                value={draft.searchMinutes}
                onChange={(e) => update({ searchMinutes: e.target.value })}
                placeholder="0"
                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ev-tags" className="text-sm font-medium">
              标签(逗号分隔)
            </label>
            <input
              id="ev-tags"
              type="text"
              value={draft.tags}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder="例如:健身房,手机"
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "保存中…" : "记录事件"}
        </Button>
        {saved && <span className="text-xs text-muted-foreground">草稿已自动保存</span>}
      </div>
    </div>
  )
}
