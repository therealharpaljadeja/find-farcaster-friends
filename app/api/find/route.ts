import { BASE_URL, ERROR_IMAGE_URL } from "@/lib/constants";
import findLensFrens from "@/lib/responses/findLensFrens";
import findFarcasterProfilesGoingToETHDenverRes from "@/lib/responses/findProfileGoingToETHDenver";
import findUserPoaps from "@/lib/responses/findUserPoaps";
import { getFrameHtml } from "frames.js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
    const body = await req.json();

    switch (body.untrustedData.buttonIndex) {
        case 1:
            return await findUserPoaps(body);
        case 2:
            return await findLensFrens(body);
        case 3:
            return await findFarcasterProfilesGoingToETHDenverRes(body);
        default:
            return new NextResponse(
                getFrameHtml({
                    version: "vNext",
                    image: ERROR_IMAGE_URL,
                    postUrl: "",
                })
            );
    }
}
