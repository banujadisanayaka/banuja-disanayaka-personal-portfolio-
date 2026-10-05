const PHOTOS = {
  "001": "1fSKkWzrioLpjPuiCNkO_Yqe77B3sbUlG",
  "002": "1YBuPoaiEM_hQwtklFfxRBsdh6RfgH7RE",
  "003": "1W9uIbql760xg9iFhk-RySSqqg0ihhRhW",
  "004": "1pAPRxjUp07PKPym6k78iVE7mlOw5z6Up",
  "005": "1QXlYW9NklUw5Go-rwFlSWL8tSzRpHuqc",
  "006": "1YpNSsoImGj0cuACrZaWDkJhh7V3-kuwU",
  "007": "1cTpxrM6xstxqD2Q7bZNc59NnfrIhttXz",
  "008": "1ICFYzYQ--l4Zc7GhSh77sLk_TBMqomEp",
  "009": "1Dh0_8cVrwgPuI6rYH6l4j21oOm_BSHBI",
  "010": "1G6shy8g5UApClxgKg1Gqc_GFja2jQd4B",
  "011": "1CSbrqWMtSdX2j4eXhxizaCNEiJnTKHx9",
  "012": "106XGMqM8ajI39XH-RgYuB1FeehWtHY0a",
  "013": "1GOMiJBam98iKy20dDIz06ISzFCdF2oJX",
  "014": "1Nv3vJLy0vAGciTb3sGKaYdR6ho94CNeC",
  "015": "1T4SfoyKfzhQe237ZBMYOTUpGNRnRs9Mn",
  "016": "1d6gGJR4f0rM5KxQZ6Xv6XkrtBJxUhat0",
  "017": "1brxTh6vFAPAAwa6uTpKOQX_XONPT-OQc",
  "018": "1w9PmBEg_dbUM2uZSOmhTtdI2iaGVB53h",
  "019": "1qV4peaA1y-P01kBY-k4u0XyuvMqiGCqi",
  "020": "10laJGYlQZR9ojgmmzUZxubAcVhR-9Rm3",
  "021": "1Yzeq_pKPBFyZl6hqNNfVNhAlMEUUCU2d",
  "022": "1oV9BRH2ck3Pn7zXoa3vI0-SB-HCnQW6N",
  "023": "1KsCiL7cqCQesan7jZVXDxbTY8K7Rk3S1",
  "024": "14CN8IZ5bLYhh-g62x1SmeIS4UzP9Gb_L",
  "025": "17dC2JSN6Mz0O9LWffSZ7wg1KoMv-DQFn",
  "026": "1ta_NeSKrU_WdKbS67_eoAkLYt8lPqkad",
  "027": "10iJdoyPrOcNg91eunJg6q4Db1z0FP2sW",
  "028": "1R-CC-K3iEkVdvQvdY0cqJ60vGzndIKUp",
  "029": "1glNxZjWm4yCXmMctDT-EZrQ_9ie_CjZV",
  "030": "1ODANZL2EHWMuK97vmMwgvDk2mK3QtcXf",
  "031": "1Kv_t7N1MH1ld6-PR1rWOb5QPYMJk9J7D",
  "032": "1jMN_m3_13Pwxsw0nXGyqDEz-4KoRzXX8",
  "033": "10ik7vd4MKjL8ZRruNiSdrpQ1RvgJTDgK",
  "034": "1u5TmEW5Vv-DhUzy8RN_uTAmgVeu1iZsl",
  "035": "1vI5Vgjqrd8_Wq56h0QocnZr4XBsmJy_I",
  "036": "1dsaOGqJj631hZmKJ3J1bLO0DsqSStrXW",
  "037": "1BqsmrimTMpToWeC8R1F12sfcDLYRT5u9",
  "038": "1AZIcY9FU1Ue3-RMTd4p503KPGYeIVmxY",
  "039": "1lt_3yM9Mk_U5ZK1At2XbpFkU13q3Xgsj",
  "040": "1Y-uDYwCF4N7eMU8J74r8_ma1dwA72mSy",
  "041": "1B3w_cOkQD1nNtjotsxkkX24knMN_G0RO",
  "042": "1nVlLPiXy90QejTkgsRmPXhUu97Zu-Tq0",
  "043": "1huPthnfcrpJVTl2MEv8FFCw2mj6DzMVn",
  "044": "1skwvhUwhUBO5tGJqJWsgECAnEsBfkKVn"
};

export default async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || "").padStart(3, "0");
  const driveId = PHOTOS[id];
  if (!driveId) return new Response("Photo not found", { status: 404 });

  const upstreamUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
  const upstream = await fetch(upstreamUrl, { redirect: "follow" });
  const contentType = upstream.headers.get("content-type") || "";

  if (!upstream.ok || !contentType.startsWith("image/")) {
    return new Response(
      "Photo source is not available yet. The source folder must allow link viewing.",
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const download = url.searchParams.get("download") === "1";
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", download
    ? "private, max-age=0, must-revalidate"
    : "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
  if (download) {
    headers.set("Content-Disposition", `attachment; filename="Sathiw_7th_Birthday_Photo_${id}.png"`);
  }

  if (req.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(upstream.body, { status: 200, headers });
};
