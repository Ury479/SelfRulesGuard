"use client"

import { useState } from "react"
import Link from "next/link"
import { setRuleActive, deleteRule } from "@/app/actions/rules"
import { DOMAIN_LABELS, STATE_LABELS, type Domain, type StateWhenError } from "@/lib/types"
import { WEAKNESS_LABELS, type WeaknessKey } from "@/lib/weakness"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

type Rule = {
  id: number
  domain: string
  scenario: string | null
  ruleText: string
  principleText: string | null
  isActive: boolean
  weaknessKey?: string | null
  hitCount?: number
  status?: string
  severity?: string
  currentVersion?: number
  matchCount?: number
  actedCount?: number
  validatedCount?: number
  helpfulCount?: number
  createdAt: Date
}

const ALL = "all"

type Review = {
  id: number
  mistakeType: string
  loss: string | null
  stateWhenError: string | null
  costLevel: string
  createdAt: Date
}

export function RulesList({ rules, reviews }: { rules: Rule[]; reviews: Review[] }) {
  const [tab, setTab] = useState<"rules" | "reviews">("rules")
  const [weaknessFilter, setWeaknessFilter] = useState<string>(ALL)

  const usedWeaknessKeys = Array.from(
    new Set(
      rules
        .map((r) => r.weaknessKey)
        .filter((k): k is string => Boolean(k && k in WEAKNESS_LABELS))
    )
  )

  const filteredRules =
    weaknessFilter === ALL
      ? rules
      : rules.filter((r) => r.weaknessKey === weaknessFilter)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Button
          variant={tab === "rules" ? "default" : "outline"}
          size="sm"
          className={tab === "rules" ? "" : "bg-transparent"}
          onClick={() => setTab("rules")}
        >
          拦截规则 ({rules.length})
        </Button>
        <Button
          variant={tab === "reviews" ? "default" : "outline"}
          size="sm"
          className={tab === "reviews" ? "" : "bg-transparent"}
          onClick={() => setTab("reviews")}
        >
          复盘记录 ({reviews.length})
        </Button>
      </div>

      {tab === "rules" && usedWeaknessKeys.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="按短板筛选">
          <Button
            variant={weaknessFilter === ALL ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setWeaknessFilter(ALL)}
          >
            全部短板
          </Button>
          {usedWeaknessKeys.map((k) => (
            <Button
              key={k}
              variant={weaknessFilter === k ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setWeaknessFilter(k)}
            >
              {WEAKNESS_LABELS[k as WeaknessKey]}
            </Button>
          ))}
        </div>
      ) : null}

      {tab === "rules" ? (
        filteredRules.length === 0 && rules.length > 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                这个短板下还没有规则。
              </p>
            </CardContent>
          </Card>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                还没有拦截规则。规则来自错误复盘,也可以在复盘后自动生成。
              </p>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                nativeButton={false}
                render={<Link href="/reviews/new" />}
              >
                去做一次复盘
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {filteredRules.map((rule) => (
              <li key={rule.id}>
                <RuleCard rule={rule} />
              </li>
            ))}
          </ul>
        )
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">还没有复盘记录。</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <Card>
                <CardContent className="flex flex-col gap-2 py-4">
                  <p className="text-sm font-medium leading-relaxed">
                    {review.mistakeType}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {review.loss ? <span>损失:{review.loss}</span> : null}
                    {review.stateWhenError ? (
                      <span>
                        状态:
                        {STATE_LABELS[review.stateWhenError as StateWhenError] ??
                          review.stateWhenError}
                      </span>
                    ) : null}
                    <span>
                      {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RuleCard({ rule }: { rule: Rule }) {
  const [active, setActive] = useState(rule.isActive)
  const [deleted, setDeleted] = useState(false)

  async function handleToggle(checked: boolean) {
    setActive(checked)
    await setRuleActive(rule.id, checked)
  }

  async function handleDelete() {
    setDeleted(true)
    await deleteRule(rule.id)
  }

  if (deleted) return null

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/rules/${rule.id}`} className="text-sm font-medium leading-relaxed transition-colors hover:text-primary">{rule.ruleText}</Link>
          <Switch
            checked={active}
            onCheckedChange={handleToggle}
            aria-label="启用规则"
          />
        </div>
        {rule.principleText ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            原则:{rule.principleText}
          </p>
        ) : null}
        <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/40 p-3 text-center"><div><p className="font-semibold tabular-nums">{rule.matchCount??0}</p><p className="text-xs text-muted-foreground">匹配</p></div><div><p className="font-semibold tabular-nums">{rule.actedCount??0}</p><p className="text-xs text-muted-foreground">纠偏</p></div><div><p className="font-semibold tabular-nums">{rule.validatedCount??0}</p><p className="text-xs text-muted-foreground">验证</p></div><div><p className="font-semibold tabular-nums">{rule.helpfulCount??0}</p><p className="text-xs text-muted-foreground">有效</p></div></div>{(rule.validatedCount??0)<3?<p className="text-xs text-muted-foreground">样本不足 3 次，暂不自动调整规则。</p>:null}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{DOMAIN_LABELS[(rule.domain as Domain) ?? "custom"] ?? rule.domain}</Badge><Badge variant="outline">{rule.status??(active?"active":"paused")} · v{rule.currentVersion??1}</Badge>
            {rule.weaknessKey && rule.weaknessKey in WEAKNESS_LABELS ? (
              <Badge variant="outline">
                {WEAKNESS_LABELS[rule.weaknessKey as WeaknessKey]}
              </Badge>
            ) : null}
            {typeof rule.hitCount === "number" && rule.hitCount > 0 ? (
              <span className="text-xs text-muted-foreground">
                命中 {rule.hitCount} 次
              </span>
            ) : null}
            {rule.scenario ? (
              <span className="text-xs text-muted-foreground">{rule.scenario}</span>
            ) : null}
            {!active ? (
              <span className="text-xs text-muted-foreground">未启用</span>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleDelete}
          >
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
