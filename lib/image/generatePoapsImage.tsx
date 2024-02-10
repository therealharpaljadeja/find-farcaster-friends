import { join } from "path";
import satori from "satori";
import fs from "fs";

type Poap = {
    eventId: string;
    eventName: string;
    imageUrl: string;
};

export const generatePoapsImage = async (poaps: Poap[]) => {
    const fontPath = join(process.cwd(), "norwester.otf");
    let fontData = fs.readFileSync(fontPath);

    return await satori(
        <div
            style={{
                backgroundColor: "#8A63D2",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <h1
                style={{
                    fontSize: "32",
                    color: "white",
                }}
            >
                Poaps Found
            </h1>
        </div>,
        {
            width: 1146,
            height: 600,
            fonts: [
                {
                    data: fontData,
                    name: "Norwester",
                    style: "normal",
                    weight: 400,
                },
            ],
        }
    );
};
