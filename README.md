# FirstLine

FirstLine is a hackathon prototype for ultra-fast community emergency response. It helps a patient trigger an incident manually or from a wearable-like signal, shares critical medical context, and dispatches the nearest qualified responder using ETA-based escalation before an ambulance arrives.

## What the prototype covers

- Patient flow with manual SOS and simulated wearable-triggered emergency escalation
- Responder flow with credential submission, demo verification, availability control, and assignment handling
- Convex-backed real-time incident state, responder matching, timeline logging, and emergency profile sharing
- Distance-aware dispatch logic that expands from the fastest ETA cohort outward

## Stack

- Mobile app: Expo + React Native + Expo Router
- Backend and realtime state: Convex
- Location: `expo-location`
- Wearable simulation / health data: Health Connect hook plus synthetic vitals fallback
- Routing enrichment: Google Distance Matrix when `GOOGLE_MAPS_API_KEY` is present, otherwise fallback ETA estimation

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and add your Convex deployment:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npx expo start
```

4. Run Convex locally or point the app at an existing deployment:

```bash
npx convex dev
```

## Required environment variables

Add these to `.env.local`:

```env
CONVEX_DEPLOYMENT=
EXPO_PUBLIC_CONVEX_URL=
EXPO_PUBLIC_CONVEX_SITE_URL=
GOOGLE_MAPS_API_KEY=
```

`GOOGLE_MAPS_API_KEY` is optional for the MVP. Without it, the app falls back to straight-line ETA estimation based on walking or driving speed.

## Suggested demo flow

1. Create or sign into a citizen account.
2. Fill in the medical profile and emergency contacts.
3. Trigger an incident from the home screen with either:
   - long-press `SOS!`
   - `Simulate` inside the wearable trigger card
4. Sign into a responder account in a second simulator/device.
5. Submit responder credentials or use `Approve for demo`.
6. Set travel mode, max coverage ETA, and toggle availability on.
7. Accept the alert, mark arrival, request backup if needed, and complete the assignment.

## System architecture

### Frontend

- `app/(tabs)/index.tsx`
  - Citizen home state
  - Wearable-trigger simulation
  - Responder availability, verification, and dispatch actions
- `app/(tabs)/medical.tsx`
  - Emergency medical profile editing
- `app/(tabs)/contacts.tsx`
  - Emergency contacts editing

### Backend

- `convex/session.ts`
  - Guest bootstrap, sign-up, sign-in, and role/session state
- `convex/profiles.ts`
  - Patient medical profile CRUD
- `convex/contacts.ts`
  - Emergency contact CRUD
- `convex/locations.ts`
  - Latest user location updates
- `convex/responders.ts`
  - Responder verification, availability, alert inbox, assignment workflow
- `convex/incidents.ts`
  - Incident creation, confirmation timeout, responder search, sequential dispatch, escalation, and timeline

## Data model

The prototype uses these main entities in Convex:

- `users`
  - identity, role, onboarding state
- `profiles`
  - age, blood group, allergies, conditions, medications, emergency sharing preferences
- `emergencyContacts`
  - family and provider contacts with notification capability flags
- `responderProfiles`
  - verification status, skills, travel mode, max ETA coverage, availability
- `verificationSubmissions`
  - proof-of-training review queue
- `locations`
  - latest GPS snapshot per user
- `incidents`
  - emergency event lifecycle and dispatch state
- `incidentVitals`
  - wearable or device data captured at trigger time
- `incidentEscalations`
  - ETA stage progression
- `incidentAlerts`
  - responder notification records
- `incidentAssignments`
  - accepted dispatch records
- `incidentTimeline`
  - full audit/event trail for the incident

## Matching and ranking logic

The app ranks responders by fastest predicted arrival, not by nearest crow-flies distance alone.

1. Filter responders to only:
   - verified responders
   - available responders
   - fresh locations
   - responders within the broad prefilter radius
2. Estimate ETA for each responder:
   - Google Distance Matrix if configured
   - fallback walking/driving model otherwise
3. Apply responder preference constraints:
   - travel mode
   - maximum accepted ETA coverage
4. Sort responders by predicted ETA ascending.
5. Notify the fastest eligible responder first.
6. If they do not respond within the timeout window, notify the next-fastest responder.
7. Continue until one accepts or the queue is exhausted.

This effectively simulates staged expansion from the immediate responder pool outward while still optimizing for true arrival time.

## Prototype assumptions

- This is a concept prototype, not a production medical device.
- Responder verification includes a demo approval path for judging convenience.
- Health signals can come from real Health Connect reads or synthetic fallback values.
- Dispatch messaging is simulated inside the app rather than integrated with Swiss 144 infrastructure.

## Ethics and compliance notes

- Medical data sharing is opt-in and limited to emergency context.
- Responder access is gated by verification state.
- Every incident action is logged in an auditable timeline.
- The app is transparent about demo behavior such as wearable simulation and demo approval.
