import findProfileWithSamePoaps from "@/lib/responses/findProfilesWithSamePoaps";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

async function getResponse(req: NextRequest) {
    const body = await req.json();

    return await findProfileWithSamePoaps(body, req.url);
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
