import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentAdmin } from "@/lib/get-current-admin"
import { getWinnersForRound, getPoolById } from "@/lib/api/pools"
import { WinnersSection } from "@/components/pools/winners-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeftIcon, Trophy } from "lucide-react"

export default async function RoundWinnersPage(props: { 
    params: Promise<{ publicId: string; roundId: string }> 
}) {
    const params = await props.params
    const { publicId, roundId } = params

    let poolName = "Pool"
    let winners: any[] = []

    try {
        const [poolRes, winnersRes] = await Promise.allSettled([
            getPoolById(publicId),
            getWinnersForRound(publicId, roundId),
        ])

        if (poolRes.status === "fulfilled" && poolRes.value.success) {
            poolName = poolRes.value.data.name
        }

        if (winnersRes.status === "fulfilled" && winnersRes.value.success) {
            winners = winnersRes.value.data || []
        }
    } catch (error) {
        console.error("Failed to fetch winners", error)
    }

    const admin = await getCurrentAdmin()


    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" admin={admin} />
            <SidebarInset>
                <SiteHeader title={`${poolName} · Winners`} />
                <div className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-2 @container/main">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                            
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="icon" asChild>
                                        <Link href={`/pools/${publicId}/rounds`}>
                                            <ArrowLeftIcon className="h-4 w-4" />
                                            <span className="sr-only">Back to Rounds</span>
                                        </Link>
                                    </Button>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight capitalize">{poolName} — Winners</h1>
                                        <p className="text-muted-foreground text-sm">Round Winners Details</p>
                                    </div>
                                </div>
                            </div>

                            {winners.length > 0 ? (
                                <WinnersSection winnerDetails={winners} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-muted/30 border border-dashed rounded-xl">
                                    <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-semibold text-muted-foreground">No Winners Yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
                                        Winners will appear here once the draw for this round is completed.
                                    </p>
                                    <Button className="mt-6" variant="outline" asChild>
                                        <Link href={`/pools/${publicId}/rounds/${roundId}/seats`}>
                                            Go to Seat Map
                                        </Link>
                                    </Button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
