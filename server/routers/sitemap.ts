/**
 * Dynamic Sitemap.xml Generator
 * 포트폴리오, 인사이트 등 동적 콘텐츠를 포함한 sitemap 자동 생성
 */

import { Router } from "express";
import { getDb } from "../db";
import { insightArticles, portfolioDrafts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const sitemapRouter = Router();

const BASE_URL = "https://kokamdo.co.kr";

// 정적 페이지 목록
const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/solutions", changefreq: "monthly", priority: "0.8" },
  { path: "/opsx", changefreq: "monthly", priority: "0.7" },
  { path: "/portfolio", changefreq: "weekly", priority: "0.9" },
  { path: "/estimator", changefreq: "monthly", priority: "0.8" },
  { path: "/insights", changefreq: "weekly", priority: "0.9" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/how-we-work", changefreq: "monthly", priority: "0.7" },
  { path: "/resources", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

function formatDate(date: Date | string | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

sitemapRouter.get("/sitemap.xml", async (_req, res) => {
  try {
    const db = await getDb();

    // 게시된 인사이트 글 조회
    const publishedInsights = await db
      .select({
        slug: insightArticles.slug,
        updatedAt: insightArticles.updatedAt,
        publishedAt: insightArticles.publishedAt,
      })
      .from(insightArticles)
      .where(eq(insightArticles.status, "published"));

    // 게시된 포트폴리오 조회
    const publishedPortfolios = await db
      .select({
        id: portfolioDrafts.id,
        updatedAt: portfolioDrafts.updatedAt,
      })
      .from(portfolioDrafts)
      .where(eq(portfolioDrafts.status, "published"));

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // 정적 페이지
    for (const page of STATIC_PAGES) {
      xml += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // 인사이트 글
    for (const insight of publishedInsights) {
      const lastmod = formatDate(insight.publishedAt || insight.updatedAt);
      xml += `  <url>
    <loc>${BASE_URL}/insights/${escapeXml(insight.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // 포트폴리오 상세
    for (const portfolio of publishedPortfolios) {
      const lastmod = formatDate(portfolio.updatedAt);
      xml += `  <url>
    <loc>${BASE_URL}/portfolio/p/${portfolio.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err: any) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

// robots.txt 동적 생성
sitemapRouter.get("/robots.txt", (_req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/
Disallow: /client/dashboard
Disallow: /client/login
Disallow: /client/register

# Crawl-delay for polite crawling
Crawl-delay: 1

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml

# Host
Host: ${BASE_URL}
`;

  res.set("Content-Type", "text/plain; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(robotsTxt);
});

export default sitemapRouter;
