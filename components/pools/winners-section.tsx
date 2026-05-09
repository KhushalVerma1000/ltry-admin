"use client"

import { WinnerSeatDetail } from "@/types/pool"
import { Trophy, User, Phone, CreditCard, Landmark, Hash, BadgeCheck, CircleDashed, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { markWinnerAsPaid } from "@/lib/api/pools"

const MEDAL_COLORS: Record<number, { bg: string; text: string; border: string; label: string }> = {
    1: { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-300", label: "🥇 1st" },
    2: { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-300",  label: "🥈 2nd" },
    3: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-300", label: "🥉 3rd" },
}

function positionLabel(pos: number) {
    if (MEDAL_COLORS[pos]) return MEDAL_COLORS[pos].label
    return `#${pos}`
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground shrink-0">{icon}</span>
            <span className="text-muted-foreground shrink-0">{label}:</span>
            <span className="font-medium truncate">{value ?? <span className="italic text-muted-foreground/60">N/A</span>}</span>
        </div>
    )
}

function WinnerCard({ winner, onPaidUpdate }: { winner: WinnerSeatDetail; onPaidUpdate?: (updated: WinnerSeatDetail) => void }) {
    const [isUpdating, setIsUpdating] = useState(false)
    const medal = MEDAL_COLORS[winner.position]
    const user = winner.seat?.bookedSeats?.[0]?.booking?.user ?? null
    const isClaimed = !!user

    return (
        <div
            className={`relative flex flex-col rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                medal ? medal.border : "border-border"
            } bg-card`}
        >
            {/* Top accent strip */}
            <div
                className={`h-1 w-full ${
                    winner.position === 1
                        ? "bg-gradient-to-r from-yellow-400 to-amber-400"
                        : winner.position === 2
                        ? "bg-gradient-to-r from-slate-400 to-slate-300"
                        : winner.position === 3
                        ? "bg-gradient-to-r from-orange-400 to-amber-300"
                        : "bg-gradient-to-r from-indigo-400 to-indigo-300"
                }`}
            />

            <div className="p-4 flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                    <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            medal
                                ? `${medal.bg} ${medal.text}`
                                : "bg-indigo-50 text-indigo-600"
                        }`}
                    >
                        {positionLabel(winner.position)}
                    </span>
                    <span className="text-lg font-extrabold tracking-tight text-foreground">
                        {winner.seat?.name ?? "Unknown Seat"}
                    </span>
                </div>

                {/* Prize */}
                <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-muted/30">
                    <span className="text-xs text-muted-foreground font-medium">Prize</span>
                    <span className="font-bold text-emerald-600 text-sm">₹{winner.prize}</span>
                </div>

                {/* Claimed / Unclaimed */}
                {isClaimed ? (
                    <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-600">Claimed</span>
                        </div>
                        <InfoRow
                            icon={<User className="w-3 h-3" />}
                            label="Name"
                            value={user!.name}
                        />
                        <InfoRow
                            icon={<Phone className="w-3 h-3" />}
                            label="Phone"
                            value={user!.phone}
                        />
                        <InfoRow
                            icon={<Landmark className="w-3 h-3" />}
                            label="Bank Acct"
                            value={user!.bankAccountNumber}
                        />
                        <InfoRow
                            icon={<Hash className="w-3 h-3" />}
                            label="IFSC"
                            value={user!.bankIFSCCode}
                        />
                        <InfoRow
                            icon={<CreditCard className="w-3 h-3" />}
                            label="UPI"
                            value={user!.upiId}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 pt-1">
                        <CircleDashed className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground italic">Unclaimed — no user assigned</span>
                    </div>
                )}

                {/* Mark Paid Action */}
                {isClaimed && (
                    <div className="mt-auto pt-4 border-t">
                        {winner.paid ? (
                            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Paid</span>
                            </div>
                        ) : (
                            <Button
                                onClick={async () => {
                                    if (!confirm(`Mark ${user?.name}'s prize of ₹${winner.prize} as PAID?`)) return
                                    setIsUpdating(true)
                                    try {
                                        const res = await markWinnerAsPaid(winner.id)
                                        if (res.success) {
                                            toast.success("Winner marked as paid!")
                                            onPaidUpdate?.(res.data)
                                        } else {
                                            toast.error(res.message || "Failed to update status")
                                        }
                                    } catch (err: any) {
                                        toast.error(err.message || "Something went wrong")
                                    } finally {
                                        setIsUpdating(false)
                                    }
                                }}
                                disabled={isUpdating}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 shadow-sm"
                            >
                                {isUpdating ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Mark Paid
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export function WinnersSection({ winnerDetails: initialWinners }: { winnerDetails: WinnerSeatDetail[] }) {
    const [winners, setWinners] = useState<WinnerSeatDetail[]>(initialWinners)

    if (!winners || winners.length === 0) return null

    const sorted = [...winners].sort((a, b) => a.position - b.position)
    const claimedCount = sorted.filter(w => !!w.seat?.bookedSeats?.[0]?.booking?.user).length
    const paidCount = sorted.filter(w => w.paid).length

    const handleUpdate = (updated: WinnerSeatDetail) => {
        setWinners(prev => prev.map(w => w.id === updated.id ? { ...w, ...updated } : w))
    }

    return (
        <div className="w-full mt-8 mb-4">
            <div className="w-full bg-gradient-to-br from-indigo-50/60 to-background border rounded-xl overflow-hidden shadow-sm">
                {/* Section header */}
                <div className="bg-indigo-600 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-300" />
                        Winners
                    </h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="bg-indigo-800/50 text-indigo-100 px-3 py-0.5 rounded-full font-medium">
                            {sorted.length} Total
                        </span>
                        <span className="bg-emerald-700/60 text-emerald-100 px-3 py-0.5 rounded-full font-medium">
                            {claimedCount} Claimed
                        </span>
                        <span className="bg-blue-700/60 text-blue-100 px-3 py-0.5 rounded-full font-medium">
                            {paidCount} Paid
                        </span>
                        <span className="bg-indigo-800/50 text-indigo-200 px-3 py-0.5 rounded-full font-medium">
                            {sorted.length - claimedCount} Unclaimed
                        </span>
                    </div>
                </div>

                {/* Winners grid */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sorted.map(winner => (
                        <WinnerCard key={winner.id} winner={winner} onPaidUpdate={handleUpdate} />
                    ))}
                </div>
            </div>
        </div>
    )
}
