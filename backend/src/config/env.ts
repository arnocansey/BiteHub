import "dotenv/config";

const required = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET"
] as const;

const insecurePlaceholders = new Set([
  "replace-me",
  "replace-me-too",
  "sk_test_xxx",
  "paystack-webhook-secret",
  "google-maps-key"
]);

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV ?? "development";

const assertSecureValue = (key: string, value: string) => {
  if (nodeEnv === "production" && insecurePlaceholders.has(value)) {
    throw new Error(
      `Environment variable ${key} is using an insecure placeholder value`
    );
  }
};

assertSecureValue("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET!);
assertSecureValue("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET!);

if (process.env.PAYSTACK_SECRET_KEY) {
  assertSecureValue("PAYSTACK_SECRET_KEY", process.env.PAYSTACK_SECRET_KEY);
}

if (process.env.PAYSTACK_WEBHOOK_SECRET) {
  assertSecureValue(
    "PAYSTACK_WEBHOOK_SECRET",
    process.env.PAYSTACK_WEBHOOK_SECRET
  );
}

if (process.env.GOOGLE_MAPS_API_KEY) {
  assertSecureValue("GOOGLE_MAPS_API_KEY", process.env.GOOGLE_MAPS_API_KEY);
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "12h",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "90d",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  clientAppUrl: process.env.CLIENT_APP_URL ?? "exp://localhost:8081",
  adminDashboardUrl: process.env.ADMIN_DASHBOARD_URL ?? "http://localhost:3000",
  adminDashboardUrls: (process.env.ADMIN_DASHBOARD_URL ?? "http://localhost:3000")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? ""
};
