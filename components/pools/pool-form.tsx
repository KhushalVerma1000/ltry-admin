"use client"

import { useState } from "react"
import { Pool } from "@/types/pool"
import { createPool, updatePool } from "@/lib/api/pools"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PoolFormProps {
    initialData?: Pool | null
    onSuccess?: () => void
    onCancel?: () => void
}

export function PoolForm({ initialData, onSuccess, onCancel }: PoolFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const perSeatPrice = Number(formData.get("perSeatPrice"))
        const totalSeats = Number(formData.get("totalSeats"))
        const notes = formData.get("notes") as string

        try {
            if (initialData) {
                await updatePool(initialData.publicId, {
                    name,
                    perSeatPrice,
                    totalSeats,
                    notes,
                })
            } else {
                await createPool({
                    name,
                    perSeatPrice,
                    totalSeats,
                    notes,
                })
            }
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save pool")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-4">
            {error && <div className="col-span-full text-sm font-medium text-destructive">{error}</div>}

            <div className="space-y-2">
                <Label htmlFor="name">Pool Name</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={initialData?.name || ""}
                    required
                    placeholder="e.g. Summer Lottery"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="perSeatPrice">Per Seat Price (₹)</Label>
                <Input
                    id="perSeatPrice"
                    name="perSeatPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={initialData?.perSeatPrice?.toString() || ""}
                    required
                    placeholder="e.g. 50.00"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="totalSeats">Total Seats</Label>
                <Input
                    id="totalSeats"
                    name="totalSeats"
                    type="number"
                    min="4"
                    step="4"
                    defaultValue={initialData?.totalSeats || ""}
                    required
                    placeholder="e.g. 100 (must be ÷4)"
                />
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                    id="notes"
                    name="notes"
                    defaultValue={initialData?.notes || ""}
                    placeholder="Add any notes here..."
                />
            </div>

            <p className="col-span-full text-xs text-muted-foreground">
                Round start/end dates are set per round. Go to a pool&apos;s rounds page to create a round.
            </p>

            <div className="flex justify-end gap-2 pt-4 col-span-full">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : initialData ? "Save Changes" : "Create Pool"}
                </Button>
            </div>
        </form>
    )
}
