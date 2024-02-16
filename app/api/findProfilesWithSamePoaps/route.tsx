import { BASE_URL, ERROR_IMAGE_URL, NO_FRIENDS_FOUND } from "@/lib/constants";
import findFarcasterWithPoapOfEventId, {
    Friend,
} from "@/lib/findFarcasterProfilesWithPoapOfEventId";
import { pickRandomElements } from "@/lib/utils";
import { Redis } from "@upstash/redis";
import { FrameButtonsType, getFrameHtml, getFrameMessage } from "frames.js";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

async function getResponse(req: NextRequest) {
    const body = await req.json();

    let fid = body.untrustedData.fid;

    // const isValid = await validateFrameMessage(body);

    // if (!isValid) {
    //     return new NextResponse(
    //         getFrameHtml({
    //             version: "vNext",
    //             image: ERROR_IMAGE_URL,
    //             buttons: [{ label: "Try Again", action: "post" }],
    //             postUrl: `${BASE_URL}/api/findUserPoaps`,
    //         })
    //     );
    // }

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

    let userData = (await redis.get(fid.toString())) as {
        userOwnedPoaps: {
            eventName: string;
            eventId: string;
            image_url: string;
        }[];
        poapFriends: Friend[];
    };

    if (!userData) {
        userData = { userOwnedPoaps: [], poapFriends: [] };
    }

    if (!userData.poapFriends || !userData.poapFriends.length) {
        userData.poapFriends = await findFarcasterWithPoapOfEventId(
            eventIds[buttonIndex - 1],
            fid
        );
        redis.set(fid.toString(), userData);
        redis.expire(fid.toString(), 5 * 60); // Delete cursor after 5 minutes
    }

    let farcasterProfiles: Friend[] = pickRandomElements(
        userData.poapFriends,
        3
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
