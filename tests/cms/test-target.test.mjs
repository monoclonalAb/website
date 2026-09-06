import assert from "node:assert/strict";
import test from "node:test";
import { isolatedTestTarget } from "../helpers/cms-test-target.mjs";

// Non-secret, inert URL strings. These tests never open a connection.
const target =
  "postgresql://fixture:fixture@localhost:5432/website_cms_test_contracts";
const env = {
  CMS_TEST_DATABASE_URL: target,
  CMS_TEST_DATABASE_CONFIRM: "website_cms_test_contracts",
};

test("test database guard requires explicit confirmation and never uses DATABASE_URL", () => {
  assert.throws(() => isolatedTestTarget({ DATABASE_URL: target }), /BLOCKED/);
  assert.throws(
    () => isolatedTestTarget({ CMS_TEST_DATABASE_URL: target }),
    /BLOCKED/,
  );
  assert.throws(
    () =>
      isolatedTestTarget({
        ...env,
        CMS_TEST_DATABASE_CONFIRM: "another_database",
      }),
    /Refusing/,
  );
  assert.equal(isolatedTestTarget(env).database, "website_cms_test_contracts");
  assert.equal(isolatedTestTarget(env).host, "localhost");
});

test("test database guard denies remote, default/production, query overrides and malformed targets", () => {
  for (const url of [
    target.replace("localhost", "production.example.com"),
    target.replace("localhost", "localhost.example.com"),
    target.replace("website_cms_test_contracts", "postgres"),
    target.replace("website_cms_test_contracts", "website"),
    target.replace(":5432", ""),
    target.replace("fixture:fixture@", ""),
    `${target}?host=production.example.com`,
    `${target}?sslmode=require`,
    `${target}#secret`,
    target.replace("postgresql:", "https:"),
    "not a URL",
    target.replace("fixture:fixture@", "fixture:%xx@"),
  ]) {
    assert.throws(
      () => isolatedTestTarget({ ...env, CMS_TEST_DATABASE_URL: url }),
      (error) => {
        assert.match(error.message, /Refusing/);
        assert.ok(!error.message.includes(url));
        return true;
      },
    );
  }
});
