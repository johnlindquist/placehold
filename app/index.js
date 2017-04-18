const Nightmare = require("nightmare");
const express = require("express");
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const app = express();

const cacheDir = "./cache";
const absCache = `${path.join(__dirname, cacheDir)}`;

if (!fs.existsSync(cacheDir)) fs.mkdir(cacheDir);

app.use(express.static(cacheDir));

const browser = new Nightmare({
  show: false,
  frame: false
});

app.get("/", async (req, res) => {
  const { query } = req;

  console.log(query);

  const { url = "https://egghead.io", w = 1024, h = 728 } = query;

  const fileName = _.replace(`/${url}-${w}x${h}.png`, /\/\/|:|\//g, "");

  console.log({ url, w, h });

  if (!url.startsWith("http")) {
    res.send(`Please include "http://" or "https://" in your "url"`);
    return;
  }

  const absFile = `${absCache}/${fileName}`;

  console.log(absFile);

  if (fs.existsSync(absFile)) {
    res.sendFile(absFile);
    return;
  }

  const width = _.clamp(_.toNumber(w), 320, 2560);
  const height = _.clamp(_.toNumber(h), 240, 1440);

  await browser.goto(url);
  await browser.viewport(width, height);
  await browser.evaluate(() =>
    document.styleSheets[0].insertRule("::-webkit-scrollbar { display:none; }")
  );
  await browser.wait(250);
  await browser.screenshot(`${cacheDir}/${fileName}`);

  res.set("Content-Type", "image/png");
  res.sendFile(absFile);
});

app.listen(3000, () => console.log("server running on http://localhost:3000"));
