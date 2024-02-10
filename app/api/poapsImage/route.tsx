import { generatePoapsImage } from "@/lib/image/generatePoapsImage";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function GET(req: NextRequest) {
    console.log(req.url);
    const { searchParams } = new URL(req.url);
    const poaps = searchParams.get("poaps");

    console.log("poaps", JSON.parse(poaps as string));

    if (poaps) {
        let svg = await generatePoapsImage(JSON.parse(poaps));

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
