import fetch from "node-fetch";
import { load as cheerioLoad } from "cheerio";

(async function main() {
  // Fetch status page
  const statusReq = await fetch(
    "https://connect2concepts.com/connect2/?type=circle&key=" +
      (process.argv[2] || "9f320719-e415-46d7-b233-a89d85ba6d97")
  );
  const statusRes = await statusReq.text();

  // Load page into Cheerio
  const $ = cheerioLoad(statusRes);

  const statusInfo = Array.from(
    $(".panel.panel-default .col-md-3.col-sm-6 center")
  ).map(function (elem) {
    // Grab text from div
    const [name, statusText, lastCountText, updatedDateText] = $(elem)
      .children("div")
      .not(".circleChart")
      .contents()
      .filter(function () {
        return (
          // filter out <br> tags
          (!this.tagName || this.tagName.toLowerCase() !== "br") &&
          // tags or text nodes OK
          (this.nodeType === 3 || this.nodeType === 1)
        );
      })
      .map(function () {
        return $(this).text().trim();
      })
      .get();

    // Get percent from .circleChart element
    const percent =
      parseFloat($(elem).children(".circleChart").attr("data-percent")) / 100;

    // Parse last count for later use
    const lastCount = parseInt(lastCountText.split(":")[1].trim());

    return {
      name,
      percent,
      lastCount,
      isOpen: statusText === "(Open)",
      // Split at first :
      lastUpdated: new Date(updatedDateText.split(/:(.*)/s)[1].trim()),
      id: Buffer.from(name).toString("base64"),
      // Add max capacity if it can be calculated
      ...(percent > 0 && { maxCapacity: Math.round(lastCount / percent) }),
    };
  });

  // Spit out for observation
  console.log(statusInfo);
})();
