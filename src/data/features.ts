import { FeatureMetric } from '../types';

export const FEATURE_METRICS: FeatureMetric[] = [
  {
    id: 'tools-count',
    title: '27+',
    subtitle: 'Powerful Tools',
    iconName: 'Sparkles',
  },
  {
    id: 'free-use',
    title: '100%',
    subtitle: 'Free to Use',
    iconName: 'CheckCircle2',
  },
  {
    id: 'no-signup',
    title: 'No Sign Up',
    subtitle: 'No Registration',
    iconName: 'UserX',
  },
  {
    id: 'privacy-first',
    title: 'Your Files',
    subtitle: 'Stay Private',
    iconName: 'ShieldCheck',
  },
];

export const TRUST_POINTS = [
  {
    title: 'Client-Side First & Auto-Purge',
    description: 'Documents are processed securely with automatic 60-minute deletion. Your private files are never stored or used to train any model.',
    iconName: 'Shield',
  },
  {
    title: 'Zero Registration Required',
    description: 'No email required, no hidden credit cards, and no paywalls. Start immediately with one click.',
    iconName: 'Zap',
  },
  {
    title: 'Universal Platform Support',
    description: 'Works effortlessly on macOS, Windows, Linux, iOS, Android, and Chromebooks straight in your browser.',
    iconName: 'Laptop',
  },
];

export const SITE_CONFIG = {
  name: 'PDFTOOL',
  tagline: 'All-in-One Free PDF & Document Tools',
  description: 'Process, convert, compress, and edit PDFs fast in your browser. 100% free with zero sign-up and total document privacy.',
  retentionHours: 1,
  totalToolsCount: '27+',
};
