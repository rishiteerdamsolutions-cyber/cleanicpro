/**
 * Generate RSA key pair for JWT signing.
 * Run: node scripts/generate-keys.js
 * Copy the output to .env.local as JWT_PRIVATE_KEY and JWT_PUBLIC_KEY
 */
const crypto = require("crypto");
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

console.log("Add these to your .env.local (use actual newlines in the key):\n");
console.log("JWT_PRIVATE_KEY=\"" + privateKey.replace(/\n/g, "\\n") + "\"");
console.log("\nJWT_PUBLIC_KEY=\"" + publicKey.replace(/\n/g, "\\n") + "\"");
