import findProfileWithSamePoaps from "@/lib/responses/findProfilesWithSamePoaps";
import { NextRequest } from "next/server";

async function getResponse(req: NextRequest) {
    // const xmtp = await Client.create(wallet, {
    //     env: "production",
    // });

    return await findProfileWithSamePoaps(body, req.url);
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
