import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/login",
        "/documents",
        "/viewer",
        "/access-request"
      ]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
