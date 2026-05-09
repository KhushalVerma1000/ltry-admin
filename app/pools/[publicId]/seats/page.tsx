import { redirect } from "next/navigation"

/**
 * The old /pools/[publicId]/seats route is no longer used.
 * Seats are now scoped to a round: /pools/[publicId]/rounds/[roundId]/seats
 * Redirect to the rounds listing page for this pool.
 */
export default async function OldSeatsPageRedirect(
    props: { params: Promise<{ publicId: string }> }
) {
    const params = await props.params
    redirect(`/pools/${params.publicId}/rounds`)
}
