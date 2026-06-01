"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { clientLocations } from "@/db/schema";

// =====================================================
// CREATE CLIENT LOCATION
// =====================================================

export async function createClientLocation(data) {
  try {
    const {
      clientId,
      name,
      code,
      type,
      address,
      city,
      state,
      pincode,
      country,
      gstNumber,
      isPrimary,
    } = data;

    // =====================================
    // VALIDATION
    // =====================================

    if (!clientId) {
      return {
        success: false,
        error: "Client ID is required",
      };
    }

    if (!name?.trim()) {
      return {
        success: false,
        error: "Location name is required",
      };
    }

    // =====================================
    // HANDLE PRIMARY LOCATION
    // =====================================

    if (isPrimary) {
      await db
        .update(clientLocations)
        .set({
          isPrimary: false,
        })
        .where(
          and(
            eq(clientLocations.clientId, clientId),
            isNull(clientLocations.deletedAt),
          ),
        );
    }

    // =====================================
    // INSERT
    // =====================================

    const [location] = await db
      .insert(clientLocations)
      .values({
        clientId,

        name: name.trim(),

        code: code?.trim() || null,

        type: type || null,

        address: address?.trim() || null,

        city: city?.trim() || null,

        state: state?.trim() || null,

        pincode: pincode?.trim() || null,

        country: country?.trim() || "India",

        gstNumber: gstNumber?.trim() || null,

        isPrimary: Boolean(isPrimary),
      })
      .returning();

    // =====================================
    // REVALIDATE
    // =====================================

    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      data: location,
    };
  } catch (error) {
    console.error("Create client location error:", error);

    return {
      success: false,
      error: error?.message || "Failed to create location",
    };
  }
}

// =====================================================
// UPDATE CLIENT LOCATION
// =====================================================

export async function updateClientLocation(id, data) {
  try {
    if (!id) {
      return {
        success: false,
        error: "Location ID is required",
      };
    }

    const {
      clientId,
      name,
      code,
      type,
      address,
      city,
      state,
      pincode,
      country,
      gstNumber,
      isPrimary,
      isActive,
    } = data;

    // =====================================
    // VALIDATION
    // =====================================

    if (!name?.trim()) {
      return {
        success: false,
        error: "Location name is required",
      };
    }

    // =====================================
    // HANDLE PRIMARY LOCATION
    // =====================================

    if (isPrimary) {
      await db
        .update(clientLocations)
        .set({
          isPrimary: false,
        })
        .where(
          and(
            eq(clientLocations.clientId, clientId),
            isNull(clientLocations.deletedAt),
          ),
        );
    }

    // =====================================
    // UPDATE
    // =====================================

    const [location] = await db
      .update(clientLocations)
      .set({
        name: name.trim(),

        code: code?.trim() || null,

        type: type || null,

        address: address?.trim() || null,

        city: city?.trim() || null,

        state: state?.trim() || null,

        pincode: pincode?.trim() || null,

        country: country?.trim() || "India",

        gstNumber: gstNumber?.trim() || null,

        isPrimary: Boolean(isPrimary),

        isActive: typeof isActive === "boolean" ? isActive : true,

        updatedAt: new Date(),
      })
      .where(eq(clientLocations.id, id))
      .returning();

    // =====================================
    // REVALIDATE
    // =====================================

    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      data: location,
    };
  } catch (error) {
    console.error("Update client location error:", error);

    return {
      success: false,
      error: error?.message || "Failed to update location",
    };
  }
}

// =====================================================
// DELETE CLIENT LOCATION
// =====================================================

export async function deleteClientLocation(id, clientId) {
  try {
    if (!id) {
      return {
        success: false,
        error: "Location ID is required",
      };
    }

    // =====================================
    // SOFT DELETE
    // =====================================

    await db
      .update(clientLocations)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clientLocations.id, id));

    // =====================================
    // REVALIDATE
    // =====================================

    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete client location error:", error);

    return {
      success: false,
      error: error?.message || "Failed to delete location",
    };
  }
}

// =====================================================
// GET CLIENT LOCATIONS
// =====================================================

export async function getClientLocations(clientId) {
  try {
    if (!clientId) {
      return [];
    }

    const locations = await db
      .select()
      .from(clientLocations)
      .where(
        and(
          eq(clientLocations.clientId, clientId),
          isNull(clientLocations.deletedAt),
        ),
      )
      .orderBy(
        desc(clientLocations.isPrimary),
        desc(clientLocations.createdAt),
      );

    return locations;
  } catch (error) {
    console.error("Get client locations error:", error);

    return [];
  }
}

// =====================================================
// GET CLIENT LOCATION BY ID
// =====================================================

export async function getClientLocationById(id) {
  try {
    if (!id) {
      return null;
    }

    const location = await db
      .select()
      .from(clientLocations)
      .where(
        and(
          eq(clientLocations.id, Number(id)),
          isNull(clientLocations.deletedAt),
        ),
      )
      .limit(1);

    return location[0] || null;
  } catch (error) {
    console.error("Get client location by ID error:", error);

    return null;
  }
}
