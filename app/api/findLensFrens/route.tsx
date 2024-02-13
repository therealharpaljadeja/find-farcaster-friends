import { BASE_URL, NO_FRIENDS_FOUND } from "@/lib/constants";
import { Friend } from "@/lib/findFarcasterProfilesWithPoapOfEventId";
import findLensFrensOnFarcaster from "@/lib/findLensFrensOnFarcaster";
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

    const fid = body.untrustedData.fid;

    const profileDetail = await getUserDataForFid({
        fid,
    });

    let username;
    if (profileDetail) {
        username = profileDetail.username;
    }

    let userData = (await redis.get(fid.toString())) as {
        farcasterProfilesFromLens: Friend[];
        cursor: number;
    };

    let farcasterProfilesFromLens;
    let cursor;

    if (userData) {
        farcasterProfilesFromLens = userData.farcasterProfilesFromLens;
        cursor = userData.cursor;
    } else {
        farcasterProfilesFromLens = await findLensFrensOnFarcaster(
            `fc_fid:${fid}`
        );
        cursor = 0;
        userData = { farcasterProfilesFromLens, cursor };
    }

    if (farcasterProfilesFromLens && farcasterProfilesFromLens.length) {
        let start = cursor;
        let end =
            cursor + 3 <= farcasterProfilesFromLens.length
                ? cursor + 3
                : farcasterProfilesFromLens.length;

        let result = farcasterProfilesFromLens.slice(start, end);

        let image = `${BASE_URL}/api/friendsImage?friends=`;

        let encodedObject = encodeURIComponent(JSON.stringify(result));

        let buttons = result.map((profile: any) => ({
            action: "link",
            label: `@${profile.profileHandle}`,
            target: `https://warpcast.com/${profile.profileHandle}`,
        }));

        // Send XMTP messages
        for await (let friend of result) {
            if (friend.isXMTPEnabled) {
                const conv = await xmtp.conversations.newConversation(
                    friend.xmtpReceiver
                );
                conv.send(
                    `@${username} found you using a Farcaster Frame \n\nCheck out @${username}'s profile here: https://warpcast.com/${username} \n\nCheck out the frame here: https://warpcast.com/harpaljadeja/0xc9d767b1`
                );
            }
        }

        if (end < farcasterProfilesFromLens.length) {
            buttons.push({
                action: "post",
                label: "Next ▶️",
                target: `${BASE_URL}/api/findLensFrens`,
            });
        }

        await redis.set(fid.toString(), { ...userData, cursor: end });

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
