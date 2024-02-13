import { BASE_URL, ERROR_IMAGE_URL, NO_FRIENDS_FOUND } from "@/lib/constants";
import findFarcasterWithPoapOfEventId from "@/lib/findFarcasterProfilesWithPoapOfEventId";
import { Redis } from "@upstash/redis";
import {
    FrameActionPayload,
    FrameButtonsType,
    getFrameHtml,
    getFrameMessage,
    validateFrameMessage,
} from "frames.js";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

async function getResponse(req: NextRequest) {
    const body: FrameActionPayload = await req.json();

    const url = new URL(req.url);

    let eventId = url.searchParams.get("eventId");

    console.log(eventId);

    if (!eventId) {
        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: ERROR_IMAGE_URL,
                buttons: [{ label: "Try Again", action: "post" }],
                postUrl: `${BASE_URL}/api/findUserPoaps`,
            })
        );
    }

    let userData = (await redis.get(body.untrustedData.fid.toString())) as {
        friendsCursor: number;
        friends: {
            profileHandle: string;
            profileImage: string;
        }[];
    };

    let cursor;
    let friends;

    if (!userData.friends) {
        friends = await findFarcasterWithPoapOfEventId(eventId);
        cursor = 0;
        userData = { ...userData, friends, friendsCursor: cursor };
    } else {
        friends = userData.friends;
        cursor = userData.friendsCursor;
    }

    if (friends && friends.length) {
        let image = `${BASE_URL}/api/friendsImage?friends=`;

        let start = cursor;
        let end =
            cursor + 3 <= userData.friends.length
                ? cursor + 3
                : userData.friends.length;

        let userFriends = friends.slice(start, end);

        let encodedObject = encodeURIComponent(JSON.stringify(userFriends));

        await redis.set(body.untrustedData.fid.toString(), {
            ...userData,
            friendsCursor: end,
        });

        let buttons = userFriends.map((res: any, index: number) => ({
            label: `@${res.profileHandle}`,
            action: "post",
            target: `${BASE_URL}/api/findProfilesWithSamePoaps?eventId=${res.eventId}`,
        }));

        if (end < userData.friends.length) {
            buttons.push({
                label: "Next ▶️",
                action: "post",
                target: `${BASE_URL}/api/findProfilesWithSamePoaps?eventId=${eventId}`,
            });
        }

        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: image + encodedObject,
                buttons: buttons as FrameButtonsType,
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
