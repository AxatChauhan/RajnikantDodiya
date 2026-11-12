export declare const STORE_MERCHANT: {
  brandName: string;
  storeTitle: string;
  proprietor: string;
  curator: string;
  curatorShort: string;
  sellerLine: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  supportHours: string;
  websiteUrl: string;
  dashboardUrl: string;
  accessExpiryLabel: string;
  accessExpiryFullLabel: string;
};

export declare const STORE_PAYMENT_DEFAULTS: {
  defaultPaymentLink: string;
  defaultPaymentLinkPrice: number;
  defaultEarlyBirdPrice: number;
  defaultStandardPrice: number;
  defaultEarlyBirdCutoff: string;
  defaultAccessExpiry: string;
  validCoupons: Record<string, { amount: number; message: string }>;
};

export declare const DEFAULT_STORE_SETTINGS: {
  productSlug: string;
  productName: string;
  earlyBirdPrice: number;
  standardPrice: number;
  earlyBirdCutoff: string;
  accessExpiryDate: string;
  sellerLine: string;
  supportEmail: string;
  supportPhone: string;
};

export interface StorePolicyLinkItem {
  id: 'contact' | 'terms' | 'privacy' | 'refund' | 'delivery';
  label: string;
  path: string;
  policyPath: string;
}

export declare const STORE_POLICY_LINKS: StorePolicyLinkItem[];

export interface StoreTimelineItem {
  releaseDateIso: string | null;
  date: string;
  title: string;
}

export declare const STORE_TIMELINE_ITEMS: StoreTimelineItem[];

export interface StoreFaqItem {
  q: string;
  a: string;
}

export declare function getStoreFaqs(currentPrice?: number): StoreFaqItem[];

export interface PolicyBullet {
  title: string;
  text: string;
}

export interface PolicySection {
  heading: string;
  intro: string;
  bullets?: PolicyBullet[];
}

export declare const STORE_POLICIES: {
  terms: PolicySection;
  privacy: PolicySection;
  refund: PolicySection;
  delivery: PolicySection;
  contact: PolicySection;
};
