"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { API_URL } from "@/lib/config"

export type LoginState = {
    error?: string
}

const setCookie = async (name: string, value: string, maxAge: number) => {
    const cookieStore = await cookies()
    cookieStore.set(name, value, {
        maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    })
}

export const loginAction = async (
    _prevState: LoginState,
    formData: FormData
): Promise<LoginState> => {

    const email = formData.get("email")?.valueOf()
    const password = formData.get("password")?.valueOf()

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
        return { error: "Enter your email and password to continue." }
    }

    // Note: the previous version of this action rejected any password
    // containing an apostrophe, a semicolon, or the standalone words
    // "and"/"or"/"select" etc. as a hand-rolled SQL-injection filter. The
    // backend already queries through Prisma with parameterized queries,
    // so that filter added no real protection — it just silently rejected
    // real admins with valid passwords ("O'Brien123", "Sales&Ops2024", ...)
    // with a generic "Invalid input data" error. Removed.

    let response: Response
    try {
        response = await fetch(`${API_URL}/admin/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: {
                "Content-Type": "application/json"
            },
            cache: "no-store"
        })
    } catch {
        // API_URL unreachable / DNS failure / backend down. Previously this
        // threw inside the server action with no handler, which Next.js
        // surfaced as a generic crash screen instead of a login error.
        return { error: "Can't reach the server right now. Check your connection and try again." }
    }

    if (!response.ok) {
        let message = "Something went wrong on our end. Please try again."
        try {
            const body = await response.json()
            if (typeof body?.message === "string" && body.message) {
                message = body.message
            }
        } catch {
            // Non-JSON error body — keep the generic message above.
        }

        if (response.status === 401 || response.status === 404) {
            message = "That email and password don't match our records."
        }

        return { error: message }
    }

    const data = await response.json()

    if (!data.success || !data.data?.accessToken) {
        return { error: "Something went wrong on our end. Please try again." }
    }

    await setCookie("accessToken", data.data.accessToken, 60 * 15) // 15 minutes
    await setCookie("refreshToken", data.data.refreshToken, 60 * 60 * 24 * 7) // 7 days
    await setCookie("admin", JSON.stringify(data.data.admin), 60 * 60 * 24 * 7) // 7 days

    redirect("/Dashboard")
}
