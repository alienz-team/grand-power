import { Storefront } from "@/components/store/Storefront";
import { getStorefrontData } from "@/lib/repo";
import { getCustomer, getSavedCodes } from "@/lib/customer";
import { LOGO_URL, SITE_URL } from "@/lib/config/contact";

// Per-visitor (language/theme cookies + signed-in customer) — never cache the HTML across users.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getStorefrontData();
  const customer = await getCustomer();
  const savedCodes = customer ? await getSavedCodes(customer.id) : [];
  const s = data.settings;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: "GRAND POWER | قراند باور",
    url: SITE_URL,
    logo: LOGO_URL,
    image: LOGO_URL,
    slogan: s.sloganEn,
    telephone: s.phoneNumber,
    email: s.email,
    address: { "@type": "PostalAddress", addressCountry: "LY", addressLocality: s.addressEn },
    sameAs: [s.facebookUrl, s.instagramUrl],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Storefront data={data} customer={customer} savedCodes={savedCodes} />
    </>
  );
}
