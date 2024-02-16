import { BASE_URL, ERROR_IMAGE_URL } from "@/lib/constants";
import { getFrameHtml } from "frames.js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
    const body = await req.json();

    switch (body.untrustedData.buttonIndex) {
        case 1:
            return await fetch(`${BASE_URL}/api/findUserPoaps`, {
                method: "POST",
                body: JSON.stringify(body),
            });
        case 2:
            return await fetch(`${BASE_URL}/api/findLensFrens`, {
                method: "POST",
                body: JSON.stringify(body),
            });
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
