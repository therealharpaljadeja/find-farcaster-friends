export const BASE_URL =
    process.env.NODE_ENV === "production"
        ? "https://find-farcaster-friends.vercel.app"
        : process.env.NEXT_PUBLIC_VERCEL_URL;

export const ERROR_IMAGE_URL = `${BASE_URL}/error.png`;
export const WALLET_NOT_CONNECTED_IMAGE_URL = `${BASE_URL}/wallet_not_connected.png`;
export const NO_POAPS_FOUND = `${BASE_URL}/no_poaps_found.png`;
export const NO_FRIENDS_FOUND = `${BASE_URL}/no_friends_found.png`;
