"use client"

import { useState } from "react"
import { Seat, DrawWinnerItem } from "@/types/pool"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SeatMap } from "@/components/pools/seat-map"
import { drawWinnerSeats, setWinnerSeats } from "@/lib/api/pools"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, AlertTriangle, Loader2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DrawWinnersActionProps {
    poolId: string
    roundId: string
    seats: Seat[]
}

function SortableWinnerItem({ item, index }: { item: DrawWinnerItem; index: number }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id.toString() })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex justify-between items-center text-sm p-2 rounded-md bg-muted/50 border cursor-grab active:cursor-grabbing hover:bg-muted/80 ${isDragging ? "shadow-md border-primary ring-1 ring-primary" : ""}`}
        >
            <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">#{index + 1}</span>
            </div>
            <span className="font-bold">{item.name}</span>
        </div>
    )
}

export function DrawWinnersAction({ poolId, roundId, seats }: DrawWinnersActionProps) {
    const router = useRouter()

    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<"prompt" | "modify">("prompt")

    const [numWinners, setNumWinners] = useState("20")
    const [isDrawing, setIsDrawing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [selectedWinners, setSelectedWinners] = useState<DrawWinnerItem[]>([])

    const notFullyFilled = seats.some(s => s.status !== "SOLD")

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setSelectedWinners((items) => {
                const oldIndex = items.findIndex((item) => item.id.toString() === active.id)
                const newIndex = items.findIndex((item) => item.id.toString() === over.id)
                const reordered = arrayMove(items, oldIndex, newIndex)
                return reordered.map((item, idx) => ({ ...item, position: idx + 1 }))
            })
        }
    }

    const handleDrawClick = () => {
        setStep("prompt")
        setIsOpen(true)
    }

    const handleExecuteDraw = async () => {
        const count = parseInt(numWinners)
        if (isNaN(count) || count <= 0) {
            toast.error("Please enter a valid number of winners.")
            return
        }

        try {
            setIsDrawing(true)
            const res = await drawWinnerSeats(poolId, roundId, count)
            if (res.success && res.data) {
                const data = res.data as any
                const winners: DrawWinnerItem[] = data.winnerSeatsWithPosition || data.winnerSeatsWithPostion || []
                setSelectedWinners(winners)
                setStep("modify")
            } else {
                toast.error(res.message || "Failed to draw winners.")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred while drawing winners.")
        } finally {
            setIsDrawing(false)
        }
    }

    const handleSeatClick = (seat: Seat) => {
        const existing = selectedWinners.find(w => w.name === seat.name)
        if (existing) {
            const newWinners = selectedWinners
                .filter(w => w.name !== seat.name)
                .map((w, idx) => ({ ...w, position: idx + 1 }))
            setSelectedWinners(newWinners)
        } else {
            setSelectedWinners([
                ...selectedWinners,
                { id: seat.id, name: seat.name, position: selectedWinners.length + 1 }
            ])
        }
    }

    const handleSaveWinners = async () => {
        if (selectedWinners.length === 0) {
            toast.error("You must have at least 1 winner selected.")
            return
        }

        try {
            setIsSaving(true)
            const res = await setWinnerSeats(poolId, roundId, selectedWinners)
            if (res.success) {
                toast.success("Winners successfully saved!")
                setIsOpen(false)
                router.refresh()
            } else {
                toast.error(res.message || "Failed to save winners.")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred while saving winners.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Button onClick={handleDrawClick} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Trophy className="w-4 h-4" />
                Draw Winners
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                {step === "prompt" ? (
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Draw Winners</DialogTitle>
                            <DialogDescription>
                                Specify how many winners should be randomly drawn from this round.
                            </DialogDescription>
                        </DialogHeader>

                        {notFullyFilled && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 flex gap-3 text-amber-800 rounded-r-md">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <p className="text-sm">
                                    <strong>Warning:</strong> Not all seats are fully sold. Drawing winners now will include any seat based on your pool rules.
                                </p>
                            </div>
                        )}

                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="numWinners">Number of Winners</Label>
                                <Input
                                    id="numWinners"
                                    type="number"
                                    min={1}
                                    value={numWinners}
                                    onChange={(e) => setNumWinners(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button onClick={handleExecuteDraw} disabled={isDrawing}>
                                {isDrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Draw Now
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                ) : (
                    <DialogContent className="max-w-5xl sm:max-w-5xl lg:max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-2 border-b bg-background z-10">
                            <DialogTitle className="text-2xl flex items-center justify-between">
                                <span>Review &amp; Modify Winners</span>
                                <span className="text-muted-foreground text-sm font-normal">
                                    {selectedWinners.length} Selected
                                </span>
                            </DialogTitle>
                            <DialogDescription>
                                Click on any seat visually to toggle its winner status. Drag items in the list to re-order positions.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto bg-muted/10 p-6 flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 overflow-x-auto">
                                <SeatMap
                                    seats={seats}
                                    mode="select-winners"
                                    selectedWinnerNames={selectedWinners.map(w => w.name)}
                                    onSeatClick={handleSeatClick}
                                />
                            </div>
                            <div className="w-full lg:w-72 bg-card border rounded-xl p-4 flex flex-col h-max max-h-full overflow-y-auto shadow-sm">
                                <h3 className="font-semibold mb-3 border-b pb-2">Winner Positions</h3>
                                <div className="flex flex-col gap-2">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={selectedWinners.map(w => w.id.toString())}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {selectedWinners.map((w, idx) => (
                                                <SortableWinnerItem key={w.id} item={w} index={idx} />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                    {selectedWinners.length === 0 && (
                                        <p className="text-muted-foreground text-sm py-4 text-center">No winners selected.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t bg-background z-10 w-full mt-auto">
                            <Button className="mr-auto" variant="outline" onClick={() => setStep("prompt")}>Back</Button>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveWinners} disabled={isSaving || selectedWinners.length === 0}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm &amp; Save Winners
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </>
    )
}
