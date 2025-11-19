import { create } from "ipfs-http-client";
import { Buffer } from "buffer";

const projectId = import.meta.env.VITE_IPFS_PROJECT_ID;
const projectSecret = import.meta.env.VITE_IPFS_PROJECT_SECRET;
const auth = projectId && projectSecret ? `Basic ${btoa(`${projectId}:${projectSecret}`)}` : undefined;

export const ipfsClient = create({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: auth ? { Authorization: auth } : undefined
});

export async function uploadJson<T>(payload: T) {
  const result = await ipfsClient.add(JSON.stringify(payload));
  return result.cid.toString();
}

export async function fetchJson<T>(cid: string): Promise<T> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of ipfsClient.cat(cid)) {
    chunks.push(chunk as Uint8Array);
  }
  const data = new TextDecoder().decode(Buffer.concat(chunks));
  return JSON.parse(data) as T;
}

export async function uploadFile(file: File | Blob) {
  const result = await ipfsClient.add(file);
  return result.cid.toString();
}
