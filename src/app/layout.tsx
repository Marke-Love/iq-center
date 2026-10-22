import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import Script from "next/script";
import { faq, pricing, site, subjects } from "@/content/site";
import "./globals.css";

const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["600", "700"], variable: "--font-unbounded", display: "swap" });
const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-onest", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["500", "700"], variable: "--font-jetbrains", display: "swap" });

const title = "Пробный ЕГЭ и ОГЭ в Санкт-Петербурге: как на настоящем экзамене | " + site.name;
const description =
  "Пробные экзамены ЕГЭ и ОГЭ по всем предметам в условиях реального экзамена: бланки, регламент, тайминг. Проверка экспертами по критериям ФИПИ и разбор ошибок. ДК имени Ленсовета, 3 минуты пешком от метро Петроградская.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, type: "website", locale: "ru_RU", siteName: site.name },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#2d2df0", width: "device-width", initialScale: 1 };

// Разметка schema.org одним графом: сущности ссылаются друг на друга через @id,
// поэтому поисковики и нейросети видят организацию, услугу, цены и вопросы как единое целое.
const orgId = `${site.url}/#org`;
const exams = ["ЕГЭ", "ОГЭ"] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["EducationalOrganization", "LocalBusiness"],
      "@id": orgId,
      name: site.name,
      alternateName: site.tagline,
      description,
      url: site.url,
      telephone: site.phoneHref.replace("tel:", ""),
      priceRange: `${pricing.price} ₽`,
      currenciesAccepted: "RUB",
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address,
        addressLocality: site.city,
        postalCode: site.postalCode,
        addressCountry: "RU",
      },
      geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lon },
      hasMap: `https://yandex.ru/maps/?pt=${site.geo.lon},${site.geo.lat}&z=17`,
      location: {
        "@type": "Place",
        name: site.landmark,
        address: { "@type": "PostalAddress", streetAddress: site.address, addressLocality: site.city, addressCountry: "RU" },
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "20:00",
      },
      areaServed: { "@type": "City", name: site.city },
      knowsAbout: ["ЕГЭ", "ОГЭ", "пробный экзамен", "критерии ФИПИ"],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      inLanguage: "ru",
      publisher: { "@id": orgId },
    },
    {
      "@type": "WebPage",
      "@id": `${site.url}/#webpage`,
      url: `${site.url}/`,
      name: title,
      description,
      inLanguage: "ru",
      isPartOf: { "@id": `${site.url}/#website` },
      about: { "@id": orgId },
    },
    {
      "@type": "Service",
      "@id": `${site.url}/#service`,
      name: "Пробный экзамен ЕГЭ и ОГЭ",
      serviceType: "Пробный экзамен",
      description: pricing.features.join(". ") + ".",
      provider: { "@id": orgId },
      areaServed: { "@type": "City", name: site.city },
      offers: {
        "@type": "Offer",
        price: pricing.price,
        priceCurrency: "RUB",
        description: pricing.unit,
        availability: "https://schema.org/InStock",
        url: `${site.url}/#prices`,
      },
      // каталог предметов: цена одинаковая, длительность — как на реальном экзамене
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Предметы пробных экзаменов",
        itemListElement: exams.map((exam) => ({
          "@type": "OfferCatalog",
          name: `Пробный ${exam}`,
          itemListElement: subjects[exam].map((sub) => ({
            "@type": "Offer",
            price: pricing.price,
            priceCurrency: "RUB",
            itemOffered: {
              "@type": "Service",
              name: `Пробный ${exam} по предмету «${sub.name}»`,
              description: `Длительность ${sub.duration}${sub.note ? `, ${sub.note}` : ""}`,
            },
          })),
        })),
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${site.url}/#faq`,
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${onest.variable} ${mono.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        {site.metrikaId && (
          <>
            <Script id="ym" strategy="afterInteractive">
              {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${site.metrikaId},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`}
            </Script>
            <noscript>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://mc.yandex.ru/watch/${site.metrikaId}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
              </div>
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
