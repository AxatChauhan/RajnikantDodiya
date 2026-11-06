import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const startTag = '<script type="application/ld+json">';
const endTag = '</script>';

const start = html.indexOf(startTag);
if (start === -1) {
  console.error('Error: start tag not found');
  process.exit(1);
}

const end = html.indexOf(endTag, start);
if (end === -1) {
  console.error('Error: end tag not found');
  process.exit(1);
}

const jsonStr = html.substring(start + startTag.length, end).trim();

try {
  const schema = JSON.parse(jsonStr);
  console.log('SUCCESS: Valid JSON-LD schema found.');
  console.log(`Context: ${schema['@context']}`);
  console.log(`Total Graph Entities: ${schema['@graph'].length}\n`);

  schema['@graph'].forEach((entity, index) => {
    console.log(`[Entity ${index + 1}] Type: ${JSON.stringify(entity['@type'])} | Name/ID: ${entity.name || entity['@id']}`);
    if (entity['@type'] === 'Product') {
      console.log(`  - Price: ${entity.offers?.price} ${entity.offers?.priceCurrency}`);
      console.log(`  - Image: ${entity.image}`);
      console.log(`  - SKU: ${entity.sku}`);
      console.log(`  - Return Policy: ${entity.offers?.hasMerchantReturnPolicy?.returnPolicyCategory}`);
      console.log(`  - Shipping Details: ${entity.offers?.shippingDetails?.shippingRate?.value} INR`);
      console.log(`  - Aggregate Rating: ${entity.aggregateRating?.ratingValue} (${entity.aggregateRating?.reviewCount} reviews)`);
    }
  });
} catch (err) {
  console.error('FATAL: JSON-LD parse failed:', err);
  process.exit(1);
}
