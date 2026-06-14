import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/projects",
        "/publications",
        "/knowledge",
        "/skills"
      ],
      disallow: [
        "/dashboard",
        "/login",
        "/access-request",
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
