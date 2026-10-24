"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Loader2, Undo2, Landmark, CreditCard, Hash, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setPayoutVerification } from "@/lib/api/verifications"
import type { PayoutVerification, PayoutVerificationRow } from "@/types/pool"

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium font-mono break-all">
                {value ?? <span className="italic text-muted-foreground/60">N/A</span>}
            </span>
        </div>
    )
}

function Row({ row }: { row: PayoutVerificationRow }) {
    const router = useRouter()
    const [busy, setBusy] = useState<PayoutVerification | null>(null)
    const [rejecting, setRejecting] = useState(false)
    const [reason, setReason] = useState("")

    const act = async (status: PayoutVerification, note?: string) => {
        setBusy(status)
        try {
            const res = await setPayoutVerification(row.publicId, status, note)
            if (res.success) {
                toast.success(
                    status === "VERIFIED" ? `${row.name} verified` : status === "REJECTED" ? `${row.name} rejected` : `${row.name} moved back to pending`
                )
                router.refresh()
            } else {
                toast.error(res.message || "Could not update verification")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setBusy(null)
        }
    }

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-lg font-semibold capitalize">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                        Registered {new Date(row.createdAt).toLocaleDateString("en-IN")}
                    </p>
                </div>
                {row.unpaidWinnings.count > 0 && (
                    <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-semibold">
                        Waiting on payout: {row.unpaidWinnings.count} prize{row.unpaidWinnings.count > 1 ? "s" : ""} · ₹
                        {row.unpaidWinnings.amount.toLocaleString("en-IN")}
                    </span>
                )}
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2">
                <Detail icon={<Phone className="w-4 h-4" />} label="Phone" value={row.phone} />
                <Detail icon={<Landmark className="w-4 h-4" />} label="Bank account" value={row.bankAccountNumber} />
                <Detail icon={<Hash className="w-4 h-4" />} label="IFSC" value={row.bankIFSCCode} />
                <Detail icon={<CreditCard className="w-4 h-4" />} label="UPI" value={row.upiId} />
            </div>

            {row.payoutVerificationNote && (
                <p className="text-xs text-muted-foreground border-l-2 pl-2">
                    Note: {row.payoutVerificationNote}
                </p>
            )}

            {rejecting ? (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium" htmlFor={`reason-${row.publicId}`}>
                        Reason (the user will see this)
                    </label>
                    <textarea
                        id={`reason-${row.publicId}`}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={500}
                        rows={2}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="e.g. Bank account holder name doesn't match your registered name"
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={!reason.trim() || busy !== null}
                            onClick={() => act("REJECTED", reason.trim())}
                        >
                            {busy === "REJECTED" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                            Confirm reject
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRejecting(false)} disabled={busy !== null}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {row.payoutVerification !== "VERIFIED" && (
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={busy !== null}
                            onClick={() => {
                                if (confirm(`Mark ${row.name}'s payout details as VERIFIED? Prizes can then be paid to them.`)) act("VERIFIED")
                            }}
                        >
                            {busy === "VERIFIED" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Verify
                        </Button>
                    )}
                    {row.payoutVerification !== "REJECTED" && (
                        <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => setRejecting(true)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                        </Button>
                    )}
                    {row.payoutVerification !== "UNVERIFIED" && (
                        <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => act("UNVERIFIED")}>
                            {busy === "UNVERIFIED" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Undo2 className="w-4 h-4 mr-1" />}
                            Move back to pending
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export function VerificationList({ rows }: { rows: PayoutVerificationRow[] }) {
    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-muted/30 border border-dashed rounded-xl">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nobody in this list.</p>
            </div>
        )
    }
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => (
                <Row key={r.publicId} row={r} />
            ))}
        </div>
    )
}
