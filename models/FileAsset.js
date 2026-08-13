const mongoose = require("mongoose");

const FileAssetSchema = new mongoose.Schema({
  filename: { type: String, required: true, trim: true },
  originalFilename: { type: String, required: true, trim: true },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 },
  path: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String, default: "" },
  type: { type: String, default: "general", index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

FileAssetSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

FileAssetSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("FileAsset", FileAssetSchema);
