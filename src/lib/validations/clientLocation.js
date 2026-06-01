import { z } from "zod";

// =====================================================
// CLIENT LOCATION TYPES
// =====================================================

export const CLIENT_LOCATION_TYPES = [
  "head_office",
  "branch",
  "warehouse",
  "billing",
];

// =====================================================
// CREATE CLIENT LOCATION SCHEMA
// =====================================================

export const createClientLocationSchema = z.object({
  clientId: z.coerce
    .number({
      required_error: "Client ID is required",
    })
    .positive("Invalid client ID"),

  name: z
    .string({
      required_error: "Location name is required",
    })
    .trim()
    .min(2, "Location name must be at least 2 characters")
    .max(120, "Location name is too long"),

  code: z.string().trim().max(50, "Code is too long").optional().nullable(),

  type: z.enum(CLIENT_LOCATION_TYPES).optional().nullable(),

  address: z
    .string()
    .trim()
    .max(500, "Address is too long")
    .optional()
    .nullable(),

  city: z
    .string()
    .trim()
    .max(100, "City name is too long")
    .optional()
    .nullable(),

  state: z
    .string()
    .trim()
    .max(100, "State name is too long")
    .optional()
    .nullable(),

  pincode: z
    .string()
    .trim()
    .max(20, "Pincode is too long")
    .optional()
    .nullable(),

  country: z
    .string()
    .trim()
    .max(100, "Country name is too long")
    .default("India")
    .optional(),

  gstNumber: z
    .string()
    .trim()
    .max(50, "GST number is too long")
    .optional()
    .nullable(),

  isPrimary: z.boolean().default(false),

  isActive: z.boolean().default(true),
});

// =====================================================
// UPDATE CLIENT LOCATION SCHEMA
// =====================================================

export const updateClientLocationSchema = createClientLocationSchema.extend({
  id: z.coerce
    .number({
      required_error: "Location ID is required",
    })
    .positive("Invalid location ID"),
});

// =====================================================
// DELETE CLIENT LOCATION SCHEMA
// =====================================================

export const deleteClientLocationSchema = z.object({
  id: z.coerce
    .number({
      required_error: "Location ID is required",
    })
    .positive("Invalid location ID"),

  clientId: z.coerce
    .number({
      required_error: "Client ID is required",
    })
    .positive("Invalid client ID"),
});
