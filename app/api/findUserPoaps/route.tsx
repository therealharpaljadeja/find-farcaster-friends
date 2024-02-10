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

        console.log(image + encodedObj);

        return new NextResponse(
            getFrameHtml({
                version: "vNext",
                image: `${BASE_URL}/api/poapsImage`,
                buttons: [
                    { label: "1", action: "post" },
                    { label: "2", action: "post" },
                    { label: "3", action: "post" },
                ],
                postUrl: `${BASE_URL}/api/mint`,
            })
        );
    } catch (e) {
        console.error(e);

        return new NextResponse(JSON.stringify({ status: "notok" }));
    }

    return new NextResponse(JSON.stringify({ status: "ok" }));
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
