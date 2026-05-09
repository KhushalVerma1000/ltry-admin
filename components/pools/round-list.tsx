"use client"

import { useState } from "react"
import { PoolRound, RoundStatus } from "@/types/pool"
import { updateRoundStatus, createPoolRound } from "@/lib/api/pools"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, RefreshCwIcon, SlidersHorizontalIcon, EyeIcon, Loader2, Trophy } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const ROUND_STATUS_OPTIONS: RoundStatus[] = ["UPCOMING", "ACTIVE", "DRAWING", "CLOSED", "CANCELLED"]

const STATUS_BADGE: Record<RoundStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE:    { label: "Active",    variant: "default" },
    UPCOMING:  { label: "Upcoming",  variant: "secondary" },
    DRAWING:   { label: "Drawing",   variant: "outline" },
    CLOSED:    { label: "Closed",    variant: "destructive" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
}

interface RoundListProps {
    poolPublicId: string
    poolName: string
    initialRounds: PoolRound[]
}

export function RoundList({ poolPublicId, poolName, initialRounds }: RoundListProps) {
    const [rounds, setRounds] = useState<PoolRound[]>(initialRounds)
    const [isCreating, setIsCreating] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [selectedRound, setSelectedRound] = useState<PoolRound | null>(null)
    const [newStatus, setNewStatus] = useState<RoundStatus>("ACTIVE")
    const [drawnAt, setDrawnAt] = useState<string>("")
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    // Create round form state
    const [roundNumber, setRoundNumber] = useState("")
    const [startsAt, setStartsAt] = useState("")
    const [endsAt, setEndsAt] = useState("")

    const handleCreateRound = async () => {
        if (!roundNumber || !startsAt || !endsAt) {
            toast.error("All fields are required.")
            return
        }
        setIsCreating(true)
        try {
            const res = await createPoolRound(poolPublicId, {
                roundNumber: parseInt(roundNumber),
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
            })
            if (res.success && res.data) {
                toast.success(`Round #${roundNumber} created with ${(res.data as any).round?.seatsSnapshot ?? "?"} seats.`)
                setCreateOpen(false)
                setRoundNumber("")
                setStartsAt("")
                setEndsAt("")
                window.location.reload()
            } else {
                toast.error(res.message || "Failed to create round.")
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create round.")
        } finally {
            setIsCreating(false)
        }
    }

    const openStatusDialog = (round: PoolRound) => {
        setSelectedRound(round)
        setNewStatus(round.status)
        if ((round as any).drawnAt) {
            const d = new Date((round as any).drawnAt);
            const localString = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setDrawnAt(localString);
        } else {
            setDrawnAt("");
        }
        setStatusDialogOpen(true)
    }

    const handleUpdateStatus = async () => {
        if (!selectedRound) return
        if (newStatus === "DRAWING" && !drawnAt) {
            toast.error("Target draw time is required for DRAWING status.")
            return
        }
        setIsUpdatingStatus(true)
        try {
            const res = await updateRoundStatus(
                poolPublicId, 
                selectedRound.publicId, 
                newStatus,
                newStatus === "DRAWING" ? new Date(drawnAt).toISOString() : undefined
            )
            if (res.success) {
                toast.success(`Round status updated to ${newStatus}.`)
                setRounds(prev =>
                    prev.map(r => r.publicId === selectedRound.publicId ? { ...r, status: newStatus, drawnAt: newStatus === "DRAWING" ? new Date(drawnAt).toISOString() : (r as any).drawnAt } as any : r)
                )
                setStatusDialogOpen(false)
            } else {
                toast.error(res.message || "Failed to update status.")
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update status.")
        } finally {
            setIsUpdatingStatus(false)
        }
    }


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Round
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Round #</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Price (snapshot)</TableHead>
                            <TableHead>Seats (snapshot)</TableHead>
                            <TableHead>Starts</TableHead>
                            <TableHead>Ends</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rounds.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No rounds found. Create the first round for this pool.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rounds.map((round) => {
                                const badge = STATUS_BADGE[round.status] ?? { label: round.status, variant: "secondary" as const }
                                const availableSeats = round._count?.seats ?? round.availableSeats
                                return (
                                    <TableRow key={round.publicId}>
                                        <TableCell className="font-semibold">#{round.roundNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant={badge.variant}>{badge.label}</Badge>
                                        </TableCell>
                                        <TableCell>₹{round.priceSnapshot}</TableCell>
                                        <TableCell>{round.seatsSnapshot}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(round.startsAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(round.endsAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {availableSeats != null ? `${availableSeats} / ${round.seatsSnapshot}` : "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/pools/${poolPublicId}/rounds/${round.publicId}/seats`}>
                                                        <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
                                                        Seats
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700">
                                                    <Link href={`/pools/${poolPublicId}/rounds/${round.publicId}/winners`}>
                                                        <Trophy className="h-3.5 w-3.5 mr-1.5" />
                                                        Winners
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Update status"
                                                    onClick={() => openStatusDialog(round)}
                                                >
                                                    <SlidersHorizontalIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Round Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Round</DialogTitle>
                        <DialogDescription>
                            Creates a new round for pool <strong>{poolName}</strong>. Seats will be generated automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="roundNumber">Round Number</Label>
                            <Input
                                id="roundNumber"
                                type="number"
                                min={1}
                                value={roundNumber}
                                onChange={e => setRoundNumber(e.target.value)}
                                placeholder="e.g. 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startsAt">Starts At</Label>
                            <Input
                                id="startsAt"
                                type="datetime-local"
                                value={startsAt}
                                onChange={e => setStartsAt(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endsAt">Ends At</Label>
                            <Input
                                id="endsAt"
                                type="datetime-local"
                                value={endsAt}
                                onChange={e => setEndsAt(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateRound} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Round
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Round Status</DialogTitle>
                        <DialogDescription>
                            Change the status of Round #{selectedRound?.roundNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="newStatus">New Status</Label>
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RoundStatus)}>
                            <SelectTrigger className="mt-2" id="newStatus">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROUND_STATUS_OPTIONS.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {newStatus === "DRAWING" && (
                        <div className="py-2">
                            <Label htmlFor="drawnAt">Target Draw Time</Label>
                            <Input
                                id="drawnAt"
                                type="datetime-local"
                                className="mt-2"
                                value={drawnAt}
                                onChange={(e) => setDrawnAt(e.target.value)}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus}>
                            {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
