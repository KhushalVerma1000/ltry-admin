"use client"

import { Seat } from "@/types/pool"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

export function SeatMap({ 
    seats,
    mode = "view",
    selectedWinnerNames = [],
    onSeatClick,
}: { 
    seats: Seat[];
    mode?: "view" | "select-winners";
    selectedWinnerNames?: string[];
    onSeatClick?: (seat: Seat) => void;
}) {
    const router = useRouter()
    const params = useParams()
    const publicId = params.publicId as string

    // Group seats by series (A, B, C, D) based on the first letter of the name
    const groupedSeats = seats.reduce((acc, seat) => {
        const series = seat.name.charAt(0).toUpperCase()
        if (!acc[series]) {
            acc[series] = []
        }
        acc[series].push(seat)
        return acc
    }, {} as Record<string, Seat[]>)

    // Sort series alphabetically to maintain order
    const seriesKeys = Object.keys(groupedSeats).sort()

    const handleSeatClick = (seat: Seat) => {
        if (mode === "select-winners") {
            onSeatClick?.(seat);
            return;
        }
        router.push(`/pools/${publicId}/seats/${seat.publicId}`)
    }

    const isWinner = (seat: Seat) => selectedWinnerNames.includes(seat.name)

    const getStatusColor = (seat: Seat) => {
        if (mode === "select-winners") {
            if (isWinner(seat)) {
                return "bg-green-500 text-white border-2 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.6)] cursor-pointer";
            }
            return "bg-muted/50 text-muted-foreground border-2 border-transparent hover:border-green-500/50 cursor-pointer";
        }

        switch (seat.status) {
            case "AVAILABLE":
                return "bg-background border-2 border-primary/50 text-foreground hover:bg-primary/10"
            case "RESERVED":
                return "bg-amber-500 text-white border-2 border-amber-600 hover:bg-amber-600 cursor-pointer"
            case "SOLD":
                return "bg-muted text-muted-foreground border-2 border-muted-foreground/30 hover:bg-muted/80 cursor-pointer"
            default:
                return "bg-secondary text-secondary-foreground border-2 border-transparent"
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center  p-6 rounded-xl border bg-card">
            <div className="flex flex-col gap-8 w-full items-center pb-4">
                {seriesKeys.map(series => (
                    <div key={series} className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full max-w-2xl bg-muted/30 p-4 rounded-xl border">
                        <div className="w-8 font-bold text-2xl text-primary text-center">
                            {series}
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1 justify-start">
                            {groupedSeats[series].sort((a, b) => a.name.localeCompare(b.name)).map(seat => (
                                <button
                                    key={seat.publicId}
                                    onClick={() => handleSeatClick(seat)}
                                    title={`${seat.name}${mode === "select-winners" && isWinner(seat) ? ' - WINNER' : ''}`}
                                    className={cn(
                                        "w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ",
                                        getStatusColor(seat)
                                    )}
                                >
                                    <span className="scale-75 md:scale-100">{seat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 px-4 py-3 border rounded-full bg-background/50">
                {mode === "select-winners" ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm border-2 border-green-600 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                        <span className="text-sm">Winner</span>
                    </div>
                ) : null}
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border-2 border-primary/50 bg-background" />
                    <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border-2 border-amber-600 bg-amber-500" />
                    <span className="text-sm">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border-2 border-muted-foreground/30 bg-muted" />
                    <span className="text-sm">Sold</span>
                </div>
            </div>
        </div>
    )
}
