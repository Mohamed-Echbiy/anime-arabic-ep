const axios = require("axios");
const Cheerio = require("cheerio");
const cors = require("cors");
const NodeCache = require("node-cache");
const { json } = require("express");

const app = require("express")();

const PORT = 8888;

app.use(cors());
app.use(json());

const cache = new NodeCache();

app.listen(PORT, () => console.log("started"));

app.get("/:chapter", async (req, res) => {
  const { chapter } = req.params;
  const { ep } = req.query;

  async function title(chapter) {
    let originalTitle = chapter;
    if (chapter === "BLUELOCK") {
      originalTitle = "blue lock";
    }
    if (chapter === "JUJUTSU KAISEN") {
      originalTitle = "JUJUTSU KAISEN tv";
    }
    const filter = /[^a-zA-Z0-9?!]/g;
    const composedTitle = chapter.replace(filter, "-");
    return composedTitle.toLowerCase();
  }
  const titleIs = await title(chapter);
  console.log(titleIs);
  let url = `https://com.cloud-anime.com/anime/${titleIs}`;
  console.log(url, "I am url");

  // Check if response is already cached
  const cachedResponse = cache.get(url);
  if (cachedResponse) {
    console.log("Returning cached response");
    return res.status(200).json({ data: cachedResponse });
  }

  try {
    const { data } = await axios.get(url);
    let trueData = data;
    // console.log(!!data);
    // if (!!data) {
    //   console.log("condition has started of data");
    //   url = `https://com.cloud-anime.com/anime/${titleIs}-tv`;
    //   console.log(url, "second url");
    //   const { data: dataS } = await axios.get(url);
    //   trueData = dataS;
    // }
    const $ = Cheerio.load(trueData);
    const links = $(`.episodes-card-title h3 a`)
      .get()
      .map((val) => $(val).attr("href"));
    // console.log(links);
    const { data: getLink } = await axios.get(links[ep - 1]);
    const $1 = Cheerio.load(getLink);
    const epLinks = $1(`ul.nav-tabs li a`)
      .get()
      .map((val) => $1(val).attr("data-ep-url"));
    console.log(epLinks, "first return ");

    const fetchAnother = async () => {
      if (!epLinks.length) {
        console.log("the condition has started");
        const $c = Cheerio.load(data);
        const links = $c(`.episodes-card-title h3 a`)
          .get()
          .map((val) => $c(val).attr("href"));
        const { data: getLink2 } = await axios.get(links[ep]);
        const $2 = Cheerio.load(getLink2);
        const Adata = $2(`ul.nav-tabs li a`)
          .get()
          .map((val) => $2(val).attr("data-ep-url"));
        return Adata;
      }
      return epLinks;
    };

    // console.log(await fetchAnother());
    cache.set(url, await fetchAnother(), 86400 * 5);
    res.status(200).json({ data: await fetchAnother() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
