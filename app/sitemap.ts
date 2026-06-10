import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not defined");
    }

const lastModified = new Date().toISOString();

  return [
    {
      url: appUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${appUrl}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/auth/sign-up`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
