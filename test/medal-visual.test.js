const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { describeMedalVisual } = require("../utils/medalManager");

test("describeMedalVisual marks default local lottie medals as renderable", () => {
  const visual = describeMedalVisual({
    name: "初出茅庐",
    iconUrl: "/static/logo.png",
    lottieUrl: "/static/icon/home.json",
  });

  assert.equal(visual.visualType, "lottie");
  assert.equal(visual.previewUrl, "/static/icon/home.json");
  assert.equal(visual.iconPreview, "/static/logo.png");
  assert.equal(visual.isRenderable, true);
  assert.equal(visual.isDefault, true);
});

test("describeMedalVisual falls back to custom icon when lottie is missing", (t) => {
  const uploadsDir = path.resolve(__dirname, "..", "uploads");
  const customFile = path.join(uploadsDir, "custom-medal.png");
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(customFile, "fixture");
  t.after(() => {
    if (fs.existsSync(customFile)) {
      fs.unlinkSync(customFile);
    }
  });

  const visual = describeMedalVisual({
    name: "自定义勋章",
    iconUrl: "http://localhost:3005/uploads/custom-medal.png",
    lottieUrl: "",
  });

  assert.equal(visual.visualType, "icon");
  assert.equal(visual.previewUrl, "http://localhost:3005/uploads/custom-medal.png");
  assert.equal(visual.iconPreview, "http://localhost:3005/uploads/custom-medal.png");
  assert.equal(visual.isRenderable, true);
  assert.equal(visual.isDefault, false);
});
