"use server";

import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";
import type {
    ApiResponse,
    PayoutVerification,
    PayoutVerificationPage,
} from "@/types/pool";

const getAuthHeaders = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };
};

/** GET /admin/payout-verifications */
export async function getPayoutVerifications(
    status: PayoutVerification,
    page = 1
): Promise<ApiResponse<PayoutVerificationPage>> {
    const headers = await getAuthHeaders();
    const res = await fetch(
        `${API_URL}/admin/payout-verifications?status=${status}&page=${page}&limit=20`,
        { headers, cache: "no-store" }
    );
    return res.json();
}

/** PATCH /admin/users/:userId/payout-verification */
export async function setPayoutVerification(
    userPublicId: string,
    status: PayoutVerification,
    note?: string
): Promise<ApiResponse<unknown>> {
    const headers = await getAuthHeaders();
    const res = await fetch(
        `${API_URL}/admin/users/${encodeURIComponent(userPublicId)}/payout-verification`,
        {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status, note }),
            cache: "no-store",
        }
    );
    return res.json();
}
