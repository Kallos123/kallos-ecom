import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function orderNum(date: Date, suffix: string) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `KAL-${y}${m}${d}-${suffix}`;
}

async function main() {
  console.log('🌱 Populating realistic data...');

  // ── Fetch existing products & variants ────────────────────────────────────
  const products = await prisma.product.findMany({
    include: { variants: { where: { isActive: true } } },
  });

  if (products.length === 0) {
    console.error('❌ No products found. Run seed first: npx prisma db seed');
    process.exit(1);
  }

  const pBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

  function variant(slug: string, idx = 0) {
    const p = pBySlug[slug] ?? products[0];
    return p.variants[idx % p.variants.length];
  }

  // ── Create customers ───────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Customer@1234', 12);

  const customerData = [
    { email: 'priya.mehta@gmail.com',     firstName: 'Priya',   lastName: 'Mehta',    phone: '9812345670', city: 'Mumbai',    state: 'Maharashtra', pin: '400001', line1: '12, Marine Drive' },
    { email: 'arjun.patel@gmail.com',     firstName: 'Arjun',   lastName: 'Patel',    phone: '9823456781', city: 'Ahmedabad', state: 'Gujarat',     pin: '380001', line1: '7, CG Road' },
    { email: 'sneha.reddy@gmail.com',     firstName: 'Sneha',   lastName: 'Reddy',    phone: '9834567892', city: 'Hyderabad', state: 'Telangana',   pin: '500001', line1: '45, Banjara Hills' },
    { email: 'vikram.singh@gmail.com',    firstName: 'Vikram',  lastName: 'Singh',    phone: '9845678903', city: 'Delhi',     state: 'Delhi',       pin: '110001', line1: '22, Connaught Place' },
    { email: 'ananya.krishnan@gmail.com', firstName: 'Ananya',  lastName: 'Krishnan', phone: '9856789014', city: 'Chennai',   state: 'Tamil Nadu',  pin: '600001', line1: '8, Anna Salai' },
    { email: 'rohan.gupta@gmail.com',     firstName: 'Rohan',   lastName: 'Gupta',    phone: '9867890125', city: 'Kolkata',   state: 'West Bengal', pin: '700001', line1: '33, Park Street' },
    { email: 'nisha.verma@gmail.com',     firstName: 'Nisha',   lastName: 'Verma',    phone: '9878901236', city: 'Jaipur',    state: 'Rajasthan',   pin: '302001', line1: '5, MI Road' },
    { email: 'karan.malhotra@gmail.com',  firstName: 'Karan',   lastName: 'Malhotra', phone: '9889012347', city: 'Pune',      state: 'Maharashtra', pin: '411001', line1: '18, FC Road' },
    { email: 'divya.nair@gmail.com',      firstName: 'Divya',   lastName: 'Nair',     phone: '9890123458', city: 'Kochi',     state: 'Kerala',      pin: '682001', line1: '3, MG Road' },
    { email: 'saurabh.joshi@gmail.com',   firstName: 'Saurabh', lastName: 'Joshi',    phone: '9901234569', city: 'Nagpur',    state: 'Maharashtra', pin: '440001', line1: '9, Sitabuldi' },
    { email: 'pooja.agarwal@gmail.com',   firstName: 'Pooja',   lastName: 'Agarwal',  phone: '9912345670', city: 'Lucknow',   state: 'Uttar Pradesh', pin: '226001', line1: '14, Hazratganj' },
    { email: 'amit.kumar@gmail.com',      firstName: 'Amit',    lastName: 'Kumar',    phone: '9923456781', city: 'Patna',     state: 'Bihar',       pin: '800001', line1: '6, Exhibition Road' },
    { email: 'shreya.sharma@gmail.com',   firstName: 'Shreya',  lastName: 'Sharma',   phone: '9934567892', city: 'Chandigarh', state: 'Punjab',     pin: '160001', line1: '11, Sector 17' },
    { email: 'ravi.iyer@gmail.com',       firstName: 'Ravi',    lastName: 'Iyer',     phone: '9945678903', city: 'Bengaluru', state: 'Karnataka',   pin: '560001', line1: '27, Brigade Road' },
    { email: 'meera.pillai@gmail.com',    firstName: 'Meera',   lastName: 'Pillai',   phone: '9956789014', city: 'Trivandrum', state: 'Kerala',     pin: '695001', line1: '2, Kowdiar' },
  ];

  const customers: any[] = [];
  for (const cd of customerData) {
    const existing = await prisma.user.findUnique({ where: { email: cd.email } });
    if (existing) {
      const addr = await prisma.address.findFirst({ where: { userId: existing.id } });
      customers.push({ ...existing, defaultAddressId: addr?.id });
      continue;
    }
    const u = await prisma.user.create({
      data: {
        email: cd.email,
        passwordHash: hash,
        firstName: cd.firstName,
        lastName: cd.lastName,
        phone: cd.phone,
        role: 'CUSTOMER',
        isEmailVerified: true,
        lastLoginAt: daysAgo(Math.floor(Math.random() * 30)),
        cart: { create: {} },
        wishlist: { create: {} },
        wallet: { create: { balance: Math.floor(Math.random() * 600) } },
        addresses: {
          create: {
            fullName: `${cd.firstName} ${cd.lastName}`,
            phone: cd.phone,
            addressLine1: cd.line1,
            city: cd.city,
            state: cd.state,
            pincode: cd.pin,
            isDefault: true,
          },
        },
      },
    });
    const addr = await prisma.address.findFirst({ where: { userId: u.id } });
    customers.push({ ...u, defaultAddressId: addr?.id });
    console.log(`✅ User: ${cd.email}`);
  }

  // ── Helper to create an order ──────────────────────────────────────────────
  async function createOrder(opts: {
    user: any;
    items: { variantId: string; productName: string; size?: string | null; color?: string | null; price: number; qty: number }[];
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    date: Date;
    suffix: string;
    discount?: number;
    couponCode?: string;
  }) {
    const subtotal = opts.items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal >= 999 ? 0 : 99;
    const discount = opts.discount ?? 0;
    const total = subtotal + shipping - discount;

    const addrSnap = {
      fullName: `${opts.user.firstName} ${opts.user.lastName}`,
      phone: opts.user.phone ?? '9999999999',
      addressLine1: '42, Example Street',
      city: 'Bengaluru', state: 'Karnataka', pincode: '560001',
    };

    return prisma.order.create({
      data: {
        orderNumber: orderNum(opts.date, opts.suffix),
        userId: opts.user.id,
        addressId: opts.user.defaultAddressId,
        addressSnapshot: addrSnap,
        subtotal,
        shippingCharge: shipping,
        discount,
        totalAmount: total,
        couponCode: opts.couponCode ?? null,
        paymentMethod: opts.paymentMethod as any,
        paymentStatus: opts.paymentStatus as any,
        orderStatus: opts.status as any,
        createdAt: opts.date,
        updatedAt: opts.date,
        items: {
          create: opts.items.map((i) => ({
            variantId: i.variantId,
            productSnapshot: { name: i.productName, size: i.size, color: i.color },
            quantity: i.qty,
            unitPrice: i.price,
            totalPrice: i.price * i.qty,
          })),
        },
        statusHistory: {
          create: [{ status: opts.status as any, createdAt: opts.date }],
        },
      },
    });
  }

  // ── Create orders ─────────────────────────────────────────────────────────
  console.log('\n📦 Creating orders...');

  const [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14] = customers;

  const whiteTee  = pBySlug['classic-white-oversized-tee'];
  const blackTee  = pBySlug['classic-black-oversized-tee'];
  const acidTee   = pBySlug['acid-wash-graphic-tee-abstract'];
  const hoodie    = pBySlug['essential-pullover-hoodie'];
  const zipHoodie = pBySlug['zip-up-hoodie-washed-black'];
  const cap       = pBySlug['kallos-structured-cap'];
  const dadCap    = pBySlug['kallos-dad-cap-washed'];
  const tote      = pBySlug['essential-tote-bag'];
  const socks     = pBySlug['ankle-socks-3-pack'];

  const ordersToCreate = [
    // DELIVERED - older orders
    { user: c0,  status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(85), suffix: 'A1B2C', items: [{ variantId: whiteTee.variants[1].id, productName: whiteTee.name, size: 'M', color: 'White', price: 799, qty: 1 }, { variantId: socks.variants[0].id, productName: socks.name, size: 'S/M', color: 'White', price: 349, qty: 1 }] },
    { user: c1,  status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(72), suffix: 'D3E4F', items: [{ variantId: hoodie.variants[1].id, productName: hoodie.name, size: 'M', color: 'Charcoal', price: 1799, qty: 1 }] },
    { user: c2,  status: 'DELIVERED',   pm: 'COD',      ps: 'PAID',    date: daysAgo(68), suffix: 'G5H6I', items: [{ variantId: blackTee.variants[2].id, productName: blackTee.name, size: 'L', color: 'Black', price: 799, qty: 2 }] },
    { user: c3,  status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(60), suffix: 'J7K8L', items: [{ variantId: cap.variants[0].id, productName: cap.name, size: 'One Size', color: 'Black', price: 599, qty: 1 }, { variantId: tote.variants[0].id, productName: tote.name, size: null, color: 'Natural', price: 799, qty: 1 }], discount: 200, couponCode: 'FLAT200' },
    { user: c4,  status: 'DELIVERED',   pm: 'WALLET',   ps: 'PAID',    date: daysAgo(55), suffix: 'M9N0O', items: [{ variantId: acidTee.variants[1].id, productName: acidTee.name, size: 'M', color: 'Beige', price: 999, qty: 1 }] },
    { user: c5,  status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(50), suffix: 'P1Q2R', items: [{ variantId: zipHoodie.variants[1].id, productName: zipHoodie.name, size: 'M', color: 'Washed Black', price: 1999, qty: 1 }] },
    { user: c6,  status: 'DELIVERED',   pm: 'COD',      ps: 'PAID',    date: daysAgo(45), suffix: 'S3T4U', items: [{ variantId: dadCap.variants[1].id, productName: dadCap.name, size: 'One Size', color: 'Washed Navy', price: 499, qty: 1 }, { variantId: socks.variants[2].id, productName: socks.name, size: 'S/M', color: 'Black', price: 349, qty: 2 }] },
    { user: c7,  status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(40), suffix: 'V5W6X', items: [{ variantId: whiteTee.variants[0].id, productName: whiteTee.name, size: 'S', color: 'White', price: 799, qty: 1 }, { variantId: hoodie.variants[4].id, productName: hoodie.name, size: 'S', color: 'Cream', price: 1799, qty: 1 }], discount: 179, couponCode: 'WELCOME10' },
    { user: c8,  status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(35), suffix: 'Y7Z8A', items: [{ variantId: blackTee.variants[1].id, productName: blackTee.name, size: 'M', color: 'Black', price: 799, qty: 1 }] },
    { user: c9,  status: 'DELIVERED',   pm: 'COD',      ps: 'PAID',    date: daysAgo(30), suffix: 'B9C0D', items: [{ variantId: hoodie.variants[8].id, productName: hoodie.name, size: 'S', color: 'Forest Green', price: 1799, qty: 1 }, { variantId: cap.variants[2].id, productName: cap.name, size: 'One Size', color: 'Olive', price: 599, qty: 1 }] },
    { user: c10, status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(25), suffix: 'E1F2G', items: [{ variantId: tote.variants[1].id, productName: tote.name, size: null, color: 'Black', price: 799, qty: 1 }, { variantId: socks.variants[1].id, productName: socks.name, size: 'L/XL', color: 'White', price: 349, qty: 1 }] },
    { user: c11, status: 'DELIVERED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(22), suffix: 'H3I4J', items: [{ variantId: acidTee.variants[4].id, productName: acidTee.name, size: 'S', color: 'Slate Blue', price: 999, qty: 1 }] },
    // SHIPPED
    { user: c12, status: 'SHIPPED',     pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(7),  suffix: 'K5L6M', items: [{ variantId: whiteTee.variants[2].id, productName: whiteTee.name, size: 'L', color: 'White', price: 799, qty: 1 }, { variantId: blackTee.variants[2].id, productName: blackTee.name, size: 'L', color: 'Black', price: 799, qty: 1 }] },
    { user: c13, status: 'SHIPPED',     pm: 'COD',      ps: 'PENDING', date: daysAgo(5),  suffix: 'N7O8P', items: [{ variantId: hoodie.variants[2].id, productName: hoodie.name, size: 'L', color: 'Charcoal', price: 1799, qty: 1 }] },
    // PROCESSING
    { user: c14, status: 'PROCESSING',  pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(3),  suffix: 'Q9R0S', items: [{ variantId: cap.variants[1].id, productName: cap.name, size: 'One Size', color: 'Cream', price: 599, qty: 1 }, { variantId: dadCap.variants[0].id, productName: dadCap.name, size: 'One Size', color: 'Washed Black', price: 499, qty: 1 }] },
    { user: c0,  status: 'PROCESSING',  pm: 'WALLET',   ps: 'PAID',    date: daysAgo(2),  suffix: 'T1U2V', items: [{ variantId: tote.variants[0].id, productName: tote.name, size: null, color: 'Natural', price: 799, qty: 1 }] },
    // CONFIRMED
    { user: c1,  status: 'CONFIRMED',   pm: 'RAZORPAY', ps: 'PAID',    date: daysAgo(1),  suffix: 'W3X4Y', items: [{ variantId: zipHoodie.variants[0].id, productName: zipHoodie.name, size: 'S', color: 'Washed Black', price: 1999, qty: 1 }] },
    // PENDING_PAYMENT
    { user: c2,  status: 'PENDING_PAYMENT', pm: 'RAZORPAY', ps: 'PENDING', date: daysAgo(0), suffix: 'Z5A6B', items: [{ variantId: whiteTee.variants[3].id, productName: whiteTee.name, size: 'XL', color: 'White', price: 799, qty: 1 }] },
    // CANCELLED
    { user: c3,  status: 'CANCELLED',   pm: 'RAZORPAY', ps: 'REFUNDED', date: daysAgo(20), suffix: 'C7D8E', items: [{ variantId: acidTee.variants[2].id, productName: acidTee.name, size: 'L', color: 'Beige', price: 999, qty: 2 }] },
    { user: c5,  status: 'CANCELLED',   pm: 'COD',      ps: 'PENDING', date: daysAgo(14), suffix: 'F9G0H', items: [{ variantId: socks.variants[3].id, productName: socks.name, size: 'L/XL', color: 'Black', price: 349, qty: 3 }] },
    // RETURN_REQUESTED (for return data)
    { user: c4,  status: 'RETURN_REQUESTED', pm: 'RAZORPAY', ps: 'PAID', date: daysAgo(18), suffix: 'I1J2K', items: [{ variantId: hoodie.variants[5].id, productName: hoodie.name, size: 'M', color: 'Cream', price: 1799, qty: 1 }] },
    { user: c6,  status: 'RETURN_REQUESTED', pm: 'COD',      ps: 'PAID', date: daysAgo(12), suffix: 'L3M4N', items: [{ variantId: blackTee.variants[0].id, productName: blackTee.name, size: 'S', color: 'Black', price: 799, qty: 1 }] },
    { user: c8,  status: 'RETURNED',    pm: 'RAZORPAY', ps: 'REFUNDED', date: daysAgo(28), suffix: 'O5P6Q', items: [{ variantId: zipHoodie.variants[2].id, productName: zipHoodie.name, size: 'L', color: 'Washed Black', price: 1999, qty: 1 }] },
    { user: c10, status: 'RETURNED',    pm: 'RAZORPAY', ps: 'REFUNDED', date: daysAgo(33), suffix: 'R7S8T', items: [{ variantId: cap.variants[0].id, productName: cap.name, size: 'One Size', color: 'Black', price: 599, qty: 1 }] },
  ];

  const createdOrders: any[] = [];
  for (const o of ordersToCreate) {
    try {
      const existing = await prisma.order.findFirst({
        where: { orderNumber: orderNum(o.date, o.suffix) },
      });
      if (existing) {
        createdOrders.push(existing);
        continue;
      }
      const ord = await createOrder({
        user: o.user,
        items: o.items,
        status: o.status,
        paymentMethod: o.pm,
        paymentStatus: o.ps,
        date: o.date,
        suffix: o.suffix,
        discount: (o as any).discount,
        couponCode: (o as any).couponCode,
      });
      createdOrders.push(ord);
      console.log(`  ✅ Order ${ord.orderNumber} [${o.status}]`);
    } catch (e: any) {
      console.warn(`  ⚠️  Skipped order ${o.suffix}: ${e.message}`);
    }
  }

  // ── Return Requests ────────────────────────────────────────────────────────
  console.log('\n↩️  Creating return requests...');

  const returnOrders = createdOrders.filter((o) =>
    ['RETURN_REQUESTED', 'RETURNED'].includes(o.orderStatus)
  );

  const returnData = [
    { reason: 'WRONG_SIZE',       description: 'Ordered M but it fits like a small. The sizing runs very small compared to the chart.', status: 'REQUESTED',  refundMethod: 'ORIGINAL_PAYMENT' },
    { reason: 'NOT_AS_DESCRIBED', description: 'The color looks very different from the website photos. Expected navy but got almost black.', status: 'REQUESTED',  refundMethod: 'WALLET' },
    { reason: 'DEFECTIVE',        description: 'The zipper broke after just 2 uses. The stitching near the collar is also coming undone.', status: 'APPROVED',   refundMethod: 'ORIGINAL_PAYMENT' },
    { reason: 'WRONG_ITEM',       description: 'Received a black cap instead of the olive one I ordered. The invoice also shows wrong item.', status: 'COMPLETED',  refundMethod: 'WALLET' },
    { reason: 'CHANGED_MIND',     description: 'The hoodie quality is fine but it doesn\'t suit me. Would like to return it.', status: 'REJECTED',   refundMethod: 'ORIGINAL_PAYMENT' },
    { reason: 'DEFECTIVE',        description: 'Graphic print is cracking and peeling after first wash. The colors are fading too.', status: 'PICKED_UP',  refundMethod: 'ORIGINAL_PAYMENT' },
    { reason: 'WRONG_SIZE',       description: 'Size chart says L is 42" chest but this is running smaller, closer to a M.', status: 'APPROVED',   refundMethod: 'WALLET' },
    { reason: 'NOT_AS_DESCRIBED', description: 'The material feels completely different from the description. Not 400 GSM at all.', status: 'COMPLETED',  refundMethod: 'ORIGINAL_PAYMENT' },
  ];

  for (let i = 0; i < Math.min(returnOrders.length, returnData.length); i++) {
    const order = returnOrders[i];
    const rd = returnData[i];

    const existing = await prisma.returnRequest.findUnique({ where: { orderId: order.id } });
    if (existing) continue;

    const ret = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        reason: rd.reason as any,
        description: rd.description,
        status: rd.status as any,
        refundMethod: rd.refundMethod as any,
        createdAt: new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    });

    // Create refund for completed/approved ones
    if (rd.status === 'COMPLETED' || rd.status === 'APPROVED') {
      const existingRefund = await prisma.refund.findUnique({ where: { returnRequestId: ret.id } });
      if (!existingRefund) {
        await prisma.refund.create({
          data: {
            returnRequestId: ret.id,
            amount: Number(order.totalAmount),
            method: rd.refundMethod as any,
            status: rd.status === 'COMPLETED' ? 'COMPLETED' : 'INITIATED',
            processedAt: rd.status === 'COMPLETED' ? new Date() : null,
          },
        });
      }
    }
    console.log(`  ✅ Return [${rd.status}] — ${rd.reason}`);
  }

  // ── Reviews ────────────────────────────────────────────────────────────────
  console.log('\n⭐ Creating reviews...');

  const reviewData = [
    { user: c0,  product: whiteTee,  rating: 5, title: 'Best oversized tee I\'ve bought', body: 'The fabric is incredibly soft and the fit is exactly what I was looking for. True to size, washed multiple times and still looks brand new. Will definitely order more colors.' , status: 'APPROVED' },
    { user: c1,  product: hoodie,    rating: 5, title: 'Worth every rupee', body: 'The 400 GSM weight is real — this hoodie is properly heavy and warm. The charcoal color is rich and hasn\'t faded. Brushed interior is super soft. Best hoodie I\'ve owned.' , status: 'APPROVED' },
    { user: c2,  product: blackTee,  rating: 4, title: 'Great quality, slight color variation', body: 'The tee is well-made and the oversized fit is on point. The black is slightly faded looking compared to the photos — more of a washed black. Still really happy with the purchase.' , status: 'APPROVED' },
    { user: c3,  product: cap,       rating: 5, title: 'Clean cap, great build', body: 'The structure is firm, the embroidery is crisp, and the snapback fits perfectly. Have been wearing it daily for 3 weeks. No signs of wear. Highly recommend.' , status: 'APPROVED' },
    { user: c4,  product: acidTee,   rating: 4, title: 'Unique and well-made', body: 'Each piece really is different — mine has this cool uneven fade pattern. The print quality is excellent, no cracking after wash. Sizing runs slightly small so order up.' , status: 'APPROVED' },
    { user: c5,  product: zipHoodie, rating: 3, title: 'Good but zipper feels cheap', body: 'The fabric and fit are great. However the zipper doesn\'t feel premium — it catches a bit when pulling up quickly. For ₹1999 I expected YKK quality throughout. Otherwise happy.' , status: 'APPROVED' },
    { user: c6,  product: dadCap,    rating: 5, title: 'Exactly what I needed', body: 'Low profile, unstructured, minimal branding. Sits perfectly and the washed navy color is gorgeous in person. Better than any cap I\'ve bought from high-street brands.' , status: 'APPROVED' },
    { user: c7,  product: hoodie,    rating: 5, title: 'The cream color is stunning', body: 'I was hesitant about cream but it looks so clean in person. The fleece is thick without being stiff. Fits slightly oversized which is exactly what I wanted. Ordered S and I\'m 5\'7" — perfect.' , status: 'APPROVED' },
    { user: c8,  product: blackTee,  rating: 5, title: 'My daily staple', body: 'Ordered three of these now. The quality consistency is impressive — every piece feels the same. 240 GSM means it drapes well without being see-through. This is genuinely better than anything at 2-3x the price.' , status: 'APPROVED' },
    { user: c9,  product: cap,       rating: 4, title: 'Solid cap with minor fit issue', body: 'The olive color is really nice and unique. The snapback adjustment range is wide enough for most heads. Mine fits a bit loose on the smallest setting but it works. Quality is good.' , status: 'APPROVED' },
    { user: c10, product: tote,      rating: 5, title: 'Heavy duty and looks great', body: 'The canvas is thick and the handles are reinforced well. Fits my 15" MacBook with room to spare. The screen print is sharp. Using it as my everyday bag to work — holds up perfectly.' , status: 'APPROVED' },
    { user: c11, product: acidTee,   rating: 5, title: 'Slate blue is a showstopper', body: 'The colour combination with the abstract print is something else. So many compliments every time I wear it. Washed it twice now and the print is holding up. Size up if you\'re between sizes.' , status: 'APPROVED' },
    // Pending reviews
    { user: c12, product: whiteTee,  rating: 4, title: 'Comfortable and true to size', body: 'Really happy with the quality. The drop shoulder cut is perfect for the oversized aesthetic. Fabric is soft. Only minor complaint is the packaging was a bit basic.', status: 'PENDING' },
    { user: c13, product: hoodie,    rating: 5, title: 'Absolutely love this hoodie', body: 'The weight and warmth are incredible. Wearing it through Pune winters and it\'s doing the job. The fit is slightly boxy which I love. Already recommended to 4 friends.', status: 'PENDING' },
    { user: c14, product: cap,       rating: 3, title: 'Decent cap but brim is stiff', body: 'The quality is okay but the brim is quite rigid and doesn\'t curve well. Expected a more relaxed look. The embroidery is nice though. Maybe it\'ll break in over time.', status: 'PENDING' },
  ];

  for (const rv of reviewData) {
    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: rv.product.id, userId: rv.user.id } },
    });
    if (existing) continue;

    await prisma.review.create({
      data: {
        productId: rv.product.id,
        userId: rv.user.id,
        rating: rv.rating,
        title: rv.title,
        body: rv.body,
        status: rv.status as any,
        createdAt: daysAgo(Math.floor(Math.random() * 40 + 5)),
      },
    });
    console.log(`  ✅ Review [${rv.status}] ${rv.rating}★ — ${rv.product.name}`);
  }

  // ── Flash Sale ─────────────────────────────────────────────────────────────
  console.log('\n⚡ Creating flash sales...');

  const existingFlash = await prisma.flashSale.findFirst({ where: { name: 'Weekend Blowout' } });
  if (!existingFlash) {
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setDate(end.getDate() + 2); end.setHours(23, 59, 59, 0);

    await prisma.flashSale.create({
      data: {
        name: 'Weekend Blowout',
        startTime: start,
        endTime: end,
        isActive: true,
        items: {
          create: [
            { productId: whiteTee.id, discountType: 'PERCENTAGE', discountValue: 20 },
            { productId: blackTee.id, discountType: 'PERCENTAGE', discountValue: 20 },
            { productId: acidTee.id,  discountType: 'FLAT',       discountValue: 150 },
          ],
        },
      },
    });
    console.log('  ✅ Flash sale: Weekend Blowout (live)');
  }

  const existingFlash2 = await prisma.flashSale.findFirst({ where: { name: 'Hoodie Drop' } });
  if (!existingFlash2) {
    await prisma.flashSale.create({
      data: {
        name: 'Hoodie Drop',
        startTime: daysAgo(-3),
        endTime: daysAgo(-1),
        isActive: true,
        items: {
          create: [
            { productId: hoodie.id,    discountType: 'PERCENTAGE', discountValue: 15 },
            { productId: zipHoodie.id, discountType: 'PERCENTAGE', discountValue: 10 },
          ],
        },
      },
    });
    console.log('  ✅ Flash sale: Hoodie Drop (upcoming)');
  }

  const existingFlash3 = await prisma.flashSale.findFirst({ where: { name: 'Accessories Week' } });
  if (!existingFlash3) {
    await prisma.flashSale.create({
      data: {
        name: 'Accessories Week',
        startTime: daysAgo(14),
        endTime: daysAgo(7),
        isActive: true,
        items: {
          create: [
            { productId: cap.id,    discountType: 'FLAT',       discountValue: 100 },
            { productId: dadCap.id, discountType: 'FLAT',       discountValue: 75  },
            { productId: tote.id,   discountType: 'PERCENTAGE', discountValue: 10  },
            { productId: socks.id,  discountType: 'PERCENTAGE', discountValue: 20  },
          ],
        },
      },
    });
    console.log('  ✅ Flash sale: Accessories Week (ended)');
  }

  console.log('\n🎉 Population complete!');
  console.log(`  Customers: ${customers.length}`);
  console.log(`  Orders: ${createdOrders.length}`);
  console.log('  Returns: up to 8 (various statuses)');
  console.log('  Reviews: 15 (12 approved, 3 pending)');
  console.log('  Flash sales: 3 (live, upcoming, ended)');
}

main()
  .catch((e) => {
    console.error('❌ Population failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
