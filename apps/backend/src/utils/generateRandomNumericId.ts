import crypto from "crypto";

export function generateRandomNumericId(length = 16) {
  let digits = "";

  while (digits.length < length) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < 250) {
      digits += (byte % 10).toString();
    }
  }

  return digits;
}

