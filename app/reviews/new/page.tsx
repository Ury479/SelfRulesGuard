import { ReviewForm } from "@/components/review-form"

export const metadata = {
  title: "错误复盘 | 关键动作拦截台",
}

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmationId?: string }>
}) {
  const params = await searchParams
  const confirmationId = params.confirmationId
    ? Number(params.confirmationId)
    : undefined

  return (
    <div className="flex flex-col gap-6 py-2">
      <header>
        <h1 className="text-2xl font-semibold text-balance">错误复盘</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          出错不是终点。花 3 分钟把这次错误变成一条可以拦住下一次的规则。
        </p>
      </header>
      <ReviewForm
        confirmationId={
          confirmationId && !Number.isNaN(confirmationId)
            ? confirmationId
            : undefined
        }
      />
    </div>
  )
}
