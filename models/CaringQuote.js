const mongoose = require("mongoose");

const CaringQuoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    sentiment: {
      type: String,
      enum: ["all", "positive", "neutral", "negative"],
      default: "all",
      index: true,
    },
    moods: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    weight: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

CaringQuoteSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

CaringQuoteSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("CaringQuote", CaringQuoteSchema);
