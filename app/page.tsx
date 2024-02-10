import { BASE_URL } from "@/lib/constants";
import { getFrameMessage } from "frames.js";
import { NextServerPageProps } from "frames.js/next/client";
import {
    FrameButton,
    FrameContainer,
    FrameImage,
    getPreviousFrame,
} from "frames.js/next/server";

export default async function Home({
    params,
    searchParams,
}: NextServerPageProps) {
    const previousFrame = getPreviousFrame(searchParams);

    if (previousFrame.postBody) {
        const frameMessage = await getFrameMessage(previousFrame.postBody, {
            hubHttpUrl: process.env.HUB_URL,
            hubRequestOptions: {
                headers: {
                    api_key: process.env.HUB_KEY as string,
                },
            },
        });

        if (frameMessage && !frameMessage?.isValid) {
            throw new Error("Invalid frame payload");
        }
    }

    return (
        <div className="p-4">
            Find Farcaster Friends using Poaps
            <FrameContainer
                pathname={`${BASE_URL}/api/findUserPoaps`}
                postUrl={`${BASE_URL}/api/findUserPoaps`}
                state={null}
                previousFrame={previousFrame}
            >
                <FrameImage src={`${BASE_URL}/base.png`} />
                <FrameButton>Find My Poaps</FrameButton>
            </FrameContainer>
        </div>
    );
}
