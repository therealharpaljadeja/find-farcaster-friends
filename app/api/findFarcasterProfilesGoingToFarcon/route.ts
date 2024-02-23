import findFarcasterProfilesGoingToFarconRes from "@/lib/responses/findFarcasterProfilesGoingToFarcon";
import { Redis } from "@upstash/redis";
// import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import { FrameActionPayload } from "frames.js";
import { NextRequest } from "next/server";

const redis = new Redis({
    url: process.env.REDIS_URL as string,
    token: process.env.REDIS_TOKEN as string,
});

let wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string);

async function getResponse(req: NextRequest) {
    // const xmtp = await Client.create(wallet, {
    //     env: "production",
    // });

    let body: FrameActionPayload = await req.json();

    return await findFarcasterProfilesGoingToFarconRes(body);
}

export async function POST(req: NextRequest): Promise<Response> {
    return getResponse(req);
}
