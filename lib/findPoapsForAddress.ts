import { fetchQueryWithPagination, init } from "@airstack/node";
import { DocumentNode, gql } from "@apollo/client";

init(process.env.AIRSTACK_API_KEY || "");

const query = gql`
    query FindPoapsForAddress($address: Identity) {
        Poaps(
            input: {
                blockchain: ALL
                limit: 3
                filter: { owner: { _eq: $address } }
                order: { createdAtBlockNumber: DESC }
            }
        ) {
            Poap {
                poapEvent {
                    eventId
                    eventName
                    isVirtualEvent
                    metadata
                }
            }
        }
    }
`;

export default async function findPoapsForAddress(identity: string) {
    let response = await fetchQueryWithPagination(gqlToString(query), {
        address: identity,
    });

    if (response) {
        let { data } = response;
        let { Poaps } = data;
        let { Poap } = Poaps;

        if (Poap.length > 0) {
            let userOwnedPoaps = Poap.filter(
                (poap: any) => !poap.isVirtualEvent
            ).map((poap: any) => {
                let { poapEvent } = poap;

                let { eventName, eventId, metadata } = poapEvent;

                let { image_url } = metadata;

                return { eventName, eventId, image_url };
            });

            return userOwnedPoaps.length ? userOwnedPoaps : [];
        }
    }
    return [];
}

export const gqlToString = (gqlQuery: DocumentNode): string =>
    gqlQuery.loc?.source.body || "";
