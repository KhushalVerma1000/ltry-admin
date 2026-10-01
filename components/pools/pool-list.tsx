"use client"

import { useState } from "react"
import { Pool, RoundStatus } from "@/types/pool"
import { PoolForm } from "./pool-form"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EditIcon, PlusIcon, RefreshCwIcon, TrashIcon, LayersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { deletePool } from "@/lib/api/pools"
import { useToast } from "@/hooks/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const ROUND_STATUS_BADGE: Record<RoundStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE:    { label: "Active",    variant: "default" },
    UPCOMING:  { label: "Upcoming",  variant: "secondary" },
    DRAWING:   { label: "Drawing",   variant: "outline" },
    CLOSED:    { label: "Closed",    variant: "destructive" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
}

export function PoolList({ initialPools }: { initialPools: Pool[] }) {
    const [pools, setPools] = useState<Pool[]>(initialPools)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingPool, setEditingPool] = useState<Pool | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [poolToDelete, setPoolToDelete] = useState<Pool | null>(null)
    const [poolNameInput, setPoolNameInput] = useState("")
    const [deleteStep, setDeleteStep] = useState<"confirm" | "verify">("confirm")
    const [isDeleting, setIsDeleting] = useState(false)
    const { success, error: showError } = useToast()

    const handleCreate = () => {
        setEditingPool(null)
        setSheetOpen(true)
    }

    const handleEdit = (pool: Pool) => {
        setEditingPool(pool)
        setSheetOpen(true)
    }

    const handleDeleteClick = (pool: Pool) => {
        setPoolToDelete(pool)
        setDeleteStep("confirm")
        setPoolNameInput("")
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (deleteStep === "confirm") {
            e.preventDefault()
            setDeleteStep("verify")
        } else if (deleteStep === "verify") {
            if (poolNameInput === poolToDelete?.name) {
                e.preventDefault()
                performDelete()
            } else {
                e.preventDefault()
                showError("Pool name does not match. Deletion cancelled.")
                setDeleteDialogOpen(false)
                resetDeleteState()
            }
        }
    }

    const performDelete = async () => {
        if (!poolToDelete) return

        setIsDeleting(true)
        try {
            await deletePool(poolToDelete.publicId)
            success(`Pool "${poolToDelete.name}" has been deleted.`)
            setPools(pools.filter(p => p.publicId !== poolToDelete.publicId))
            setDeleteDialogOpen(false)
            resetDeleteState()
        } catch (err) {
            showError(err instanceof Error ? err.message : "Failed to delete pool")
        } finally {
            setIsDeleting(false)
        }
    }

    const resetDeleteState = () => {
        setPoolToDelete(null)
        setPoolNameInput("")
        setDeleteStep("confirm")
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        resetDeleteState()
    }

    const handleSuccess = () => {
        setSheetOpen(false)
        window.location.reload()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
                <Button onClick={handleCreate}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Pool
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pool ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Price / Seat</TableHead>
                            <TableHead>Total Seats</TableHead>
                            <TableHead>Active Round</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pools.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                                        <span className="font-medium text-foreground">No pools yet</span>
                                        <span className="text-sm">
                                            Create your first lottery pool to start selling seats.
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            pools.map((pool) => {
                                const round = pool.activeRound
                                const statusInfo = round
                                    ? ROUND_STATUS_BADGE[round.status] ?? { label: round.status, variant: "secondary" as const }
                                    : null

                                return (
                                    <TableRow key={pool.publicId}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{pool.publicId}</TableCell>
                                        <TableCell className="font-medium">{pool.name}</TableCell>
                                        <TableCell>₹{pool.perSeatPrice}</TableCell>
                                        <TableCell>{pool.totalSeats}</TableCell>
                                        <TableCell>
                                            {round ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={statusInfo!.variant}>{statusInfo!.label}</Badge>
                                                    <span className="text-xs text-muted-foreground">R{round.roundNumber}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No round running</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {round
                                                ? <span>{round.availableSeats ?? "—"} / {pool.totalSeats}</span>
                                                : <span className="text-muted-foreground">—</span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/pools/${pool.publicId}/rounds`}>
                                                        <LayersIcon className="h-3.5 w-3.5 mr-1.5" />
                                                        Rounds
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(pool)}>
                                                    <EditIcon className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(pool)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
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

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{editingPool ? "Edit Pool" : "Create Pool"}</SheetTitle>
                        <SheetDescription>
                            {editingPool
                                ? "Update the details of the selected pool."
                                : "Enter the details for the new lottery pool."}
                        </SheetDescription>
                    </SheetHeader>
                    <PoolForm
                        initialData={editingPool}
                        onSuccess={handleSuccess}
                        onCancel={() => setSheetOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {deleteStep === "confirm"
                                ? "Delete Pool?"
                                : "Verify Pool Name"}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                {deleteStep === "confirm" ? (
                                    <div className="space-y-2 mt-2">
                                        <div>Delete the pool <strong>&quot;{poolToDelete?.name}&quot;</strong>?</div>
                                        <div className="text-xs text-muted-foreground">This can&apos;t be undone — every round and seat under this pool will be deleted too.</div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 mt-2">
                                        <div>Type the pool name to confirm:</div>
                                        <div className="font-semibold text-foreground">&quot;{poolToDelete?.name}&quot;</div>
                                        <Input
                                            placeholder="Enter pool name"
                                            value={poolNameInput}
                                            onChange={(e) => setPoolNameInput(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-2">
                        <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteStep === "verify" && poolNameInput !== poolToDelete?.name}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : deleteStep === "confirm" ? "Next" : "Delete Pool"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
