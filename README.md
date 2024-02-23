# Find Farcaster Frens

This is a farcaster frame that let's you find Farcaster profiles using Poaps, using Lens Profile, Farcaster profiles attending ETHDenver, and Farcaster profiles attending Farcon!

![base.gif](./public/base.gif)

## How it's built

The Frame uses Airstack to find interacting user's POAPs, holders of POAPs, Lens following of the interacting user, holders of staked SPORK (ETHDenver) and holders of Farcon Pass.

The Frame uses XMTP to notify users who are found by the interacting user!

I have also used Frames.js to build the frame and also used the debugger to show the pagination feature (this also led to discovery of a bug in Warpcast Frame Validator)

## How to use

1. Clone the project

```bash
git clone https://github.com/therealharpaljadeja/find-farcaster-friends
```

2. Install dependencies

```bash
npm i
```

3. Run the project

```bash
npm run dev
```

> [!NOTE]
> The XMTP message feature is accessible only on the xmtp-message branch

> [!NOTE]
> The Pagination feature is accessible only on the local-debugger branch
