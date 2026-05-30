import { decrypt, encrypt } from "@/lib/crypto";

export const encryptAnonymousMessage = (body: string) => encrypt(body);

export const decryptAnonymousMessage = (body: string) => decrypt(body);
