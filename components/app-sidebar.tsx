"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, CommandIcon } from "lucide-react"
import type { CurrentAdmin } from "@/lib/get-current-admin"

const navMain = [
  {
    title: "Dashboard",
    url: "/Dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Pools",
    url: "/pools",
    icon: <ListIcon />,
  },
]

export function AppSidebar({
  admin,
  ...props
}: React.ComponentProps<typeof Sidebar> & { admin: CurrentAdmin }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/Dashboard">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">ltry Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={admin} />
      </SidebarFooter>
    </Sidebar>
  )
}
