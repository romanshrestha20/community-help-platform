import twilio from "twilio";

type SendSmsInput = {
  to: string;
  message: string;
};

type SmsConfigStatus = {
  mode: string;
  configured: boolean;
  missing: string[];
};

const trimEnv = (value?: string) => value?.trim() || "";

const getSmsDeliveryMode = () => {
  return trimEnv(process.env.SMS_DELIVERY_MODE).toLowerCase() || "log";
};

const getTwilioConfig = () => {
  return {
    accountSid: trimEnv(process.env.TWILIO_ACCOUNT_SID),
    authToken: trimEnv(process.env.TWILIO_AUTH_TOKEN),
    phoneNumber: trimEnv(process.env.TWILIO_PHONE_NUMBER),
    verifyServiceSid: trimEnv(process.env.TWILIO_VERIFY_SERVICE_SID),
  };
};

const getMissingRequiredSmsEnv = () => {
  const mode = getSmsDeliveryMode();

  if (mode !== "twilio" && mode !== "twilio-verify") {
    return [];
  }

  const config = getTwilioConfig();
  const missing: string[] = [];

  if (!config.accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!config.authToken) missing.push("TWILIO_AUTH_TOKEN");
  if (mode === "twilio" && !config.phoneNumber) {
    missing.push("TWILIO_PHONE_NUMBER");
  }
  if (mode === "twilio-verify" && !config.verifyServiceSid) {
    missing.push("TWILIO_VERIFY_SERVICE_SID");
  }

  return missing;
};

const getTwilioClient = () => {
  const missing = getMissingRequiredSmsEnv();

  if (missing.length > 0) {
    throw new Error(
      `SMS_DELIVERY_MODE=${getSmsDeliveryMode()} requires: ${missing.join(", ")}`
    );
  }

  const config = getTwilioConfig();
  return twilio(config.accountSid, config.authToken);
};

export const getSmsServiceStatus = (): SmsConfigStatus => {
  const mode = getSmsDeliveryMode();

  if (mode === "log") {
    return {
      mode,
      configured: true,
      missing: [],
    };
  }

  if (mode === "twilio") {
    const missing = getMissingRequiredSmsEnv();
    return {
      mode,
      configured: missing.length === 0,
      missing,
    };
  }

  if (mode === "twilio-verify") {
    const missing = getMissingRequiredSmsEnv();
    return {
      mode,
      configured: missing.length === 0,
      missing,
    };
  }

  return {
    mode,
    configured: false,
    missing: ["SMS_DELIVERY_MODE"],
  };
};

export const isTwilioVerifyMode = () => getSmsDeliveryMode() === "twilio-verify";

export const sendSms = async ({ to, message }: SendSmsInput) => {
  if (!to || !message) {
    throw new Error("Missing required parameters for sending SMS");
  }

  const deliveryMode = getSmsDeliveryMode();

  if (deliveryMode === "log") {
    console.info("[sms] delivering sms via log transport", {
      to,
      message,
    });
    return;
  }

  if (deliveryMode === "twilio") {
    const client = getTwilioClient();
    const { phoneNumber } = getTwilioConfig();

    await client.messages.create({
      to,
      from: phoneNumber,
      body: message,
    });

    return;
  }

  throw new Error(
    `Unsupported SMS_DELIVERY_MODE: ${deliveryMode}. Use "log", "twilio", or "twilio-verify".`
  );
};

export const sendPhoneVerificationCode = async ({
  phone,
  code,
}: {
  phone: string;
  code?: string;
}) => {
  if (isTwilioVerifyMode()) {
    const client = getTwilioClient();
    const { verifyServiceSid } = getTwilioConfig();

    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return;
  }

  if (!code) {
    throw new Error("Verification code is required for non-Twilio Verify SMS delivery");
  }

  await sendSms({
    to: phone,
    message: `Your Community Help verification code is ${code}. It expires soon.`,
  });
};

export const checkPhoneVerificationCode = async ({
  phone,
  code,
}: {
  phone: string;
  code: string;
}) => {
  if (!isTwilioVerifyMode()) {
    throw new Error("Phone verification checks are only available in twilio-verify mode");
  }

  const client = getTwilioClient();
  const { verifyServiceSid } = getTwilioConfig();

  return client.verify.v2.services(verifyServiceSid).verificationChecks.create({
    to: phone,
    code,
  });
};
