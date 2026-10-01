import { cookies } from "next/headers"

export type CurrentAdmin = {
    name: string
    email: string
}

const FALLBACK: CurrentAdmin = {
    name: "Admin",
    email: "",
}

// The login action stores the admin object returned by the backend in a
// plain (non-httpOnly) "admin" cookie so server components can read it
// without another API round trip. The sidebar used to show a hardcoded
// "Admin / admin@ltry.com" regardless of who was actually signed in.
export async function getCurrentAdmin(): Promise<CurrentAdmin> {
    try {
        const cookieStore = await cookies()
        const raw = cookieStore.get("admin")?.value
        if (!raw) return FALLBACK

        const parsed = JSON.parse(raw)
        return {
            name: typeof parsed?.name === "string" && parsed.name ? parsed.name : FALLBACK.name,
            email: typeof parsed?.email === "string" ? parsed.email : FALLBACK.email,
        }
    } catch {
        return FALLBACK
    }
}
