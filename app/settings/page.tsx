import type { Metadata } from "next"
import { getNavOrder } from "@/app/actions/preferences"
import { getEntropyConfig } from "@/app/actions/lifespan"
import { SettingsPanel } from "@/components/settings-panel"
import { EntropySettings } from "@/components/entropy-settings"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "设置" }

export default async function SettingsPage() {
  const [navOrder, entropyConfig] = await Promise.all([getNavOrder(), getEntropyConfig()])

  return (
    <main className="mx-auto w-full max-w-[42rem] px-6 py-8">
      <header>
        <h1 className="font-serif text-3xl tracking-[0.02em] text-balance">设置</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          个性化导航顺序与本机数据管理。
        </p>
      </header>
      <div className="mt-6 flex flex-col gap-6">
        <EntropySettings
          initialBirthDate={entropyConfig.birthDate}
          initialModelTreeUrl={entropyConfig.modelTreeUrl}
        />
        <SettingsPanel initialOrder={navOrder} />
      </div>
    </main>
  )
}
