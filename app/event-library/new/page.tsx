import { EventQuickRecordForm } from "@/components/event-quick-record-form"

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">30 秒记录事件</h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          先记录,再去解决现实问题。复盘可以等事情解决后再做。
        </p>
      </section>
      <EventQuickRecordForm />
    </div>
  )
}
