import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPools } from "@/lib/api/pools"
import Link from "next/link"

const STATUS_COLORS: Record<string, string> = {
    ACTIVE:    "bg-emerald-100 text-emerald-700",
    UPCOMING:  "bg-blue-100 text-blue-700",
    DRAWING:   "bg-purple-100 text-purple-700",
    CLOSED:    "bg-gray-100 text-gray-500",
    CANCELLED: "bg-red-100 text-red-600",
}

export async function DashboardPools() {
    let poolsResponse;
    try {
        poolsResponse = await getPools();
    } catch (e) {
        console.error("Failed to load pools", e);
        return <div className="px-4 lg:px-6 text-red-500">Failed to load pools from server.</div>;
    }

    const pools = poolsResponse?.data || [];
    if (pools.length === 0) {
        return (
            <div className="px-4 lg:px-6">
                <h2 className="text-xl font-semibold mb-4">Pools Overview</h2>
                <div className="text-muted-foreground text-sm">No pools available.</div>
            </div>
        )
    }

    return (
        <div className="px-4 lg:px-6">
            <h2 className="text-xl font-semibold mb-4">Pools Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pools.map(pool => {
                    const round = pool.activeRound;
                    const statusColor = round ? STATUS_COLORS[round.status] || "bg-gray-100 text-gray-500" : null;

                    return (
                        <Link key={pool.publicId} href={`/pools/${pool.publicId}/rounds`} className="block group">
                            <Card className="flex flex-col h-full transition-shadow group-hover:shadow-md">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg line-clamp-1">{pool.name}</CardTitle>
                                        {round && (
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                                                {round.status}
                                            </span>
                                        )}
                                    </div>
                                    <CardDescription>₹{pool.perSeatPrice} / seat · {pool.totalSeats} total</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-between">
                                    {round ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Round #{round.roundNumber}</span>
                                                <Badge variant="secondary">
                                                    {round.availableSeats ?? "?"} / {pool.totalSeats} available
                                                </Badge>
                                            </div>
                                            {round.endsAt && (
                                                <div className="text-xs text-muted-foreground">
                                                    Ends: {new Date(round.endsAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">No active round</div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
