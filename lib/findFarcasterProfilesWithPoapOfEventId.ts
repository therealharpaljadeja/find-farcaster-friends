import { fetchQueryWithPagination, init } from "@airstack/node";
import { gql } from "@apollo/client";
import { gqlToString } from "./findPoapsForAddress";

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
                }
            }
        }
    }
`;

export default async function findFarcasterWithPoapOfEventId(eventId: string) {
    let response = await fetchQueryWithPagination(gqlToString(query), {
        eventId,
    });

    if (response) {
        let { data } = response;
        let { Poaps } = data;
        let { Poap } = Poaps;

        let farcasterProfilesThatOwnPoapWithEventId = Poap.map((poap: any) => {
            let { owner, poapEvent } = poap;

            let { socials } = owner;

            if (socials) {
                let { profileHandle, profileImage } = socials[0];
                return {
                    eventName: poapEvent.eventName,
                    profileHandle,
                    profileImage,
                };
            }

            return null;
        });

        let result = farcasterProfilesThatOwnPoapWithEventId.filter(Boolean);

        // I have to filter the null results from Airstack so I can't put a limit of 3 on the Airstack result but instead had to put a manual limit here.
        return [result[0], result[1], result[2]];
    }
    return [];
}
