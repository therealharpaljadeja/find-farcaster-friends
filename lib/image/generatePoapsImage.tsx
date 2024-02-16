import { join } from "path";
import satori from "satori";
import fs from "fs";

export const generatePoapsImage = async (poaps: string[]) => {
    const fontPath = join(process.cwd(), "norwester.otf");
    let fontData = fs.readFileSync(fontPath);

    return await satori(
        <div
            style={{
                padding: "40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#8A63D2",
                width: "100%",
                height: "100%",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <h1
                    style={{
                        fontSize: "48px",
                        color: "white",
                    }}
                >
                    Poaps Found
                </h1>
                <div
                    style={{
                        display: "flex",
                        width: "1000px",
                        justifyContent: "space-between",
                    }}
                >
                    {poaps.map((poap, index) => (
                        <img
                            src={poap}
                            key={index}
                            style={{
                                width: "220px",
                                height: "220px",
                                borderRadius: "100%",
                            }}
                        />
                    ))}
                </div>
                <p
                    style={{
                        fontSize: "24px",
                        color: "white",
                    }}
                >
                    Select Poap to use to find friends
                </p>
            </div>
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
