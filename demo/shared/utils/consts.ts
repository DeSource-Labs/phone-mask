import type { SocialMediaItem, SocialMediaKey, LibItem, Library } from '../types';

export const socialMedia = {
  email: 'mailto:hello@desource-labs.org',
  github: 'https://github.com/DeSource-Labs',
  linkedin: 'https://www.linkedin.com/company/desource-labs',
  telegram: 'https://t.me/desource_labs'
};

export const socialMediaArray: SocialMediaItem[] = Object.entries(socialMedia).map(([type, href]) => ({
  type: type as SocialMediaKey,
  href
}));

export const icons: Record<SocialMediaKey, { viewBox: string; path: string }> = {
  email: {
    viewBox: '0 0 24 24',
    path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7-10-7'
  },
  telegram: {
    viewBox: '0 0 30 30',
    path: 'M5.936 13.465q5.331-2.338 11.238-4.84 4.06-1.66 5.352-2.133Q23.84 6 24.352 6q.533 0 .758.226.184.185.267.512.02.123.02.533v.226q-.204 2.174-.943 6.624-.717 4.45-1.271 7.198-.164 1.026-.513 1.497-.349.451-.78.493-.122.02-.225.02-.471 0-.964-.226-.471-.246-1.271-.82l-.616-.43q-.82-.533-2.091-1.395a104 104 0 0 0-2.215-1.477q-.964-.656-.964-1.23 0-.308.246-.615.246-.328.759-.82l.39-.37a529 529 0 0 0 3.076-2.912q2.152-2.03 2.235-2.256v-.143a.3.3 0 0 0-.102-.226.22.22 0 0 0-.165-.061.7.7 0 0 0-.225.04q-.144.042-8.1 5.353-1.19.759-1.97.759-.861 0-3.096-.718a4 4 0 0 0-.533-.164q-.882-.287-1.23-.492-.33-.205-.329-.533v-.082q.062-.246.43-.513.37-.287 1.006-.533'
  },
  x: {
    viewBox: '0 0 24 24',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
  },
  linkedin: {
    viewBox: '0 0 24 24',
    path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
  },
  github: {
    viewBox: '0 0 30 30',
    path: 'M 25.5 15 q 0 2.277 -0.923 4.286 a 10.7 10.7 0 0 1 -2.543 3.486 a 10.8 10.8 0 0 1 -3.691 2.215 a 1 1 0 0 1 -0.185 0.02 a 0.55 0.55 0 0 1 -0.369 -0.143 q -0.144 -0.143 -0.144 -0.43 v -2.872 q 0 -0.696 -0.205 -1.189 q -0.204 -0.492 -0.512 -0.738 q 2.133 -0.247 3.445 -1.354 q 1.333 -1.107 1.333 -3.794 q 0 -1.66 -1.087 -2.85 q 0.205 -0.472 0.205 -1.149 a 4.3 4.3 0 0 0 -0.328 -1.62 a 1 1 0 0 0 -0.226 -0.02 q -0.369 0 -1.045 0.225 q -0.657 0.226 -1.641 0.882 q -0.944 -0.308 -2.625 -0.308 q -1.251 0 -2.645 0.308 q -0.882 -0.636 -1.539 -0.882 q -0.635 -0.246 -1.025 -0.246 a 0.6 0.6 0 0 0 -0.267 0.041 a 3.8 3.8 0 0 0 -0.328 1.538 q 0 0.739 0.246 1.23 q -1.087 1.231 -1.087 2.851 q 0 2.687 1.292 3.794 q 1.312 1.108 3.466 1.395 q -0.573 0.471 -0.635 1.415 q -0.575 0.267 -1.19 0.266 q -1.19 0 -1.846 -1.168 a 2.7 2.7 0 0 0 -0.676 -0.739 a 1.6 1.6 0 0 0 -0.923 -0.328 q -0.472 0 -0.472 0.205 q 0 0.145 0.39 0.43 q 0.307 0.165 0.615 0.554 q 0.328 0.39 0.554 0.985 q 0.245 0.636 0.861 1.087 q 0.636 0.45 1.62 0.451 q 0.492 0 1.067 -0.123 v 1.805 q 0 0.225 -0.164 0.369 a 0.63 0.63 0 0 1 -0.431 0.143 h -0.123 a 11.3 11.3 0 0 1 -3.733 -2.235 a 10.8 10.8 0 0 1 -2.563 -3.507 A 10.15 10.15 0 0 1 4.5 15 q 0 -2.87 1.415 -5.27 a 10.4 10.4 0 0 1 3.814 -3.815 A 10.26 10.26 0 0 1 15 4.5 q 2.85 0 5.25 1.415 a 10.37 10.37 0 0 1 3.835 3.814 Q 25.5 12.13 25.5 15'
  }
};

export const LibItems: LibItem[] = [
  { id: 'vue', name: 'Vue' },
  { id: 'nuxt', name: 'Nuxt' },
  { id: 'react', name: 'React' },
  { id: 'typescript', name: 'TS/JS' }
];

export const NpmLinks: Record<Library, string> = {
  vue: 'https://www.npmjs.com/package/@desource/phone-mask-vue',
  nuxt: 'https://www.npmjs.com/package/@desource/phone-mask-nuxt',
  react: 'https://www.npmjs.com/package/@desource/phone-mask-react',
  typescript: 'https://www.npmjs.com/package/@desource/phone-mask'
};

export const NpmCommands: Record<Library, string> = {
  vue: 'npm install @desource/phone-mask-vue',
  nuxt: 'npm install @desource/phone-mask-nuxt',
  react: 'npm install @desource/phone-mask-react',
  typescript: 'npm install @desource/phone-mask'
};

export const DocLinks: Record<Library, string> = {
  vue: 'https://github.com/DeSource-Labs/phone-mask/tree/main/packages/phone-mask-vue',
  nuxt: 'https://github.com/DeSource-Labs/phone-mask/tree/main/packages/phone-mask-nuxt',
  react: 'https://github.com/DeSource-Labs/phone-mask/tree/main/packages/phone-mask-react',
  typescript: 'https://github.com/DeSource-Labs/phone-mask/tree/main/packages/phone-mask'
};

export const Links = {
  coreRepo: 'https://github.com/DeSource-Labs/phone-mask',
  packages: 'https://github.com/DeSource-Labs/phone-mask/tree/main/packages',
  org: 'https://desource-labs.org',
  googleLib: 'https://github.com/google/libphonenumber',
  contributing: 'https://github.com/DeSource-Labs/phone-mask/blob/main/CONTRIBUTING.md'
};
