import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kallos.in' },
    update: {},
    create: {
      email: 'admin@kallos.in',
      passwordHash: adminHash,
      firstName: 'Kallos',
      lastName: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
      wallet: { create: {} },
    },
  });
  console.log(`✅ Admin: ${admin.email} / Admin@1234`);

  // ─── Test Customer ─────────────────────────────────────────────────────────
  const customerHash = await bcrypt.hash('Customer@1234', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@kallos.in' },
    update: {},
    create: {
      email: 'customer@kallos.in',
      passwordHash: customerHash,
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '9876543210',
      role: 'CUSTOMER',
      isEmailVerified: true,
      cart: { create: {} },
      wishlist: { create: {} },
      wallet: { create: { balance: 500 } },
      addresses: {
        create: {
          fullName: 'Rahul Sharma',
          phone: '9876543210',
          addressLine1: '42, MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          isDefault: true,
        },
      },
    },
  });
  console.log(`✅ Customer: ${customer.email} / Customer@1234`);

  // ─── Categories ────────────────────────────────────────────────────────────
  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: { name: 'Clothing', slug: 'clothing', description: 'All clothing items', sortOrder: 1 },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: { name: 'Accessories', slug: 'accessories', description: 'Bags, caps, and more', sortOrder: 2 },
  });

  // ─── Subcategories ─────────────────────────────────────────────────────────
  const tshirts = await prisma.subcategory.upsert({
    where: { slug: 'tshirts' },
    update: {},
    create: { name: 'T-Shirts', slug: 'tshirts', categoryId: clothing.id, sortOrder: 1 },
  });

  const hoodies = await prisma.subcategory.upsert({
    where: { slug: 'hoodies' },
    update: {},
    create: { name: 'Hoodies', slug: 'hoodies', categoryId: clothing.id, sortOrder: 2 },
  });

  const oversized = await prisma.subcategory.upsert({
    where: { slug: 'oversized-tees' },
    update: {},
    create: { name: 'Oversized Tees', slug: 'oversized-tees', categoryId: clothing.id, sortOrder: 3 },
  });

  const graphicTees = await prisma.subcategory.upsert({
    where: { slug: 'graphic-tees' },
    update: {},
    create: { name: 'Graphic Tees', slug: 'graphic-tees', categoryId: clothing.id, sortOrder: 4 },
  });

  const caps = await prisma.subcategory.upsert({
    where: { slug: 'caps' },
    update: {},
    create: { name: 'Caps', slug: 'caps', categoryId: accessories.id, sortOrder: 1 },
  });

  const bags = await prisma.subcategory.upsert({
    where: { slug: 'bags' },
    update: {},
    create: { name: 'Bags', slug: 'bags', categoryId: accessories.id, sortOrder: 2 },
  });

  const socks = await prisma.subcategory.upsert({
    where: { slug: 'socks' },
    update: {},
    create: { name: 'Socks', slug: 'socks', categoryId: accessories.id, sortOrder: 3 },
  });

  console.log('✅ Categories & subcategories created');

  // ─── Products ──────────────────────────────────────────────────────────────

  const products = [
    {
      name: 'Classic White Oversized Tee',
      slug: 'classic-white-oversized-tee',
      description: 'Our signature oversized fit tee in premium 240 GSM cotton. Drop shoulders, boxy cut, and a relaxed feel that goes with everything.',
      basePrice: 799,
      categoryId: clothing.id,
      subcategoryId: oversized.id,
      brand: 'KALLOS',
      material: '100% Cotton, 240 GSM',
      careInstructions: 'Machine wash cold. Do not bleach. Tumble dry low.',
      isFeatured: true,
      tags: ['oversized', 'cotton', 'white', 'basics', 'new-arrival'],
      images: [
        { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=90', publicId: 'unsplash/photo-1521572163474-6864f9cf17ab', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=1200&q=90', publicId: 'unsplash/photo-1586790170083-2f9ceadc732d', isPrimary: false, sortOrder: 1 },
        { url: 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=1200&q=90', publicId: 'unsplash/photo-1622445275463-afa2ab738c34', isPrimary: false, sortOrder: 2 },
      ],
      variants: [
        { size: 'S', color: 'White', colorHex: '#FFFFFF', sku: 'KAL-CWOT-S-WHT', stock: 50, price: null },
        { size: 'M', color: 'White', colorHex: '#FFFFFF', sku: 'KAL-CWOT-M-WHT', stock: 80, price: null },
        { size: 'L', color: 'White', colorHex: '#FFFFFF', sku: 'KAL-CWOT-L-WHT', stock: 60, price: null },
        { size: 'XL', color: 'White', colorHex: '#FFFFFF', sku: 'KAL-CWOT-XL-WHT', stock: 40, price: null },
        { size: 'XXL', color: 'White', colorHex: '#FFFFFF', sku: 'KAL-CWOT-XXL-WHT', stock: 20, price: null },
      ],
    },
    {
      name: 'Classic Black Oversized Tee',
      slug: 'classic-black-oversized-tee',
      description: 'Same signature oversized fit in deep black. Enzyme washed for an ultra-soft feel from day one.',
      basePrice: 799,
      categoryId: clothing.id,
      subcategoryId: oversized.id,
      brand: 'KALLOS',
      material: '100% Cotton, 240 GSM',
      careInstructions: 'Machine wash cold. Wash dark colors separately.',
      isFeatured: true,
      tags: ['oversized', 'cotton', 'black', 'basics'],
      images: [
        { url: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1200&q=90', publicId: 'unsplash/photo-1503341455253-b2e723bb3dbb', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=90', publicId: 'unsplash/photo-1583743814966-8936f5b7be1a', isPrimary: false, sortOrder: 1 },
        { url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=90', publicId: 'unsplash/photo-1618354691373-d851c5c3a990', isPrimary: false, sortOrder: 2 },
      ],
      variants: [
        { size: 'S', color: 'Black', colorHex: '#000000', sku: 'KAL-CBOT-S-BLK', stock: 60, price: null },
        { size: 'M', color: 'Black', colorHex: '#000000', sku: 'KAL-CBOT-M-BLK', stock: 90, price: null },
        { size: 'L', color: 'Black', colorHex: '#000000', sku: 'KAL-CBOT-L-BLK', stock: 70, price: null },
        { size: 'XL', color: 'Black', colorHex: '#000000', sku: 'KAL-CBOT-XL-BLK', stock: 45, price: null },
        { size: 'XXL', color: 'Black', colorHex: '#000000', sku: 'KAL-CBOT-XXL-BLK', stock: 25, price: null },
      ],
    },
    {
      name: 'Acid Wash Graphic Tee — Abstract',
      slug: 'acid-wash-graphic-tee-abstract',
      description: 'Bold abstract print on a vintage acid wash base. Screen printed with water-based inks. Each piece is unique due to the wash process.',
      basePrice: 999,
      categoryId: clothing.id,
      subcategoryId: graphicTees.id,
      brand: 'KALLOS',
      material: '100% Cotton, 200 GSM',
      careInstructions: 'Hand wash recommended. Cold water only.',
      isFeatured: true,
      tags: ['graphic', 'acid-wash', 'streetwear', 'limited'],
      images: [
        { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=90', publicId: 'unsplash/photo-1576566588028-4147f3842f27', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=1200&q=90', publicId: 'unsplash/photo-1529374255404-311a2a4f1fd9', isPrimary: false, sortOrder: 1 },
      ],
      variants: [
        { size: 'S', color: 'Beige', colorHex: '#D4B896', sku: 'KAL-AWGT-S-BEI', stock: 15, price: null },
        { size: 'M', color: 'Beige', colorHex: '#D4B896', sku: 'KAL-AWGT-M-BEI', stock: 25, price: null },
        { size: 'L', color: 'Beige', colorHex: '#D4B896', sku: 'KAL-AWGT-L-BEI', stock: 20, price: null },
        { size: 'XL', color: 'Beige', colorHex: '#D4B896', sku: 'KAL-AWGT-XL-BEI', stock: 10, price: null },
        { size: 'S', color: 'Slate Blue', colorHex: '#6B7FA3', sku: 'KAL-AWGT-S-SBL', stock: 12, price: null },
        { size: 'M', color: 'Slate Blue', colorHex: '#6B7FA3', sku: 'KAL-AWGT-M-SBL', stock: 18, price: null },
        { size: 'L', color: 'Slate Blue', colorHex: '#6B7FA3', sku: 'KAL-AWGT-L-SBL', stock: 14, price: null },
      ],
    },
    {
      name: 'Essential Pullover Hoodie',
      slug: 'essential-pullover-hoodie',
      description: 'Heavyweight 400 GSM fleece pullover. Kangaroo pocket, ribbed cuffs and hem. Brushed inside for maximum warmth.',
      basePrice: 1799,
      categoryId: clothing.id,
      subcategoryId: hoodies.id,
      brand: 'KALLOS',
      material: '80% Cotton, 20% Polyester, 400 GSM Fleece',
      careInstructions: 'Machine wash cold. Tumble dry low. Do not iron print.',
      isFeatured: true,
      tags: ['hoodie', 'fleece', 'winter', 'heavyweight'],
      images: [
        { url: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=1200&q=90', publicId: 'unsplash/photo-1556821840-3a63f15732ce', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=90', publicId: 'unsplash/photo-1591047139829-d91aecb6caea', isPrimary: false, sortOrder: 1 },
        { url: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=1200&q=90', publicId: 'unsplash/photo-1509942774463-acf339cf87d5', isPrimary: false, sortOrder: 2 },
      ],
      variants: [
        { size: 'S', color: 'Charcoal', colorHex: '#36393F', sku: 'KAL-EPH-S-CHR', stock: 30, price: null },
        { size: 'M', color: 'Charcoal', colorHex: '#36393F', sku: 'KAL-EPH-M-CHR', stock: 45, price: null },
        { size: 'L', color: 'Charcoal', colorHex: '#36393F', sku: 'KAL-EPH-L-CHR', stock: 40, price: null },
        { size: 'XL', color: 'Charcoal', colorHex: '#36393F', sku: 'KAL-EPH-XL-CHR', stock: 25, price: null },
        { size: 'S', color: 'Cream', colorHex: '#F5F0E8', sku: 'KAL-EPH-S-CRM', stock: 20, price: null },
        { size: 'M', color: 'Cream', colorHex: '#F5F0E8', sku: 'KAL-EPH-M-CRM', stock: 35, price: null },
        { size: 'L', color: 'Cream', colorHex: '#F5F0E8', sku: 'KAL-EPH-L-CRM', stock: 30, price: null },
        { size: 'XL', color: 'Cream', colorHex: '#F5F0E8', sku: 'KAL-EPH-XL-CRM', stock: 18, price: null },
        { size: 'S', color: 'Forest Green', colorHex: '#2D5016', sku: 'KAL-EPH-S-FGR', stock: 15, price: null },
        { size: 'M', color: 'Forest Green', colorHex: '#2D5016', sku: 'KAL-EPH-M-FGR', stock: 22, price: null },
        { size: 'L', color: 'Forest Green', colorHex: '#2D5016', sku: 'KAL-EPH-L-FGR', stock: 18, price: null },
      ],
    },
    {
      name: 'Zip-Up Hoodie — Washed Black',
      slug: 'zip-up-hoodie-washed-black',
      description: 'Full-zip hoodie in garment-washed black. YKK zipper, two side pockets, adjustable drawstrings. Slightly relaxed fit.',
      basePrice: 1999,
      categoryId: clothing.id,
      subcategoryId: hoodies.id,
      brand: 'KALLOS',
      material: '100% Cotton, 380 GSM',
      careInstructions: 'Machine wash cold inside out. Do not bleach.',
      isFeatured: false,
      tags: ['hoodie', 'zip-up', 'washed', 'streetwear'],
      images: [
        { url: 'https://images.unsplash.com/photo-1614495151270-6b5e2cd8d21d?w=1200&q=90', publicId: 'unsplash/photo-1614495151270-6b5e2cd8d21d', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1617952986600-802f965dcdbc?w=1200&q=90', publicId: 'unsplash/photo-1617952986600-802f965dcdbc', isPrimary: false, sortOrder: 1 },
      ],
      variants: [
        { size: 'S', color: 'Washed Black', colorHex: '#2C2C2C', sku: 'KAL-ZUH-S-WBK', stock: 20, price: null },
        { size: 'M', color: 'Washed Black', colorHex: '#2C2C2C', sku: 'KAL-ZUH-M-WBK', stock: 30, price: null },
        { size: 'L', color: 'Washed Black', colorHex: '#2C2C2C', sku: 'KAL-ZUH-L-WBK', stock: 25, price: null },
        { size: 'XL', color: 'Washed Black', colorHex: '#2C2C2C', sku: 'KAL-ZUH-XL-WBK', stock: 15, price: null },
      ],
    },
    {
      name: 'KALLOS Structured Cap',
      slug: 'kallos-structured-cap',
      description: 'Six-panel structured cap with embroidered KALLOS wordmark on the front. Adjustable snapback closure. One size fits most.',
      basePrice: 599,
      categoryId: accessories.id,
      subcategoryId: caps.id,
      brand: 'KALLOS',
      material: '100% Cotton Twill',
      careInstructions: 'Spot clean only. Do not machine wash.',
      isFeatured: true,
      tags: ['cap', 'snapback', 'accessories', 'streetwear'],
      images: [
        { url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=1200&q=90', publicId: 'unsplash/photo-1588850561407-ed78c282e89b', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=1200&q=90', publicId: 'unsplash/photo-1574180566232-aaad1b5b8450', isPrimary: false, sortOrder: 1 },
        { url: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=1200&q=90', publicId: 'unsplash/photo-1534215754734-18e55d13e346', isPrimary: false, sortOrder: 2 },
      ],
      variants: [
        { size: 'One Size', color: 'Black', colorHex: '#000000', sku: 'KAL-SC-OS-BLK', stock: 50, price: null },
        { size: 'One Size', color: 'Cream', colorHex: '#F5F0E8', sku: 'KAL-SC-OS-CRM', stock: 40, price: null },
        { size: 'One Size', color: 'Olive', colorHex: '#6B6B3A', sku: 'KAL-SC-OS-OLV', stock: 30, price: null },
      ],
    },
    {
      name: 'KALLOS Dad Cap — Washed',
      slug: 'kallos-dad-cap-washed',
      description: 'Unstructured washed twill dad cap with a subtle tonal KALLOS embroidery. Low-profile and easy to wear.',
      basePrice: 499,
      categoryId: accessories.id,
      subcategoryId: caps.id,
      brand: 'KALLOS',
      material: '100% Cotton Twill, Garment Washed',
      careInstructions: 'Hand wash cold. Air dry.',
      isFeatured: false,
      tags: ['cap', 'dad-cap', 'accessories', 'washed'],
      images: [
        { url: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=1200&q=90', publicId: 'unsplash/photo-1521369909029-2afed882baee', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=1200&q=90', publicId: 'unsplash/photo-1533827432537-70133748f5c8', isPrimary: false, sortOrder: 1 },
      ],
      variants: [
        { size: 'One Size', color: 'Washed Black', colorHex: '#2C2C2C', sku: 'KAL-DC-OS-WBK', stock: 35, price: null },
        { size: 'One Size', color: 'Washed Navy', colorHex: '#1C2A4A', sku: 'KAL-DC-OS-WNV', stock: 30, price: null },
        { size: 'One Size', color: 'Stone', colorHex: '#B2A89A', sku: 'KAL-DC-OS-STN', stock: 25, price: null },
      ],
    },
    {
      name: 'Essential Tote Bag',
      slug: 'essential-tote-bag',
      description: 'Heavy-duty 12oz canvas tote with reinforced handles. Screen-printed KALLOS logo. Fits a 15" laptop. Perfect daily carry.',
      basePrice: 799,
      categoryId: accessories.id,
      subcategoryId: bags.id,
      brand: 'KALLOS',
      material: '12oz Cotton Canvas',
      careInstructions: 'Machine wash cold. Air dry. Do not iron print.',
      isFeatured: true,
      tags: ['bag', 'tote', 'canvas', 'accessories'],
      images: [
        { url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&q=90', publicId: 'unsplash/photo-1622560480605-d83c853bc5c3', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&q=90', publicId: 'unsplash/photo-1544816155-12df9643f363', isPrimary: false, sortOrder: 1 },
        { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=90', publicId: 'unsplash/photo-1584917865442-de89df76afd3', isPrimary: false, sortOrder: 2 },
      ],
      variants: [
        { size: null, color: 'Natural', colorHex: '#E8DCC8', sku: 'KAL-ETB-NAT', stock: 60, price: null },
        { size: null, color: 'Black', colorHex: '#000000', sku: 'KAL-ETB-BLK', stock: 50, price: null },
      ],
    },
    {
      name: 'Ankle Socks 3-Pack',
      slug: 'ankle-socks-3-pack',
      description: 'Everyday ankle socks in a 3-pack. Cushioned sole, ribbed cuff. KALLOS logo on the side. Soft cotton blend.',
      basePrice: 349,
      categoryId: accessories.id,
      subcategoryId: socks.id,
      brand: 'KALLOS',
      material: '80% Cotton, 15% Polyester, 5% Elastane',
      careInstructions: 'Machine wash warm. Tumble dry low.',
      isFeatured: false,
      tags: ['socks', 'accessories', 'basics', 'bundle'],
      images: [
        { url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=1200&q=90', publicId: 'unsplash/photo-1586350977771-b3b0abd50c82', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=90', publicId: 'unsplash/photo-1542291026-7eec264c27ff', isPrimary: false, sortOrder: 1 },
      ],
      variants: [
        { size: 'S/M (UK 4–7)', color: 'White', colorHex: '#FFFFFF', sku: 'KAL-AS3-SM-WHT', stock: 80, price: null },
        { size: 'L/XL (UK 8–11)', color: 'White', colorHex: '#FFFFFF', sku: 'KAL-AS3-LX-WHT', stock: 70, price: null },
        { size: 'S/M (UK 4–7)', color: 'Black', colorHex: '#000000', sku: 'KAL-AS3-SM-BLK', stock: 80, price: null },
        { size: 'L/XL (UK 8–11)', color: 'Black', colorHex: '#000000', sku: 'KAL-AS3-LX-BLK', stock: 70, price: null },
      ],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      include: { images: true },
    });

    if (existing) {
      // Product exists — seed images if it has none
      if (existing.images.length === 0) {
        await prisma.productImage.createMany({
          data: p.images.map((img) => ({ ...img, productId: existing.id })),
        });
        console.log(`📸 Added images to existing: ${p.name}`);
      } else {
        console.log(`⏭️  Skipping existing: ${p.name}`);
      }
      continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId,
        brand: p.brand,
        material: p.material,
        careInstructions: p.careInstructions,
        isFeatured: p.isFeatured,
        isActive: true,
        tags: { create: p.tags.map((tag) => ({ tag })) },
        images: { create: p.images },
        variants: {
          create: p.variants.map((v) => ({
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            sku: v.sku,
            stock: v.stock,
            price: v.price ?? null,
            isActive: true,
          })),
        },
      },
    });
    console.log(`✅ Product: ${p.name}`);
  }

  // ─── Coupons ───────────────────────────────────────────────────────────────
  const coupons = [
    {
      code: 'WELCOME10',
      description: '10% off for first-time orders',
      type: 'PERCENTAGE' as const,
      value: 10,
      isFirstTimeOnly: true,
      perUserLimit: 1,
      isActive: true,
    },
    {
      code: 'FLAT200',
      description: '₹200 off on orders above ₹1499',
      type: 'FLAT' as const,
      value: 200,
      minOrderValue: 1499,
      perUserLimit: 2,
      isActive: true,
    },
    {
      code: 'FREESHIP',
      description: 'Free shipping on any order',
      type: 'FREE_SHIPPING' as const,
      value: 0,
      perUserLimit: 3,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    console.log(`✅ Coupon: ${c.code}`);
  }

  // ─── Admin Settings ────────────────────────────────────────────────────────
  const settings = [
    { key: 'free_shipping_above', value: '999', description: 'Free shipping above this cart value (INR)' },
    { key: 'cod_enabled', value: 'true', description: 'Whether COD is available' },
    { key: 'cod_surcharge', value: '0', description: 'Extra charge for COD orders (INR)' },
    { key: 'return_window_days', value: '7', description: 'Days within which returns are allowed' },
    { key: 'low_stock_threshold', value: '10', description: 'Alert threshold for low stock' },
    { key: 'max_cart_quantity_per_item', value: '10', description: 'Max quantity per item in cart' },
  ];

  for (const s of settings) {
    await prisma.adminSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log('✅ Admin settings');

  console.log('\n🎉 Seed complete!\n');
  console.log('  Admin:    admin@kallos.in    / Admin@1234');
  console.log('  Customer: customer@kallos.in / Customer@1234');
  console.log(`  Products: ${products.length} products with variants (clothing + accessories)`);
  console.log('  Coupons:  WELCOME10 | FLAT200 | FREESHIP\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
