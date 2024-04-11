import { nip19 } from "nostr-tools";

const hexPubkeyValidator = /^\w{64}$/;

export function npubToHex(npub: string): string {
  let hex: string = npub;
  if (hex.startsWith("npub1")) {
    hex = nip19.decode(npub).data.toString();
    //get hex pubkey from npub, or return error
  }
  if (!hexPubkeyValidator.test(hex)) {
    throw new Error("invalid pubkey");
  }
  return hex;
}


