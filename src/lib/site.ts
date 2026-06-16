import type { Metadata } from "next";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://personal-workstation.vercel.app";
export const siteName = "黄铭语研究工作站";
export const siteDescription = "公开研究项目、学术成果、知识笔记与 AI 工作流。";
export const publicOgImage = {
  path: "/research-workstation-hero.png",
  width: 1800,
  height: 1080,
  alt: "黄铭语研究工作站公开研究工作台预览"
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

function titleWithSiteName(title: string) {
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}

export function publicMetadataDescription(value: string | null | undefined, fallback = siteDescription, maxLength = 150) {
  const normalized = (value?.trim() || fallback).replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

export function publicPageMetadata({
  title,
  description,
  path,
  type = "website",
  socialTitle
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  socialTitle?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(publicOgImage.path);
  const resolvedDescription = publicMetadataDescription(description, siteDescription);
  const resolvedSocialTitle = socialTitle ?? (type === "article" ? title : titleWithSiteName(title));

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: resolvedSocialTitle,
      description: resolvedDescription,
      url,
      siteName,
      locale: "zh_CN",
      type,
      images: [
        {
          url: imageUrl,
          width: publicOgImage.width,
          height: publicOgImage.height,
          alt: publicOgImage.alt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedSocialTitle,
      description: resolvedDescription,
      images: [imageUrl]
    }
  };
}

export function publicNoindexMetadata({
  title,
  description,
  path
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    ...publicPageMetadata({
      title,
      description,
      path
    }),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false
      }
    }
  };
}
