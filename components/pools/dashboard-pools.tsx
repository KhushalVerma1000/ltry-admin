import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPools } from "@/lib/api/pools"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

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
        return (
            <div className="px-4 lg:px-6">
                <h2 className="text-xl font-semibold mb-1">Pools overview</h2>
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Couldn&apos;t reach the server. Check that the backend is running
                    and <code className="font-mono">API_URL</code> in <code className="font-mono">.env.local</code> points to it, then refresh.
                </div>
            </div>
        );
    }

    const pools = poolsResponse?.data || [];
    if (pools.length === 0) {
        return (
            <div className="px-4 lg:px-6">
                <h2 className="text-xl font-semibold mb-1">Pools overview</h2>
                <div className="rounded-lg border border-dashed py-10 text-center">
                    <p className="font-medium">No pools yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create your first lottery pool to start selling seats.
                    </p>
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/pools">
                            <PlusIcon className="mr-1.5 h-4 w-4" />
                            Create a pool
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="px-4 lg:px-6">
            <h2 className="text-xl font-semibold mb-4">Pools overview</h2>
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
                                        <div className="text-sm text-muted-foreground">No round running yet</div>
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
