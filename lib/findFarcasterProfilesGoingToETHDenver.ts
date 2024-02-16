import { gql } from "@apollo/client";
import { gqlToString } from "./findPoapsForAddress";
import { fetchQueryWithPagination } from "@airstack/node";

const query = gql`
    query StakeSporkHolders {
        polygon: TokenBalances(
            input: {
                filter: {
                    tokenAddress: {
                        _eq: "0x058d96baa6f9d16853970b333ed993acc0c35add"
                    }
                }
                blockchain: polygon
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

export default async function findFarcasterProfilesGoingToETHDenver() {
    let response = await fetchQueryWithPagination(gqlToString(query));

    if (response) {
        let { data } = response;

        let { polygon } = data;
        if (polygon) {
            let { TokenBalance } = polygon;

            let farcasterProfilesGoingToETHDenver = TokenBalance.filter(
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

            let result = farcasterProfilesGoingToETHDenver.filter(Boolean);

            return result;
        }

        return [];
    }

    return [];
}
