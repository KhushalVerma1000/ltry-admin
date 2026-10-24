import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { VerificationList } from "@/components/verifications/verification-list"
import { getCurrentAdmin } from "@/lib/get-current-admin"
import { getPayoutVerifications } from "@/lib/api/verifications"
import type { PayoutVerification, PayoutVerificationPage } from "@/types/pool"

const TABS: { status: PayoutVerification; label: string }[] = [
    { status: "UNVERIFIED", label: "Pending" },
    { status: "VERIFIED", label: "Verified" },
    { status: "REJECTED", label: "Rejected" },
]

export default async function VerificationsPage(props: {
    searchParams: Promise<{ status?: string; page?: string }>
}) {
    const sp = await props.searchParams
    const status = (TABS.find((t) => t.status === sp.status?.toUpperCase())?.status ?? "UNVERIFIED") as PayoutVerification
    const page = Math.max(parseInt(sp.page ?? "1", 10) || 1, 1)

    let result: PayoutVerificationPage | null = null
    let error: string | null = null
    try {
        const res = await getPayoutVerifications(status, page)
        if (res.success) result = res.data
        else error = res.message || "Could not load the list"
    } catch (e) {
        error = e instanceof Error ? e.message : "Could not load the list"
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
                <SiteHeader title="Payout verification" />
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payout verification</h1>
                        <p className="text-muted-foreground text-sm max-w-2xl">
                            Check each user&apos;s bank/UPI details (for example, the account holder&apos;s name matches their
                            registered name) before their first payout. A prize can only be marked paid for verified users.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {TABS.map((t) => (
                            <Link
                                key={t.status}
                                href={`/verifications?status=${t.status}`}
                                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                                    t.status === status ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                }`}
                            >
                                {t.label}
                            </Link>
                        ))}
                    </div>

                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : (
                        <>
                            <VerificationList rows={result?.data ?? []} />
                            {result && result.pagination.totalPages > 1 && (
                                <div className="flex items-center gap-3 text-sm">
                                    {result.pagination.hasPrev && (
                                        <Link className="underline" href={`/verifications?status=${status}&page=${page - 1}`}>
                                            Previous
                                        </Link>
                                    )}
                                    <span className="text-muted-foreground">
                                        Page {result.pagination.page} of {result.pagination.totalPages}
                                    </span>
                                    {result.pagination.hasNext && (
                                        <Link className="underline" href={`/verifications?status=${status}&page=${page + 1}`}>
                                            Next
                                        </Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
