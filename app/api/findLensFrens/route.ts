import findLensFrens from "@/lib/responses/findLensFrens";
import { FrameActionPayload } from "frames.js";
import { NextRequest } from "next/server";

async function getResponse(req: NextRequest) {
    const body: FrameActionPayload = await req.json();

    return await findLensFrens(body);
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
