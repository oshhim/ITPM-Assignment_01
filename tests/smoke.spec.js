import { test, expect } from "@playwright/test";
import cases from "../test-data/testcases.json" assert { type: "json" };

test("swifttranslator test suite", async ({ page }) => {
  test.setTimeout(180000);

  await page.goto("https://swifttranslator.com/", {
    waitUntil: "domcontentloaded",
  });

  const input = page.locator("textarea").first();

  // wait until both panels exist
  const bigBoxes = page.locator(".w-full.h-80.p-3.rounded-lg");
  await expect(bigBoxes).toHaveCount(2, { timeout: 15000 });

  // always re-locate output box (prevents stale DOM issues)
  const getOutputBox = () => page.locator(".w-full.h-80.p-3.rounded-lg").nth(1);

  // ✅ safer read: output panel can re-render and text can temporarily be empty
  async function getOutputText() {
    const box = getOutputBox();
    await expect(box).toBeVisible({ timeout: 5000 });
    const txt = (await box.textContent()) || "";
    return txt.trim();
  }

  async function clearInput() {
    await input.click();
    await input.fill("");
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(400);
  }

  for (const tc of cases) {
    // ✅ UI case: Clear button test
    if (tc.id.startsWith("Pos_UI")) {
      console.log(`\n[${tc.id}] UI - Clear button`);

      // type something first
      await clearInput();
      await input.fill("oyaa kohedha?");
      await page.keyboard.press("Escape");
      await page.mouse.click(5, 5);

      // wait output non-empty
      await expect
        .poll(async () => await getOutputText(), { timeout: 30000 })
        .not.toBe("");

      // click clear
      const clearBtn = page.getByRole("button", { name: /clear/i });
      await clearBtn.click();

      const inputVal = (await input.inputValue()).trim();
      const outVal = (await getOutputText()).trim();

      console.log("Expected:", tc.expected);
      console.log("Actual:", `input="${inputVal}" output="${outVal}"`);

      // both should become empty
      expect(inputVal).toBe("");
      expect(outVal).toBe("");

      continue; // go next testcase
    }

    // ✅ Normal pos/neg cases
    await clearInput();

    // ✍️ Type input
    await input.fill(tc.input);

    // close suggestion popup + trigger update
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 5);

    // ✅ Wait until output becomes non-empty (handles re-render gaps)
    await expect
      .poll(async () => await getOutputText(), { timeout: 30000 })
      .not.toBe("");

    const actual = await getOutputText();

    console.log(`\n[${tc.id}]`);
    console.log("Input:", tc.input);
    console.log("Expected:", tc.expected);
    console.log("Actual:", actual);

    // ✅ PASS/FAIL rules
    if (tc.id.startsWith("Pos_")) {
      // POS must match expected
      expect(actual).toBe(tc.expected);
    } else if (tc.id.startsWith("Neg_")) {
      // NEG must NOT match expected
      expect(actual).not.toBe(tc.expected);
    } else {
      // fallback (in case of unexpected IDs)
      expect(actual).not.toBe("");
    }
  }
});
