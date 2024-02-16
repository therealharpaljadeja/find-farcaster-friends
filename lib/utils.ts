import { Friend } from "./findFarcasterProfilesWithPoapOfEventId";

// Function to pick random elements from the array
export function pickRandomElements(array: any[], count: number) {
    const shuffled = array.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

export type UserData = {
    userOwnedPoaps: {
        eventName: string;
        eventId: string;
        image_url: string;
    }[];
    poapFriends: Friend[];
};
