"use server";

import { ApiResponse } from "@/types/pool";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const getAuthHeaders = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    // Convert Next.js cookies to a standard Cookie header string
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}), // Forward cookies to backend
    };
};

const API_URL = process.env.API_URL || "http://localhost:3000/api/v1";

export async function logoutAdmin(): Promise<void> {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/admin/logout`, {
            method: "POST",
            headers,
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to logout: ${response.statusText}`);
        }

        // Clear cookies on client side
        const cookieStore = await cookies();
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");

    } catch (error) {
        console.error("Logout error:", error);
        // Still clear cookies even if API call fails
        const cookieStore = await cookies();
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");
    } finally {
        // Redirect to login page
        redirect("/Login");
    }
}
