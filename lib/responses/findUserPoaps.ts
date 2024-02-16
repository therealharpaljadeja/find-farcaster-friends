import {
    FrameActionPayload,
    FrameButtonsType,
    getAddressForFid,
    getFrameHtml,
    validateFrameMessage,
} from "frames.js";
import {
    BASE_URL,
    ERROR_IMAGE_URL,
    NO_POAPS_FOUND,
    WALLET_NOT_CONNECTED_IMAGE_URL,
} from "../constants";
import { NextResponse } from "next/server";
import findPoapsForAddress from "../findPoapsForAddress";
import { UserData, pickRandomElements } from "../utils";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

export default async function findUserPoaps(body: FrameActionPayload) {
    let accountAddress: string | undefined;

    try {
        accountAddress = await getAddressForFid({
            fid: body.untrustedData.fid,
            options: { fallbackToCustodyAddress: true },
        });

        if (!accountAddress) {
            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: WALLET_NOT_CONNECTED_IMAGE_URL,
                    postUrl: `${BASE_URL}`,
                })
            );
        }

        let fid = body.untrustedData.fid;

        let userData = (await redis.get(fid.toString())) as UserData;

        if (!userData) {
            userData = {
                userOwnedPoaps: [],
                poapFriends: [],
                farcasterProfilesFromLens: [],
            };
        }

        if (!userData.userOwnedPoaps || !userData.userOwnedPoaps.length) {
            userData.userOwnedPoaps = await findPoapsForAddress(accountAddress);
        }

        let result = pickRandomElements(userData.userOwnedPoaps, 3);

        if (result) {
            if (result && result.length > 0) {
                let image = `${BASE_URL}/api/poapsImage?poaps=`;

                let poapImageUrls = result.map((poap: any) => poap.image_url);

                let encodedPoapImageUrls = encodeURIComponent(
                    JSON.stringify(poapImageUrls)
                );

                let poapEventIds = result.map((poap: any) => poap.eventId);

                let encodedPoapEventIds = encodeURIComponent(
                    JSON.stringify(poapEventIds)
                );

                redis.set(fid.toString(), { ...userData, poapFriends: [] });
                redis.expire(fid.toString(), 5 * 60); // Delete cursor after 5 minutes

                return new NextResponse(
                    getFrameHtml({
                        version: "vNext",
                        image: image + encodedPoapImageUrls,
                        buttons: [
                            ...result.map((res: any, index: number) => ({
                                label: index + 1,
                                action: "post",
                                target:
                                    `${BASE_URL}/api/findProfilesWithSamePoaps?eventIds=` +
                                    encodedPoapEventIds,
                            })),
                        ] as FrameButtonsType,
                        postUrl:
                            `${BASE_URL}/api/findProfilesWithSamePoaps?eventIds=` +
                            encodedPoapEventIds,
                    })
                );
            } else {
                return new NextResponse(
                    getFrameHtml({
                        version: "vNext",
                        image: NO_POAPS_FOUND,
                        postUrl: "",
                    })
                );
            }
        } else {
            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: NO_POAPS_FOUND,
                    postUrl: "",
                })
            );
        }
    } catch (e) {
        console.error(e);
        return new NextResponse(JSON.stringify({ status: "notok" }));
    }
}
