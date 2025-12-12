import crypto from "crypto";

export function generateRandomNumericId(length = 16) {
  const bytesNeeded = Math.ceil(length * 0.6);

  const buffer = crypto.randomBytes(bytesNeeded).toString("hex");

  let digits = "";

  for (let i = 0; i < buffer.length && digits.length < length; i++) {
    const charCode = buffer.charCodeAt(i);
    const digit = charCode % 10;
    digits += digit.toString();
  }

  while (digits.length < length) {
    digits += Math.floor(Math.random() * 10).toString();
  }

  return digits;
}


