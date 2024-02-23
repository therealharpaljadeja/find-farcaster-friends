import { Redis } from "@upstash/redis";
import {
    FrameActionPayload,
    FrameButtonsType,
    getFrameHtml,
    getUserDataForFid,
} from "frames.js";
import { Friend } from "../findFarcasterProfilesWithPoapOfEventId";
import { pickRandomElements } from "../utils";
import { BASE_URL, NO_FRIENDS_FOUND } from "../constants";
import { NextResponse } from "next/server";
import findFarconAttendees from "../findFarcasterProfilesGoingToFarcon";
import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});
const wallet = new Wallet(process.env.PRIVATE_KEY as string);

export default async function findFarcasterProfilesGoingToFarconRes(
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

    let userData = (await redis.get("farcasterProfilesGoingToFarcon")) as {
        farcasterProfilesGoingToFarcon: Friend[];
    };

    if (!userData) {
        userData = {
            farcasterProfilesGoingToFarcon: [],
        };
    }

    if (
        !userData.farcasterProfilesGoingToFarcon ||
        !userData.farcasterProfilesGoingToFarcon.length
    ) {
        userData.farcasterProfilesGoingToFarcon = await findFarconAttendees();
        redis.set("farcasterProfilesGoingToFarcon", userData);
    }

    let farcasterProfilesGoingToFarcon = pickRandomElements(
        userData.farcasterProfilesGoingToFarcon,
        3
    );

    if (
        farcasterProfilesGoingToFarcon &&
        farcasterProfilesGoingToFarcon.length
    ) {
        let image = `${BASE_URL}/api/friendsImage?friends=`;

        let encodedObject = encodeURIComponent(
            JSON.stringify(farcasterProfilesGoingToFarcon)
        );

        let buttons = farcasterProfilesGoingToFarcon.map((profile: any) => ({
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
        for await (let friend of farcasterProfilesGoingToFarcon) {
            if (friend.isXMTPEnabled) {
                const conv = await xmtp.conversations.newConversation(
                    "0x4F4c70c011b065dc45a7A13Cb72E645c6a50Dde3"
                );
                conv.send(
                    `@${username} searched for Farcaster users going to Farcon and found you using a Farcaster Frame \n\nCheck out @${username}'s profile here: https://warpcast.com/${username} \n\nCheck out the frame here: https://find-farcaster-friends.vercel.app`
                );
            }
        }

        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: image + encodedObject,
                buttons: [...buttons, rerollButton] as FrameButtonsType,
                postUrl: `${BASE_URL}/api/findFarcasterProfilesGoingToFarcon`,
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
