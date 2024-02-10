export const BASE_URL =
    process.env.NODE_ENV === "production"
        ? "https://find-farcaster-friends.vercel.app"
        : "https://8c7f-2401-4900-1c94-aaba-a9f5-10bf-a5d5-b7ec.ngrok-free.app";

export const ERROR_IMAGE_URL = `${BASE_URL}/error.png`;
export const WALLET_NOT_CONNECTED_IMAGE_URL = `${BASE_URL}/wallet_not_connected.png`;
export const NO_POAPS_FOUND = `${BASE_URL}/no_poaps_found.png`;
