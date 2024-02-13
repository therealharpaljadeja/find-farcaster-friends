import { fetchQueryWithPagination, init } from "@airstack/node";
import { DocumentNode, gql } from "@apollo/client";
import { Friend } from "./findFarcasterProfilesWithPoapOfEventId";

init(process.env.AIRSTACK_API_KEY || "");

const query = gql`
    query FindLensFrensOnFarcaster($identity: Identity!) {
        SocialFollowings(
            input: {
                filter: {
                    identity: { _in: [$identity] }
                    dappName: { _eq: lens }
                }
                blockchain: ALL
                limit: 200
            }
        ) {
            Following {
                followingAddress {
                    socials(
                        input: { filter: { dappName: { _eq: farcaster } } }
                    ) {
                        profileHandle
                        profileImage
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

export default async function findLensFrensOnFarcaster(
    identity: string
): Promise<Friend[] | []> {
    try {
        let response = await fetchQueryWithPagination(gqlToString(query), {
            identity,
        });

        if (response) {
            let { data } = response;
            let { SocialFollowings } = data;

            if (SocialFollowings) {
                let { Following } = SocialFollowings;

                console.log(Following);

                let result = Following.filter(
                    (following: any) =>
                        following.followingAddress.socials !== null
                )
                    .filter((following: any) =>
                        following.followingAddress.socials[0].profileImage.endsWith(
                            ".jpg"
                        )
                    )
                    .map((following: any) => {
                        if (following.xmtp.isXMTPEnabled) {
                            return {
                                ...following.followingAddress.socials[0],
                                isXMTPEnabled: following.xmtp.isXMTPEnabled,
                                xmtpReceiver: following.xmtp.owner.identity,
                            };
                        }
                        return {
                            ...following.followingAddress.socials[0],
                            isXMTPEnabled: false,
                        };
                    });

                return result;
            }

            return [];
        }
    } catch (e) {
        console.error(e);
    }
    return [];
}

export const gqlToString = (gqlQuery: DocumentNode): string =>
    gqlQuery.loc?.source.body || "";
