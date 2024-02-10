import { generateFriendsImage } from "@/lib/image/generateFriendsImage";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const friends = searchParams.get("friends");

    if (friends) {
        let svg = await generateFriendsImage(JSON.parse(friends));

        const pngBuffer = await sharp(Buffer.from(svg))
            .toFormat("png")
            .toBuffer();

        return new NextResponse(pngBuffer, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "max-age=1",
            },
        });
    }

    return new NextResponse(JSON.stringify({ status: "notok" }), {
        status: 400,
    });
}
