import { fetchQueryWithPagination, init } from "@airstack/node";
import { DocumentNode, gql } from "@apollo/client";

init(process.env.AIRSTACK_API_KEY || "");

const query = gql`
    query FindPoapsForAddress($address: Identity, $cursor: String) {
        Poaps(
            input: {
                cursor: $cursor
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
            pageInfo {
                nextCursor
            }
        }
    }
`;

export default async function findPoapsForAddress(
    identity: string,
    cursor: string = ""
) {
    try {
        let response = await fetchQueryWithPagination(gqlToString(query), {
            address: identity,
            cursor: cursor ?? "",
        });

        if (response) {
            let { data } = response;
            let { Poaps } = data;
            let { Poap, pageInfo } = Poaps;
            let { nextCursor } = pageInfo;

            if (Poap && Poap.length > 0) {
                let userOwnedPoaps = Poap.filter(
                    (poap: any) => !poap.isVirtualEvent
                ).map((poap: any) => {
                    let { poapEvent } = poap;

                    let { eventName, eventId, metadata } = poapEvent;

                    let { image_url } = metadata;

                    return { eventName, eventId, image_url };
                });

                return userOwnedPoaps.length
                    ? { userOwnedPoaps, nextCursor }
                    : null;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

export const gqlToString = (gqlQuery: DocumentNode): string =>
    gqlQuery.loc?.source.body || "";
