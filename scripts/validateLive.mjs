import fs from 'fs';

async function checkLive() {
  const res = await fetch('https://rajnikantdodiya.com/?cache_bust=' + Date.now());
  const html = await res.text();
  const startTag = '<script type="application/ld+json">';
  const endTag = '</script>';
  const start = html.indexOf(startTag);
  const end = html.indexOf(endTag, start);
  const json = JSON.parse(html.substring(start + startTag.length, end).trim());

  console.log('--- LIVE PRODUCTION AUDIT ---');
  console.log(`URL: https://rajnikantdodiya.com`);
  console.log(`Total Graph Entities: ${json['@graph'].length}`);

  const products = json['@graph'].filter(e => e['@type'] === 'Product');
  console.log(`Merchant Listings (Products) Found: ${products.length}\n`);

  products.forEach((p, idx) => {
    console.log(`[Product ${idx + 1}] ${p.name}`);
    console.log(`  SKU: ${p.sku}`);
    console.log(`  Price: ₹${p.offers.price} ${p.offers.priceCurrency}`);
    console.log(`  Availability: ${p.offers.availability}`);
    console.log(`  Image: ${p.image[0]}`);
    console.log(`  Brand: ${p.brand?.name}`);
    console.log(`  Return Policy: ${p.offers.hasMerchantReturnPolicy?.returnPolicyCategory}`);
    console.log(`  Shipping Details: ${p.offers.shippingDetails?.shippingRate?.value} ${p.offers.shippingDetails?.shippingRate?.currency}`);
    console.log(`  Rating: ${p.aggregateRating?.ratingValue} / 5 (${p.aggregateRating?.reviewCount} reviews)`);
    console.log('');
  });
}

checkLive().catch(err => {
  console.error(err);
  process.exit(1);
});
