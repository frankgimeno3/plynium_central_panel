/**
 * Upload a full cover layout PNG (captured from the Data tab preview) into
 * `…/adverts media/cover/final/` and persist its CDN URL on the publication.
 */

import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationModel,
  PublicationSlotDbModel,
} from "../../../../../../server/database/models.js";
import "../../../../../../server/database/models.js";
import {
  coverAdvertMaterialsFinalMediatecaPath,
  ensureCoverAdvertMaterialsFinalFolderHierarchy,
} from "../../../../../../server/features/publication/PublicationMediatecaFolderService.js";
import { uploadBufferToS3 } from "../../../../../../server/features/media/S3Service.js";
import { createMedia } from "../../../../../../server/features/media/MediaService.js";

export const runtime = "nodejs";

const COVER_SLOT_KEY = "cover";

const postSchema = Joi.object({
  image_png_base64: Joi.string().trim().min(32).required(),
  slot_id: Joi.number().integer().positive().optional(),
});

function parsePngBase64(raw) {
  const s = String(raw ?? "").trim();
  const comma = s.indexOf(",");
  const payload = s.startsWith("data:") && comma >= 0 ? s.slice(comma + 1) : s;
  return Buffer.from(payload, "base64");
}

async function resolveCoverSlotId(publicationId, requestedSlotId) {
  if (requestedSlotId != null) {
    const sid = Number(requestedSlotId);
    const slot = await PublicationSlotDbModel.findOne({
      where: { publication_id: String(publicationId), publication_slot_id: sid },
    });
    if (!slot) return null;
    return sid;
  }
  const cover = await PublicationSlotDbModel.findOne({
    where: { publication_id: String(publicationId), slot_key: COVER_SLOT_KEY },
  });
  const id = cover?.get?.("publication_slot_id") ?? cover?.publication_slot_id;
  return id != null ? Number(id) : null;
}

export const POST = createEndpoint(
  async (_request, body, params) => {
    const publicationId = params?.id;
    if (!publicationId) {
      return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    }
    if (!PublicationModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const publication = await PublicationModel.findByPk(String(publicationId));
    if (!publication) {
      return NextResponse.json({ message: "Publication not found" }, { status: 404 });
    }

    const slotId = await resolveCoverSlotId(publicationId, body.slot_id);
    if (!slotId) {
      return NextResponse.json({ message: "Cover slot not found" }, { status: 404 });
    }

    let buffer;
    try {
      buffer = parsePngBase64(body.image_png_base64);
    } catch {
      return NextResponse.json({ message: "Invalid image data" }, { status: 400 });
    }
    if (!buffer?.length) {
      return NextResponse.json({ message: "Empty image" }, { status: 400 });
    }

    const editionName = publication.get("publication_edition_name") ?? "";
    const folderPath = coverAdvertMaterialsFinalMediatecaPath(editionName);
    const folderId = await ensureCoverAdvertMaterialsFinalFolderHierarchy(publication);
    if (!folderId) {
      return NextResponse.json({ message: "Could not ensure mediateca folder" }, { status: 500 });
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `cover-flatplan-${stamp}.png`;
    const { mediaId, s3Key, cdnUrl } = await uploadBufferToS3({
      buffer,
      contentType: "image/png",
      filename,
    });

    await createMedia({
      mediaId,
      name: filename,
      contentName: filename,
      s3Key,
      folderId,
      folderPath,
      cdnUrl,
      contentType: "image/png",
      type: "image",
    });

    const imageUrl = cdnUrl || "";
    try {
      await publication.update({ publication_cover_flatplan_image_url: imageUrl });
    } catch (err) {
      const msg = String(err?.message ?? "");
      if (!msg.includes("publication_cover_flatplan_image_url")) throw err;
      console.warn(
        "[cover-flatplan-composite] column publication_cover_flatplan_image_url missing; run migration 047"
      );
    }

    return NextResponse.json({
      publication_id: String(publicationId),
      publication_slot_id: slotId,
      publication_cover_flatplan_image_url: imageUrl,
      image_url: imageUrl,
      mediateca_folder_path: folderPath,
      media_id: mediaId,
    });
  },
  postSchema,
  true
);
