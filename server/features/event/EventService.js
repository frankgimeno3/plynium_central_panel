import EventModel from "./EventModel.js";
import { createEventPortals } from "./EventPortalService.js";
import "../../database/models.js";

function toApiEvent(event) {
  return {
    id_fair: event.id_fair,
    event_name: event.event_name,
    country: event.country,
    main_description: event.main_description ?? "",
    region: event.region ?? "",
    start_date: event.start_date ? new Date(event.start_date).toISOString().split("T")[0] : null,
    end_date: event.end_date ? new Date(event.end_date).toISOString().split("T")[0] : null,
    location: event.location ?? "",
    event_main_image: event.event_main_image ?? "",
  };
}

function buildCreatePayload(eventData) {
  return {
    id_fair: eventData.id_fair,
    event_name: eventData.event_name,
    country: eventData.country ?? "",
    main_description: eventData.main_description ?? "",
    region: eventData.region ?? "",
    start_date: eventData.start_date,
    end_date: eventData.end_date,
    location: eventData.location ?? "",
    event_main_image: eventData.event_main_image ?? "",
  };
}

/**
 * @param {{ name?: string, region?: string, dateFrom?: string, dateTo?: string, portalNames?: string[] }} opts
 * - name: partial match on event_name (case-insensitive)
 * - region: exact match on region
 * - dateFrom, dateTo: event overlaps [dateFrom, dateTo] if start_date <= dateTo AND end_date >= dateFrom (both required if either set)
 * - portalNames: only events visible in at least one of these portals (by name)
 */
export async function getAllEvents(opts = {}) {
  try {
    if (!EventModel.sequelize) {
      console.warn("EventModel not initialized, returning empty array");
      return [];
    }

    const name = typeof opts?.name === "string" ? opts.name.trim() : "";
    const region = typeof opts?.region === "string" ? opts.region.trim() : "";
    const dateFrom = typeof opts?.dateFrom === "string" ? opts.dateFrom.trim() : "";
    const dateTo = typeof opts?.dateTo === "string" ? opts.dateTo.trim() : "";
    const portalNames = Array.isArray(opts?.portalNames) ? opts.portalNames.filter(Boolean).map((n) => String(n).trim()) : [];

    const hasFilters = name || region || (dateFrom && dateTo) || portalNames.length > 0;

    if (hasFilters) {
      const conditions = [];
      const replacements = {};

      if (name) {
        conditions.push("e.event_name ILIKE :namePattern");
        const escaped = name.replace(/[%_\\]/g, (c) => `\\${c}`);
        replacements.namePattern = `%${escaped}%`;
      }
      if (region) {
        conditions.push("e.region = :region");
        replacements.region = region;
      }
      if (dateFrom && dateTo) {
        conditions.push("e.start_date::date <= :dateTo");
        conditions.push("e.end_date::date >= :dateFrom");
        replacements.dateFrom = dateFrom;
        replacements.dateTo = dateTo;
      }

      let joinClause = "";
      if (portalNames.length > 0) {
        const placeholders = portalNames.map((_, i) => `:p${i}`).join(", ");
        portalNames.forEach((n, i) => { replacements[`p${i}`] = n; });
        joinClause = ` INNER JOIN event_portals ep ON ep.event_id = e.id_fair
         INNER JOIN portals p ON p.id = ep.portal_id AND p.name IN (${placeholders})`;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const [rows] = await EventModel.sequelize.query(
        `SELECT DISTINCT e.id_fair, e.event_name, e.country, e.main_description, e.region,
                e.start_date, e.end_date, e.location, e.event_main_image
         FROM events e${joinClause}
         ${whereClause}
         ORDER BY e.start_date ASC`,
        { replacements }
      );
      return (rows || []).map((r) => toApiEvent(r));
    }

    const events = await EventModel.findAll({
      order: [["start_date", "ASC"]],
    });
    return events.map(toApiEvent);
  } catch (error) {
    if (isEventMainImageColumnMissingError(error)) {
      console.warn("[EventService] Column 'event_main_image' missing, adding it...");
      await ensureEventMainImageColumn();
      const events = await EventModel.findAll({ order: [["start_date", "ASC"]] });
      return events.map(toApiEvent);
    }
    console.error("Error fetching events from database:", error);
    if (
      error.name === "SequelizeConnectionError" ||
      error.name === "SequelizeConnectionRefusedError" ||
      error.message?.includes("ETIMEDOUT") ||
      error.message?.includes("ECONNREFUSED") ||
      (error.message?.includes("relation") && error.message?.includes("does not exist")) ||
      error.message?.includes("not initialized") ||
      error.message?.includes("Model not found")
    ) {
      console.warn("Database connection issue, returning empty array");
      return [];
    }
    throw error;
  }
}

export async function getEventById(idFair) {
  try {
    const event = await EventModel.findByPk(idFair);
    if (!event) {
      throw new Error(`Event with id_fair ${idFair} not found`);
    }
    return toApiEvent(event);
  } catch (error) {
    if (isEventMainImageColumnMissingError(error)) {
      await ensureEventMainImageColumn();
      const event = await EventModel.findByPk(idFair);
      if (!event) throw new Error(`Event with id_fair ${idFair} not found`);
      return toApiEvent(event);
    }
    throw error;
  }
}

function isEventsTableMissingError(error) {
  const msg = (error?.message || "") + (error?.original?.message || "");
  return msg.includes("events") && msg.includes("does not exist");
}

function isEventMainImageColumnMissingError(error) {
  const msg = (error?.message || "") + (error?.original?.message || "");
  return msg.includes("event_main_image") && msg.includes("does not exist");
}

async function ensureEventMainImageColumn() {
  if (!EventModel.sequelize) return;
  const tableName = EventModel.tableName || "events";
  await EventModel.sequelize.query(
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS event_main_image VARCHAR(255) DEFAULT ''`
  );
}

export async function createEvent(eventData) {
  if (!EventModel.sequelize) {
    throw new Error("EventModel not initialized");
  }
  try {
    const event = await EventModel.create(buildCreatePayload(eventData));
    const portalIds = Array.isArray(eventData.portalIds)
      ? eventData.portalIds.filter((id) => Number.isInteger(Number(id))).map(Number)
      : [];
    if (portalIds.length > 0) {
      await createEventPortals(event.id_fair, portalIds, eventData.event_name ?? "");
    }
    return toApiEvent(event);
  } catch (error) {
    if (isEventsTableMissingError(error)) {
      console.warn("[EventService] Table 'events' missing, creating it...");
      await EventModel.sync();
      const event = await EventModel.create(buildCreatePayload(eventData));
      const portalIds = Array.isArray(eventData.portalIds)
        ? eventData.portalIds.filter((id) => Number.isInteger(Number(id))).map(Number)
        : [];
      if (portalIds.length > 0) {
        await createEventPortals(event.id_fair, portalIds, eventData.event_name ?? "");
      }
      return toApiEvent(event);
    }
    if (isEventMainImageColumnMissingError(error)) {
      console.warn("[EventService] Column 'event_main_image' missing, adding it...");
      await ensureEventMainImageColumn();
      const event = await EventModel.create(buildCreatePayload(eventData));
      const portalIds = Array.isArray(eventData.portalIds)
        ? eventData.portalIds.filter((id) => Number.isInteger(Number(id))).map(Number)
        : [];
      if (portalIds.length > 0) {
        await createEventPortals(event.id_fair, portalIds, eventData.event_name ?? "");
      }
      return toApiEvent(event);
    }
    throw error;
  }
}

function buildUpdatePayload(eventData) {
  const payload = {};
  if (eventData.event_name !== undefined) payload.event_name = eventData.event_name;
  if (eventData.country !== undefined) payload.country = eventData.country;
  if (eventData.main_description !== undefined) payload.main_description = eventData.main_description;
  if (eventData.region !== undefined) payload.region = eventData.region;
  if (eventData.start_date !== undefined) payload.start_date = eventData.start_date;
  if (eventData.end_date !== undefined) payload.end_date = eventData.end_date;
  if (eventData.location !== undefined) payload.location = eventData.location;
  if (eventData.event_main_image !== undefined) payload.event_main_image = eventData.event_main_image ?? "";
  return payload;
}

export async function updateEvent(idFair, eventData) {
  try {
    const event = await EventModel.findByPk(idFair);
    if (!event) {
      throw new Error(`Event with id_fair ${idFair} not found`);
    }
    const payload = buildUpdatePayload(eventData);
    if (Object.keys(payload).length === 0) {
      return toApiEvent(event);
    }
    await EventModel.update(payload, { where: { id_fair: idFair } });
    const updated = await EventModel.findByPk(idFair);
    return toApiEvent(updated);
  } catch (error) {
    if (isEventMainImageColumnMissingError(error)) {
      await ensureEventMainImageColumn();
      return updateEvent(idFair, eventData);
    }
    throw error;
  }
}

export async function deleteEvent(idFair) {
  try {
    const event = await EventModel.findByPk(idFair);
    if (!event) {
      throw new Error(`Event with id_fair ${idFair} not found`);
    }
    await event.destroy();
    return toApiEvent(event);
  } catch (error) {
    if (isEventMainImageColumnMissingError(error)) {
      await ensureEventMainImageColumn();
      return deleteEvent(idFair);
    }
    throw error;
  }
}
