import { keccak256, toBytes } from "viem";
import { packString } from "./merkle";

/**
 * Credential schema registry.
 *
 * A schema declares display fields and provable CLAIMS. Claims are committed via
 * a Merkle root and proven with a predicate without being revealed:
 *   - `range`    → value ≥ threshold          (numbers, and timestamps as expiry)
 *   - `equality` → value == X                 (numbers or strings)
 *
 * Adding a numeric/string credential type = add a schema here (no new circuit).
 */

export type ClaimKind = "number" | "string" | "timestamp";
export type Predicate = "range" | "equality";

export interface ClaimField {
  key: string;
  label: string;
  kind: ClaimKind;
  predicates: Predicate[]; // which statements a verifier may request
  min?: number; // number kind
  max?: number;
  step?: number;
  scale?: number; // integer scale for `number` (e.g. GPA ×100); default 1
  unit?: string;
}

export interface DisplayField {
  key: string;
  label: string;
  type: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
}

export interface Schema {
  type: string;
  version: string;
  id: `0x${string}`;
  label: string;
  description: string;
  display: DisplayField[];
  claims: ClaimField[];
}

function schemaId(type: string, version: string): `0x${string}` {
  return keccak256(toBytes(`${type}.${version}`));
}

const COMMON_DISPLAY: DisplayField[] = [
  { key: "name", label: "Recipient name", type: "text", required: true, placeholder: "Ada Lovelace" },
  { key: "institution", label: "Institution", type: "text", required: true, placeholder: "University of…" },
  { key: "program", label: "Program", type: "text", required: true, placeholder: "B.Sc. Computer Science" },
  { key: "description", label: "Description", type: "textarea", required: true, placeholder: "Awarded with honours…" },
];

export const SCHEMAS: Schema[] = [
  {
    type: "diploma",
    version: "v1",
    id: schemaId("diploma", "v1"),
    label: "Academic Diploma",
    description: "A degree credential; prove a GPA threshold without revealing the GPA.",
    display: COMMON_DISPLAY,
    claims: [
      { key: "gpa", label: "GPA", kind: "number", predicates: ["range"], min: 0, max: 5, step: 0.01, scale: 100 },
    ],
  },
  {
    type: "competency",
    version: "v1",
    id: schemaId("competency", "v1"),
    label: "Competency Certificate",
    description: "A skills credential; prove a score/level threshold, or an exact area.",
    display: [
      ...COMMON_DISPLAY.filter((f) => f.key !== "program"),
      { key: "program", label: "Competency area", type: "text", required: true, placeholder: "Welding — Structural" },
    ],
    claims: [
      { key: "score", label: "Assessment score", kind: "number", predicates: ["range"], min: 0, max: 100, step: 1, scale: 1, unit: "/100" },
      { key: "level", label: "Attained level", kind: "number", predicates: ["range", "equality"], min: 1, max: 5, step: 1, scale: 1 },
      { key: "skill", label: "Skill", kind: "string", predicates: ["equality"] },
    ],
  },
  {
    type: "license",
    version: "v1",
    id: schemaId("license", "v1"),
    label: "Professional License",
    description: "A license credential; prove the issuing authority and that it is not expired.",
    display: [
      ...COMMON_DISPLAY.filter((f) => f.key !== "program"),
      { key: "program", label: "License type", type: "text", required: true, placeholder: "Structural Welding" },
    ],
    claims: [
      { key: "authority", label: "Issuing authority", kind: "string", predicates: ["equality"] },
      { key: "level", label: "Grade / class", kind: "number", predicates: ["range", "equality"], min: 1, max: 10, step: 1, scale: 1 },
      { key: "validUntil", label: "Valid until", kind: "timestamp", predicates: ["range"] },
    ],
  },
];

export function getSchema(id: string): Schema | undefined {
  return SCHEMAS.find((s) => s.id.toLowerCase() === id.toLowerCase());
}

export function getSchemaByType(type: string): Schema | undefined {
  return SCHEMAS.find((s) => s.type === type);
}

/**
 * Encode a raw claim value to the field-element integer the circuit uses.
 *   number    → round(value × scale)
 *   timestamp → unix seconds (raw is a unix-seconds number)
 *   string    → packed utf-8 bytes
 */
export function encodeClaimValue(field: ClaimField, raw: number | string): bigint {
  if (field.kind === "string") {
    return packString(String(raw));
  }
  const n = typeof raw === "number" ? raw : parseFloat(raw);
  if (isNaN(n)) throw new Error(`${field.label} must be a number`);
  if (field.kind === "timestamp") return BigInt(Math.floor(n));
  if (field.min !== undefined && field.max !== undefined && (n < field.min || n > field.max)) {
    throw new Error(`${field.label} must be between ${field.min} and ${field.max}`);
  }
  return BigInt(Math.round(n * (field.scale ?? 1)));
}
