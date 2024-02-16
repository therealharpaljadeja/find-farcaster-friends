import { fetchQueryWithPagination, init } from "@airstack/node";
import { DocumentNode, gql } from "@apollo/client";
import { Friend } from "./findFarcasterProfilesWithPoapOfEventId";

init(process.env.AIRSTACK_API_KEY || "");

const query = gql`
    query FindLensFrensOnFarcaster($identity: Identity!, $userId: String) {
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
                        input: {
                            filter: {
                                dappName: { _eq: farcaster }
                                userId: { _ne: $userId }
                            }
                        }
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
    fid: number
): Promise<Friend[] | []> {
    try {
        let response = await fetchQueryWithPagination(gqlToString(query), {
            identity: `fc_fid:${fid}`,
            userId: fid.toString(),
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
                        if (following.xmtp && following.xmtp.isXMTPEnabled) {
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
