import { expect, test } from "@playwright/test";

function apiRow({ id = crypto.randomUUID(), guestName, startDate, endDate, places }) {
  return {
    id,
    guest_name: guestName,
    start_date: startDate,
    end_date: endDate,
    places,
    created_at: "2026-05-15T10:00:00.000Z"
  };
}

async function mockSupabase(page, initialRows = []) {
  const rows = [...initialRows];
  await page.route("**/rest/v1/bookings**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ json: rows });
      return;
    }
    if (request.method() === "POST") {
      const row = JSON.parse(request.postData() || "{}");
      rows.push(row);
      await route.fulfill({ json: [row] });
      return;
    }
    if (request.method() === "DELETE") {
      rows.length = 0;
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await route.fulfill({ status: 405, json: { message: "Unsupported method." } });
  });
}

async function openApp(page, rows = []) {
  await mockSupabase(page, rows);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Book a stay" })).toBeVisible();
}

async function fillStay(page, guestName, startDate, endDate, beds = [1]) {
  await page.getByLabel("Name").fill(guestName);
  await page.getByLabel("Start").fill(startDate);
  await page.getByLabel("End").fill(endDate);
  for (const bed of beds) await page.getByLabel(`Bed ${bed}`).check();
}

test("guest books available dates and sees confirmation", async ({ page }) => {
  await openApp(page);
  await fillStay(page, "Ana Maria", "2026-05-20", "2026-05-22", [1, 2]);
  await page.getByRole("button", { name: "Book stay" }).click();

  await expect(page.getByRole("status")).toContainText("Booked 2 bed(s) for Ana Maria.");
  await expect(page.getByText("2026-05-20 to 2026-05-22")).toBeVisible();
  await expect(page.getByText("2 beds booked")).toBeVisible();
});

test("already reserved beds are unavailable for overlapping dates", async ({ page }) => {
  await openApp(page, [
    apiRow({
      id: "existing",
      guestName: "Mira",
      startDate: "2026-05-20",
      endDate: "2026-05-22",
      places: [1]
    })
  ]);
  await page.getByLabel("Start").fill("2026-05-21");
  await page.getByLabel("End").fill("2026-05-21");

  await expect(page.getByLabel("Bed 1")).toBeDisabled();
  await expect(page.getByLabel("Bed 2")).toBeEnabled();
});

test("expired bookings are hidden from the booking list", async ({ page }) => {
  await page.addInitScript(() => {
    Date = class extends Date {
      constructor(...args) {
        super(...(args.length ? args : ["2026-05-23T10:00:00.000Z"]));
      }
      static now() {
        return new Date("2026-05-23T10:00:00.000Z").getTime();
      }
    };
  });
  await openApp(page, [
    apiRow({ id: "past", guestName: "Past", startDate: "2026-05-20", endDate: "2026-05-22", places: [1] }),
    apiRow({ id: "future", guestName: "Future", startDate: "2026-05-23", endDate: "2026-05-24", places: [2] })
  ]);

  await expect(page.getByText("2026-05-20 to 2026-05-22")).toBeHidden();
  await expect(page.getByText("2026-05-23 to 2026-05-24")).toBeVisible();
});

test("form blocks missing name and invalid date order", async ({ page }) => {
  await openApp(page);
  await page.getByLabel("Start").fill("2026-06-10");
  await expect(page.getByLabel("End")).toHaveValue("2026-06-10");
  await expect(page.getByLabel("End")).toHaveAttribute("min", "2026-06-10");

  await page.getByLabel("Bed 1").check();
  await page.getByRole("button", { name: "Book stay" }).click();
  await expect(page.getByLabel("Name")).toBeFocused();
});
