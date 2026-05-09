import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SeatMap } from "@/components/pools/seat-map"
import { getRoundSeats, getPoolById, getWinnersForRound } from "@/lib/api/pools"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import { DrawWinnersAction } from "@/components/pools/draw-winners-action"
import { WinnersSection } from "@/components/pools/winners-section"
import { WinnerSeatDetail } from "@/types/pool"

export default async function RoundSeatsPage(
    props: { params: Promise<{ publicId: string; roundId: string }> }
) {
    const params = await props.params
    const { publicId: poolPublicId, roundId } = params

    let seats: any[] = []
    let poolName = "Pool"
    let poolDetails: { price?: string | number; total?: number } | null = null
    let winnerDetails: WinnerSeatDetail[] = []
    let roundNumber: number | null = null

    try {
        const [poolRes, seatsRes, winnersRes] = await Promise.allSettled([
            getPoolById(poolPublicId),
            getRoundSeats(roundId),
            getWinnersForRound(poolPublicId, roundId),
        ])

        if (poolRes.status === "fulfilled" && poolRes.value.success && poolRes.value.data) {
            const data = poolRes.value.data
            poolName = data.name || "Pool"
            poolDetails = {
                price: data.perSeatPrice,
                total: data.totalSeats,
            }
            // Find the specific round to get roundNumber
            const thisRound = data.rounds?.find(r => r.publicId === roundId)
            roundNumber = thisRound?.roundNumber ?? null
        }

        if (seatsRes.status === "fulfilled" && seatsRes.value.success) {
            seats = seatsRes.value.data || []
        }

        if (winnersRes.status === "fulfilled" && winnersRes.value.success) {
            winnerDetails = winnersRes.value.data || []
        }
    } catch (error) {
        console.error("Failed to fetch round seats", error)
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

                            <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="icon" asChild>
                                        <Link href={`/pools/${poolPublicId}/rounds`}>
                                            <ArrowLeftIcon className="h-4 w-4" />
                                            <span className="sr-only">Back to Rounds</span>
                                        </Link>
                                    </Button>
                                    <div>
                                        <div className="flex items-center gap-3 relative top-0.5">
                                            <h1 className="text-2xl font-bold tracking-tight capitalize">
                                                {poolName}
                                                {roundNumber != null && (
                                                    <span className="ml-2 text-base font-normal text-muted-foreground">
                                                        — Round #{roundNumber}
                                                    </span>
                                                )}
                                            </h1>
                                            {poolDetails && (
                                                <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold px-2.5 py-1 bg-indigo-100/50 text-indigo-700 rounded-full">
                                                    <span>₹{poolDetails.price} / Seat</span>
                                                    <span className="w-1 h-1 rounded-full bg-indigo-300" />
                                                    <span>{seats.length} Seats</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground mt-1">
                                            Manage and view all seats for this round.
                                        </p>
                                    </div>
                                </div>
                                {seats.length > 0 && (
                                    <DrawWinnersAction
                                        poolId={poolPublicId}
                                        roundId={roundId}
                                        seats={seats}
                                    />
                                )}
                            </div>

                            <WinnersSection winnerDetails={winnerDetails} />

                            {seats.length > 0 ? (
                                <SeatMap seats={seats} />
                            ) : (
                                <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground w-full">
                                    No seats found for this round. The round may still be loading or seats have not been generated.
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
