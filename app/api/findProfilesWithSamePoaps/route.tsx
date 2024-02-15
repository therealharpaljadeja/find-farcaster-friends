import { BASE_URL, ERROR_IMAGE_URL, NO_FRIENDS_FOUND } from "@/lib/constants";
import findFarcasterWithPoapOfEventId, {
    Friend,
} from "@/lib/findFarcasterProfilesWithPoapOfEventId";
import { Redis } from "@upstash/redis";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import {
    FrameActionPayload,
    FrameButtonsType,
    getFrameHtml,
    getUserDataForFid,
} from "frames.js";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

let wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string);

async function getResponse(req: NextRequest) {
    const xmtp = await Client.create(wallet, {
        env: "production",
    });

    const body: FrameActionPayload = await req.json();

    const profileDetail = await getUserDataForFid({
        fid: body.untrustedData.fid,
    });

    let username;
    if (profileDetail) {
        username = profileDetail.username;
    }

    const url = new URL(req.url);

    let eventId = url.searchParams.get("eventId");

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
        friends: Friend[];
    };

    let cursor;
    let friends;

    if (!userData.friends) {
        // If Data is not already available in Redis then fetch it
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

        if (userFriends.length) {
            let encodedObject = encodeURIComponent(JSON.stringify(userFriends));

            // Update cursor in Redis for next fetch
            await redis.set(body.untrustedData.fid.toString(), {
                ...userData,
                friendsCursor: end,
            });

            redis.expire(body.untrustedData.fid.toString(), 5 * 60);

            // Send XMTP messages
            for await (let friend of userFriends) {
                if (friend.isXMTPEnabled) {
                    console.log(`Message sent to: ${friend.profileHandle}`);
                    const conv = await xmtp.conversations.newConversation(
                        friend.xmtpReceiver
                    );
                    conv.send(
                        `Hey @${friend.profileHandle},\n@${username} found you using a Farcaster Frame \n\nCheck out @${username}'s profile here: https://warpcast.com/${username} \n\nCheck out the frame here: https://find-farcaster-friends.vercel.app`
                    );
                }
            }

            let buttons = userFriends.map((res: any, index: number) => ({
                label: `@${res.profileHandle}`,
                action: "link",
                target: `https://warpcast.com/${res.profileHandle}`,
            }));

            if (end < userData.friends.length) {
                buttons.push({
                    label: "Next ▶️",
                    action: "post",
                    target: `${BASE_URL}/api/findProfilesWithSamePoaps?eventId=${eventId}`,
                });
            }

            console.log(image + encodedObject);

            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: image + encodedObject,
                    buttons: buttons as FrameButtonsType,
                    postUrl: "",
                })
            );
        } else {
            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: NO_FRIENDS_FOUND,
                    postUrl: "",
                })
            );
        }
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
