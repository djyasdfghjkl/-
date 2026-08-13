const mongoose = require("mongoose");

const UserBlockSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  },
);

UserBlockSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

UserBlockSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

UserBlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

module.exports = mongoose.model("UserBlock", UserBlockSchema);
