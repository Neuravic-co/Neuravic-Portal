// Smoke test against a running portal: node scripts/smoke.mjs http://127.0.0.1:5174
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:5174";
let failed = 0;

async function check(name, run) {
  try {
    await run();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}\n     ${error.message}`);
  }
}

const get = (path, init) => fetch(base + path, { redirect: "manual", ...init });

await check("health endpoint reports ok and is not cached", async () => {
  const res = await get("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
  assert.match(res.headers.get("cache-control") ?? "", /no-store/);
});

await check("login page renders with security headers and a CSP nonce", async () => {
  const res = await get("/login");
  assert.equal(res.status, 200);
  const csp = res.headers.get("content-security-policy") ?? "";
  const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
  assert.ok(nonce, "CSP has a nonce");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.ok(!/unsafe-eval/.test(csp), "no unsafe-eval in production");
  const html = await res.text();
  assert.ok(html.includes(`nonce="${nonce}"`), "scripts carry the nonce");
  for (const [header, pattern] of [
    ["strict-transport-security", /max-age=\d+/],
    ["x-frame-options", /DENY/],
    ["x-content-type-options", /nosniff/],
    ["referrer-policy", /strict-origin/],
    ["cross-origin-opener-policy", /same-origin/],
  ]) assert.match(res.headers.get(header) ?? "", pattern, header);
  assert.equal(res.headers.get("x-powered-by"), null);
});

await check("the nonce changes on every request", async () => {
  const nonce = async () => /'nonce-([^']+)'/.exec((await get("/login")).headers.get("content-security-policy") ?? "")?.[1];
  assert.notEqual(await nonce(), await nonce());
});

await check("every portal page redirects anonymous visitors to the login page", async () => {
  for (const path of ["/", "/pims", "/team", "/team/1", "/tools", "/calendar", "/support"]) {
    const res = await get(path);
    assert.equal(res.status, 307, path);
    assert.match(res.headers.get("location") ?? "", /\/login$/, path);
  }
});

await check("a forged session cookie is not accepted", async () => {
  for (const name of ["nv_session", "__Host-nv_session"]) {
    const res = await get("/pims", { headers: { cookie: `${name}=forged` } });
    assert.equal(res.status, 307, name);
  }
});

await check("unknown pages return 404 and never leak a stack trace", async () => {
  const res = await get("/does-not-exist");
  assert.equal(res.status, 404);
  assert.ok(!/at .*\.(ts|js):\d+/.test(await res.text()));
});

await check("the theme cookie is rendered on the server", async () => {
  const html = await (await get("/login", { headers: { cookie: "nv_theme=dark" } })).text();
  assert.match(html, /<html[^>]*data-theme="dark"/);
});

await check("the brand mark is served and cacheable", async () => {
  const res = await get("/assets/neuravic-mark.png");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control") ?? "", /max-age=\d+/);
});

if (failed > 0) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}
console.log("\nall smoke checks passed");
