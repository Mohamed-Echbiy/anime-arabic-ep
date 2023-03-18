const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const NodeCache = require("node-cache");
const { json } = require("express");
const compression = require("compression");

const app = require("express")();

const PORT = 8888;

app.use(cors());
app.use(json());
app.use(compression());

const cache = new NodeCache();

app.listen(PORT, () => console.log("started"));

app.get("/:title", async (req, res) => {
  const { title } = req.params;
  const { ep } = req.query;

  // Check if response is already cached
  const url = `https://animelek.me/anime/${title}`;
  // const cachedResponse = cache.get(url);
  // if (cachedResponse) {
  //   console.log("Returning cached response");
  //   return res.status(200).json({ data: cachedResponse });
  // }

  try {
    console.log("the try is started");
    if (title === "one-piece") {
      try {
        console.log("the condition is true");
        const url_one_piece = `https://witanime.com/episode/one-piece-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-${ep}/`;
        console.log(url_one_piece);
        const { data: html_One_Piece } = await axios(url_one_piece);
        const $ = cheerio.load(html_One_Piece);
        const getStreamLinks = $(`#episode-servers li a`)
          .get()
          .map((vl) => $(vl).attr("data-ep-url"));
        console.log(getStreamLinks);
        return res.status(200).json({ data: getStreamLinks.slice(1) });
      } catch (error) {
        console.log(error.message);
        return res.status(404).json({ message: error.message });
      }
    }
    console.log("we skipped the condition");
    console.log(url);
    const { data: html } = await axios(url);
    const $ = cheerio.load(html);
    const episodes_Links = $(".episodes-card h3 a")
      .get()
      .sort()
      .map((v) => $(v).attr("href"));
    const episodePage = episodes_Links[+ep - 1];
    // after getting the url of the site and let extract the streming url
    const { data: epHTML } = await axios(episodePage);
    const $1 = cheerio.load(epHTML);
    const streaming_Links = $1("li a")
      .get()
      .map((L) => {
        const link = $1(L).attr("data-ep-url");
        if (!!link) {
          return link;
        }
        return;
        //
      });
    const data = streaming_Links.filter((F) => F !== undefined);

    console.log(data);
    // cache.set(url, { data: data, ep: ep - 1 }, 60);
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
