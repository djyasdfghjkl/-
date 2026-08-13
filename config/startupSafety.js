const RESET_CONFIRMATION = "I_UNDERSTAND_DATABASE_RESET";

function shouldClearDatabaseOnStartup(env = process.env) {
  return (
    env.RUN_DATABASE_RESET === "true" &&
    env.DATABASE_RESET_CONFIRMATION === RESET_CONFIRMATION
  );
}

function shouldUseMongoFallback(env = process.env) {
  return env.MONGODB_FALLBACK === "true";
}

module.exports = {
  RESET_CONFIRMATION,
  shouldClearDatabaseOnStartup,
  shouldUseMongoFallback,
};
