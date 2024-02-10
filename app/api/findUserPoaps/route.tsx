import { BASE_URL, ERROR_IMAGE_URL } from "@/lib/constants";
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
                    postUrl: `${BASE_URL}/api/mint`,
                })
            );
        }

        accountAddress = await getAddressForFid({
            fid: body.untrustedData.fid,
            options: { fallbackToCustodyAddress: true },
        });

        let result = await findPoapsForAddress(accountAddress);

        let poap_image_urls = result.map((poap: any) => poap.image_url);

        let image = `${BASE_URL}/api/poapsImage?poaps=`;

        let encodedObj = encodeURIComponent(JSON.stringify(poap_image_urls));

        return new NextResponse(
            `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta property="fc:frame" content="vNext" />
                    <meta property="fc:frame:image" content="${
                        image + encodedObj
                    }" />
                    <meta property="fc:frame:button:1" content="1" />
                    <meta property="fc:frame:button:1:action" content="post" />
                    <meta property="fc:frame:button:1:action:target" content="${BASE_URL}/api/findProfilesWithSameProps?eventId=${
                result[0].eventId
            }" />
                    <meta property="fc:frame:button:2" content="2" />
                    <meta property="fc:frame:button:2:action" content="post" />
                    <meta property="fc:frame:button:2:action:target" content="${BASE_URL}/api/findProfilesWithSameProps?eventId=${
                result[1].eventId
            }" />
                    <meta property="fc:frame:button:3" content="3" />
                    <meta property="fc:frame:button:3:action" content="post" />
                    <meta property="fc:frame:button:3:action:target" content="${BASE_URL}/api/findProfilesWithSameProps?eventId=${
                result[2].eventId
            }" />
                    <meta property="fc:frame:post_url" content="${BASE_URL}/findUserPoaps" />
                </head>
            </html>
            `
            // getFrameHtml({
            //     version: "vNext",
            //     image: image + encodedObj,
            //     buttons: [
            //         {
            //             label: "1",
            //             action: "post",
            //             target: `${BASE_URL}/api/findProfilesWithSameProps?eventId=${result[0].eventId}`,
            //         },
            //         {
            //             label: "2",
            //             action: "post",
            //             target: `${BASE_URL}/api/findProfilesWithSameProps?eventId=${result[1].eventId}`,
            //         },
            //         {
            //             label: "3",
            //             action: "post",
            //             target: `${BASE_URL}/api/findProfilesWithSameProps?eventId=${result[2].eventId}`,
            //         },
            //     ],
            //     postUrl: `${BASE_URL}/api/findProfilesWithSamePoaps?eventIds=`,
            // })
        );
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
