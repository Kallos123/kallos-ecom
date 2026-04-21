import type { PublicStoreSettings } from '@/lib/store-settings';

export const INFO_PAGE_SLUGS = [
  'contact',
  'shipping',
  'returns',
  'faq',
  'about',
  'careers',
  'press',
  'privacy',
  'terms',
] as const;

export type InfoPageSlug = (typeof INFO_PAGE_SLUGS)[number];

type ProseSection = {
  type: 'prose';
  title: string;
  paragraphs: string[];
};

type BulletsSection = {
  type: 'bullets';
  title: string;
  items: string[];
};

type ContactSection = {
  type: 'contact';
  title: string;
  items: Array<{
    label: string;
    value: string;
    href?: string;
  }>;
};

type FaqSection = {
  type: 'faq';
  title: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

type CalloutSection = {
  type: 'callout';
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export type InfoPageSection =
  | ProseSection
  | BulletsSection
  | ContactSection
  | FaqSection
  | CalloutSection;

export interface InfoPageContent {
  eyebrow: string;
  title: string;
  lede: string;
  category: 'support' | 'company' | 'legal';
  sections: InfoPageSection[];
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function isInfoPageSlug(value: string): value is InfoPageSlug {
  return INFO_PAGE_SLUGS.includes(value as InfoPageSlug);
}

export function getInfoPageContent(
  slug: InfoPageSlug,
  settings: PublicStoreSettings
): InfoPageContent {
  const storeName = settings.store_name;
  const supportEmail = settings.support_email;
  const freeShippingAbove = formatPrice(settings.free_shipping_above);
  const returnWindowDays = settings.return_window_days;

  switch (slug) {
    case 'contact':
      return {
        eyebrow: 'Support',
        title: 'Contact KALLOS',
        lede: 'Reach the team that handles orders, delivery questions, returns, and account help.',
        category: 'support',
        sections: [
          {
            type: 'prose',
            title: 'How we help',
            paragraphs: [
              `${storeName} support is designed around order clarity rather than ticket ping-pong. If you share your order number, the team can usually resolve shipping, sizing, and return questions faster.`,
              'For urgent delivery questions, include the order number, recipient name, and a short description of the issue in your first message.',
            ],
          },
          {
            type: 'contact',
            title: 'Support channels',
            items: [
              {
                label: 'Email',
                value: supportEmail,
                href: `mailto:${supportEmail}`,
              },
              {
                label: 'Response window',
                value: 'Within 1 business day',
              },
              {
                label: 'Best for',
                value: 'Orders, delivery updates, returns, and account access',
              },
            ],
          },
          {
            type: 'callout',
            title: 'Before you write in',
            body: 'Most shipping and return questions are already answered in our support pages.',
            href: '/faq',
            linkLabel: 'Read the FAQ',
          },
        ],
      };
    case 'shipping':
      return {
        eyebrow: 'Support',
        title: 'Shipping & Delivery',
        lede: 'Delivery expectations, dispatch timing, and what to expect once your order moves into fulfillment.',
        category: 'support',
        sections: [
          {
            type: 'prose',
            title: 'Dispatch cadence',
            paragraphs: [
              'Orders are reviewed before dispatch so payment, inventory, and delivery details line up cleanly.',
              `Orders above ${freeShippingAbove} qualify for complimentary shipping unless a product or promotion states otherwise.`,
            ],
          },
          {
            type: 'bullets',
            title: 'What to expect',
            items: [
              'A confirmation email is sent once payment clears or cash-on-delivery is accepted.',
              'Tracking details appear in your account as soon as the shipment is handed to the courier.',
              'Delivery windows can shift during launch drops, sale periods, or weather disruptions.',
            ],
          },
          {
            type: 'callout',
            title: 'Need help with a live order?',
            body: 'The fastest way to resolve delivery issues is to share your order number with support.',
            href: '/contact',
            linkLabel: 'Contact support',
          },
        ],
      };
    case 'returns':
      return {
        eyebrow: 'Support',
        title: 'Returns & Refunds',
        lede: 'Return requests are designed to stay transparent from request to refund.',
        category: 'support',
        sections: [
          {
            type: 'prose',
            title: 'Return window',
            paragraphs: [
              `Eligible delivered orders can be submitted for return within ${returnWindowDays} days of delivery.`,
              'Items must be unused, in original condition, and sent back with original tags and packaging wherever applicable.',
            ],
          },
          {
            type: 'bullets',
            title: 'Refund routes',
            items: [
              'Online orders can be refunded to the original payment method or to your wallet when offered at checkout.',
              'Cash-on-delivery returns are refunded to wallet credit.',
              'Refund timing depends on payment rails after approval is completed.',
            ],
          },
          {
            type: 'callout',
            title: 'Start from your account',
            body: 'Return requests are tied to individual orders so the right items and amounts stay attached to the request.',
            href: '/account/orders',
            linkLabel: 'View your orders',
          },
        ],
      };
    case 'faq':
      return {
        eyebrow: 'Support',
        title: 'Frequently Asked Questions',
        lede: 'The fastest answers for orders, payments, delivery, returns, and account recovery.',
        category: 'support',
        sections: [
          {
            type: 'faq',
            title: 'Common questions',
            items: [
              {
                question: 'How do I track my order?',
                answer: 'Tracking details appear in your account once the order has shipped. If you still do not see them, contact support with your order number.',
              },
              {
                question: 'Can I retry a payment if checkout closed?',
                answer: 'Yes. Saved orders with pending or failed online payment can be reopened from your order detail page.',
              },
              {
                question: 'How long do I have to request a return?',
                answer: `You can request a return within ${returnWindowDays} days of delivery for eligible orders.`,
              },
              {
                question: 'Do you offer complimentary shipping?',
                answer: `Yes. Orders above ${freeShippingAbove} qualify for complimentary shipping by default.`,
              },
              {
                question: 'Can I sign in without a password?',
                answer: 'Yes. The OTP sign-in flow sends a one-time code to your email so you can access your account without a password reset.',
              },
            ],
          },
        ],
      };
    case 'about':
      return {
        eyebrow: 'Company',
        title: 'About KALLOS',
        lede: `${storeName} approaches fashion as atmosphere, craft, and permanence rather than trend velocity.`,
        category: 'company',
        sections: [
          {
            type: 'prose',
            title: 'Our point of view',
            paragraphs: [
              `${storeName} builds around a darker editorial mood: structured silhouettes, tactile materials, and detail that reads quietly up close.`,
              'The collections are meant to feel collected rather than consumed, with an emphasis on modern dressing that still carries memory and attitude.',
            ],
          },
          {
            type: 'bullets',
            title: 'What guides the brand',
            items: [
              'Materials and trims are chosen for texture and longevity, not noise.',
              'The product language favors restraint over excess.',
              'The customer experience should feel composed from browse to delivery.',
            ],
          },
        ],
      };
    case 'careers':
      return {
        eyebrow: 'Company',
        title: 'Careers',
        lede: 'We are interested in people who care about craft, systems, and how luxury experiences actually hold together in production.',
        category: 'company',
        sections: [
          {
            type: 'prose',
            title: 'Who fits here',
            paragraphs: [
              'KALLOS is best suited to people who can work with taste and rigor at the same time.',
              'Whether the role is creative or operational, the expectation is the same: sharpen the experience without adding noise.',
            ],
          },
          {
            type: 'contact',
            title: 'How to apply',
            items: [
              {
                label: 'Applications',
                value: supportEmail,
                href: `mailto:${supportEmail}?subject=KALLOS%20Careers`,
              },
              {
                label: 'Include',
                value: 'Your role of interest, portfolio or resume, and why KALLOS is the right fit',
              },
            ],
          },
        ],
      };
    case 'press':
      return {
        eyebrow: 'Company',
        title: 'Press',
        lede: 'Press requests, brand notes, and editorial contact information.',
        category: 'company',
        sections: [
          {
            type: 'prose',
            title: 'Brand boilerplate',
            paragraphs: [
              `${storeName} is a luxury fashion label with a dark editorial lens, focused on timeless wardrobe pieces, tactile detail, and composed customer experience.`,
            ],
          },
          {
            type: 'contact',
            title: 'Press contact',
            items: [
              {
                label: 'Email',
                value: supportEmail,
                href: `mailto:${supportEmail}?subject=KALLOS%20Press`,
              },
              {
                label: 'Request types',
                value: 'Interviews, brand information, image requests, and editorial inquiries',
              },
            ],
          },
        ],
      };
    case 'privacy':
      return {
        eyebrow: 'Legal',
        title: 'Privacy Policy',
        lede: 'How we collect, use, and protect personal information across the KALLOS storefront and account experience.',
        category: 'legal',
        sections: [
          {
            type: 'bullets',
            title: 'Information we collect',
            items: [
              'Account details such as your name, email, and phone number.',
              'Order, address, and payment workflow information needed to fulfill purchases.',
              'Operational analytics used to improve site performance and customer support.',
            ],
          },
          {
            type: 'prose',
            title: 'How it is used',
            paragraphs: [
              'We use your information to process orders, support returns, authenticate your account, and communicate updates related to purchases or support requests.',
              'We do not sell your personal information. Data is handled only where it supports operations, security, and service quality.',
            ],
          },
          {
            type: 'callout',
            title: 'Questions about privacy?',
            body: 'If you need clarification on data handling, contact support directly.',
            href: '/contact',
            linkLabel: 'Contact support',
          },
        ],
      };
    case 'terms':
      return {
        eyebrow: 'Legal',
        title: 'Terms of Service',
        lede: 'The operating terms that govern browsing, account access, ordering, and use of the KALLOS storefront.',
        category: 'legal',
        sections: [
          {
            type: 'bullets',
            title: 'Using the storefront',
            items: [
              'Product availability, pricing, and delivery timing may change without prior notice.',
              'Orders may be cancelled or adjusted when fraud, inventory conflict, or delivery impossibility is detected.',
              'Accounts must be used with accurate personal and delivery information.',
            ],
          },
          {
            type: 'prose',
            title: 'Orders and payments',
            paragraphs: [
              'Submitting an order does not guarantee acceptance until payment or order confirmation steps are completed successfully.',
              'Refunds, cancellations, and return outcomes are subject to the published support policy and the condition of goods received back.',
            ],
          },
          {
            type: 'callout',
            title: 'Need a policy walkthrough?',
            body: 'Support can help clarify how a term applies to a live order or account issue.',
            href: '/contact',
            linkLabel: 'Contact support',
          },
        ],
      };
  }
}