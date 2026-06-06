import type { Metadata } from "next";

export const siteUrl = "https://personal-workstation.vercel.app";
export const siteName = "黄铭语公开研究工作站";
export const siteDescription = "黄铭语关于投资研究、量化策略、AI 辅助研究、知识文章与公开 Skill 的个人研究主页。";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function publicPageMetadata({
  title,
  description,
  path,
  type = "website"
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: "zh_CN",
      type
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}
