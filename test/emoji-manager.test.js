const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_EMOJIS, isRenderableResource, normalizeEmojiDoc } = require("../utils/emojiManager");

test("default mood morphing lottie asset is renderable from local static directory", () => {
  const moodMorph = DEFAULT_EMOJIS.find((item) => item.uuid === "emoji-morphing-mood");
  assert.ok(moodMorph);
  assert.equal(isRenderableResource("lottie", moodMorph.resource_value), true);
});

test("normalizeEmojiDoc exposes preview metadata for lottie resources", () => {
  const normalized = normalizeEmojiDoc({
    uuid: "demo-lottie",
    name: "变化中",
    description: "测试资源",
    type: 3,
    resource_type: "lottie",
    resource_value: "/static/icon/mood-morphing.json",
    thumbnail_url: "",
    preview_text: "🫠",
    tags: ["变化"],
    scenes: ["mood", "editor"],
    status: 1,
    sort_order: 9,
    use_count: 7,
    category_id: {
      _id: "cat-1",
      code: "mood-picks",
      name: "心情精选",
    },
  });

  assert.equal(normalized.id, "demo-lottie");
  assert.equal(normalized.resourceType, "lottie");
  assert.equal(normalized.previewUrl, "/static/icon/mood-morphing.json");
  assert.equal(normalized.previewText, "🫠");
  assert.equal(normalized.categoryCode, "mood-picks");
  assert.equal(normalized.isRenderable, true);
});
