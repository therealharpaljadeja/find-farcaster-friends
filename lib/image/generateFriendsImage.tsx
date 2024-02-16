import { join } from "path";
import satori from "satori";
import fs from "fs";

type Friend = {
    profileImage: string;
    profileHandle: string;
};

export const generateFriendsImage = async (friends: Friend[]) => {
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
                    Friends Found
                </h1>
                <div
                    style={{
                        display: "flex",
                        width: "1000px",
                        justifyContent: "space-between",
                    }}
                >
                    {friends.map((friend, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flexDirection: "column",
                            }}
                        >
                            <img
                                src={friend.profileImage}
                                style={{
                                    width: "220px",
                                    height: "220px",
                                    borderRadius: "100%",
                                    marginBottom: "20px",
                                }}
                            />
                            <p style={{ fontSize: "20px", color: "white" }}>
                                @{friend.profileHandle}
                            </p>
                        </div>
                    ))}
                </div>
                <p
                    style={{
                        fontSize: "24px",
                        color: "white",
                    }}
                >
                    Tap below buttons to follow!
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
