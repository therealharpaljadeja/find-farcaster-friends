import {
    BASE_URL,
    NO_POAPS_FOUND,
    WALLET_NOT_CONNECTED_IMAGE_URL,
} from "@/lib/constants";
import findPoapsForAddress from "@/lib/findPoapsForAddress";
import { Redis } from "@upstash/redis";
import {
    FrameActionPayload,
    FrameButtonsType,
    getAddressForFid,
    getFrameHtml,
    validateFrameMessage,
} from "frames.js";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

async function getResponse(req: NextRequest) {
    let accountAddress: string | undefined;

    try {
        const body: FrameActionPayload = await req.json();

        console.log(body.untrustedData.fid);

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

        let cursor;
        let result;

        let userData = (await redis.get(fid.toString())) as {
            poapCursor: number;
            userOwnedPoaps: {
                eventName: string;
                eventId: string;
                image_url: string;
            }[];
        };

        if (!userData) {
            result = await findPoapsForAddress(accountAddress);
            cursor = 0;
            userData = { userOwnedPoaps: result, poapCursor: 0 };
        } else {
            result = userData.userOwnedPoaps;
            cursor = userData.poapCursor;
        }

        if (result) {
            let start = cursor;
            let end =
                cursor + 3 <= userData.userOwnedPoaps.length
                    ? cursor + 3
                    : userData.userOwnedPoaps.length;
            let userOwnedPoaps = result.slice(start, end);

            if (userOwnedPoaps && userOwnedPoaps.length > 0) {
                let image = `${BASE_URL}/api/poapsImage?poaps=`;

                let poapImageUrls = userOwnedPoaps.map(
                    (poap: any) => poap.image_url
                );

                let encodedPoapImageUrls = encodeURIComponent(
                    JSON.stringify(poapImageUrls)
                );

                let poapEventIds = userOwnedPoaps.map(
                    (poap: any) => poap.eventId
                );

                let encodedPoapEventIds = encodeURIComponent(
                    JSON.stringify(poapEventIds)
                );

                redis.set(fid.toString(), {
                    ...userData,
                    poapCursor: end,
                });

                redis.expire(fid.toString(), 5 * 60); // Delete cursor after 5 minutes

                let buttons = userOwnedPoaps.map((res: any, index: number) => ({
                    label: index + 1,
                    action: "post",
                    target: `${BASE_URL}/api/findProfilesWithSamePoaps?eventId=${res.eventId}`,
                }));

                if (end < userData.userOwnedPoaps.length) {
                    buttons.push({
                        label: "Next ▶️",
                        action: "post",
                        target: `${BASE_URL}/api/findUserPoaps`,
                    });
                }

                return new NextResponse(
                    getFrameHtml({
                        version: "vNext",
                        image: image + encodedPoapImageUrls,
                        buttons: buttons as FrameButtonsType,
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

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
