const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // We can just render the page component by spinning up the next dev server briefly
  // Actually, I can just launch the Next dev server, wait for it, and grab the layout.
})();
