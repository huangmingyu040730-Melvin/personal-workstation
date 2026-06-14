import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/projects",
        "/publications",
        "/knowledge",
        "/skills",
        "/access-request"
      ],
      disallow: [
        "/dashboard",
        "/login",
        "/documents",
        "/viewer",
        "/api",
        "/public-files",
        "/admin",
        "/storage",
        "/signed"
      ]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
