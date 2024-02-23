import findFarcasterProfilesGoingToFarconRes from "@/lib/responses/findFarcasterProfilesGoingToFarcon";
import { FrameActionPayload } from "frames.js";
import { NextRequest } from "next/server";

async function getResponse(req: NextRequest) {
    let body: FrameActionPayload = await req.json();

    return await findFarcasterProfilesGoingToFarconRes(body);
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
