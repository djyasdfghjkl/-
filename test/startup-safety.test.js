const test = require("node:test");
const assert = require("node:assert/strict");
const {
  shouldClearDatabaseOnStartup,
  shouldUseMongoFallback,
} = require("../config/startupSafety");

test("database reset is never enabled by CLEAR_DATABASE alone", () => {
  assert.equal(
    shouldClearDatabaseOnStartup({
      CLEAR_DATABASE: "true",
    }),
    false,
  );
});

test("mongo fallback requires an explicit opt-in", () => {
  assert.equal(
    shouldUseMongoFallback({
      MONGODB_FALLBACK: "false",
    }),
    false,
  );
  assert.equal(
    shouldUseMongoFallback({
      MONGODB_FALLBACK: "true",
    }),
    true,
  );
});
