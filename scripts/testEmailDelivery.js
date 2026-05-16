#!/usr/bin/env node

require("dotenv").config();

const { sendVerificationEmail } = require("../src/services/mailService");

const targetEmail = process.argv[2] || process.env.TEST_EMAIL_TO;

if (!targetEmail) {
  console.error("Missing target email. Usage: npm run test:email -- user@example.com");
  process.exit(1);
}

const code = String(Math.floor(100000 + Math.random() * 900000));

(async () => {
  console.log(`Testing verification email delivery to ${targetEmail}...`);
  const result = await sendVerificationEmail({
    email: targetEmail,
    code,
    expiresInMinutes: 15,
  });
  console.log("Email delivery result:", result);
})().catch((error) => {
  console.error("Email delivery failed:", error.message);
  process.exit(1);
});
