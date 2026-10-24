export type SeatStatus = "AVAILABLE" | "RESERVED" | "SOLD";
export type BookingStatus = "PENDING" | "COMPLETED" | "FAILED";
export type RoundStatus = "UPCOMING" | "ACTIVE" | "DRAWING" | "CLOSED" | "CANCELLED";

// ── PoolRound ──────────────────────────────────────────────────────────────
export interface PoolRound {
    publicId: string;
    roundNumber: number;
    status: RoundStatus;
    startsAt: string;
    endsAt: string;
    priceSnapshot: string | number;
    seatsSnapshot: number;
    drawnAt?: string | null;
    /** Available seat count from _count.seats (only present on list endpoints) */
    availableSeats?: number;
    /** Raw _count object returned by getPoolRounds */
    _count?: {
        seats: number;
        bookings: number;
        winners: number;
    };
}

// ── Pool ───────────────────────────────────────────────────────────────────
export interface Pool {
    id?: number;
    name: string;
    perSeatPrice: string | number;
    totalSeats: number;
    publicId: string;
    createdAt?: string;
    updatedAt?: string;
    notes?: string | null;
    /** The current ACTIVE round (if any), returned by getAllPools */
    activeRound?: PoolRound | null;
    /** Recent rounds, returned by getPoolById */
    rounds?: PoolRound[];
}

// ── Seat ───────────────────────────────────────────────────────────────────
export interface Seat {
    id: number;
    name: string;
    poolId?: number;
    roundId?: number;
    status: SeatStatus;
    bookingId: string | null;
    createdAt?: string;
    updatedAt?: string;
    publicId: string;
    booking?: Booking | null;
    round?: Pick<PoolRound, "publicId" | "roundNumber">;
}

// ── Booking ────────────────────────────────────────────────────────────────
export interface Booking {
    id: string;
    amount: string | number;
    providerOrderId?: string | null;
    providerPaymentId?: string | null;
    status: BookingStatus;
    userId?: number;
    createdAt?: string;
    updatedAt?: string;
    user?: User;
    seats?: Seat[];
}

// ── Winner ─────────────────────────────────────────────────────────────────
export interface Winner {
    id: number;
    position: number;
    prize?: string | number;
    paid?: boolean;
    paidAt?: string | null;
    seatId?: number;
    roundId?: number;
    poolId?: number;
    seat?: Seat;
    round?: Pick<PoolRound, "publicId" | "roundNumber">;
}

// ── User ───────────────────────────────────────────────────────────────────
export interface User {
    id?: number;
    publicId?: string;
    name: string;
    phone: string | number;
    createdAt?: string;
    updatedAt?: string;
}

// ── Draw winner flow ────────────────────────────────────────────────────────
export interface DrawWinnerItem {
    id?: number;
    publicId: string;
    name: string;
    position: number;
}

export interface DrawWinnersData {
    poolId: string;
    roundId: string;
    roundNumber: number;
    numberOfWinners: string | number;
    winnerSeatsWithPosition: DrawWinnerItem[];
    totalAvailableSeats: number;
}

// ── Generic API response wrapper ───────────────────────────────────────────
export interface ApiResponse<T> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
}

// ── Winner Seats (from GET /admin/winners/:poolId/round/:roundId) ──────────
export type PayoutVerification = "UNVERIFIED" | "VERIFIED" | "REJECTED";

export interface WinnerSeatUser {
    publicId: string;
    name: string;
    phone: string;
    bankAccountNumber: string | null;
    bankIFSCCode: string | null;
    upiId: string | null;
    payoutVerification: PayoutVerification;
    payoutVerificationNote: string | null;
}

export interface WinnerSeatDetail {
    id: number;
    position: number;
    prize: string;
    paid?: boolean;
    paidAt?: string | null;
    seat: {
        name: string;
        publicId: string;
    };
    bookingId: string | null;
    providerOrderId: string | null;
    /** The user holding the seat's completed booking, or null if unclaimed. */
    user: WinnerSeatUser | null;
}

// ── Payout verification (from GET /admin/payout-verifications) ─────────────
export interface PayoutVerificationRow {
    publicId: string;
    name: string;
    phone: string;
    bankAccountNumber: string | null;
    bankIFSCCode: string | null;
    upiId: string | null;
    payoutVerification: PayoutVerification;
    payoutVerifiedAt: string | null;
    payoutVerificationNote: string | null;
    createdAt: string;
    unpaidWinnings: { count: number; amount: number };
}

export interface PayoutVerificationPage {
    data: PayoutVerificationRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
