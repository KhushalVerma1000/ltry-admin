"use server";

import { ApiResponse, Pool, PoolRound, RoundStatus, Seat, WinnerSeatDetail } from "@/types/pool";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";

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

async function apiFetch(url: string, options?: RequestInit) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorMsg = `Failed to fetch: ${response.statusText}`;
            try {
                // Try to extract detailed error from response
                const clonedResponse = response.clone();
                const errorData = await clonedResponse.json();
                if (errorData && errorData.message) {
                    errorMsg = errorData.message;
                } else if (errorData && errorData.error) {
                    errorMsg = errorData.error;
                } else {
                    const textData = await response.text();
                    if (textData) errorMsg = textData;
                }
            } catch (e) {
                const textData = await response.text().catch(() => "");
                if (textData) errorMsg = textData;
            }
            throw new Error(errorMsg);
        }
        return response;
    } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("fetch failed")) {
            throw new Error("Unable to connect to the backend server. Please verify your connection or check if the server is running.");
        }
        throw error;
    }
}

// ── Pools ──────────────────────────────────────────────────────────────────

/** GET /pools — returns list of pools each with their activeRound */
export async function getPools(): Promise<ApiResponse<Pool[]>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/pools`, {
        method: "GET",
        headers,
        cache: "no-store",
    });
    return response.json();
}

/** GET /pools/p/:publicId — returns pool with its recent rounds */
export async function getPoolById(publicId: string): Promise<ApiResponse<Pool>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/pools/p/${publicId}`, {
        method: "GET",
        headers,
        cache: "no-store",
    });
    return response.json();
}

/** POST /pools/create */
export async function createPool(data: {
    name: string;
    perSeatPrice: number;
    totalSeats: number;
    notes?: string;
}): Promise<ApiResponse<Pool>> {
    const headers = await getAuthHeaders();
    if (data.totalSeats % 4 !== 0) {
        throw new Error("Total seats must be divisible by 4.");
    }
    const response = await apiFetch(`${API_URL}/pools/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    return response.json();
}

/** PUT /pools/update/:publicId */
export async function updatePool(
    publicId: string,
    data: Partial<{
        name: string;
        perSeatPrice: number;
        totalSeats: number;
        notes: string;
    }>
): Promise<ApiResponse<Pool>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/pools/update/${publicId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
    });
    return response.json();
}

/** DELETE /pools/delete/:publicId */
export async function deletePool(poolId: string): Promise<ApiResponse<Pool>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/pools/delete/${poolId}`, {
        method: "DELETE",
        headers,
    });
    return response.json();
}

// ── PoolRounds ─────────────────────────────────────────────────────────────

/** GET /pools/:publicId/rounds — returns all rounds for a pool */
export async function getPoolRounds(poolPublicId: string): Promise<ApiResponse<PoolRound[]>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/pools/admin/${poolPublicId}/rounds`, {
        method: "GET",
        headers,
        cache: "no-store",
    });
    return response.json();
}

/** POST /pools/:publicId/round/create */
export async function createPoolRound(
    poolPublicId: string,
    data: {
        roundNumber: number;
        startsAt: string;
        endsAt: string;
    }
): Promise<ApiResponse<PoolRound>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/pools/${poolPublicId}/round/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    return response.json();
}

/** PUT /pools/:poolId/round/:roundId/status */
export async function updateRoundStatus(
    poolPublicId: string,
    roundPublicId: string,
    status: RoundStatus,
    drawnAt?: string
): Promise<ApiResponse<PoolRound>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(
        `${API_URL}/pools/${poolPublicId}/round/${roundPublicId}/status`,
        {
            method: "PUT",
            headers,
            body: JSON.stringify({ status, drawnAt }),
        }
    );
    return response.json();
}

/** PUT /pools/:poolId/round/:roundId/reset */
export async function resetRound(
    poolPublicId: string,
    roundPublicId: string
): Promise<ApiResponse<{ count: number }>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(
        `${API_URL}/pools/${poolPublicId}/round/${roundPublicId}/reset`,
        {
            method: "PUT",
            headers,
        }
    );
    return response.json();
}

// ── Seats ──────────────────────────────────────────────────────────────────

/** GET /seats/round/:roundId — returns all seats for a round */
export async function getRoundSeats(roundPublicId: string): Promise<ApiResponse<Seat[]>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/seats/round/${roundPublicId}`, {
        method: "GET",
        headers,
        cache: "no-store",
    });
    return response.json();
}

/** GET /seats/detail/:seatid — admin seat detail */
export async function getSeatDetails(seatId: string): Promise<ApiResponse<Seat>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/seats/detail/${seatId}`, {
        method: "GET",
        headers,
        cache: "no-store",
    });
    return response.json();
}

// ── Winners ────────────────────────────────────────────────────────────────

/** POST /admin/draw-winner-seats — poolId + roundId + numberOfWinners */
export async function drawWinnerSeats(
    poolId: string,
    roundId: string,
    numberOfWinners: number
): Promise<ApiResponse<import("@/types/pool").DrawWinnersData>> {
    const headers = await getAuthHeaders();
    headers["Content-Type"] = "application/x-www-form-urlencoded";

    const body = new URLSearchParams();
    body.append("poolId", poolId);
    body.append("roundId", roundId);
    body.append("numberOfWinners", numberOfWinners.toString());

    const response = await apiFetch(`${API_URL}/admin/draw-winner-seats`, {
        method: "POST",
        headers,
        body,
        cache: "no-store",
    });
    return response.json();
}

/** POST /admin/set-winner-seats — poolId + roundId + winnerSeats */
export async function setWinnerSeats(
    poolId: string,
    roundId: string,
    winnerSeats: import("@/types/pool").DrawWinnerItem[]
): Promise<ApiResponse<any>> {
    const headers = await getAuthHeaders();
    headers["Content-Type"] = "application/x-www-form-urlencoded";

    const body = new URLSearchParams();
    body.append("poolId", poolId);
    body.append("roundId", roundId);
    body.append("winnerSeats", JSON.stringify(winnerSeats));

    const response = await apiFetch(`${API_URL}/admin/set-winner-seats`, {
        method: "POST",
        headers,
        body,
        cache: "no-store",
    });
    return response.json();
}

/** GET /winners/:poolId/round/:roundId */
export async function getWinnersForRound(
    poolPublicId: string,
    roundPublicId: string
): Promise<ApiResponse<WinnerSeatDetail[]>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(
        `${API_URL}/winners/${poolPublicId}/round/${roundPublicId}`,
        {
            method: "GET",
            headers,
            cache: "no-store",
        }
    );
    return response.json();
}

/** PUT /winners/:winnerId/pay — marks a winner as paid */
export async function markWinnerAsPaid(
    winnerId: number
): Promise<ApiResponse<WinnerSeatDetail>> {
    const headers = await getAuthHeaders();
    const response = await apiFetch(`${API_URL}/winners/${winnerId}/paid`, {
        method: "PATCH",
        headers,
    });
    return response.json();
}
