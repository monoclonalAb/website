// Test-only gate. Never fall back to DATABASE_URL, PGHOST or a loaded .env file.
// A name check is not proof of isolation: the confirmation is an owner/operator
// assertion that this dedicated local database contains no valuable data.
export function isolatedTestTarget(env) {
  const raw = env.CMS_TEST_DATABASE_URL;
  const confirmation = env.CMS_TEST_DATABASE_CONFIRM;
  if (!raw || !confirmation) {
    throw new Error(
      "BLOCKED: set an explicitly isolated CMS_TEST_DATABASE_URL and CMS_TEST_DATABASE_CONFIRM (database name). No connection attempted.",
    );
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Refusing invalid CMS test target; URL redacted.");
  }
  const database = url.pathname.slice(1);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !url.port ||
    !url.username ||
    url.search ||
    url.hash ||
    !/^website_cms_test_[a-z0-9_]+$/.test(database) ||
    database.length > 63 ||
    confirmation !== database
  ) {
    throw new Error(
      "Refusing CMS test target: require loopback, explicit port/user, dedicated website_cms_test_* database, matching confirmation and no URL query/fragment. URL redacted.",
    );
  }
  try {
    return {
      host: url.hostname.replace(/^\[|\]$/g, ""),
      port: Number(url.port),
      database,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: false,
      connectionTimeoutMillis: 3_000,
      statement_timeout: 5_000,
      query_timeout: 6_000,
      application_name: "website-cms-isolated-test",
    };
  } catch {
    throw new Error("Refusing invalid CMS test credentials; URL redacted.");
  }
}
