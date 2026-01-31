import { test, expect } from "@playwright/test";

test("translate singlish to sinhala", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto("https://swifttranslator.com/", {
    waitUntil: "domcontentloaded",
  });

  // Input is the only textarea
  const input = page.locator("textarea").first();

  // These are the two big panels (left + right). This selector matches the big boxes on the page.
  const bigBoxes = page.locator(".w-full.h-80.p-3.rounded-lg");

  // Make sure we actually see 2 big boxes
  await expect(bigBoxes).toHaveCount(2, { timeout: 15000 });

  const outputBox = bigBoxes.nth(1); // right-side Sinhala box

  await input.fill("Oyaa kohedha?");
  await page.keyboard.press("Escape");
  await page.mouse.click(5, 5); // blur

  // Wait until output box gets Sinhala characters (NOT hidden, because this is the visible big box)
  await expect
    .poll(
      async () => {
        const t = (await outputBox.innerText()).trim();
        return t;
      },
      { timeout: 20000 },
    )
    .toMatch(/[\u0D80-\u0DFF]{2,}/);

  const out = (await outputBox.innerText()).trim();
  console.log("Sinhala output:", out);

  expect(out.length).toBeGreaterThan(0);
});
