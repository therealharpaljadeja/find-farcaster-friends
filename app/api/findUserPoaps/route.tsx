import {
    BASE_URL,
    ERROR_IMAGE_URL,
    NO_POAPS_FOUND,
    WALLET_NOT_CONNECTED_IMAGE_URL,
} from "@/lib/constants";
import findPoapsForAddress from "@/lib/findPoapsForAddress";
import {
    FrameActionPayload,
    getAddressForFid,
    getFrameHtml,
    validateFrameMessage,
} from "frames.js";
import { NextRequest, NextResponse } from "next/server";

async function getResponse(req: NextRequest) {
    let accountAddress: string | undefined;

    try {
        const body: FrameActionPayload = await req.json();

        const { isValid } = await validateFrameMessage(body, {
            hubHttpUrl: process.env.HUB_URL,
            hubRequestOptions: {
                headers: {
                    api_key: process.env.HUB_KEY as string,
                },
            },
        });

        if (!isValid) {
            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: ERROR_IMAGE_URL,
                    buttons: [{ label: "Try Again", action: "post" }],
                    postUrl: `${BASE_URL}`,
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

        let result = await findPoapsForAddress(accountAddress);

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

            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: image + encodedPoapImageUrls,
                    buttons: result.map((res: any, index: number) => ({
                        label: index + 1,
                        action: "post",
                        target: `${BASE_URL}/api/findProfilesWithSameProps?eventId=${res.eventId}`,
                    })),
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
    } catch (e) {
        console.error(e);

        return new NextResponse(JSON.stringify({ status: "notok" }));
    }
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}

// export const GET = async (req: Request, res: Response) => {
//     const { searchParams } = new URL(req.url);
//     const address = searchParams.get("address") ?? undefined;
//     if (!address) {
//         return new Response("Error: no address", { status: 400 });
//     }

//     const commonPoaps = await findFriendsUsingPoaps(address);

//     return new Response(JSON.stringify({ userOwnedPoaps: commonPoaps }), {
//         status: 200,
//         headers: {
//             "Content-type": "application/json",
//         },
//     });
// };
