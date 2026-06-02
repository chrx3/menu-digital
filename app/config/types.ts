export interface BusinessConfig {
  id?: string;
  slug: string;
  name: string;
  description: string;
  year: number;
  locale: string;
  currency: string;
  lang: string;
  whatsappNumber: string;
  whatsappGreeting: string;
  phone: string;
  email: string;
  address: string;
  logoDesktop: string;
  logoMobile: string[];
  logoRotationInterval: number;
  favicon: string;
  appleIcon: string;
  seoTitle: string;
  seoDescription: string;
  seoThemeColor: string;
  seoOgImage: string;
  orderChannels: {
    whatsapp: boolean;
    phone: boolean;
    telegram: boolean;
  };
  promotionTypes: string[];
  isActive: boolean;
}

export interface BusinessTheme {
  id?: string;
  businessId: string;
  colorPrimary: string;
  colorPrimaryLight: string;
  colorPrimaryIntense: string;
  colorPrimaryText: string;
  colorBackground: string;
  colorBackgroundDark: string;
  colorBackgroundDeep: string;
  colorTextDark: string;
  colorTextMedium: string;
  colorTextLight: string;
  colorWhite: string;
  fontHeading: string;
  fontHeadingWeights: number[];
  fontBody: string;
  fontBodyWeights: number[];
  headerHeightDesktop: string;
  headerHeightMobile: string;
  particlesDesktop: number;
  particlesMobile: number;
  cartFlyDuration: number;
  cartFlyBallSize: number;
  reducedMotion: boolean;
}

export interface TranslationEntry {
  id?: string;
  businessId: string;
  locale: string;
  key: string;
  value: string;
}

export interface ParticleIcon {
  id: string;
  businessId: string;
  name: string;
  label: string;
  orden: number;
  isActive: boolean;
}
