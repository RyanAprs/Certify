import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT || "",
  pinataGateway: import.meta.env.VITE_GATEWAY_URL || "",
});

/* ---------------- file ---------------- */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    const res = await pinata.upload.public.file(file);
    return res.cid;
  } catch (err) {
    console.error("IPFS file upload failed:", err);
    throw err;
  }
};

/* ---------------- json ---------------- */
export async function uploadJson<T>(payload: T): Promise<string> {
  try {
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });

    // blob → file (nama & lastModified dummy)
    const file = new File([blob], "metadata.json", {
      type: "application/json",
      lastModified: Date.now(),
    });

    const res = await pinata.upload.public.file(file);
    return res.cid;
  } catch (err) {
    console.error("IPFS JSON upload failed:", err);
    throw err;
  }
}

/* ---------------- fetch json ---------------- */
export async function fetchJson<T>(cid: string): Promise<T> {
  try {
    const url = `https://${import.meta.env.VITE_GATEWAY_URL || ""}/ipfs/${cid}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch JSON from IPFS: ${res.statusText}`);
    }
    const data: T = await res.json();
    return data;
  } catch (err) {
    console.error("IPFS JSON fetch failed:", err);
    throw err;
  }
}
