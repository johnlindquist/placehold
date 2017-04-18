const Nightmare = require("nightmare");
const express = require("express");
const serveIndex = require("serve-index");
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const app = express();

const cacheDir = "./cache";
const absCache = `${path.join(__dirname, cacheDir)}`;

function calculateContentHeight() {
  function getNumericalStyle(element, property) {
    return parseFloat(
      window.getComputedStyle(element, null).getPropertyValue(property)
    );
  }

  var html = document.documentElement;
  var body = document.body;

  var bodyMarginBottom = getNumericalStyle(body, "margin-bottom");
  var bodyMarginTop = getNumericalStyle(body, "margin-top");
  var htmlMarginBottom = getNumericalStyle(html, "margin-bottom");
  var htmlMarginTop = getNumericalStyle(html, "margin-top");

  var bodyPaddingBottom = getNumericalStyle(body, "padding-bottom");
  var bodyPaddingTop = getNumericalStyle(body, "padding-top");
  var htmlPaddingBottom = getNumericalStyle(html, "padding-bottom");
  var htmlPaddingTop = getNumericalStyle(html, "padding-top");

  var margins =
    bodyMarginBottom + bodyMarginTop + htmlMarginBottom + htmlMarginTop;
  var paddings =
    bodyPaddingBottom + bodyPaddingTop + htmlPaddingBottom + htmlPaddingTop;

  return html.offsetHeight + Math.round(margins + paddings);
}

if (!fs.existsSync(cacheDir)) fs.mkdir(cacheDir);

app.use("/cache", serveIndex(absCache, { icons: true }));
app.use("/cache", express.static(cacheDir));

app.get("/", async (req, res) => {
  const { query } = req;
  const {
    url = "https://egghead.io",
    w = 1024,
    h = 768,
    update = false,
    full = false
  } = query;

  const fileName = _.replace(
    `/${url}-${w}x${h}${full ? "-full" : ""}.png`,
    /\/\/|:|\//g,
    ""
  );

  if (!url.startsWith("http")) {
    res.send(`Please include "http://" or "https://" in your "url"`);
    return;
  }

  const absFile = `${absCache}/${fileName}`;

  if (fs.existsSync(absFile) && !update) {
    res.sendFile(absFile);
    return;
  }

  const browser = new Nightmare({
    show: false,
    frame: false
  });

  try {
    const width = _.clamp(_.toNumber(w), 320, 2560);
    const height = _.clamp(_.toNumber(h), 240, 1440);

    await browser.goto(url);

    if (full) {
      const contentHeight = await browser.evaluate(calculateContentHeight);
      await browser.viewport(width, contentHeight);
    } else {
      await browser.viewport(width, height);
    }

    await browser.wait(500);
    await browser.evaluate(() =>
      document.styleSheets[0].insertRule(
        "::-webkit-scrollbar { display:none; }"
      )
    );

    await browser.wait(1500);
    await browser.screenshot(`${cacheDir}/${fileName}`);

    res.set("Content-Type", "image/png");
    res.sendFile(absFile);

    await browser.end();
  } catch (e) {
    console.log(e);
    res.send("something went wrong...");
    await browser.end();
  }
});

app.listen(3000, () => console.log("server running on http://localhost:3000"));
