"use server"

import { db } from "@/lib/db"
import { confirmationRules, interventionRuleVersions } from "@/lib/db/schema"
import { getUserId } from "@/lib/user"
import { ruleSchema, type RuleInput } from "@/lib/validation"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { canTransitionRule, type RuleStatus } from "@/lib/domain/experience-trigger"

export async function getRules() {
  const userId = await getUserId()
  return db
    .select()
    .from(confirmationRules)
    .where(eq(confirmationRules.userId, userId))
    .orderBy(desc(confirmationRules.createdAt))
}

export async function getRule(id: number) {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(confirmationRules)
    .where(
      and(eq(confirmationRules.id, id), eq(confirmationRules.userId, userId))
    )
  return rows[0] ?? null
}

export async function createRule(input: RuleInput) {
  const userId = await getUserId()
  const parsed = ruleSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入无效" }
  }
  const data = parsed.data
  const inserted = await db.transaction(async (tx) => {
    const rows = await tx.insert(confirmationRules).values({
      userId, domain: data.domain, scenario: data.scenario ?? null,
      ruleText: data.ruleText, principleText: data.principleText ?? null,
      triggerCondition: data.triggerCondition ?? null, sourceReviewId: data.sourceReviewId ?? null,
      sourceId: data.sourceReviewId ?? null, isActive: data.isActive,
      status: data.isActive ? "active" : "draft", triggerText: data.ruleText,
      recommendedAction: data.ruleText, currentVersion: 1,
    }).returning()
    const rule = rows[0]
    await tx.insert(interventionRuleVersions).values({
      userId, ruleId: rule.id, version: 1, sceneTagsSnapshot: rule.scenario,
      riskTagsSnapshot: rule.likelyMistakeKeywords, triggerTextSnapshot: rule.ruleText,
      actionSnapshot: rule.ruleText, severitySnapshot: rule.severity,
      changeReason: "创建规则",
    })
    return rows
  })
  revalidatePath("/rules")
  return { id: inserted[0].id }
}

export async function setRuleActive(id: number, isActive: boolean) {
  const userId = await getUserId()
  const existing = await getRule(id)
  if (!existing) return { error: "规则不存在" }
  const next = isActive ? "active" : "paused"
  if (!canTransitionRule(existing.status as RuleStatus, next)) return { error: "当前规则状态不能执行此操作" }
  await db
    .update(confirmationRules)
    .set({ isActive, status: next, updatedAt: new Date() })
    .where(
      and(eq(confirmationRules.id, id), eq(confirmationRules.userId, userId))
    )
  revalidatePath("/rules")
}

export async function updateRuleText(id: number, ruleText: string) {
  const userId = await getUserId()
  const text = ruleText.trim()
  if (!text || text.length > 500) return { error: "规则内容无效" }
  const existing = await getRule(id)
  if (!existing) return { error: "规则不存在" }
  const nextVersion = existing.currentVersion + 1
  await db.transaction(async (tx) => {
    await tx.update(confirmationRules).set({
      ruleText: text, triggerText: text, recommendedAction: text,
      currentVersion: nextVersion, updatedAt: new Date(),
    }).where(and(eq(confirmationRules.id, id), eq(confirmationRules.userId, userId)))
    await tx.insert(interventionRuleVersions).values({
      userId, ruleId: id, version: nextVersion, sceneTagsSnapshot: existing.scenario,
      riskTagsSnapshot: existing.likelyMistakeKeywords, triggerTextSnapshot: text,
      actionSnapshot: text, severitySnapshot: existing.severity,
      changeReason: "修改规则文案",
    })
  })
  revalidatePath("/rules")
  return { success: true }
}

export async function deleteRule(id: number) {
  const userId = await getUserId()
  await db.update(confirmationRules).set({
    status: "archived", isActive: false, updatedAt: new Date(),
  }).where(and(eq(confirmationRules.id, id), eq(confirmationRules.userId, userId)))
  revalidatePath("/rules")
}
