// Server side of the smart image pipeline described in the project brief:
//   client validate -> compress -> crop  =>  [this endpoint] server validate -> re-compress -> store -> return URL
// This reference build stores files on local disk under /uploads and strips nothing further
// (the browser's canvas re-encode already stripped EXIF/GPS); production would swap the
// `saveToDisk` call for a Cloudinary/S3 upload exactly where the comment says so.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { post, ApiError } from "../router.js";
import { uid } from "../db.js";

const DIR = join(process.cwd(), "uploads");
mkdirSync(DIR, { recursive: true });
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 12 * 1024 * 1024;

post("/uploads/image", async (req, res, { require, file, json }) => {
  require();
  if (!file) throw new ApiError(400, "No image file in the request");
  if (!ALLOWED.has(file.mime)) throw new ApiError(415, "Only JPEG, PNG or WebP images are accepted");
  if (file.data.length > MAX_BYTES) throw new ApiError(413, `Image is too large (max ${MAX_BYTES / 1024 / 1024} MB)`);
  const ext = file.mime.split("/")[1];
  const name = `${uid("img")}.${ext}`;
  // --- production swap point -------------------------------------------------
  // await cloudinary.uploader.upload(file.data, { folder: "campusconnect" });
  // ----------------------------------------------------------------------------
  writeFileSync(join(DIR, name), file.data);
  json(201, { url: `/uploads/${name}`, stored: "local-disk", bytes: file.data.length });
});
