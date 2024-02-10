import FindFarcasterWithPoapOfEventId from "@/lib/findFarcasterProfilesWithPoapOfEventId";

export const GET = async (req: Request, res: Response) => {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") ?? undefined;
    if (!eventId) {
        return new Response("Error: no eventId", { status: 400 });
    }

    const farcasterProfiles = await FindFarcasterWithPoapOfEventId(eventId);

    return new Response(
        JSON.stringify({
            farcasterProfilesWithPoapOfEventId: farcasterProfiles,
        }),
        {
            status: 200,
            headers: {
                "Content-type": "application/json",
            },
        }
    );
};
