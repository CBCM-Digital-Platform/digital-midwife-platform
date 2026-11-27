export interface LandingPageTextEntry {
  title: string;
  description: string;
}

export interface LandingPageHero {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  image_url: string;
  image_alt: string;
  connected_badge: string;
  verification_title: string;
  verification_label: string;
  verification_description: string;
  proof_points: string[];
}

export interface LandingPageFeatureCard {
  id: string;
  step: string;
  status: string;
  category: string;
  title: string;
  description: string;
  image_url: string;
  image_alt: string;
  features: string[];
}

export interface LandingPageRoleCard {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  image_url: string;
  image_alt: string;
  caption: string;
  subcaption: string;
  highlights: LandingPageTextEntry[];
  feature_cards: LandingPageTextEntry[];
}

export interface LandingPageStat {
  id: string;
  value: number;
  suffix: string;
  label: string;
  description: string;
}

export interface LandingPageContent {
  hero: LandingPageHero;
  how_it_works: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    cards: LandingPageFeatureCard[];
  };
  roles: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    cards: LandingPageRoleCard[];
  };
  impact: {
    eyebrow: string;
    title: string;
    description: string;
    stats: LandingPageStat[];
    cta: {
      eyebrow: string;
      title: string;
      description: string;
      button_label: string;
    };
  };
}
