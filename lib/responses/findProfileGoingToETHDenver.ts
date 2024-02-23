import { Redis } from "@upstash/redis";
import {
    FrameActionPayload,
    FrameButtonsType,
    getFrameHtml,
    getUserDataForFid,
} from "frames.js";
import { Friend } from "../findFarcasterProfilesWithPoapOfEventId";
import { pickRandomElements } from "../utils";
import findFarcasterProfilesGoingToETHDenver from "../findFarcasterProfilesGoingToETHDenver";
import { BASE_URL, NO_FRIENDS_FOUND } from "../constants";
import { NextResponse } from "next/server";
import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

const wallet = new Wallet(process.env.PRIVATE_KEY as string);

export default async function findFarcasterProfilesGoingToETHDenverRes(
    body: FrameActionPayload
) {
    const fid = body.untrustedData.fid;

    const profileDetail = await getUserDataForFid({
        fid,
    });

    let username;

    if (profileDetail) {
        username = profileDetail.username;
    }

    let userData = (await redis.get("farcasterProfilesGoingToETHDenver")) as {
        farcasterProfilesGoingToETHDenver: Friend[];
    };

    if (!userData) {
        userData = {
            farcasterProfilesGoingToETHDenver: [],
        };
    }

    if (
        !userData.farcasterProfilesGoingToETHDenver ||
        !userData.farcasterProfilesGoingToETHDenver.length
    ) {
        userData.farcasterProfilesGoingToETHDenver =
            await findFarcasterProfilesGoingToETHDenver();
        redis.set("farcasterProfilesGoingToETHDenver", userData);
    }

    let farcasterProfilesGoingToETHDenver = pickRandomElements(
        userData.farcasterProfilesGoingToETHDenver,
        3
    );

    if (
        farcasterProfilesGoingToETHDenver &&
        farcasterProfilesGoingToETHDenver.length
    ) {
        let image = `${BASE_URL}/api/friendsImage?friends=`;

        let encodedObject = encodeURIComponent(
            JSON.stringify(farcasterProfilesGoingToETHDenver)
        );

        let buttons = farcasterProfilesGoingToETHDenver.map((profile: any) => ({
            action: "link",
            label: `@${profile.profileHandle}`,
            target: `https://warpcast.com/${profile.profileHandle}`,
        }));

        let rerollButton = {
            action: "post",
            label: "Reroll 🔄",
        };

        const xmtp = await Client.create(wallet, {
            env: "production",
        });

        // Send XMTP messages
        for await (let friend of farcasterProfilesGoingToETHDenver) {
            if (friend.isXMTPEnabled) {
                const conv = await xmtp.conversations.newConversation(
                    "0x4F4c70c011b065dc45a7A13Cb72E645c6a50Dde3"
                );
                conv.send(
                    `@${username} searched for Farcaster profiles attending ETHDenver and found you using a Farcaster Frame \n\nCheck out the frame here: https://find-farcaster-friends.vercel.app \n\n @${username}'s profile here: https://warpcast.com/${username}`
                );
            }
        }

        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: image + encodedObject,
                buttons: [...buttons, rerollButton] as FrameButtonsType,
                postUrl: `${BASE_URL}/api/findFarcasterProfilesGoingToETHDenver`,
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
