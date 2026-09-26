// These values are public: they can appear in generated HTML, JavaScript and API responses.
// Never put credentials or API tokens in this file.
export const siteConfig = {
  email: "",
  location: "",
  education: "",
  steamId: "",
  statusBaseUrl: "",
  statusPageSlug: "public",
};

export const steamProfileUrl = siteConfig.steamId
  ? `https://steamcommunity.com/profiles/${siteConfig.steamId}/`
  : "";

export const statusPageUrl = siteConfig.statusBaseUrl
  ? `${siteConfig.statusBaseUrl.replace(/\/+$/, "")}/status/${encodeURIComponent(siteConfig.statusPageSlug)}`
  : "";
