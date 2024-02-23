import {
    FrameActionPayload,
    FrameButtonsType,
    getFrameHtml,
    getFrameMessage,
    getUserDataForFid,
} from "frames.js";
import { NextResponse } from "next/server";
import { BASE_URL, ERROR_IMAGE_URL, NO_FRIENDS_FOUND } from "../constants";
import { Redis } from "@upstash/redis";
import findFarcasterWithPoapOfEventId, {
    Friend,
} from "../findFarcasterProfilesWithPoapOfEventId";
import { pickRandomElements } from "../utils";
// import { Client } from "@xmtp/xmtp-js";
// import { Wallet } from "ethers";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

// const wallet = new Wallet(process.env.PRIVATE_KEY as string);

export default async function findProfileWithSamePoaps(
    body: FrameActionPayload,
    urlFromReq: string
) {
    let fid = body.untrustedData.fid;

    const profileDetail = await getUserDataForFid({
        fid,
    });

    let username;

    if (profileDetail) {
        username = profileDetail.username;
    }

    const url = new URL(urlFromReq);

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

    if (buttonIndex > 4) {
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

        let buttons = farcasterProfiles.map((profile: any) => ({
            action: "link",
            label: `@${profile.profileHandle}`,
            target: `https://warpcast.com/${profile.profileHandle}`,
        }));

        let rerollButton = {
            action: "post",
            label: "Reroll 🔄",
            target: urlFromReq,
        };

        // const xmtp = await Client.create(wallet, {
        //     env: "production",
        // });

        // for await (let friend of farcasterProfiles) {
        //     if (friend.isXMTPEnabled) {
        //         const conv = await xmtp.conversations.newConversation(
        //             "0x4F4c70c011b065dc45a7A13Cb72E645c6a50Dde3"
        //         );
        //         conv.send(
        //             `@${username} found you using a Farcaster Frame \n\n @${username}'s profile here: https://warpcast.com/${username} \n\nCheck out the frame here: https://find-farcaster-friends.vercel.app`
        //         );
        //     }
        // }

        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: image + encodedObject,
                buttons: [...buttons, rerollButton] as FrameButtonsType,
                postUrl: urlFromReq,
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
