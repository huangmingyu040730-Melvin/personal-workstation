import type { Metadata } from "next";

export const siteUrl = "https://personal-workstation.vercel.app";
export const siteName = "黄铭语研究工作站";
export const siteDescription = "沉淀研究项目、学术成果、知识笔记和 AI 工作流的个人研究空间。";

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
