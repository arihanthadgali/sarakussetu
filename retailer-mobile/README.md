# SarakuSetu Retailer (mobile)

React Native + Expo (SDK 57) + TypeScript. Android first. Uses the existing
`backend-node` API; it does not include or change any backend code.

## Run

```bash
cd retailer-mobile
npm install
cp .env.example .env     # set EXPO_PUBLIC_API_BASE_URL (see comments inside)
npm run android          # or: npm start, then open in Expo Go
```

The backend must be running (`backend-node`, port 3000, `NODE_ENV=development`).
In development the OTP is printed in the backend console.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest (jest-expo)
npm run doctor      # expo-doctor
```

## Layout

- `src/app/` — routes only (Expo Router). `(auth)` sign-in/verify, `(tabs)` Home/Shop/Orders/Cart/Profile.
- `src/api/` — fetch client and endpoint modules for **existing** backend routes only.
- `src/features/` — auth session, Home, orders, and guest/server carts.
- `src/components/ui/` — design-system primitives. `src/theme/` — tokens.

## Home data

Home uses real product, order, and cart APIs. The header shows the signed-in
phone number from `/api/auth/me`, or a neutral browsing label for guests.
The backend does not provide shop names, locations, or retailer notifications;
the bell is a visual placeholder without an unread badge or notification action.
Category filters use local presentation rules because products lack category metadata.
Synthetic pricing fixtures live in `src/test/pricing-fixtures.ts` and are used only by tests.

## Checkout retry safety

Within the mounted checkout attempt, confirmed guest lines are never added again.
Explicit rejection responses allow retry from the failed line; rejected order creation
retries only order creation. Guest data is cleared only after a confirmed order response.
Concurrent submissions share one request sequence, and completed attempts reuse the result.

Timeouts, network errors, invalid responses and server errors have uncertain outcomes.
Checkout blocks retry and asks the user to inspect orders/cart instead of replaying writes.
A GET cart snapshot cannot establish that an earlier timed-out request has finished.
The API has no idempotency key or operation-status endpoint, so exactly-once behavior
across app restarts, route remounts or concurrent devices cannot be guaranteed. Progress
is in memory for the current mounted attempt only. Do not start a fresh checkout after
an uncertain result until the server outcome has been verified.

For physical iPhone development, replace YOUR-LAN-IP in your ignored `.env` with the
backend computer's reachable LAN address. The template contains no machine-specific address.
