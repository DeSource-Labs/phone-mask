import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];
const JS_FILES = ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'];

const REACT_FILES = ['packages/phone-mask-react/**/*.{ts,tsx,js,jsx}'];
const VUE_SFC_FILES = ['packages/phone-mask-vue/**/*.vue', 'packages/phone-mask-nuxt/**/*.vue', 'demo/**/*.vue'];
const VUE_TS_FILES = [
  'packages/phone-mask-vue/**/*.{ts,mts,cts}',
  'packages/phone-mask-nuxt/**/*.{ts,mts,cts}',
  'demo/**/*.{ts,mts,cts}'
];
const SVELTE_FILES = [
  'packages/phone-mask-svelte/**/*.svelte',
  'packages/phone-mask-svelte/**/*.svelte.ts',
  'packages/phone-mask-svelte/**/*.svelte.js'
];

const BROWSER_FILES = [
  'packages/phone-mask/src/**/*.{ts,mts,cts}',
  'packages/phone-mask-react/**/*.{ts,tsx,js,jsx}',
  'packages/phone-mask-vue/**/*.{ts,js,mts,cts,vue}',
  'packages/phone-mask-svelte/**/*.{ts,js,mts,cts,svelte}',
  'demo/**/*.{ts,tsx,js,jsx,vue}'
];

const NODE_FILES = [
  'eslint.config.js',
  'scripts/**/*.{js,mjs,cjs,ts,mts,cts}',
  'packages/*/scripts/**/*.{js,mjs,cjs,ts,mts,cts}',
  '**/vite.config.{js,mjs,cjs,ts,mts,cts}',
  '**/vitest.config.{js,mjs,cjs,ts,mts,cts}',
  '**/vitest.*.config.{js,mjs,cjs,ts,mts,cts}',
  '**/playwright.config.{js,mjs,cjs,ts,mts,cts}',
  '**/nuxt.config.{js,mjs,cjs,ts,mts,cts}'
];

const vueRecommendedRules = Object.assign({}, ...vue.configs['flat/recommended'].map((config) => config.rules ?? {}));
const svelteRecommendedRules = Object.assign(
  {},
  ...svelte.configs['flat/recommended'].map((config) => config.rules ?? {})
);

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.svelte-kit/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.min.css',
      'pnpm-lock.yaml'
    ]
  },

  js.configs.recommended,

  {
    files: TS_FILES,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.es2021
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },

  {
    files: BROWSER_FILES,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    }
  },

  {
    files: NODE_FILES,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    }
  },

  {
    files: REACT_FILES,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off'
    }
  },

  {
    files: VUE_TS_FILES,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ref: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        nextTick: 'readonly',
        useTemplateRef: 'readonly',
        useId: 'readonly',
        shallowRef: 'readonly',
        reactive: 'readonly',
        navigateTo: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        defineNuxtConfig: 'readonly',
        clearError: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off'
    }
  },

  {
    files: VUE_SFC_FILES,
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ref: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        nextTick: 'readonly',
        useTemplateRef: 'readonly',
        useId: 'readonly',
        shallowRef: 'readonly',
        reactive: 'readonly',
        navigateTo: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        clearError: 'readonly'
      }
    },
    plugins: {
      vue
    },
    rules: {
      ...vueRecommendedRules,
      'vue/comment-directive': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'warn',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/custom-event-name-casing': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Use the TS rule in Vue SFCs and disable core rule to avoid false positives in types
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  },

  {
    files: SVELTE_FILES,
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    plugins: {
      svelte,
      '@typescript-eslint': typescript
    },
    rules: {
      ...svelteRecommendedRules,
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },

  {
    files: JS_FILES,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2021
      }
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn'
    }
  },

  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest
      }
    },
    rules: {
      'no-undef': 'off'
    }
  },

  // Prettier config (must be last)
  prettier
];
