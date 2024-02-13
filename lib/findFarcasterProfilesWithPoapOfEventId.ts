import { fetchQueryWithPagination, init } from "@airstack/node";
import { gql } from "@apollo/client";
import { gqlToString } from "./findPoapsForAddress";

export type Friend = {
    eventName: string;
    profileHandle: string;
    profileImage: string;
    isXMTPEnabled: boolean;
    xmtpReceiver: string;
};

const query = gql`
    query FindFarcasterWithPoapWithEventId($eventId: String) {
        Poaps(
            input: {
                blockchain: ALL
                filter: { eventId: { _eq: $eventId } }
                limit: 200
            }
        ) {
            Poap {
                poapEvent {
                    eventName
                }
                owner {
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

export default async function findFarcasterWithPoapOfEventId(
    eventId: string
): Promise<Friend[] | []> {
    let response = await fetchQueryWithPagination(gqlToString(query), {
        eventId,
    });

    if (response) {
        let { data } = response;
        let { Poaps } = data;
        let { Poap } = Poaps;

        let farcasterProfilesThatOwnPoapWithEventId = Poap.map((poap: any) => {
            let { owner, poapEvent } = poap;

            let { socials, xmtp } = owner;

            if (socials) {
                let { profileHandle, profileImage } = socials[0];

                let isXMTPEnabled = false;
                let xmtpReceiver;

                if (xmtp) {
                    isXMTPEnabled = xmtp[0].isXMTPEnabled;
                    xmtpReceiver = xmtp[0].owner.identity;
                }

                return {
                    eventName: poapEvent.eventName,
                    profileHandle,
                    profileImage,
                    isXMTPEnabled,
                    xmtpReceiver,
                };
            }

            return null;
        });

        let result = farcasterProfilesThatOwnPoapWithEventId.filter(Boolean);

        return result;
    }
    return [];
}
