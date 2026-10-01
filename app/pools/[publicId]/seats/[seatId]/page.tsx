import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentAdmin } from "@/lib/get-current-admin"
import { getSeatDetails, getPools } from "@/lib/api/pools"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, MapPin, User, DollarSign, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorDisplay } from "@/components/error-display"

export default async function SeatDetailPage(props: {
    params: Promise<{ publicId: string; seatId: string }>
}) {
    const params = await props.params
    let seatData: any = null
    let poolName = "Pool"
    let error = ""

    try {
        const response = await getSeatDetails(params.seatId)
        if (response.success) {
            seatData = response.data
        } else {
            error = response.message || "Failed to fetch seat details"
        }

        // Fetch pools to get the pool name
        const poolsRes = await getPools()
        if (poolsRes.success) {
            const match = poolsRes.data.find(p => p.publicId === params.publicId)
            if (match) poolName = match.name
        }
    } catch (err) {
        console.error("Failed to fetch seat details", err)
        error = "Error loading seat details"
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return "bg-green-100 text-green-800"
            case "RESERVED":
                return "bg-amber-100 text-amber-800"
            case "SOLD":
                return "bg-gray-100 text-gray-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getBookingStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800"
            case "COMPLETED":
                return "bg-green-100 text-green-800"
            case "FAILED":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const admin = await getCurrentAdmin()


    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" admin={admin} />
            <SidebarInset>
                <SiteHeader title={`${poolName} · Seat detail`} />
                <div className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-2 @container/main">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                            <div className="flex items-center gap-4 mb-2">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href={`/pools/${params.publicId}/seats`}>
                                        <ArrowLeftIcon className="h-4 w-4" />
                                        <span className="sr-only">Back to Seats</span>
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Seat Details</h1>
                                    <p className="text-muted-foreground">View complete information about this seat and its booking.</p>
                                </div>
                            </div>

                            <ErrorDisplay error={error} />

                            {seatData ? (
                                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                                    {/* Seat Information Card */}
                                    <Card className="lg:col-span-1">
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>Seat {seatData.name}</span>
                                                <Badge className={getStatusColor(seatData.status)}>
                                                    {seatData.status}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>Seat Information</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Pool</p>
                                                <p className="text-lg font-semibold">{poolName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <p className="text-lg font-semibold">{seatData.status}</p>
                                            </div>
                                            {seatData.createdAt && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        Created
                                                    </p>
                                                    <p className="text-sm">
                                                        {new Date(seatData.createdAt).toLocaleDateString()} at {new Date(seatData.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Booking Information Card */}
                                    {seatData.booking ? (
                                        <Card className="lg:col-span-2">
                                            <CardHeader>
                                                <CardTitle className="flex items-center justify-between">
                                                    <span>Booking Information</span>
                                                    <Badge className={getBookingStatusColor(seatData.booking.status)}>
                                                        {seatData.booking.status}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription>Details of the booking associated with this seat</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Payment Information */}
                                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4" />
                                                            Amount
                                                        </p>
                                                        <p className="text-2xl font-bold">₹{seatData.booking.amount}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Payment Status</p>
                                                        <p className="text-lg font-semibold">{seatData.booking.status}</p>
                                                    </div>
                                                </div>

                                                {seatData.booking.providerPaymentId && (
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <p className="text-sm text-muted-foreground">Provider Payment ID</p>
                                                        <p className="text-sm font-mono ">{seatData.booking.providerPaymentId}</p>
                                                    </div>
                                                )}
                                                {/* Related Seats */}
                                                {seatData.booking.seats && seatData.booking.seats.length > 0 && (
                                                    <div className="border-t pt-6">
                                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                                            <MapPin className="h-4 w-4" />
                                                            Seats in This Booking
                                                        </h3>
                                                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                                            {seatData.booking.seats.map((seat: any) => (
                                                                <Link key={seat.publicId} href={`/pools/${params.publicId}/seats/${seat.publicId}`}>
                                                                    <div className="p-3 border rounded-lg bg-muted/50 hover:bg-muted hover:shadow-md transition-all cursor-pointer">
                                                                        <p className="text-sm font-semibold text-primary">{seat.name}</p>
                                                                        {/* <p className="text-xs text-muted-foreground mt-1">{seat.publicId}</p> */}
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* User Information */}
                                                <div className="border-t pt-6">
                                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        Booking User Information
                                                    </h3>
                                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Name</p>
                                                            <p className="text-lg font-semibold">{seatData.booking.user.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Phone</p>
                                                            <p className="text-lg font-semibold">{seatData.booking.user.phone}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Timeline */}
                                                <div className="border-t pt-6">
                                                    <h3 className="font-semibold mb-4">Timeline</h3>
                                                    <div className="space-y-3">
                                                        {seatData.booking.createdAt && (
                                                            <div className="flex items-start gap-3">
                                                                <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                                                                <div>
                                                                    <p className="text-sm font-semibold">Booking Created</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(seatData.booking.createdAt).toLocaleDateString()} at {new Date(seatData.booking.createdAt).toLocaleTimeString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {seatData.booking.updatedAt && (
                                                            <div className="flex items-start gap-3">
                                                                <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                                                                <div>
                                                                    <p className="text-sm font-semibold">Last Updated</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(seatData.booking.updatedAt).toLocaleDateString()} at {new Date(seatData.booking.updatedAt).toLocaleTimeString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="lg:col-span-2">
                                            <CardHeader>
                                                <CardTitle>Booking Information</CardTitle>
                                                <CardDescription>No booking associated with this seat</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground">This seat is currently available and has no associated booking.</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground w-full">
                                    <p>Seat details could not be loaded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

