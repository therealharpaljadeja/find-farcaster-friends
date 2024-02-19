import { gql } from "@apollo/client";
import { gqlToString } from "./findPoapsForAddress";
import { fetchQueryWithPagination } from "@airstack/node";

const query = gql`
    query FarconAttendees {
        base: TokenBalances(
            input: {
                filter: {
                    tokenAddress: {
                        _eq: "0x456cc03543d41eb1c9a7ca9fa86e9383b404f50d"
                    }
                }
                limit: 200
            }
        ) {
            TokenBalance {
                owner {
                    socials(
                        input: { filter: { dappName: { _in: farcaster } } }
                    ) {
                        profileImage
                        profileHandle
                    }
                    xmtp {
                        isXMTPEnabled
                        owner {
                            identity
                        }
                    }
                }
            }
        }
    }
`;

export default async function findFarcasterProfilesGoingToFarcon() {
    let response = await fetchQueryWithPagination(gqlToString(query));

    if (response) {
        let { data } = response;

        let { base } = data;
        if (base) {
            let { TokenBalance } = base;

            let farcasterProfilesGoingToFarcon = TokenBalance.filter(
                (tokenBalance: any) => tokenBalance.owner.socials !== null
            )
                .filter((tokenBalance: any) =>
                    tokenBalance.owner.socials[0].profileImage.endsWith(".jpg")
                )
                .map((poap: any) => {
                    let { owner } = poap;

                    let { socials, xmtp } = owner;

                    let { profileHandle, profileImage } = socials[0];

                    let isXMTPEnabled = false;
                    let xmtpReceiver;

                    if (xmtp) {
                        isXMTPEnabled = xmtp[0].isXMTPEnabled;
                        xmtpReceiver = xmtp[0].owner.identity;
                    }

                    return {
                        profileHandle,
                        profileImage,
                        isXMTPEnabled,
                        xmtpReceiver,
                    };
                });

            let result = farcasterProfilesGoingToFarcon.filter(Boolean);

            return result;
        }

        return [];
    }

    return [];
}
