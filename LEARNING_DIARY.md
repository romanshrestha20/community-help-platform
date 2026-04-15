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

### 12. Centralized field-level validation system

**Problem:** Multiple forms had scattered, inconsistent validation logic with limited per-field error feedback.

**Solution:**

- Created centralized validation module: `mobile-app/src/utils/validation/forms.ts`
- Introduced field-level validators that return field error maps + form-level error + `isValid` flag
- Base validators in `validators.ts` (email, phone, password, date, etc.)
- Feature validators delegate/re-export from centralized module
- Added `useFormValidation` hook to manage both form-level and field-level error state

**Implementation details:**

- `validateXForm()` returns single error string (backward compatible)
- `validateXFormFields()` returns `FormValidationResult<T>` with field map
- Each form input receives `error={fieldErrors.fieldName ?? null}` prop
- On field change, `clearFieldError(fieldName)` removes field-level error immediately
- Validation applied at form submit and incrementally on user input

**Coverage:**

- Auth (login, register, change password, delete account confirmation)
- Help request (create/edit: title, description, budget, location)
- Bid (create/edit: amount, message)
- Profile update (full name, date of birth, bio)

Key outcome:

- Consistent, reusable validation patterns across all forms
- Per-field error display for better UX
- Easy to maintain and extend for new forms

**Files changed:**

- `mobile-app/src/utils/validation/forms.ts` (created centralized validators)
- `mobile-app/src/utils/validation/useFormValidation.ts` (extended to support field errors)
- `mobile-app/src/features/*/utils/*Validation.ts` (refactored to delegate)
- All form components (register, profile edit, request form, bid form, etc.)

### 13. Location picker UX fix

**Problem:** After selecting a location, the UI still showed "No matching addresses found" message, creating false/confusing feedback.

**Solution:**

- Added `showNoMatches` condition to only show empty state when actively searching with no results AND no location selected
- Added `showSuggestionDropdown` guard to prevent rendering empty dropdown container after selection
- Changed selected suggestion query to use `addressLine1` instead of full `label` for concise street input

**Files changed:**

- `mobile-app/src/features/location/components/LocationPickerField.tsx`
- `mobile-app/src/features/location/hooks/useLocationPicker.tsx`

Key outcome:

- Location selection now feels immediately complete without false "no matches" state
- Selected address displays cleanly without verbose text

### 14. Date of birth validation improvements

**Problem:** Date validator had timezone-related edge cases causing valid dates (e.g., "2002-10-11") to be rejected.

**Solution:**

- Replaced UTC-based date parsing with local date parsing using `new Date(year, month-1, day)`
- Added explicit month (1-12) and day range validation per calendar month
- Implemented leap-year-aware February validation
- Added minimum age requirement (13 years) for registration
- Clearer error messages ("You must be at least 13 years old to register")

**Key changes in `validators.ts`:**

- Parse date components locally, not via ISO string
- Validate calendar constraints (month, day per month, leap years)
- Calculate actual age and enforce minimum
- Removed timezone ambiguity entirely

Key outcome:

- Valid dates now always pass
- Age validation provides clearer feedback
- No more mysterious "invalid date" rejections

**Files changed:**

- `mobile-app/src/utils/validation/validators.ts`

### 15. iOS native date picker implementation

**Problem:** Users had to manually type dates in YYYY-MM-DD format, leading to typos and format error frustration.

**Solution:**

## Additional Successes (This Chat Continuation)

### 16. Notification preferences: backend-backed delivery filtering

- Added persistent notification preferences with category-level toggles and a global `pushEnabled` switch.
- Wired mobile notification settings into the real push registration flow so disabling push removes/stops token registration and re-enabling restores it.
- Extended backend notification handling so preferences can be stored and enforced before delivery instead of only being ignored in-app.
- Added backend service/controller coverage around notification preference updates and push token behavior.

Key outcome:

- Users can now control notification categories more reliably, and disabled categories are blocked closer to the delivery source.

### 17. Review and rating system tied to completed help requests

- Improved the review data model to connect reviews to the completed request rather than relying on title/comment uniqueness.
- Added backend CRUD for reviews with validation and request-based rules:
  - review only after request completion
  - reviewer must be the requester
  - target must be the assigned helper
  - one review per requester per completed request
- Added helper rating aggregation and surfaced trust metrics such as rating, total reviews, and completed helps.
- Added backend tests for review service and route behavior.

Key outcome:

- Reviews are now grounded in real completed jobs, which makes the trust system much harder to abuse and more useful to requesters.

### 18. Review feature integrated into mobile UI

- Built a modular mobile reviews feature with:
  - review API/service/hooks
  - star rating input
  - review summary card
  - review list and review card
  - review composer modal
- Wired review creation into completed request flow so a requester can leave a review after marking a request completed.
- Added helper review summary and recent reviews into the bidder profile modal.

Key outcome:

- The app now has a real end-to-end feedback loop after a completed request, improving trust and post-job engagement.

### 19. Bid trust signals and bidder profile redesign

- Extended bid payloads from backend to include:
  - `helperRating`
  - `helperTotalReviews`
  - `helperCompletedHelps`
- Removed the need for extra summary fetches on bid cards by embedding trust metrics directly in bid responses.
- Surfaced rating inline on bid cards so requesters can compare helpers faster.
- Redesigned `BidderProfileModal` into a stronger trust-first layout with:
  - profile hero/header
  - quick facts
  - highlighted bid amount
  - trust summary
  - recent reviews

Key outcome:

- Requesters can assess helper credibility much faster from both the list and profile layers.

### 20. Bid list interaction improvements

- Reworked bid card actions into swipe-to-action interactions.
- Added coordination so only one bid card stays open at a time.
- Strengthened swipe action feedback with clearer motion and visual emphasis.
- Fixed My Bids screen rendering so the logged-in user's bids show up correctly.

Key outcome:

- Bid management now feels more mobile-native and less cluttered, while preserving a single clear active action state.

### 21. Avatar and profile data propagation fixes

- Extended backend request and bid payloads to include requester/helper profile fields such as avatar, gender, and location.
- Updated mobile request, bid, and profile modal rendering to use uploaded avatars instead of local fallback initials wherever data exists.
- Fixed favorites data flow to include requester avatar and location in saved request cards.
- Standardized inbox conversation rows to use the shared avatar component.
- Synced avatar/profile updates into auth state as well as profile state so home greeting overview updates immediately after avatar upload.

Key outcome:

- Uploaded profile photos now propagate more consistently across home, bids, saved requests, request details, and messaging instead of appearing only on profile screens.

## Lessons Learned From This Phase

- Trust features need strong business rules, not just UI components. Reviews only become meaningful when tied to actual completed requests.
- If the same profile data appears across many screens, backend response shaping matters as much as frontend rendering.
- Shared UI components like avatar renderers reduce inconsistency and make cross-screen fixes much faster.
- State can drift when profile data is split between auth and feature stores; profile mutations should synchronize both when the UI depends on each.
- Embedding trust summary fields in core payloads is often better than adding follow-up fetches for every card or modal.

## Suggested Next Follow-ups

1. Add an explicit `totalReviews` field to all frontend user/profile types where trust metrics are displayed.
2. Add end-to-end UI tests for avatar propagation after upload and for review creation after request completion.
3. Add pagination and empty-state polish for helper reviews on slower or low-review accounts.
4. Consider surfacing the same rating summary in assigned-helper sections and conversation headers for consistency.

- Created reusable `DatePickerField` component using native `@react-native-community/datetimepicker`
- Component renders as a tappable field with calendar icon
- Tapping opens native iOS date picker in modal with spinner style
- Displays selected date in friendly format: "Jan 1, 2002"
- Stores value in YYYY-MM-DD format for validators/API
- Supports field-level error display
- Maximum date set to today (no future dates)

**Component features:**

- Accessible date picking without manual entry
- Integrates with `useFormValidation` hook for error handling
- Reusable across all date fields
- Friendly UX with calendar icon indicator

\*\*Integration:

- Register screen: date-of-birth field
- Profile edit: date-of-birth field
- Structured as reusable UI primitive for future date inputs

**Files created/changed:**

- `mobile-app/src/components/ui/DatePickerField.tsx` (new component)
- `mobile-app/app/(auth)/register.tsx` (replaced AppInput with DatePickerField)
- `mobile-app/src/features/user/components/ProfileEditForm.tsx` (replaced TextInput with DatePickerField)

Key outcome:

- No more manual date typing or format errors
- Native iOS UX for date selection
- Field-level error messages still work
- Age validation runs automatically on picked date

### 16. Form field autofill hint configuration

**Problem:** iOS autofill was suggesting saved emails/passwords in the full-name field, confusing users.

**Solution:**

- Added explicit autofill/textContentType hints to register form inputs:
  - Full name: `autoComplete="name"`, `textContentType="name"`, `importantForAutofill="no"`
  - Email: `autoComplete="email"`, `textContentType="emailAddress"`
  - Phone: `autoComplete="tel"`, `textContentType="telephoneNumber"`
  - Password: `autoComplete="new-password"`, `textContentType="newPassword"`
- These hints tell iOS/Android autofill what field type to expect

**Files changed:**

- `mobile-app/app/(auth)/register.tsx`

Key outcome:

- iOS autofill now suggests appropriate values for each field
- No more email suggestions in name field
- Better semantic clarity for assistive technologies

### 17. Swipe back gesture support

**Problem:** No native iOS swipe-to-go-back gesture available in auth screens.

**Solution:**

- Replaced `Slot` with `Stack` navigator in auth layout
- Configured `gestureEnabled: true` to enable swipe gestures
- Set `gestureResponseDistance: 50` for responsive 50pt swipe zone
- Added `headerShown: false` to maintain existing visual style

**Files changed:**

- `mobile-app/app/(auth)/_layout.tsx`

Key outcome:

- Users can now swipe from left edge to go back through auth screens
- Native iOS UX pattern users expect
- Consistent with standard back navigation

## Technical Patterns Established

### Validation Architecture

```
Validators Layer (validators.ts)
  ↓
Form-Level Validators (forms.ts)
  ↓
Feature Facades (authValidation.ts, etc.)
  ↓
Form Hooks (useFormValidation)
  ↓
Form Components (register.tsx, ProfileEditForm.tsx)
```

### Field Error Flow

1. User types in field
2. `onChangeText` calls `clearFieldError(fieldName)` immediately
3. Form validates on submit: `validateXFormFields()` returns `FormValidationResult`
4. `setFieldErrors(result.fieldErrors)` populates field error map
5. Each input displays `error={fieldErrors[fieldName] ?? null}`
6. Error clears on next field change

### Date Picker Integration

1. User taps date field
2. `DatePickerField` opens native iOS date picker modal
3. User selects date
4. Date converted to YYYY-MM-DD string and passed to form state
5. Validator runs automatically
6. Age check enforced at validation layer

## Lessons Learned

- Field-level error state requires careful timing: show errors after submit, clear on field change
- Timezone handling with dates is tricky; always parse to local date when doing age calculations
- Native date/time pickers dramatically improve usability over manual input
- Explicit autofill hints prevent OS from making incorrect suggestions
- Swipe gestures enhance perceived polish; consider for all stack navigation
- Centralized validation makes it easy to ensure consistency across features
- Reusable form components and hooks reduce boilerplate across screens

## Follow-up Suggestions

1. Add phone number picker/formatter for international numbers
2. Consider time picker for appointment-related forms (future feature)
3. Add password strength meter to registration
4. Implement animated transitions when field errors appear/disappear
5. Add validation state caching for form recovery on app suspend/resume
6. Create form documentation/storybook for validation patterns

## 18. Distance Display: Location-Aware Request Discovery

**Objective**: Show approximate distance from user's current location to each request location, enabling users to quickly assess proximity before browsing request details.

**Implementation**:

1. **Distance Calculation Utility** (`src/utils/distance.ts`)

- Implemented Haversine formula for geodetic distance calculation
- Converts degrees to radians for trigonometric calculations
- Functions:
  - `calculateDistance(lat1, lon1, lat2, lon2)`: Returns distance in kilometers
  - `formatDistance(distanceKm)`: Formats as "Xkm" or "Ym" based on magnitude
  - `getDistanceToRequest(userLat, userLon, reqLat, reqLon)`: End-to-end distance calculation with formatting

2. **RequestCard Updates** (`src/features/helpRequest/components/RequestCard.tsx`)

- Added `userLocation?: AppLocation | null` prop
- Distance calculated conditionally if both user and request locations available
- Distance displayed in meta section (alongside location, bid count, budget)
- Styled with primary color to emphasize relevance
- Format: "Location • Xkm" (e.g., "Downtown • 1.5km")

3. **RequestList Updates** (`src/features/helpRequest/components/RequestList.tsx`)

- Added `userLocation?: AppLocation | null` to component props
- Passes user location through to each RequestCard instance
- Seamlessly threads location through list rendering

4. **Screen Integration**

- **BrowseRequestsScreen**: Uses `useLocationPicker` hook with `autoUseCurrentLocationOnMount: true`
  - Automatically fetches user's current location on screen load
  - Passes to `RequestList` for distance calculations
- **MyRequestsScreen**: Same pattern for owner's own requests
  - Shows distance to their own request locations (useful context)

**User Experience**:

- Users see "1.5km" or "500m" next to each request location
- Helps decide which requests are worth exploring without leaving browse screen
- Works seamlessly when both locations available; gracefully omitted if missing

**Edge Cases Handled**:

1. **Missing user location**: Distance not displayed (no permission, disabled, etc.)
2. **Missing request location**: Distance not displayed (old data, etc.)
3. **Zero coordinates**: Validated in conditional before calculation
4. **Null values**: Optional chaining prevents runtime errors

**Distance Matrix**:

- < 1km: Displayed as meters (e.g., "500m")
- > = 1km: Displayed with one decimal (e.g., "1.5km", "12.3km")
- Haversine formula provides ~0.5% accuracy (sufficient for UX context)

**Files Modified**:

1. `mobile-app/src/utils/distance.ts` (NEW) – Haversine calculation and formatting
2. `mobile-app/src/features/helpRequest/components/RequestCard.tsx` – Distance display in meta section
3. `mobile-app/src/features/helpRequest/components/RequestList.tsx` – Pass location through list
4. `mobile-app/src/features/helpRequest/screens/BrowseRequestsScreen.tsx` – Get user location, pass to list
5. `mobile-app/src/features/helpRequest/screens/MyRequestsScreen.tsx` – Get user location, pass to list

**Testing Recommendations**:

- Verify distance formatting: < 1km shows meters, >= 1km shows kilometers
- Test with nearby requests (< 5km) and distant requests (> 100km)
- Confirm distance omitted gracefully when location permissions denied
- Compare calculated distances against map app for accuracy validation
- Verify no performance regression when rendering large request lists (distances calc is lightweight)

## 19. Request Detail UI Unification + Spacing Token System

**Objective**: Bring the request detail experience to production-level consistency by unifying component visuals and enforcing a token-driven spacing rhythm.

**Implementation**:

1. **Request Detail Visual Language Unification**

- Upgraded request detail surfaces to a shared style language: pill labels, bordered info chips, panel blocks, section framing, and stronger typography hierarchy.
- Aligned header, bid sections, action sections, and photo sections so they read as one system rather than isolated components.

2. **Avatar Profile Interaction**

- Added tappable requester avatar behavior in request details.
- Introduced a requester profile modal pattern for contextual profile details without navigation jumps.

3. **Bid Form Stabilization + Polish**

- Replaced inconsistent intermediate markup with a stable, themed implementation.
- Standardized validation/error rendering blocks and trimmed user message payload before submit.
- Fixed runtime fragility from partially refactored UI state by restoring explicit, complete style definitions.

4. **Design Token Spacing Adoption**

- Refactored key spacing/radius values from hardcoded numbers to `theme.spacing` and `theme.radius` tokens.
- Introduced token-derived constants for optical balance while preserving visual density.
- Documented repeatable spacing rules for future UI work.

**Files Modified**:

1. `mobile-app/src/features/helpRequest/components/RequestDetailHeader.tsx`
2. `mobile-app/src/features/helpRequest/screens/RequestDetailsScreen.tsx`
3. `mobile-app/src/features/helpRequest/components/RequestActionBar.tsx`
4. `mobile-app/src/features/helpRequest/components/RequestPhotoUploadSection.tsx`
5. `mobile-app/src/features/bid/components/BidCard.tsx`
6. `mobile-app/src/features/bid/components/BidList.tsx`
7. `mobile-app/src/features/bid/components/BidForm.tsx`
8. `mobile-app/readme/SPACING_SYSTEM_GUIDE.md` (NEW)

**Reusable Patterns Established**:

1. **Section Framing Pattern**: pill label + strong heading + bordered content panel
2. **Metadata Chip Pattern**: compact bordered row with icon + text
3. **Error Surface Pattern**: `dangerSoft` background + `danger` border + concise message
4. **Token-First Spacing Pattern**: default to spacing/radius tokens, derive one-off optical values from tokens

**Lessons Learned**:

- Visual consistency is easiest to maintain when spacing decisions are token-based, not ad hoc.
- Refactors that mix old/new layout systems can cause runtime drift; replace fully, then validate.
- A small spacing guide dramatically lowers design drift across contributors.
- Feature polish should include interaction polish (tap targets, modal affordances), not only typography/colors.

**Testing Recommendations**:

1. Validate spacing rhythm on small and large devices (especially vertical density).
2. Verify profile modal open/close behavior and backdrop dismissal flow.
3. Stress-test bid form validation states (empty, invalid range, max-length breach).
4. Compare request detail sections for consistent chip/panel padding and border radius.
5. Run through owner vs helper flows to ensure no visual/behavior regression.

## 20. Cross-Platform Date Picker UX + Minimal Toast Redesign (2026-04-10)

**Objective**: Improve form UX quality by making date selection feel native on both web and iOS, and simplify toast styling to a clean minimal system.

**Implementation**:

1. **Date Picker: Web + iOS behavior split with shared shell**

- Updated `DatePickerField` to keep the same closed-state visual shell on both platforms:
  - label on top
  - rounded bordered field
  - left calendar icon
  - formatted value/placeholder text
  - error border support
- On web:
  - prevented unsupported native picker crashes by not rendering `@react-native-community/datetimepicker`
  - used browser-native date picker via `TextInput` with web props (`type: "date"`, `max`)
  - preserved formatted preview text in the field shell
- On iOS:
  - bottom sheet modal with `Cancel`, title (`Select date`), `Done`
  - wheel changes write to `tempDate`
  - committed value updates only on `Done`
  - `Cancel` discards in-progress changes

2. **Profile Date Field web compatibility guard**

- Added platform guard in profile date field so `DateTimePicker` only renders on non-web platforms.

3. **Toast system visual simplification**

- Refined global toast renderer to a minimal card style:
  - removed accent rail and status chip
  - removed heavy icon bubble treatment
  - reduced elevation/shadow intensity
  - tightened spacing and typography hierarchy
  - retained semantic differentiation through subtle icon color (success/error/info)
- Kept existing toast API usage unchanged by applying all changes centrally in toast config.

**Files Modified**:

1. `mobile-app/src/components/ui/DatePickerField.tsx`
2. `mobile-app/src/features/user/profile/components/ProfileDateField.tsx`
3. `mobile-app/src/utils/toastConfig.tsx`

**Lessons Learned**:

- Cross-platform input components should default to platform guards when third-party native components do not support web.
- For date selection UX, staged edits (`tempDate`) with explicit commit (`Done`) on iOS feel more intentional than immediate commit.
- Global UI primitives like toasts are best simplified centrally so all feature teams inherit consistent visual behavior automatically.

## 21. Notifications System: In-App UX + Real Push Pipeline (2026-04-11)

**Objective**: Move from a basic in-app notification list to a production-ready notification system with live badge updates and real OS-level push delivery.

**Implementation**:

1. **In-app notifications UX redesign**

- Refined notifications screen into a cleaner feed-style experience.
- Added filtering and clearer visual hierarchy for unread/read states.
- Improved copy/timestamp readability and interaction polish.
- Added swipe-to-delete interaction to reduce visible action clutter.

2. **Live badge-count behavior**

- Wired notification unread count into shared badge state so tab indicators update without opening the notification screen.
- Added background/foreground refresh behavior and synchronized native app badge value from unread count.

3. **Mobile push registration flow (Expo)**

- Added push registration hook at app root startup for authenticated users.
- Implemented permission request + Expo token retrieval + backend token registration.
- Added notification tap routing support (open target route from push payload data).
- Added unregister flow on logout to remove stale tokens.
- Configured foreground notification behavior with current Expo fields:
  - `shouldShowBanner`
  - `shouldShowList`
  - `shouldPlaySound`
  - `shouldSetBadge`

4. **Backend push-token and dispatch pipeline**

- Added `PushToken` model in Prisma schema with user relation and useful indexes.
- Exposed authenticated endpoints for token register/unregister.
- Added push-token service for upsert/get/delete operations.
- Added notification dispatch service to map notification types to in-app routes and send Expo push payloads.
- Updated notification creation flow to asynchronously trigger push dispatch after DB persistence.

5. **Testing coverage added**

- Added focused controller tests for push token register/unregister.
- Added route-level integration tests with supertest for push-token endpoints.
- Verified notification controller + notification route test suites passing.

6. **Debugging and production lessons from rollout**

- Diagnosed backend 500 on push-token registration to stale Prisma client generation:
  - runtime had `prisma.pushToken` undefined
  - resolved by regenerating Prisma client (`npx prisma generate`) and restarting backend
- Clarified test environment constraints:
  - remote push banners are not supported on iOS Simulator / Android Emulator
  - physical device is required for true remote push validation
- Clarified Expo runtime requirement:
  - use development build for modern push testing, not simulator-only workflow

7. **Dev-client scheme + build workflow fixes for push testing**

- Resolved dev-client scheme mismatch warning by aligning Android deep-link intent filters with app scheme(s) used by iOS.
- Updated `eas.json` with practical build profiles:
  - `development-android` for Android dev client APK
  - `development-ios-simulator` for iOS simulator build without Apple paid team
- Documented iOS cloud device build limitation when Apple account has no developer team.

**Key files touched (high-signal set)**:

Backend:

1. `backend/prisma/schema.prisma`
2. `backend/src/controllers/notification.controller.ts`
3. `backend/src/routes/notification.route.ts`
4. `backend/src/services/push-token.service.ts`
5. `backend/src/services/notification-dispatch.service.ts`
6. `backend/src/services/expo-push.service.ts`
7. `backend/src/services/notification.service.ts`
8. `backend/src/controllers/__tests__/notification.controller.test.ts`
9. `backend/src/routes/__tests__/notification.route.test.ts`

Mobile:

1. `mobile-app/src/features/notifications/hooks/usePushNotifications.ts`
2. `mobile-app/src/features/notifications/api/notification.api.ts`
3. `mobile-app/src/features/notifications/service/notification.service.ts`
4. `mobile-app/src/hooks/useBadgeCounts.ts`
5. `mobile-app/app/(tabs)/notifications/index.tsx`
6. `mobile-app/app/_layout.tsx`
7. `mobile-app/app.json`
8. `mobile-app/android/app/src/main/AndroidManifest.xml`
9. `mobile-app/eas.json`

**Lessons Learned**:

- A complete notification system requires both in-app state flow and out-of-app push delivery; DB notifications alone are not enough.
- Push rollout failures often come from environment mismatches (simulator vs real device, Expo runtime mode, credentials) more than UI code.
- Prisma schema changes must be followed by client regeneration, or runtime delegates can be missing even when code compiles.
- Token lifecycle hygiene (register on auth, unregister on logout) is essential to avoid noisy/stale push delivery.
- Route data in push payloads greatly improves UX by taking users directly to the relevant screen on tap.

**Follow-up Suggestions**:

1. Add delivery observability (success/failure logs + receipt handling) for Expo push sends.
2. Add automated tests for `notification-dispatch.service` route mapping and badge payload correctness.
3. Add token pruning strategy for permanently invalid Expo push tokens.
4. Add manual QA checklist for real-device push testing across foreground/background/terminated states.

## 22. Project-Wide Zod Migration and Backend Type Cleanup (2026-04-11)

**Objective**: Replace the remaining hand-written validation paths with Zod across the mobile app and backend, then fix the type issues introduced by that refactor.

**Implementation**:

1. **Mobile validation migration**

- Reworked the central form validation module to use Zod-backed schemas while preserving the existing validator function API.
- Kept the mobile feature code unchanged at the call sites so forms still receive the same validation results and error messages.

2. **Backend validation migration**

- Added shared backend Zod schemas for auth, notification push tokens, help requests, and bids.
- Updated controllers to validate request bodies with Zod instead of ad hoc manual checks.

3. **Controller cleanup after the schema refactor**

- Normalized request route params in the request controller so `req.params` values are handled safely even when typed as `string | string[]`.
- Tightened request-image handlers so invalid request/image IDs fail fast with a clean 400 or 404 response.
- Added a defensive password-hash guard in auth before calling bcrypt so null hashes do not produce runtime/type errors.

4. **Verification sweep**

- Ran diagnostics on the touched backend controllers and the mobile validation file.
- Confirmed the backend and mobile app are clean after the migration.

**Files Modified**:

1. `mobile-app/src/utils/validation/forms.ts`
2. `backend/src/utils/zod.ts`
3. `backend/src/utils/validation-schemas.ts`
4. `backend/src/controllers/auth.controller.ts`
5. `backend/src/controllers/notification.controller.ts`
6. `backend/src/controllers/request.controller.ts`
7. `backend/src/controllers/bid.controller.ts`

**Lessons Learned**:

- Zod migrations are safest when you keep the public validation API stable and only change the internals.
- Express route params often need explicit normalization before TypeScript and Prisma are happy with them.
- Any login or password flow that touches bcrypt should guard against missing hashes before comparing.
- It is worth doing a full diagnostics sweep after a validation refactor because the compile errors often appear in adjacent code, not just the edited schema file.

**Outcome**:

- The project now uses Zod for the main validation paths in both mobile and backend.
- The remaining compile/type issues from the refactor were resolved.
- Both apps were verified clean after the migration.
