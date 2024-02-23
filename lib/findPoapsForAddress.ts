import { fetchQueryWithPagination, init } from "@airstack/node";
import { DocumentNode, gql } from "@apollo/client";

init(process.env.AIRSTACK_API_KEY || "");

const query = gql`
    query FindPoapsForAddress($address: Identity) {
        Poaps(
            input: {
                blockchain: ALL
                filter: { owner: { _eq: $address } }
                order: { createdAtBlockNumber: DESC }
            }
        ) {
            Poap {
                poapEvent {
                    eventId
                    eventName
                    isVirtualEvent
                    contentValue {
                        image {
                            medium
                            small
                        }
                    }
                }
            }
        }
    }
`;

export default async function findPoapsForAddress(identity: string) {
    try {
        let response = await fetchQueryWithPagination(gqlToString(query), {
            address: identity,
        });

        if (response) {
            let { data } = response;

            let { Poaps } = data;
            let { Poap } = Poaps;

            if (Poap && Poap.length > 0) {
                let userOwnedPoaps = Poap.filter(
                    (poap: any) =>
                        !poap.isVirtualEvent &&
                        !poap.poapEvent.contentValue.image.small.endsWith(
                            ".gif"
                        )
                ).map((poap: any) => {
                    let { poapEvent } = poap;

                    let { eventName, eventId, contentValue } = poapEvent;

                    let { image } = contentValue;
                    let { small: image_url } = image;

                    return { eventName, eventId, image_url };
                });

                return userOwnedPoaps.length ? userOwnedPoaps : [];
            }
        }
    } catch (e) {
        console.error(e);
    }
    return [];
}

export const gqlToString = (gqlQuery: DocumentNode): string =>
    gqlQuery.loc?.source.body || "";
