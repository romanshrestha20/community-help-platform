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
