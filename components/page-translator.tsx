"use client"

// 全站中英切换:纯前端 DOM 文本替换,不调用外部翻译接口。
// MutationObserver 会持续处理路由切换、弹窗和异步渲染产生的新界面文案。

import { useEffect, useRef, useState } from "react"
import { Languages } from "lucide-react"
import { lookupTranslation } from "@/lib/page-translation-dict"
import { cn } from "@/lib/utils"

const HAS_CHINESE = /[\u3400-\u9fff]/
const TRANSLATABLE_ATTRS = ["placeholder", "aria-label", "aria-description", "title", "alt"] as const

type Language = "zh" | "en"
type TouchedAttr = { el: Element; attr: string; original: string }

export function PageTranslator() {
  const [lang, setLang] = useState<Language>("zh")
  const touchedTexts = useRef(new Map<Text, string>())
  const touchedAttrs = useRef(new Map<string, TouchedAttr>())
  const elementIds = useRef(new WeakMap<Element, number>())
  const nextElementId = useRef(0)
  const observerRef = useRef<MutationObserver | null>(null)
  const headObserverRef = useRef<MutationObserver | null>(null)
  const originalTitleRef = useRef<string | null>(null)
  const [mobileTop, setMobileTop] = useState<number | null>(null)
  const dragRef = useRef({ pointerId: -1, startY: 0, startTop: 0, moved: false })

  function getAttrKey(el: Element, attr: string) {
    let id = elementIds.current.get(el)
    if (id === undefined) {
      id = nextElementId.current++
      elementIds.current.set(el, id)
    }
    return `${id}:${attr}`
  }

  function translateTextNode(node: Text) {
    if (node.parentElement?.closest("[data-no-translate]")) return
    const raw = node.nodeValue
    if (!raw || !HAS_CHINESE.test(raw)) return

    const trimmed = raw.trim()
    if (!trimmed) return
    const translated = lookupTranslation(trimmed)
    if (!translated || translated === trimmed) return

    // React 更新已翻译的动态节点时,同步保存最新中文原文,确保切回中文不回退旧数据。
    touchedTexts.current.set(node, raw)
    node.nodeValue = raw.replace(trimmed, translated)
  }

  function translateAttribute(el: Element, attr: string) {
    if (el.closest("[data-no-translate]")) return
    const value = el.getAttribute(attr)
    if (!value || !HAS_CHINESE.test(value)) return

    const translated = lookupTranslation(value.trim())
    if (!translated || translated === value) return

    const key = getAttrKey(el, attr)
    touchedAttrs.current.set(key, { el, attr, original: value })
    el.setAttribute(attr, translated)
  }

  function translateAttrs(root: Element | Document) {
    for (const attr of TRANSLATABLE_ATTRS) {
      if (root instanceof Element && root.hasAttribute(attr)) translateAttribute(root, attr)
      root.querySelectorAll(`[${CSS.escape(attr)}]`).forEach((el) => translateAttribute(el, attr))
    }
  }

  function walkAndTranslate(root: Node) {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root as Text)
      return
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let current = walker.nextNode()
    while (current) {
      translateTextNode(current as Text)
      current = walker.nextNode()
    }

    if (root instanceof Element || root instanceof Document) translateAttrs(root)
  }

  function translateDocumentTitle() {
    if (!HAS_CHINESE.test(document.title)) return
    originalTitleRef.current = document.title
    document.title = document.title
      .split(/(\s*[·|]\s*)/)
      .map((part) => lookupTranslation(part.trim()) ?? part)
      .join("")
  }

  function enable() {
    observerRef.current?.disconnect()
    headObserverRef.current?.disconnect()
    walkAndTranslate(document.body)
    translateDocumentTitle()
    document.documentElement.lang = "en"

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(mutation.target as Text)
        } else if (mutation.type === "attributes" && mutation.target instanceof Element) {
          if (mutation.attributeName) translateAttribute(mutation.target, mutation.attributeName)
        }
        for (const added of mutation.addedNodes) walkAndTranslate(added)
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRS],
      childList: true,
      subtree: true,
      characterData: true,
    })
    observerRef.current = observer

    const headObserver = new MutationObserver(() => translateDocumentTitle())
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true })
    headObserverRef.current = headObserver
  }

  function disable() {
    observerRef.current?.disconnect()
    headObserverRef.current?.disconnect()
    observerRef.current = null
    headObserverRef.current = null

    for (const [node, original] of touchedTexts.current) node.nodeValue = original
    for (const { el, attr, original } of touchedAttrs.current.values()) el.setAttribute(attr, original)

    touchedTexts.current.clear()
    touchedAttrs.current.clear()
    if (originalTitleRef.current) document.title = originalTitleRef.current
    originalTitleRef.current = null
    document.documentElement.lang = "zh-CN"
  }

  function setLanguage(next: Language) {
    if (next === "en") enable()
    else disable()
    setLang(next)
    try {
      localStorage.setItem("ui-lang", next)
    } catch {}
  }

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem("ui-lang")
    } catch {}
    if (saved === "en") {
      enable()
      // localStorage 仅在客户端挂载后可读。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang("en")
    }
    return () => {
      observerRef.current?.disconnect()
      headObserverRef.current?.disconnect()
    }
    // 该 effect 只负责首次恢复偏好;翻译函数通过长驻布局实例访问最新 DOM。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nextLanguage = lang === "zh" ? "en" : "zh"
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

  function handleDragStart(event: React.PointerEvent<HTMLButtonElement>) {
    const button = event.currentTarget
    const top = button.parentElement?.getBoundingClientRect().top ?? window.innerHeight * 0.42
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startTop: top, moved: false }
    button.setPointerCapture(event.pointerId)
  }

  function handleDragMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (drag.pointerId !== event.pointerId) return

    const delta = event.clientY - drag.startY
    if (Math.abs(delta) > 4) drag.moved = true
    if (!drag.moved) return

    const edgeGap = 8
    const buttonSize = 44
    setMobileTop(Math.min(Math.max(drag.startTop + delta, edgeGap), window.innerHeight - buttonSize - edgeGap))
  }

  function handleDragEnd(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragRef.current.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current.pointerId = -1
  }

  function handleMobileClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (dragRef.current.moved) {
      event.preventDefault()
      dragRef.current.moved = false
      return
    }
    setLanguage(nextLanguage)
  }

  return (
    <div data-no-translate>
      {/* 桌面与移动端均为单击切换；移动端放在页面侧边，避免遮挡首屏标题。 */}
      <div className="fixed right-6 top-6 z-50 hidden lg:block">
        <button
          type="button"
          onClick={() => setLanguage(nextLanguage)}
          aria-label={lang === "zh" ? "Switch interface to English" : "切换界面为中文"}
          aria-pressed={lang === "en"}
          className={cn(
            "flex min-h-10 items-center gap-2 rounded-md border border-border px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] shadow-card transition-colors",
            focusRing,
            lang === "en"
              ? "bg-primary text-primary-foreground"
              : "bg-card/95 text-foreground hover:bg-accent",
          )}
        >
          <Languages className="size-4" aria-hidden="true" />
          <span>{lang === "zh" ? "English" : "中文"}</span>
        </button>
      </div>

      <div
        className={cn("fixed right-0 z-50 lg:hidden", mobileTop === null && "top-[42%]")}
        style={mobileTop === null ? undefined : { top: mobileTop }}
      >
        <button
          type="button"
          onClick={handleMobileClick}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          aria-label={lang === "zh" ? "Switch interface to English；上下拖动可移动" : "切换界面为中文；上下拖动可移动"}
          aria-pressed={lang === "en"}
          className={cn(
            "flex size-11 touch-none cursor-grab items-center justify-center rounded-l-lg border border-r-0 border-border shadow-card transition-colors active:cursor-grabbing",
            focusRing,
            lang === "en"
              ? "bg-primary text-primary-foreground"
              : "bg-card/95 text-foreground hover:bg-accent",
          )}
        >
          <Languages className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
