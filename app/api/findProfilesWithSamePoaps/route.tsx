import findProfileWithSamePoaps from "@/lib/responses/findProfilesWithSamePoaps";
import { FrameActionPayload } from "frames.js";
import { NextRequest } from "next/server";

async function getResponse(req: NextRequest) {
    const body: FrameActionPayload = await req.json();

    return await findProfileWithSamePoaps(body, req.url);
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
