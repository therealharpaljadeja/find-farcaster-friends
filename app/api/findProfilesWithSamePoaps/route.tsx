import { BASE_URL, ERROR_IMAGE_URL } from "@/lib/constants";
import FindFarcasterWithPoapOfEventId from "@/lib/findFarcasterProfilesWithPoapOfEventId";
import { getFrameHtml, getFrameMessage, validateFrameMessage } from "frames.js";
import { NextRequest, NextResponse } from "next/server";

async function getResponse(req: NextRequest) {
    const body = await req.json();

    const isValid = await validateFrameMessage(body);

    if (!isValid) {
        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: ERROR_IMAGE_URL,
                buttons: [{ label: "Try Again", action: "post" }],
                postUrl: `${BASE_URL}/api/mint`,
            })
        );
    }

    const url = new URL(req.url);

    let eventIdsFromUrl = url.searchParams.get("eventIds");

    let eventIds: string[] = JSON.parse(eventIdsFromUrl as string);

    if (!eventIds) {
        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: ERROR_IMAGE_URL,
                buttons: [{ label: "Try Again", action: "post" }],
                postUrl: `${BASE_URL}/api/mint`,
            })
        );
    }

    const { buttonIndex } = await getFrameMessage(body);
    const farcasterProfiles = await FindFarcasterWithPoapOfEventId(
        eventIds[buttonIndex - 1]
    );

    let image = `${BASE_URL}/api/friendsImage?friends=`;

    let encodedObject = encodeURIComponent(JSON.stringify(farcasterProfiles));

    return new NextResponse(
        getFrameHtml({
            version: "vNext",
            image: image + encodedObject,
            buttons: [
                {
                    action: "link",
                    label: `@${farcasterProfiles[0].profileHandle}`,
                    target: `https://warpcast.com/${farcasterProfiles[0].profileHandle}`,
                },
                {
                    action: "link",
                    label: `@${farcasterProfiles[1].profileHandle}`,
                    target: `https://warpcast.com/${farcasterProfiles[1].profileHandle}`,
                },
                {
                    action: "link",
                    label: `@${farcasterProfiles[2].profileHandle}`,
                    target: `https://warpcast.com/${farcasterProfiles[2].profileHandle}`,
                },
            ],
            postUrl: "",
        })
    );
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
