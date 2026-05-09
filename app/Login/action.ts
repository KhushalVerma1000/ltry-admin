"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

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


export const loginAction = async (formData: FormData) => {
     
    const email = formData.get("email")?.valueOf()
    const password = formData.get("password")?.valueOf()
    // Validation
    if (typeof email !== "string" || typeof password !== "string") {
        throw new Error("Invalid form data")
    }

    // check for sql injection
    const sqlInjectionPattern = /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|OR|AND)\b|\-\-|\;|\')/i
    if (sqlInjectionPattern.test(email) || sqlInjectionPattern.test(password)) {
        throw new Error("Invalid input data")
    }


    const LogInData = {
        email,
        password,
    }
    const response = await fetch(process.env.API_URL + "/admin/login", {
        method: "POST",
        body: JSON.stringify(LogInData),
        headers: {
            "Content-Type": "application/json"
        }
    })


    if (!response.ok) {
        throw new Error("Login failed")
    }

    const data = await response.json()

    if (!data.success || !data.data.accessToken) {
        throw new Error("Invalid response from server")
    }

    // Set cookies
    await setCookie("accessToken", data.data.accessToken, 60 * 15) // 15 minutes
    await setCookie("refreshToken", data.data.refreshToken, 60 * 60 * 24 * 7) // 7 days
    await setCookie("admin", JSON.stringify(data.data.admin), 60 * 60 * 24 * 7) // 7 days

    // Redirect to dashboard
    redirect("/Dashboard")
}

