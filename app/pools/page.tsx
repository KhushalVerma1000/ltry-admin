import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PoolList } from "@/components/pools/pool-list"
import { getPools } from "@/lib/api/pools"

export default async function PoolsPage() {
    let poolsResponse;
    try {
        poolsResponse = await getPools();
    } catch (error) {
        console.error("Failed to fetch pools on pools list page", error);
        poolsResponse = { data: [], success: false, message: "Error", statusCode: 500 };
    }

    const pools = poolsResponse.data || [];

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-2 @container/main">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Pools Management</h1>
                                    <p className="text-muted-foreground">Manage lottery pools and pricing.</p>
                                </div>
                            </div>
                            <PoolList initialPools={pools} />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

