import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * When MAILPIT_URL is set (CI starts a Mailpit test mail server and points the portal's SMTP settings at it), sign-up
 * needs a confirmation email, and the tests read that email from Mailpit's API. Without it the portal has no mail
 * server, accounts are trusted on sign-up, and the mail-only tests are skipped.
 */
const MAILPIT = process.env.MAILPIT_URL?.replace(/\/+$/, "");

/** The text of the newest email to `to` whose subject contains `subject`. Waits for it to arrive. */
async function emailTo(request: APIRequestContext, to: string, subject: string) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
    const { messages = [] } = (await list.json()) as { messages?: { ID: string; Subject: string }[] };
    const found = messages.find((message) => message.Subject.includes(subject));
    if (found) return ((await (await request.get(`${MAILPIT}/api/v1/message/${found.ID}`)).json()) as { Text: string }).Text;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No email "${subject}" arrived for ${to}`);
}

function linkIn(text: string, path: string) {
  const match = text.match(new RegExp(`https?://\\S+${path}\\?token=[\\w-]+`));
  expect(match, `a ${path} link in the email`).not.toBeNull();
  return match![0];
}

/** Opens the link in the confirmation email and presses the button. */
async function confirmEmail(page: Page, request: APIRequestContext, email: string) {
  const link = linkIn(await emailTo(request, email, "Confirm your Neuravic Portal email"), "/verify-email");
  await page.goto(link);
  await page.getByRole("button", { name: "Confirm email" }).click();
  await expect(page).toHaveURL(/\/login\?notice=verified$/);
}

const person = {
  name: "Amira Hassan",
  email: `amira.${Date.now()}@neuravic.test`,
  title: "Platform Engineer",
  password: "violet-lantern-harbour-47",
};

async function fillSignUp(page: Page, overrides: Partial<typeof person & { confirm: string }> = {}) {
  const data = { ...person, confirm: person.password, ...overrides };
  await page.getByLabel("Full name").fill(data.name);
  await page.getByLabel("Work email").fill(data.email);
  await page.getByLabel("Job title").fill(data.title);
  await page.getByLabel("Department").selectOption("Engineering");
  await page.getByLabel("Office").selectOption("cairo");
  await page.getByLabel("Password", { exact: true }).fill(data.password);
  await page.getByLabel("Confirm password").fill(data.confirm);
  await page.getByRole("button", { name: "Create account" }).click();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

// The tests build on each other (the account made first is used later), so they run in order.
test.describe.configure({ mode: "serial" });

test("anonymous visitors are sent to the sign-in page", async ({ page }) => {
  await page.goto("/pims");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in to the portal" })).toBeVisible();
});

test("sign-up shows a message for each problem and keeps what was typed", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await expect(page.getByText("Enter a valid work email.")).toBeVisible();
  await expect(page.getByText("Choose a department.")).toBeVisible();

  await fillSignUp(page, { password: "password123456", confirm: "something-else-entirely" });
  await expect(page.getByText(/too common or easy to guess/)).toBeVisible();
  await expect(page.getByText("The passwords do not match.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue(person.name);
  await expect(page.getByLabel("Work email")).toHaveValue(person.email);
  await expect(page).toHaveURL(/\/signup$/);

  await fillSignUp(page, { password: "amira-secret-2026", confirm: "amira-secret-2026" });
  await expect(page.getByText("Do not use your name in your password.")).toBeVisible();
});

test("sign-up is limited to the company email domain", async ({ page }) => {
  await page.goto("/signup");
  await fillSignUp(page, { email: "amira@gmail.com" });
  await expect(page.getByText("Use your company email address.")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("a new person can sign up, lands on their profile, and is the admin", async ({ page, request }) => {
  await page.goto("/signup");
  await fillSignUp(page);

  if (MAILPIT) {
    // Nobody is signed in until the address is confirmed from the email.
    await expect(page).toHaveURL(/\/login\?notice=check-email$/);
    await expect(page.getByText(/Check your email/)).toBeVisible();
    await confirmEmail(page, request, person.email);
    await signIn(page, person.email, person.password);
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/pims");
  } else {
    await expect(page).toHaveURL(/\/pims\?welcome=1$/);
    await expect(page.getByText("Welcome to the portal, Amira.")).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: person.name })).toBeVisible();
  await expect(page.getByText("Admin", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("NV-0001").first()).toBeVisible();

  // The session cookie is HTTP-only, so scripts on the page cannot read it.
  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name.endsWith("nv_session"));
  expect(session, "a session cookie is set").toBeDefined();
  expect(session!.httpOnly).toBe(true);
  expect(session!.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain("nv_session");
});

test("signing out ends the session", async ({ page }) => {
  await signIn(page, person.email, person.password);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/pims");
  await expect(page).toHaveURL(/\/login$/);
});

test("sign-in rejects a wrong password without revealing which part was wrong", async ({ page }) => {
  await signIn(page, person.email, "not-the-right-password");
  await expect(page.locator(".alert--error")).toHaveText("The email or password is not right.");
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, "nobody@neuravic.test", "not-the-right-password");
  await expect(page.locator(".alert--error")).toHaveText("The email or password is not right.");
});

test("sign-in with the right details opens the overview, and the sign-in page is then skipped", async ({ page }) => {
  await signIn(page, person.email, person.password);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Welcome back, Amira/ })).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/$/);
});

test("the same email cannot sign up twice", async ({ page, request }) => {
  await page.goto("/signup");
  await fillSignUp(page, { name: "Someone Else" });
  if (MAILPIT) {
    // The page cannot be used to find out who has an account: the answer is the same as for a new address,
    // and the real owner is told by email instead.
    await expect(page).toHaveURL(/\/login\?notice=check-email$/);
    await expect(page.getByText(/already exists/)).toHaveCount(0);
    expect(await emailTo(request, person.email, "You already have a Neuravic Portal account")).toContain("/forgot-password");
  } else {
    await expect(page.getByText("An account with this email already exists. Sign in instead.")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  }
});

test("repeated wrong passwords are throttled", async ({ page }) => {
  const target = `throttle.${Date.now()}@neuravic.test`;
  for (let attempt = 0; attempt < 5; attempt++) {
    await signIn(page, target, "wrong-password-attempt");
    await expect(page.locator(".alert--error")).toHaveText("The email or password is not right.");
  }
  await signIn(page, target, "wrong-password-attempt");
  await expect(page.locator(".alert--error")).toHaveText(/Too many attempts/);
});

test("the theme choice survives a reload with no flash", async ({ page }) => {
  await signIn(page, person.email, person.password);
  const toggle = page.getByRole("button", { name: /^Theme:/ });
  await toggle.click(); // system -> light
  await toggle.click(); // light -> dark
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("Ctrl K opens the command palette and jumps to a page", async ({ page }) => {
  await signIn(page, person.email, person.password);
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search pages" });
  await expect(search).toBeFocused();
  await search.fill("calendar");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/calendar$/);
});

test("a reset or confirmation link that is not real is refused", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/reset-password?token=not-a-real-token");
  await expect(page.getByText("This link is invalid or has expired.")).toBeVisible();
  await expect(page.getByLabel("New password")).toHaveCount(0);
  await page.goto("/verify-email?token=not-a-real-token");
  await expect(page.getByText("This link is invalid or has expired.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm email" })).toHaveCount(0);
});

test("without a mail server, password reset says it is not set up", async ({ page }) => {
  test.skip(Boolean(MAILPIT), "only applies when mail is off");
  await page.context().clearCookies();
  await page.goto("/forgot-password");
  await page.getByLabel("Work email").fill(person.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator(".alert--error")).toContainText("not set up");
});

test("an account must confirm its email before it can sign in", async ({ page, request }) => {
  test.skip(!MAILPIT, "needs the Mailpit test mail server");
  await page.context().clearCookies();
  const newcomer = { name: "Karim Nasser", email: `karim.${Date.now()}@neuravic.test` };
  await page.goto("/signup");
  await fillSignUp(page, { ...newcomer, password: "copper-meadow-lantern-83", confirm: "copper-meadow-lantern-83" });
  await expect(page).toHaveURL(/\/login\?notice=check-email$/);

  // The right password is still refused until the address is confirmed.
  await signIn(page, newcomer.email, "copper-meadow-lantern-83");
  await expect(page.locator(".alert--error")).toContainText("Confirm your email address first");
  await expect(page).toHaveURL(/\/login$/);

  await confirmEmail(page, request, newcomer.email);
  await signIn(page, newcomer.email, "copper-meadow-lantern-83");
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Sign out" }).click();
});

test("forgot password sends one single-use link, and asking about an unknown address gives the same answer", async ({ page, request }) => {
  test.skip(!MAILPIT, "needs the Mailpit test mail server");
  await page.context().clearCookies();
  const SENT = /If an account exists for that address, we have emailed it a link/;

  await page.goto("/forgot-password");
  await page.getByLabel("Work email").fill("nobody.at.all@neuravic.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(SENT)).toBeVisible();

  await page.goto("/forgot-password");
  await page.getByLabel("Work email").fill(person.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(SENT)).toBeVisible();

  const link = linkIn(await emailTo(request, person.email, "Reset your Neuravic Portal password"), "/reset-password");
  await page.goto(link);
  const next = "harbour-lantern-violet-52";
  await page.getByLabel("New password", { exact: true }).fill("password123456");
  await page.getByLabel("Confirm new password").fill("password123456");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page.getByText(/too common or easy to guess/)).toBeVisible();

  // A refused password does not use the link up.
  await page.getByLabel("New password", { exact: true }).fill(next);
  await page.getByLabel("Confirm new password").fill(next);
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page).toHaveURL(/\/login\?notice=password-reset$/);

  await signIn(page, person.email, person.password);
  await expect(page.locator(".alert--error")).toHaveText("The email or password is not right.");
  await signIn(page, person.email, next);
  await expect(page).toHaveURL(/\/$/);
  person.password = next;
  await page.getByRole("button", { name: "Sign out" }).click();

  // The same link cannot be used again.
  await page.goto(link);
  await expect(page.getByText("This link is invalid or has expired.")).toBeVisible();
});
