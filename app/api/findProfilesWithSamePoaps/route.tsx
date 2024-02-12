import { BASE_URL, ERROR_IMAGE_URL, NO_FRIENDS_FOUND } from "@/lib/constants";
import findFarcasterWithPoapOfEventId from "@/lib/findFarcasterProfilesWithPoapOfEventId";
import {
    FrameButton,
    FrameButtonsType,
    getFrameHtml,
    getFrameMessage,
    validateFrameMessage,
} from "frames.js";
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
                postUrl: `${BASE_URL}/api/findUserPoaps`,
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
                postUrl: `${BASE_URL}/api/findUserPoaps`,
            })
        );
    }

    const { buttonIndex } = await getFrameMessage(body);

    if (buttonIndex > 3) {
        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: ERROR_IMAGE_URL,
                buttons: [{ label: "Try Again", action: "post" }],
                postUrl: `${BASE_URL}/api/findUserPoaps`,
            })
        );
    }

    const farcasterProfiles = await findFarcasterWithPoapOfEventId(
        eventIds[buttonIndex - 1]
    );

    if (farcasterProfiles && farcasterProfiles.length) {
        let image = `${BASE_URL}/api/friendsImage?friends=`;

        let encodedObject = encodeURIComponent(
            JSON.stringify(farcasterProfiles)
        );

        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: image + encodedObject,
                buttons: farcasterProfiles.map((profile: any) => ({
                    action: "link",
                    label: `@${profile.profileHandle}`,
                    target: `https://warpcast.com/${profile.profileHandle}`,
                })) as FrameButtonsType,
                postUrl: "",
            })
        );
    }

    return new NextResponse(
        getFrameHtml({
            version: "vNext",
            image: NO_FRIENDS_FOUND,
            postUrl: "",
        })
    );
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
