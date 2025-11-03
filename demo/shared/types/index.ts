export type SocialMediaKey = 'email' | 'telegram' | 'x' | 'linkedin' | 'github';

export type SocialMediaItem = {
  type: SocialMediaKey;
  href: string;
};

export type SocialMedia = Record<SocialMediaKey, string>;

export type Library = 'vue' | 'nuxt' | 'react' | 'typescript';

export type LibItem = {
  id: Library;
  name: string;
};
