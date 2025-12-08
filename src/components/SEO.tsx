import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  children?: React.ReactNode;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description = "KukeMC - 一个充满乐趣的 Minecraft 服务器，提供生存、小游戏、粘液科技等多种玩法。",
  image = "https://m.ccw.site/gandi_application/user_assets/2a6bb37880317d2bb5525ab560618e04.png",
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  keywords = ["Minecraft", "我的世界", "KukeMC", "服务器", "生存", "小游戏"],
  children
}) => {
  const siteUrl = import.meta.env.VITE_APP_URL || 'https://kuke.ink';
  const currentUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : window.location.href;
  const siteName = "KukeMC";
  const defaultSuffix = " - KukeMC-我的世界服务器(Minecraft)";

  // Determine final title
  let finalTitle = title;
  if (!title.includes("KukeMC") && !title.includes("我的世界服务器")) {
      finalTitle = `${title}${defaultSuffix}`;
  } else if (title.includes("KukeMC") && !title.includes("我的世界服务器(Minecraft)")) {
      // If title has KukeMC but lacks the full suffix user wants
      // e.g. "Page - KukeMC" -> "Page - KukeMC-我的世界服务器(Minecraft)"
      finalTitle = title.replace(" - KukeMC", defaultSuffix).replace("KukeMC", "KukeMC-我的世界服务器(Minecraft)");
      // Edge case cleanup if replacement wasn't clean
      if (!finalTitle.includes(defaultSuffix)) {
         // Fallback if structure was different
         finalTitle = `${title} - 我的世界服务器(Minecraft)`; 
      }
  }

  // Construct structured data
  let structuredData: any = null;

  if (type === 'article') {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": finalTitle,
      "image": [image],
      "datePublished": publishedTime,
      "dateModified": modifiedTime || publishedTime,
      "author": [{
          "@type": "Person",
          "name": author || siteName,
          "url": author ? `${siteUrl}/player/${author}` : siteUrl
      }]
    };
  } else if (type === 'profile') {
      structuredData = {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "mainEntity": {
              "@type": "Person",
              "name": finalTitle.split(' - ')[0], 
              "description": description,
              "image": image,
              "interactionStatistic": [{
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/LikeAction",
                "userInteractionCount": 0 
              }]
          }
      };
  }

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article Specific */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {children}
    </Helmet>
  );
};

export default SEO;
