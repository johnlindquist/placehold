const Nightmare = require("nightmare");
const express = require("express");
const serveIndex = require("serve-index");
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const app = express();
const download = require("image-downloader");

const cacheDir = "./cache";
const absCache = `${path.join(__dirname, cacheDir)}`;

if (!fs.existsSync(cacheDir)) fs.mkdir(cacheDir);

app.use("/cache", serveIndex(absCache, {
  icons: true
}));
app.use("/cache", express.static(cacheDir));


const getUrl = async(q, w, h) => await new Nightmare({
  show: false,
  gotoTimeout: 4000,
  waitTimeout: 4000,
  executionTimeout: 1000
}).goto(
  `https://www.google.com/search?q=${q}&tbm=isch&tbs=isz:ex,iszw:${w},iszh:${h}`
).wait('a[href^="/imgres"][style^="background"]').evaluate(
  () =>
  Array.from(
    document.querySelectorAll('a[href^="/imgres"][style^="background"]')
  )[0].href
).end();

const parseUrl = url => _.split(
  decodeURIComponent(
    _.replace(url, "https://www.google.com/imgres?imgurl=", "")
  ),
  "&"
)[0];

const createDest = (q, w, h) => `${path.join(__dirname, "./cache")}/${q}-${w}x${h}.jpg`;

const checkOrDownload = async(res, q, w, h) => {
  const file = createDest(q, w, h)

  console.log(file)
  if (fs.existsSync(file)) {
    res.sendFile(file);
    return;
  }

  const url = await getUrl(q, w, h);
  const parsedUrl = parseUrl(url)

  console.log(`
      ${parsedUrl}

      ${file}
    `);

  const {
    filename,
    image
  } = await download.image({
    url: parsedUrl,
    dest: file // Save to /path/to/dest/image.jpg
  });

  console.log(`${filename} saved`);

  if (fs.existsSync(file)) {
    res.sendFile(file);
    return;
  } else {
    res.send('download failed...')
  }
}


const findFile = async(req, res) => {
  console.log(req.params)

  try {

    const {
      params
    } = req;

    const {
      q = "puppy", w = 640, h = 480
    } = params;

    await checkOrDownload(res, q, w, h)
  } catch (e) {
    console.log(e)
    await checkOrDownload(res, `no results found`, 640, 480)
  }
}


app.get("/:q?/:w?/:h?", findFile);

app.listen(3000, () => console.log("server running on http://localhost:3000"));

//document.querySelectorAll('img[alt="Image result for cat"]')[0]

//spans.find(e => e.innerText === "View image")