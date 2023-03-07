const axios = require("axios");
const Cheerio = require("cheerio");
const cors = require("cors");
const { json } = require("express");

const app = require("express")();

const PORT = 8088;

app.use(cors());
app.use(json());

app.listen(PORT, () => console.log("started"));

app.get("/:chapter", async (req, res) => {
  const { chapter } = req.params;
  const { ep } = req.query;

  async function title(chapter) {
    const filter = /[^a-zA-Z0-9?!]/g;
    const composedTitle = chapter.replace(filter, "-");
    return composedTitle.toLowerCase();
  }
  const titleIs = await title(chapter);
  console.log(titleIs);
  const url = `https://com.cloud-anime.com/anime/${titleIs}`;
  console.log(url, "I am url");
  try {
    const { data } = await axios.get(url);
    // console.log(data);
    const $ = Cheerio.load(data);
    const links = $(`.episodes-card-title h3 a`)
      .get()
      .map((val) => $(val).attr("href"));
    const { data: getLink } = await axios.get(links[ep - 1]);
    const $1 = Cheerio.load(getLink);
    let epLinks = $1(`ul.nav-tabs li a`)
      .get()
      .map((val) => $1(val).attr("data-ep-url"));

    if (epLinks.length < 1) {
      const $ = Cheerio.load(data);
      const links = $(`.episodes-card-title h3 a`)
        .get()
        .map((val) => $(val).attr("href"));
      const { data: getLink } = await axios.get(links[ep - 2]);
      let epLinks = $1(`ul.nav-tabs li a`)
        .get()
        .map((val) => $1(val).attr("data-ep-url"));
    }
    res.status(200).json({ data: epLinks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
