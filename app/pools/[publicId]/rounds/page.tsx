import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RoundList } from "@/components/pools/round-list"
import { getPoolById, getPoolRounds } from "@/lib/api/pools"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"

export default async function PoolRoundsPage(props: { params: Promise<{ publicId: string }> }) {
    const params = await props.params
    const { publicId } = params

    let poolName = "Pool"
    let poolNotes: string | null = null
    let rounds: any[] = []

    try {
        const [poolRes, roundsRes] = await Promise.allSettled([
            getPoolById(publicId),
            getPoolRounds(publicId),
        ])

        if (poolRes.status === "fulfilled" && poolRes.value.success && poolRes.value.data) {
            poolName = poolRes.value.data.name || "Pool"
            poolNotes = poolRes.value.data.notes || null
        }

        if (roundsRes.status === "fulfilled" && roundsRes.value.success) {
            rounds = roundsRes.value.data || []
        }
    } catch (error) {
        console.error("Failed to fetch pool rounds", error)
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-2 @container/main">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">

                            <div className="flex items-center gap-4 mb-2">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href="/pools">
                                        <ArrowLeftIcon className="h-4 w-4" />
                                        <span className="sr-only">Back to Pools</span>
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight capitalize">{poolName} — Rounds</h1>
                                    {poolNotes && (
                                        <p className="text-muted-foreground text-sm mt-0.5">{poolNotes}</p>
                                    )}
                                </div>
                            </div>

                            <RoundList
                                poolPublicId={publicId}
                                poolName={poolName}
                                initialRounds={rounds}
                            />

                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
