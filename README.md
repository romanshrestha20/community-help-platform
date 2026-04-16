# community-help-platform

## Twilio phone verification

The backend supports two SMS modes:

- `SMS_DELIVERY_MODE=twilio`: generate the OTP in the app, send it through Twilio Programmable SMS.
- `SMS_DELIVERY_MODE=twilio-verify`: let Twilio Verify send and validate the code.

Recommended setup for production phone verification:

```bash
SMS_DELIVERY_MODE=twilio-verify
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

If you want app-generated OTPs instead of Twilio Verify:

```bash
SMS_DELIVERY_MODE=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567
PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

The mobile app calls:

- `POST /api/auth/send-phone-code`
- `POST /api/auth/verify-phone-code`

Notes:

- Phone numbers are normalized on the backend before storage.
- `twilio-verify` now has a resend cooldown in addition to the broader per-user/per-phone rate limits.
- The verify flow requires an authenticated user with a phone number already saved on their profile.
