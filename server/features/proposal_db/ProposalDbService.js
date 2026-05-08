import { randomUUID } from "node:crypto";
import { Op } from "sequelize";
import ProposalDbModel from "./ProposalDbModel.js";
import ProposalServiceLineDbModel from "./ProposalServiceLineDbModel.js";
import ProposalPaymentDbModel from "./ProposalPaymentDbModel.js";
import { ContractDbModel, OrderDbModel, ProjectDbModel } from "../../database/models.js";
import { getContractById } from "../contract_db/ContractDbService.js";
import {
    reserveAllPreferentialSlotsForProposal,
    finalizePreferentialSlotAfterAccept,
} from "../publication/PublicationPreferentialSlotReservationService.js";

function httpError(statusCode, message) {
    const e = new Error(message);
    e.statusCode = statusCode;
    return e;
}

/**
 * Match proposal_payment ordinal rules: by payment date ascending, undated last, stable by payload order.
 * @param {unknown[]} payments
 * @returns {{ pay: unknown, ordinal: string }[]}
 */
function sortPayloadPaymentsByOrdinalRules(payments) {
    const list = Array.isArray(payments) ? payments : [];
    const decorated = list.map((pay, idx) => ({ pay, idx }));
    decorated.sort((a, b) => {
        const da = a.pay?.date ? String(a.pay.date).slice(0, 10) : null;
        const db = b.pay?.date ? String(b.pay.date).slice(0, 10) : null;
        if (da && db) {
            const c = da.localeCompare(db);
            if (c !== 0) return c;
        } else if (da && !db) return -1;
        else if (!da && db) return 1;
        return a.idx - b.idx;
    });
    const y = decorated.length;
    return decorated.map((d, i) => ({
        pay: d.pay,
        ordinal: y > 0 ? `${i + 1}/${y}` : "1/1",
    }));
}

/**
 * Panel RDS shape (see docs/RDS_SCHEMA.md): revenues_db uses id / id_customer / label / order_id / revenue_date …
 */
async function insertForecastedRevenuePanelRow(sequelize, transaction, row) {
    const id = String(row.id ?? "").trim();
    const id_customer = row.id_customer != null ? String(row.id_customer).trim() : null;
    const customer_name = String(row.customer_name ?? "").trim();
    const label = String(row.label ?? "").trim() || "Forecasted revenue";
    const order_id = String(row.order_id ?? row.reference ?? "")
        .trim()
        .slice(0, 128);
    const contract_id = row.contract_id != null ? String(row.contract_id).trim().slice(0, 64) : null;
    const proposal_payment_id = row.proposal_payment_id != null ? String(row.proposal_payment_id).trim() : null;
    const amount_eur = Number(row.amount_eur);
    const revenue_date = String(row.revenue_date ?? "").slice(0, 10);

    await sequelize.query(
        `
        INSERT INTO public.revenues_db (
            id,
            id_customer,
            customer_name,
            label,
            order_id,
            contract_id,
            proposal_payment_id,
            amount_eur,
            revenue_date,
            revenue_payment_status,
            created_at,
            updated_at
        ) VALUES (
            :id,
            :id_customer,
            :customer_name,
            :label,
            :order_id,
            :contract_id,
            CAST(:proposal_payment_id AS UUID),
            :amount_eur,
            CAST(:revenue_date AS DATE),
            'pending',
            NOW(),
            NOW()
        )
        `,
        {
            replacements: {
                id,
                id_customer: id_customer || null,
                customer_name,
                label,
                order_id,
                contract_id: contract_id || null,
                proposal_payment_id: proposal_payment_id || null,
                amount_eur: Number.isFinite(amount_eur) ? amount_eur : 0,
                revenue_date: revenue_date || new Date().toISOString().slice(0, 10),
            },
            transaction,
        }
    );
}

/**
 * Pre-tax net after line discounts and general discount (matches proposal detail totals pre-VAT).
 * @param {unknown[]} serviceLines
 * @param {number} generalDiscountPct
 */
function computePreTaxNet(serviceLines, generalDiscountPct) {
    const lines = Array.isArray(serviceLines) ? serviceLines : [];
    const sub = lines.reduce((sum, line) => {
        const u = Number(line?.units) || 0;
        const p = Number(line?.price) || 0;
        const d = Number(line?.discount_pct ?? line?.discount) || 0;
        return sum + u * p * (1 - d / 100);
    }, 0);
    const g = Number(generalDiscountPct) || 0;
    return sub * (1 - g / 100);
}

function parseTransferArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((s) => {
        if (s == null || s === "") return null;
        try {
            return typeof s === "string" ? JSON.parse(s) : s;
        } catch {
            return { raw: String(s) };
        }
    }).filter(Boolean);
}

/**
 * Reverse the pipe-separated snapshot written in proposal_service_custom_name (see serviceLineCustomName).
 * @param {string} custom
 */
function parseStoredServiceLineCustomName(custom) {
    const s = String(custom ?? "").trim();
    let units = 1;
    let price = 0;
    let discount_pct = 0;
    let specifications = "";
    let description = s;

    const unitsMatch = s.match(/Units:\s*(\d+)/i);
    if (unitsMatch) units = parseInt(unitsMatch[1], 10) || 1;

    const priceMatch = s.match(/Unit price:\s*([\d.]+)\s*€?/i);
    if (priceMatch) price = parseFloat(priceMatch[1]) || 0;

    const discMatch = s.match(/Line disc\. %:\s*([\d.]+)/i);
    if (discMatch) discount_pct = parseFloat(discMatch[1]) || 0;

    const specMatch = s.match(/Specs:\s*([^|]+)/i);
    if (specMatch) specifications = specMatch[1].trim();

    const beforePipe = s.split("|")[0]?.trim() ?? "";
    if (beforePipe && !/^Specs:/i.test(beforePipe)) description = beforePipe;

    return { description, specifications, units, price, discount_pct };
}

function inferProposalLinePublicationDateIso(lineLike) {
    const line = lineLike ?? {};
    if (line?.publicationMonth != null && line?.publicationYear != null) {
        const y = Number(line.publicationYear);
        const m = Number(line.publicationMonth);
        if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
            return `${y}-${String(m).padStart(2, "0")}-01`;
        }
    }
    if (line?.startDate) {
        return String(line.startDate).slice(0, 10);
    }
    return null;
}

function publicationDateFromPlainLine(plain) {
    const d = plain?.proposal_service_publication_date ?? plain?.proposalServicePublicationDate;
    return d ? String(d).slice(0, 10) : "";
}

function buildProposalServiceUnitDetails(lineLike) {
    const line = lineLike ?? {};
    const spec = String(line?.specifications ?? "").trim();
    const extras = [];

    const pubIso = inferProposalLinePublicationDateIso(line);
    if (pubIso) extras.push(`Publication date: ${pubIso}`);

    if (line?.publicationMonth != null && line?.publicationYear != null) {
        extras.push(`Publication month: ${line.publicationMonth}/${line.publicationYear}`);
    }

    if (line?.startDate || line?.endDate) {
        const s = line?.startDate ? String(line.startDate).slice(0, 10) : "";
        const e = line?.endDate ? String(line.endDate).slice(0, 10) : "";
        if (s && e) extras.push(`Campaign window: ${s} → ${e}`);
        else if (s) extras.push(`Start date: ${s}`);
        else if (e) extras.push(`End date: ${e}`);
    }

    const pubId =
        line?.id_planned_publication != null
            ? String(line.id_planned_publication).trim()
            : line?.publication_id != null
              ? String(line.publication_id).trim()
              : "";
    if (pubId) extras.push(`Publication id: ${pubId}`);

    if (line?.magazinePageType || line?.magazineSlotKey) {
        const pt = line?.magazinePageType ? String(line.magazinePageType) : "";
        const sk = line?.magazineSlotKey ? String(line.magazineSlotKey) : "";
        extras.push(`Magazine placement: ${[pt, sk].filter(Boolean).join(" · ")}`);
    }

    if (line?.position_in_magazine != null && String(line.position_in_magazine).trim() !== "") {
        extras.push(`Preferential placement: ${String(line.position_in_magazine).trim()}`);
    }

    const body = [
        spec && `Specifications:\n${spec}`,
        extras.length ? `Details:\n- ${extras.join("\n- ")}` : "",
    ]
        .filter(Boolean)
        .join("\n\n");

    return body.trim();
}

function linesToApi(lines) {
    return (lines || []).map((l, idx) => {
        const plain = typeof l?.get === "function" ? l.get({ plain: true }) : l;
        const unitDetailsRaw = plain?.proposal_service_unit_details ?? plain?.proposalServiceUnitDetails ?? "";

        /** @type {{description?: string, specifications?: string, publicationMonth?: number, publicationYear?: number, startDate?: string, endDate?: string, id_planned_publication?: string, magazinePageType?: string, magazineSlotKey?: string}|null} */
        let embedded = null;
        const ud = String(unitDetailsRaw ?? "").trim();
        if (ud) {
            const markerIdx = ud.indexOf("__embedded_json__:");
            const jsonBlob = markerIdx >= 0 ? ud.slice(markerIdx + "__embedded_json__:".length).trim() : ud;
            try {
                const parsed = JSON.parse(jsonBlob);
                if (parsed && typeof parsed === "object") embedded = parsed;
            } catch {
                embedded = null;
            }
        }

        const custom = plain?.proposal_service_custom_name ?? plain?.custom_name ?? "";
        const parsed = parseStoredServiceLineCustomName(custom);
        const discDb =
            plain?.proposal_service_discount != null ? Number(plain.proposal_service_discount) : Number(plain?.discount) || 0;
        const lineUuid = plain?.proposal_service_line_id != null ? String(plain.proposal_service_line_id) : "";
        const sid = String(
            plain?.service_id ??
                plain?.id_service ??
                plain?.serviceId ??
                ""
        ).trim();

        const dbPub = publicationDateFromPlainLine(plain);
        let description =
            embedded?.description != null && String(embedded.description).trim() !== ""
                ? String(embedded.description).trim()
                : parsed.description;
        let specifications =
            embedded?.specifications != null && String(embedded.specifications).trim() !== ""
                ? String(embedded.specifications).trim()
                : parsed.specifications;

        let publicationMonth = embedded?.publicationMonth;
        let publicationYear = embedded?.publicationYear;
        let startDate = embedded?.startDate;
        let endDate = embedded?.endDate;
        let id_planned_publication = embedded?.id_planned_publication;
        let magazinePageType = embedded?.magazinePageType;
        let magazineSlotKey = embedded?.magazineSlotKey;
        let preferential_slot_id =
            embedded?.preferential_slot_id != null ? String(embedded.preferential_slot_id).trim() : undefined;
        let position_in_magazine =
            embedded?.position_in_magazine != null ? String(embedded.position_in_magazine).trim() : undefined;

        if (!description && embedded && embedded.fallback_custom_name_snapshot) {
            const snap = parseStoredServiceLineCustomName(String(embedded.fallback_custom_name_snapshot));
            description = snap.description;
            specifications = specifications || snap.specifications;
        }

        if ((!specifications || !String(specifications).trim()) && unitDetailsRaw && !embedded) {
            const ud = String(unitDetailsRaw ?? "").trim();
            if (ud) specifications = ud;
        }

        let out = {
            lineId: lineUuid || `line-fallback-${idx}-${sid}`,
            id_service: sid,
            description,
            specifications,
            units: parsed.units,
            price: parsed.price,
            discount_pct: Number.isFinite(discDb) ? discDb : parsed.discount_pct,
            ...(publicationMonth != null && publicationYear != null ? { publicationMonth, publicationYear } : {}),
            ...(startDate || endDate ? { startDate: startDate ?? "", endDate: endDate ?? "" } : {}),
            ...(id_planned_publication ? { id_planned_publication } : {}),
            ...(magazinePageType || magazineSlotKey ? { magazinePageType, magazineSlotKey } : {}),
            ...(preferential_slot_id ? { preferential_slot_id } : {}),
            ...(position_in_magazine ? { position_in_magazine } : {}),
        };

        if (dbPub && !out.startDate && (publicationMonth == null || publicationYear == null)) {
            out = { ...out, startDate: dbPub };
        }

        return out;
    });
}

function paymentsToApi(rows) {
    return (rows || []).map((p, idx) => {
        const plain = typeof p?.get === "function" ? p.get({ plain: true }) : p;
        let paymentMethod = "transferencia_bancaria";
        let bank = "Sabadell";
        const num = String(plain?.proposal_payment_number ?? "").trim();
        if (num) {
            try {
                const meta = JSON.parse(num);
                if (meta.method === "recibo" || meta.method === "transferencia_bancaria") {
                    paymentMethod = meta.method;
                }
                if (meta.bank) bank = String(meta.bank);
            } catch {
                // ignore invalid JSON
            }
        }
        const pid = plain?.proposal_payment_id != null ? String(plain.proposal_payment_id) : "";
        const ord = plain?.proposal_payment_ordinal != null ? String(plain.proposal_payment_ordinal).trim() : "";
        return {
            paymentId: pid || `pay-fallback-${idx}`,
            amount: plain?.proposal_payment_amount != null ? Number(plain.proposal_payment_amount) : 0,
            date: plain?.proposal_payment_date ?? "",
            number: num,
            paymentMethod,
            bank,
            proposalPaymentOrdinal: ord || undefined,
        };
    });
}

function normalizeServiceLinesFromRow(p) {
    const lines = p?.service_lines ?? p?.serviceLines ?? p?.servicesArray ?? [];
    return Array.isArray(lines) ? lines : [];
}

function normalizePaymentsFromRow(p) {
    const pay = p?.payments ?? [];
    return Array.isArray(pay) ? pay : [];
}

function toApiProposal(row, serviceLines = [], paymentRows = []) {
    if (!row) return null;
    const additional = Array.isArray(row.additional_contact_ids)
        ? row.additional_contact_ids
        : [];
    const plyniumArr = parseTransferArray(row.exchange_plynium_transfers_array);
    const counterpartArr = parseTransferArray(row.exchange_counterpart_transfers_array);
    const firstPlynium = plyniumArr[0] || {};
    const firstCounter = counterpartArr[0] || {};
    const serviceLinesApi =
        serviceLines.length > 0 ? linesToApi(serviceLines) : normalizeServiceLinesFromRow(row);
    const paymentsApi =
        paymentRows.length > 0 ? paymentsToApi(paymentRows) : normalizePaymentsFromRow(row);
    return {
        id_proposal: row.id_proposal,
        id_customer: row.id_customer ?? "",
        id_contact: row.id_contact ?? "",
        additionalContactIds: additional,
        agent: row.agent ?? "",
        status: row.status ?? "",
        title: row.title ?? "",
        proposal_date: row.proposal_date ?? "",
        date_created: row.date_created ?? "",
        expiration_date: row.expiration_date ?? "",
        amount_eur: row.amount_eur != null ? Number(row.amount_eur) : 0,
        general_discount_pct: row.general_discount_pct != null ? Number(row.general_discount_pct) : 0,
        serviceLines: serviceLinesApi,
        payments: paymentsApi,
        isExchange: !!row.is_exchange,
        exchangeHasFinalPrice: !!row.exchange_has_final_price,
        exchangeFinalPrice: row.exchange_final_price != null ? Number(row.exchange_final_price) : 0,
        exchangeHasBankTransfers: !!row.exchange_has_bank_transfers,
        exchangePlyniumTransferDate: firstPlynium.date ?? firstPlynium.payment_date ?? "",
        exchangeCounterpartDate: firstCounter.date ?? "",
        exchangeTransferredAmount:
            firstPlynium.amount != null ? Number(firstPlynium.amount) : 0,
        exchangeToBeReceivedHtml: "",
        exchangePlyniumTransfers: plyniumArr,
        exchangeCounterpartTransfers: counterpartArr,
    };
}

async function loadLinesAndPaymentsByProposalIds(proposalIds) {
    const linesBy = new Map();
    const payBy = new Map();
    if (!proposalIds.length || !ProposalServiceLineDbModel.sequelize) {
        return { linesBy, payBy };
    }
    const [lines, pays] = await Promise.all([
        ProposalServiceLineDbModel.findAll({
            where: { proposal_id: { [Op.in]: proposalIds } },
        }),
        ProposalPaymentDbModel.findAll({
            where: { proposal_id: { [Op.in]: proposalIds } },
        }),
    ]);
    for (const id of proposalIds) {
        linesBy.set(id, []);
        payBy.set(id, []);
    }
    for (const r of lines) {
        const p = r.get({ plain: true });
        const pid = p.proposal_id;
        if (!linesBy.has(pid)) linesBy.set(pid, []);
        linesBy.get(pid).push(p);
    }
    for (const r of pays) {
        const p = r.get({ plain: true });
        const pid = p.proposal_id;
        if (!payBy.has(pid)) payBy.set(pid, []);
        payBy.get(pid).push(p);
    }
    return { linesBy, payBy };
}

export async function getAllProposals() {
    try {
        if (!ProposalDbModel.sequelize) {
            console.warn("ProposalDbModel not initialized, returning empty array");
            return [];
        }
        const rows = await ProposalDbModel.findAll({
            order: [["date_created", "DESC"]],
        });
        const ids = rows.map((r) => r.get("id_proposal"));
        const { linesBy, payBy } = await loadLinesAndPaymentsByProposalIds(ids);
        return rows.map((r) => {
            const plain = r.get({ plain: true });
            const id = plain.id_proposal;
            return toApiProposal(plain, linesBy.get(id) || [], payBy.get(id) || []);
        });
    } catch (error) {
        console.error("Error fetching proposals from database:", error);
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

export async function getProposalById(idProposal) {
    const row = await ProposalDbModel.findByPk(idProposal);
    if (!row) throw new Error(`Proposal with id ${idProposal} not found`);
    const plain = row.get({ plain: true });
    const { linesBy, payBy } = await loadLinesAndPaymentsByProposalIds([idProposal]);
    return toApiProposal(plain, linesBy.get(idProposal) || [], payBy.get(idProposal) || []);
}

/**
 * @param {string} line
 * @returns {string}
 */
function serviceLineCustomName(line) {
    const desc = String(line?.description ?? "").trim();
    const spec = String(line?.specifications ?? "").trim();
    const units = line?.units != null ? String(line.units) : "";
    const price = line?.price != null ? String(line.price) : "";
    const disc = line?.discount_pct != null ? String(line.discount_pct) : "";
    const pubIsoFromLine = inferProposalLinePublicationDateIso(line);
    const pubDateFromLineField =
        line?.proposal_service_publication_date != null
            ? String(line.proposal_service_publication_date).slice(0, 10)
            : "";
    const pubIso = pubIsoFromLine || pubDateFromLineField;
    const parts = [
        desc,
        pubIso && `Publication date: ${pubIso}`,
        spec && `Specs: ${spec}`,
        units && `Units: ${units}`,
        price && `Unit price: ${price} €`,
        disc && `Line disc. %: ${disc}`,
    ].filter(Boolean);
    const s = parts.join(" | ");
    return s.length > 512 ? `${s.slice(0, 509)}...` : s;
}

function buildPersistedProposalServiceLinePayload(line) {
    const pubIso =
        inferProposalLinePublicationDateIso(line) ||
        (line?.proposal_service_publication_date != null
            ? String(line.proposal_service_publication_date).slice(0, 10)
            : "");

    const customNameSnapshot = serviceLineCustomName(line);
    const humanDetails = buildProposalServiceUnitDetails(line);
    const embedded = {
        v: 1,
        description: String(line?.description ?? "").trim(),
        specifications: String(line?.specifications ?? "").trim(),
        publicationMonth: line?.publicationMonth,
        publicationYear: line?.publicationYear,
        startDate: line?.startDate,
        endDate: line?.endDate,
        id_planned_publication: line?.id_planned_publication,
        magazinePageType: line?.magazinePageType,
        magazineSlotKey: line?.magazineSlotKey,
        preferential_slot_id: line?.preferential_slot_id ?? line?.preferentialSlotId,
        position_in_magazine: line?.position_in_magazine ?? line?.positionInMagazine,
        fallback_custom_name_snapshot: customNameSnapshot,
    };

    const embeddedJson = JSON.stringify(embedded);
    const unitDetails =
        embeddedJson.length > 20000 && humanDetails
            ? humanDetails
            : humanDetails && humanDetails.length
              ? `${humanDetails}\n\n__embedded_json__:${embeddedJson}`
              : `__embedded_json__:${embeddedJson}`;

    return {
        proposal_service_custom_name: customNameSnapshot,
        proposal_service_discount: Number(line?.discount_pct ?? line?.discount ?? 0) || 0,
        proposal_service_publication_date: pubIso || null,
        proposal_service_unit_details: unitDetails,
    };
}

/**
 * Persist a new proposal with service lines and payments.
 * @param {Record<string, unknown>} payload API-shaped body from the panel wizard
 */
export async function createProposal(payload) {
    if (!ProposalDbModel.sequelize) {
        throw new Error("ProposalDbModel not initialized");
    }
    const id_proposal = String(payload?.id_proposal ?? "").trim() || `prop-${randomUUID()}`;
    const id_customer = String(payload?.id_customer ?? "").trim();
    if (!id_customer) {
        throw new Error("id_customer is required");
    }

    const id_contact = String(payload?.id_contact ?? "").trim();
    const additional = Array.isArray(payload?.additionalContactIds)
        ? payload.additionalContactIds.map((x) => String(x).trim()).filter(Boolean)
        : [];
    const agent = String(payload?.agent ?? "").trim();
    const title = String(payload?.title ?? "").trim().slice(0, 255) || "Untitled proposal";
    const status = String(payload?.status ?? "draft").trim() || "draft";
    const amount_eur = Number(payload?.amount_eur);
    const proposal_date = payload?.proposal_date ? String(payload.proposal_date).slice(0, 10) : null;
    const date_created = payload?.date_created
        ? String(payload.date_created).slice(0, 10)
        : proposal_date || new Date().toISOString().slice(0, 10);
    const expiration_date = payload?.expiration_date ? String(payload.expiration_date).slice(0, 10) : null;

    let general_discount_pct = 0;
    if (payload?.general_discount_mode === "abs") {
        general_discount_pct = 0;
    } else {
        const p = Number(payload?.general_discount_pct);
        general_discount_pct = Number.isFinite(p) ? p : 0;
    }

    const is_exchange = Boolean(payload?.isExchange);
    const exchange_has_final_price = Boolean(payload?.exchangeHasFinalPrice);
    const exchange_final_price = Number(payload?.exchangeFinalPrice) || 0;
    const exchange_has_bank_transfers = Boolean(payload?.exchangeHasBankTransfers);

    const plyniumArr = [];
    if (exchange_has_bank_transfers) {
        const o = {
            date: String(payload?.exchangePlyniumTransferDate ?? "").trim(),
            counterpart_date: String(payload?.exchangeCounterpartDate ?? "").trim(),
            amount: Number(payload?.exchangeTransferredAmount) || 0,
        };
        if (o.date || o.counterpart_date || o.amount) {
            plyniumArr.push(JSON.stringify(o));
        }
    }
    const counterpartArr = [];
    const html = String(payload?.exchangeToBeReceivedHtml ?? "").trim();
    if (html) {
        counterpartArr.push(JSON.stringify({ type: "to_be_received_html", html }));
    }

    const serviceLines = Array.isArray(payload?.serviceLines) ? payload.serviceLines : [];
    const payments = Array.isArray(payload?.payments) ? payload.payments : [];

    const sequelize = ProposalDbModel.sequelize;
    await sequelize.transaction(async (transaction) => {
        await ProposalDbModel.create(
            {
                id_proposal,
                id_customer,
                id_contact,
                additional_contact_ids: additional,
                agent,
                status,
                title,
                amount_eur: Number.isFinite(amount_eur) ? amount_eur : 0,
                proposal_date,
                date_created,
                expiration_date,
                general_discount_pct,
                is_exchange,
                exchange_has_final_price,
                exchange_final_price,
                exchange_has_bank_transfers,
                exchange_plynium_transfers_array: plyniumArr,
                exchange_counterpart_transfers_array: counterpartArr,
            },
            { transaction }
        );

        for (const line of serviceLines) {
            const service_id = String(line?.id_service ?? line?.service_id ?? line?.serviceId ?? "").trim();
            if (!service_id) continue;
            const snap = buildPersistedProposalServiceLinePayload(line);
            await ProposalServiceLineDbModel.create(
                {
                    proposal_id: id_proposal,
                    service_id,
                    proposal_service_custom_name: snap.proposal_service_custom_name,
                    proposal_service_discount: snap.proposal_service_discount,
                    proposal_service_publication_date: snap.proposal_service_publication_date,
                    proposal_service_unit_details: snap.proposal_service_unit_details,
                },
                { transaction }
            );
        }

        const preferentialSlotIds = [];
        for (const line of serviceLines) {
            const ps = line?.preferential_slot_id ?? line?.preferentialSlotId;
            if (ps) preferentialSlotIds.push(String(ps).trim());
        }
        await reserveAllPreferentialSlotsForProposal(transaction, id_proposal, preferentialSlotIds);

        const paysOrdinal = sortPayloadPaymentsByOrdinalRules(payments);
        for (const { pay, ordinal } of paysOrdinal) {
            const amt = Number(pay?.amount);
            const meta = {
                method: pay?.paymentMethod ?? "",
                bank: pay?.bank ?? "",
            };
            await ProposalPaymentDbModel.create(
                {
                    proposal_id: id_proposal,
                    proposal_payment_amount: Number.isFinite(amt) ? amt : 0,
                    proposal_payment_date: pay?.date ? String(pay.date).slice(0, 10) : null,
                    proposal_payment_number: JSON.stringify(meta),
                    proposal_payment_ordinal: ordinal,
                },
                { transaction }
            );
        }
    });

    return getProposalById(id_proposal);
}

/**
 * Persist header fields, service lines, and optionally payments.
 * @param {string} id_proposal
 * @param {Record<string, unknown>} payload
 */
export async function updateProposal(id_proposal, payload) {
    if (!ProposalDbModel.sequelize) {
        throw new Error("ProposalDbModel not initialized");
    }
    const row = await ProposalDbModel.findByPk(id_proposal);
    if (!row) {
        throw httpError(404, `Proposal with id ${id_proposal} not found`);
    }
    const plain = row.get({ plain: true });
    const updates = {};

    if (payload.title != null) {
        const t = String(payload.title).trim();
        if (!t) throw httpError(400, "title cannot be empty");
        updates.title = t.slice(0, 512);
    }
    if (payload.date_created != null) {
        updates.date_created = String(payload.date_created).slice(0, 10);
    }
    if (payload.expiration_date !== undefined) {
        updates.expiration_date = payload.expiration_date
            ? String(payload.expiration_date).slice(0, 10)
            : null;
    }
    if (payload.proposal_date !== undefined) {
        updates.proposal_date = payload.proposal_date ? String(payload.proposal_date).slice(0, 10) : null;
    }
    if (payload.general_discount_pct != null) {
        updates.general_discount_pct = Number.isFinite(Number(payload.general_discount_pct))
            ? Number(payload.general_discount_pct)
            : 0;
    }

    const sequelize = ProposalDbModel.sequelize;
    await sequelize.transaction(async (transaction) => {
        if (Array.isArray(payload.serviceLines)) {
            await ProposalServiceLineDbModel.destroy({ where: { proposal_id: id_proposal }, transaction });
            for (const line of payload.serviceLines) {
                const service_id = String(line?.id_service ?? line?.service_id ?? line?.serviceId ?? "").trim();
                if (!service_id) continue;
                const snap = buildPersistedProposalServiceLinePayload(line);
                await ProposalServiceLineDbModel.create(
                    {
                        proposal_id: id_proposal,
                        service_id,
                        proposal_service_custom_name: snap.proposal_service_custom_name,
                        proposal_service_discount: snap.proposal_service_discount,
                        proposal_service_publication_date: snap.proposal_service_publication_date,
                        proposal_service_unit_details: snap.proposal_service_unit_details,
                    },
                    { transaction }
                );
            }
            const g =
                payload.general_discount_pct != null
                    ? Number(payload.general_discount_pct)
                    : Number(plain.general_discount_pct) || 0;
            updates.amount_eur = payload.serviceLines.length ? computePreTaxNet(payload.serviceLines, g) : 0;
        } else if (payload.amount_eur != null) {
            updates.amount_eur = Number(payload.amount_eur);
        }

        if (Array.isArray(payload.payments)) {
            await ProposalPaymentDbModel.destroy({ where: { proposal_id: id_proposal }, transaction });
            const paysOrdinalPatch = sortPayloadPaymentsByOrdinalRules(payload.payments);
            for (const { pay, ordinal } of paysOrdinalPatch) {
                const amt = Number(pay?.amount);
                const meta = {
                    method: pay?.paymentMethod ?? "",
                    bank: pay?.bank ?? "",
                };
                await ProposalPaymentDbModel.create(
                    {
                        proposal_id: id_proposal,
                        proposal_payment_amount: Number.isFinite(amt) ? amt : 0,
                        proposal_payment_date: pay?.date ? String(pay.date).slice(0, 10) : null,
                        proposal_payment_number: JSON.stringify(meta),
                        proposal_payment_ordinal: ordinal,
                    },
                    { transaction }
                );
            }
        }

        if (Object.keys(updates).length) {
            await row.update(updates, { transaction });
        }
    });

    return getProposalById(id_proposal);
}

/**
 * Mark proposal accepted, create one contract and one project per service line.
 * @param {string} id_proposal
 * @param {{ contract_title?: string }} [options] If `contract_title` is non-empty after trim, it becomes `contract_title` in DB; otherwise the proposal title is used.
 */
export async function acceptProposalCreateContractAndProjects(id_proposal, options = {}) {
    if (!ProposalDbModel.sequelize) {
        throw new Error("ProposalDbModel not initialized");
    }
    const proposal = await getProposalById(id_proposal);
    const lineRows = await ProposalServiceLineDbModel.findAll({
        where: { proposal_id: id_proposal },
        order: [["proposal_service_line_id", "ASC"]],
    });
    const lines = linesToApi(lineRows);
    if (!lines.length) {
        throw httpError(400, "Proposal has no service lines; add services before accepting.");
    }
    const linesWithoutService = lines.filter(
        (l) => !String(l?.id_service ?? l?.service_id ?? l?.serviceId ?? "").trim()
    );
    if (linesWithoutService.length) {
        throw httpError(
            400,
            "Hay líneas de servicio sin identificador de servicio (service_id). Edita y guarda la propuesta antes de aceptar."
        );
    }

    const existing = await ContractDbModel.findOne({ where: { id_proposal } });
    if (existing) {
        throw httpError(409, "This proposal already has a contract.");
    }

    const id_contract = `ctr-${randomUUID()}`;
    const id_customer = String(proposal.id_customer ?? "").trim();
    if (!id_customer) {
        throw httpError(400, "Proposal is missing customer_id.");
    }

    const agent = String(proposal.agent ?? "").trim();
    const overrideTitle =
        options?.contract_title != null && String(options.contract_title).trim() !== ""
            ? String(options.contract_title).trim()
            : "";
    const contractTitle = (overrideTitle || String(proposal.title ?? "Contract").trim()).slice(0, 255) || "Contract";
    const gd = Number(proposal.general_discount_pct) || 0;
    const amount =
        proposal.amount_eur != null && Number.isFinite(Number(proposal.amount_eur))
            ? Number(proposal.amount_eur)
            : computePreTaxNet(lines, gd);

    const sequelize = ProposalDbModel.sequelize;
    const createdProjects = [];
    const createdRevenues = [];

    await sequelize.transaction(async (transaction) => {
        await ProposalDbModel.update({ status: "accepted" }, { where: { id_proposal }, transaction });

        await ContractDbModel.create(
            {
                id_contract,
                id_proposal,
                id_customer,
                agent,
                process_state: "active",
                payment_state: "pending",
                title: contractTitle,
                amount_eur: amount,
            },
            { transaction }
        );

        const preferentialSlotIdsAccept = new Set();
        for (const line of lines) {
            const ps = line?.preferential_slot_id;
            if (ps) preferentialSlotIdsAccept.add(String(ps).trim());
        }
        for (const slotId of preferentialSlotIdsAccept) {
            await finalizePreferentialSlotAfterAccept(transaction, {
                preferentialSlotId: slotId,
                acceptedProposalId: id_proposal,
                contractId: id_contract,
                customerId: id_customer,
            });
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const sid = String(line?.id_service ?? line?.service_id ?? line?.serviceId ?? "").trim();

            const id_project = `prj-${randomUUID()}`;
            const desc = String(line?.description ?? "").trim().slice(0, 120);
            const projectTitle = `${contractTitle} — ${desc || `Service ${i + 1}`}`.slice(0, 255);

            let publication_date = null;
            if (line?.startDate) {
                publication_date = String(line.startDate).slice(0, 10);
            } else if (line?.publicationMonth != null && line?.publicationYear != null) {
                const y = Number(line.publicationYear);
                const m = Number(line.publicationMonth);
                if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
                    publication_date = `${y}-${String(m).padStart(2, "0")}-01`;
                }
            }

            const publication_id = line?.id_planned_publication
                ? String(line.id_planned_publication).slice(0, 64)
                : null;

            await ProjectDbModel.create(
                {
                    id_project,
                    id_contract,
                    title: projectTitle,
                    status: "draft",
                    service: sid,
                    publication_date,
                    publication_id,
                },
                { transaction }
            );

            createdProjects.push({
                id_project,
                id_contract,
                title: projectTitle,
                status: "draft",
                service: sid,
                publication_date: publication_date ?? "",
                publication_id: publication_id ?? "",
                pm_events_array: [],
            });
        }

        if (!createdProjects.length) {
            throw httpError(400, "No se pudieron crear proyectos a partir de las líneas de servicio.");
        }

        let customer_account_name = "";
        if (id_customer) {
            const [custRows] = await sequelize.query(
                `SELECT customer_account_name AS name FROM customers_db WHERE customer_id = :cid LIMIT 1`,
                { replacements: { cid: id_customer }, transaction }
            );
            customer_account_name =
                custRows && custRows[0] && custRows[0].name != null ? String(custRows[0].name) : "";
        }

        const payRows = await ProposalPaymentDbModel.findAll({
            where: { proposal_id },
            order: sequelize.literal("proposal_payment_date ASC NULLS LAST, proposal_payment_id ASC"),
            transaction,
        });

        for (const pr of payRows) {
            const pplain = typeof pr?.get === "function" ? pr.get({ plain: true }) : pr;
            const paymentPk = pplain?.proposal_payment_id != null ? String(pplain.proposal_payment_id) : "";
            const ordStored =
                pplain?.proposal_payment_ordinal != null ? String(pplain.proposal_payment_ordinal).trim() : "";
            let ordinal = ordStored;
            if (!ordinal && payRows.length > 0) {
                const idx = payRows.findIndex((r) => String(r.get("proposal_payment_id") ?? "") === paymentPk);
                ordinal = `${idx + 1}/${payRows.length}`;
            }
            if (!ordinal) ordinal = "1/1";

            const amt = pplain?.proposal_payment_amount != null ? Number(pplain.proposal_payment_amount) : 0;
            let revenue_day = pplain?.proposal_payment_date ? String(pplain.proposal_payment_date).slice(0, 10) : "";
            if (!revenue_day) {
                revenue_day = proposal.proposal_date ? String(proposal.proposal_date).slice(0, 10) : "";
            }
            if (!revenue_day) {
                revenue_day = new Date().toISOString().slice(0, 10);
            }

            const orderIdStr = `${contractTitle}-${ordinal}`.slice(0, 128);
            const revenueId = `rev-${randomUUID()}`;

            await insertForecastedRevenuePanelRow(sequelize, transaction, {
                id: revenueId,
                id_customer,
                customer_name: customer_account_name,
                label: "Forecasted revenue",
                order_id: orderIdStr,
                contract_id: id_contract,
                proposal_payment_id: paymentPk,
                amount_eur: Number.isFinite(amt) ? amt : 0,
                revenue_date: revenue_day,
            });

            await OrderDbModel.create(
                {
                    order_id: orderIdStr,
                    invoice_id: null,
                    contract_id: id_contract,
                    customer_id: id_customer || null,
                    customer_company_name: customer_account_name || null,
                    agent_id: agent || null,
                    order_payment_status: "pending",
                    order_total_amount_eur: Number.isFinite(amt) ? amt : 0,
                    revenue_id: revenueId,
                    order_collection_date: revenue_day,
                },
                { transaction }
            );

            createdRevenues.push({
                id: revenueId,
                order_id: orderIdStr,
                reference: orderIdStr,
                amount_eur: Number.isFinite(amt) ? amt : 0,
                revenue_date: revenue_day,
                proposal_payment_id: paymentPk,
            });
        }
    });

    const contract = await getContractById(id_contract);
    const proposalAfter = await getProposalById(id_proposal);
    return { proposal: proposalAfter, contract, projects: createdProjects, revenues: createdRevenues };
}
