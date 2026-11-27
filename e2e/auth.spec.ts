import { expect, test, type Page } from "@playwright/test";

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

test("a new person can sign up, lands on their profile, and is the admin", async ({ page }) => {
  await page.goto("/signup");
  await fillSignUp(page);

  await expect(page).toHaveURL(/\/pims\?welcome=1$/);
  await expect(page.getByText("Welcome to the portal, Amira.")).toBeVisible();
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

test("the same email cannot sign up twice", async ({ page }) => {
  await page.goto("/signup");
  await fillSignUp(page, { name: "Someone Else" });
  await expect(page.getByText("An account with this email already exists. Sign in instead.")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
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
