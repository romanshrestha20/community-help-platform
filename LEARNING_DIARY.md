# Learning Diary - Chat Session

Date: 2026-04-09

## Goal

Improve help request UX and reliability across mobile app and backend, with focus on:

- request photo upload and rendering
- request details/manage actions
- reusable UI primitives

## What We Implemented

### 1. Request photos: end-to-end reliability

- Verified request details and my-requests rendering flow.
- Added request photo rendering in request details using reusable photo section.
- Fixed backend list mapping to include request images in responses.
- Added frontend payload normalization for image shapes (`url`, `uri`, fallback keys).

Key outcome:

- Photos can now render in both list and detail views when images exist.

### 2. Request create flow: upload hardening

- Diagnosed a reliability gap where create happened first and image upload was a second call.
- Introduced single-step multipart create with images from mobile:
  - added `createRequestWithImagesApi(...)`
  - service/hook now use multipart create when selected images are present.
- Updated backend location parser to accept multipart `location` as JSON string.

Key outcome:

- Request + images can be persisted in one request path, reducing missing-photo race/failure cases.

### 3. Request details actions UX

- Added missing action icon support in `RequestActionBar`.
- Fixed icon prop usage to match `AppButton` API (`icon`, not `leftIcon`).
- Added status-action tap lock so status cannot be re-triggered repeatedly while processing.

Key outcome:

- Cleaner interactions and fewer duplicate status update requests.

### 4. Action bar redesign

- Reworked request manage section into compact header with three-dots menu trigger.
- Moved actions into menu surface for cleaner details layout.

Key outcome:

- Better visual hierarchy and less clutter in request details screen.

### 5. Reusable ActionSheet component

- Built reusable UI primitive:
  - `mobile-app/src/components/ui/ActionSheet.tsx`
- Supports:
  - title/description
  - action list with icon/loading/disabled/destructive
  - backdrop dismiss + cancel action
  - close behavior per action (`closeOnPress`)
- Refactored `RequestActionBar` to consume `ActionSheet`.

Key outcome:

- Reusable pattern now available for requests, bids, profile, and future feature menus.

### 6. Bid state handling in opportunities

- Updated the opportunities card actions so `Remove Bid` only appears for mutable bids.
- Reused the shared bid mutability rule (`canMutateBid`) instead of treating any existing bid as removable.
- Non-mutable bids now stay read-only instead of exposing a delete affordance.

Key outcome:

- UI now matches bid lifecycle rules more closely and avoids implying that accepted/rejected bids can be removed.

## Important Files Touched

Backend:

- `backend/src/services/helpRequest.service.ts`
- `backend/src/utils/location.ts`

Mobile app:

- `mobile-app/src/features/helpRequest/helpRequest.api.ts`
- `mobile-app/src/features/helpRequest/services/helpRequest.service.ts`
- `mobile-app/src/features/helpRequest/hooks/helpRequest.hook.ts`
- `mobile-app/src/features/helpRequest/hooks/useCreateEditRequestScreen.ts`
- `mobile-app/src/features/helpRequest/components/RequestPhotoUploadSection.tsx`
- `mobile-app/src/features/helpRequest/components/RequestDetailHeader.tsx`
- `mobile-app/src/features/helpRequest/screens/RequestDetailsScreen.tsx`
- `mobile-app/src/features/helpRequest/components/RequestActionBar.tsx`
- `mobile-app/src/components/ui/ActionSheet.tsx`

## Lessons Learned

- If file upload is critical to a feature, prefer one-step multipart create to avoid sync/race issues.
- Normalize API payloads at service boundaries to prevent UI breakage from minor shape drift.
- Reusable UI primitives (ActionSheet, photo section) speed up feature consistency across screens.
- Status actions should include in-flight lock semantics to prevent duplicate transitions.
- Bid affordances should follow the same mutability rule everywhere; only pending bids should surface remove/edit actions.

## Follow-up Suggestions

1. Migrate other overflow menus (bids/profile/settings) to `ActionSheet` for consistency.
2. Add integration test coverage for request create-with-images and details rendering.
3. Add lightweight backend logs/metrics for `/requests` multipart usage and image upload failures.

## Additional Successes (This Chat)

### 7. iOS Expo Go render-crash stabilization

- Diagnosed repeated `expected dynamic type 'boolean', but had type 'string'` crashes occurring in `RNSScreen` host creation.
- Applied a working stabilization path for current runtime/tooling combination:
  - switched nested auth/tab child layouts to `Slot`-based routing
  - disabled native screens at startup with `enableScreens(false)` in app root

Key outcome:

- App booted successfully again on physical iOS in Expo Go.

### 8. Navigation consistency and back-flow reliability

- Normalized route usage through `APP_ROUTES` constants to avoid mixed hardcoded paths.
- Added profile request detail/edit route entries so profile flows stay in profile namespace.
- Updated request list/detail/edit navigation so profile-origin flows return to profile routes consistently.
- Updated custom tab behavior so tab presses reliably return users to root tab screens from deep paths.

Key outcome:

- Tab switching and back navigation became consistent across profile/home request flows.

### 9. Shared header alignment and compact styling

- Refined `AppHeader` compact variant to reduce padding/margins and improve subtitle readability.
- Applied profile-style visual language into shared header component (without forcing profile implementation changes).
- Tuned title sizing to better match compact UI density.

Key outcome:

- Header presentation is now more consistent, reusable, and visually balanced across screens.

### 10. Home action tile layout fix

- Reworked the action tile block in home screen into a stable wrapped layout.
- Kept primary action prominent and made secondary actions responsive for smaller screens.

Key outcome:

- Home shortcuts render more reliably without crowding/overflow issues.

### 11. Request list screen JSX repair

- Repaired broken `FlatList` structure in My Requests screen by restoring `ListHeaderComponent`, `ListEmptyComponent`, and `ListFooterComponent` into valid prop positions.

Key outcome:

- Screen returned to a valid render path with no TypeScript diagnostics.
