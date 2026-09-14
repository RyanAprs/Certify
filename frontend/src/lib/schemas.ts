import { keccak256, toBytes } from "viem";

/**
 * Credential schema registry (Phase 1).
 *
 * A schema declares the display fields and the provable numeric CLAIMS of a
 * credential type. Claims are committed via a Merkle root (see merkle.ts) and
 * proven with the range predicate (value ≥ threshold) without being revealed.
 *
 * Adding a new numeric credential type = add a schema here. No new circuit is
 * needed as long as its provable statements are numeric thresholds.
 */

export interface ClaimField {
  key: string; // canonical claim key (must be stable; used in keyHash)
  label: string; // human label
  min: number;
  max: number;
  step?: number;
  /** integer scale applied before committing (e.g. GPA ×100). */
  scale: number;
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
  type: string; // e.g. "diploma"
  version: string; // e.g. "v1"
  id: `0x${string}`; // keccak256("diploma.v1")
  label: string; // "Academic Diploma"
  description: string;
  display: DisplayField[];
  claims: ClaimField[]; // ordered → Merkle leaf indices
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
    claims: [{ key: "gpa", label: "GPA", min: 0, max: 5, step: 0.01, scale: 100 }],
  },
  {
    type: "competency",
    version: "v1",
    id: schemaId("competency", "v1"),
    label: "Competency Certificate",
    description: "A skills credential; prove a score or level threshold privately.",
    display: [
      ...COMMON_DISPLAY.filter((f) => f.key !== "program"),
      { key: "program", label: "Competency area", type: "text", required: true, placeholder: "Welding — Structural" },
    ],
    claims: [
      { key: "score", label: "Assessment score", min: 0, max: 100, step: 1, scale: 1, unit: "/100" },
      { key: "level", label: "Attained level", min: 1, max: 5, step: 1, scale: 1 },
    ],
  },
];

export function getSchema(id: string): Schema | undefined {
  return SCHEMAS.find((s) => s.id.toLowerCase() === id.toLowerCase());
}

export function getSchemaByType(type: string): Schema | undefined {
  return SCHEMAS.find((s) => s.type === type);
}

/** Scale a human value to the integer the circuit/commitment uses. */
export function scaleClaim(field: ClaimField, raw: string | number): number {
  const n = typeof raw === "number" ? raw : parseFloat(raw);
  if (isNaN(n) || n < field.min || n > field.max) {
    throw new Error(`${field.label} must be between ${field.min} and ${field.max}`);
  }
  return Math.round(n * field.scale);
}
