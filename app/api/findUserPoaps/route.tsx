import {
    BASE_URL,
    ERROR_IMAGE_URL,
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
} from "frames.js";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

// Function to pick random elements from the array
function pickRandomElements(array: any[], count: number) {
    const shuffled = array.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

async function getResponse(req: NextRequest) {
    let accountAddress: string | undefined;

    try {
        const body: FrameActionPayload = await req.json();

        const { isValid, message } = await validateFrameMessage(body, {
            hubHttpUrl: process.env.HUB_URL,
            hubRequestOptions: {
                headers: {
                    api_key: process.env.HUB_KEY as string,
                },
            },
        });

        if (!isValid || !message) {
            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: ERROR_IMAGE_URL,
                    buttons: [{ label: "Try Again", action: "post" }],
                    postUrl: `${BASE_URL}/api/findUserPoaps`,
                })
            );
        }

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

        let userData = (await redis.get(fid.toString())) as {
            userOwnedPoaps: {
                eventName: string;
                eventId: string;
                image_url: string;
            }[];
        };

        let result;

        if (userData && userData.userOwnedPoaps) {
            result = pickRandomElements(userData.userOwnedPoaps, 3);
        } else {
            userData = { userOwnedPoaps: [] };
            userData.userOwnedPoaps = await findPoapsForAddress(accountAddress);
            result = pickRandomElements(userData.userOwnedPoaps, 3);
        }

        if (result) {
            if (result && result.length > 0) {
                let image = `${BASE_URL}/api/poapsImage?poaps=`;

                let poapImageUrls = result.map((poap: any) => poap.image_url);

                let encodedPoapImageUrls = encodeURIComponent(
                    JSON.stringify(poapImageUrls)
                );

                console.log(result);
                let poapEventIds = result.map((poap: any) => poap.eventId);

                let encodedPoapEventIds = encodeURIComponent(
                    JSON.stringify(poapEventIds)
                );

                redis.set(fid.toString(), { userData });
                redis.expire(fid.toString(), 5 * 60); // Delete cursor after 5 minutes

                return new NextResponse(
                    getFrameHtml({
                        version: "vNext",
                        image: image + encodedPoapImageUrls,
                        buttons: [
                            ...result.map((res: any, index: number) => ({
                                label: index + 1,
                                action: "post",
                                target: `${BASE_URL}/api/findProfilesWithSamePoaps?eventId=${res.eventId}`,
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

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
