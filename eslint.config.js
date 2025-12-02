import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.min.css',
      'pnpm-lock.yaml'
    ]
  },

  // Base JavaScript config
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
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

  // Vue composables and Nuxt files (TypeScript with Vue APIs)
  {
    files: ['**/composables/**/*.ts', '**/utils/**/*.ts', 'demo/app/**/*.ts', 'demo/**/*.config.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // Vue 3 auto-imports
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
        // Nuxt auto-imports
        navigateTo: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        defineNuxtConfig: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off'
    }
  },

  // Vue files
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
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
        // Vue 3 auto-imports
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
        // Nuxt auto-imports
        navigateTo: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        clearError: 'readonly'
      }
    },
    rules: {
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

  // JavaScript/CommonJS files
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn'
    }
  },

  // Prettier config (must be last)
  prettier
];
