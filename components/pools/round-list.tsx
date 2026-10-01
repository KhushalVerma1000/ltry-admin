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
import { PlusIcon, RefreshCwIcon, SlidersHorizontalIcon, EyeIcon, Loader2, Trophy, ArrowRightIcon, LockIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// Mirrors the backend rules: UPCOMING -> ACTIVE -> DRAWING -> CLOSED, and a
// round can be CANCELLED any time before it closes. CLOSED / CANCELLED are final.
const ALLOWED_TRANSITIONS: Record<RoundStatus, RoundStatus[]> = {
    UPCOMING:  ["ACTIVE", "CANCELLED"],
    ACTIVE:    ["DRAWING", "CANCELLED"],
    DRAWING:   ["CLOSED", "ACTIVE", "CANCELLED"],
    CLOSED:    [],
    CANCELLED: [],
}

const STATUS_HELP: Record<RoundStatus, string> = {
    UPCOMING:  "Created but not open to players yet.",
    ACTIVE:    "Open for booking. Players can pick and pay for seats.",
    DRAWING:   "Booking is locked and a countdown to the draw is shown to players.",
    CLOSED:    "Winners are published and the round is finished. This can't be undone.",
    CANCELLED: "Round is called off. This can't be undone.",
}

// The one step an admin normally takes next, shown as a quick button per row.
const NEXT_STEP: Partial<Record<RoundStatus, { to: RoundStatus; label: string }>> = {
    UPCOMING: { to: "ACTIVE",  label: "Open booking" },
    ACTIVE:   { to: "DRAWING", label: "Start draw" },
    DRAWING:  { to: "CLOSED",  label: "Close round" },
}

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
    const nextRoundNumber = rounds.reduce((max, r) => Math.max(max, r.roundNumber), 0) + 1
    const [startsAt, setStartsAt] = useState("")
    const [endsAt, setEndsAt] = useState("")

    const handleCreateRound = async () => {
        if (!startsAt || !endsAt) {
            toast.error("Start and end time are required.")
            return
        }
        if (new Date(endsAt) <= new Date(startsAt)) {
            toast.error("The round must end after it starts.")
            return
        }
        setIsCreating(true)
        try {
            const res = await createPoolRound(poolPublicId, {
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
            })
            if (res.success && res.data) {
                const created = (res.data as any).round
                toast.success(`Round #${created?.roundNumber ?? nextRoundNumber} created with ${created?.seatsSnapshot ?? "?"} seats.`)
                setCreateOpen(false)
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

    const openStatusDialog = (round: PoolRound, preselect?: RoundStatus) => {
        setSelectedRound(round)
        setNewStatus(preselect ?? ALLOWED_TRANSITIONS[round.status][0] ?? round.status)
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
        if (newStatus === selectedRound.status && newStatus !== "DRAWING") {
            toast.error("Pick a different status to move this round to.")
            return
        }
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
                                                {NEXT_STEP[round.status] && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openStatusDialog(round, NEXT_STEP[round.status]!.to)}
                                                    >
                                                        {NEXT_STEP[round.status]!.label}
                                                        <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
                                                    </Button>
                                                )}
                                                {ALLOWED_TRANSITIONS[round.status].length === 0 ? (
                                                    <span className="inline-flex items-center px-2 text-muted-foreground" title="This round is final">
                                                        <LockIcon className="h-4 w-4" />
                                                    </span>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="More status options"
                                                        onClick={() => openStatusDialog(round)}
                                                    >
                                                        <SlidersHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                )}
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
                                value={`#${nextRoundNumber}`}
                                readOnly
                                disabled
                                className="font-semibold"
                            />
                            <p className="text-xs text-muted-foreground">Assigned automatically in order.</p>
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
                                {(selectedRound
                                    ? (newStatus === selectedRound.status || selectedRound.status === "DRAWING"
                                        ? [selectedRound.status, ...ALLOWED_TRANSITIONS[selectedRound.status]]
                                        : ALLOWED_TRANSITIONS[selectedRound.status])
                                    : []
                                ).filter((v, i, arr) => arr.indexOf(v) === i).map(st => (
                                    <SelectItem key={st} value={st}>
                                        {st}{st === selectedRound?.status ? " (current)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">{STATUS_HELP[newStatus]}</p>
                        {(newStatus === "CLOSED" || newStatus === "CANCELLED") && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                                This is final. {newStatus === "CLOSED" ? "Make sure winners are set first." : "Any refunds for booked seats must be handled separately."}
                            </p>
                        )}
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
