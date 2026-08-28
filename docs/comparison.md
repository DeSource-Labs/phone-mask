# 📊 Bundle size and market comparison

Phone Mask pairs worldwide coverage with best-in-class bundle size. In this dated audit of public npm packages, it is the smallest measured option in framework-agnostic JavaScript, Vue, Svelte, and Nuxt, and sits in the smallest displayed React tier.

That claim is deliberately narrow and testable. First-party sizes come from the current source; published alternatives run through the same local pipeline. The tables also identify data sources and optional validation overhead so similar raw sizes are not mistaken for identical coverage.

## 🧭 What is included

The ranked tables cover packages that provide international formatting, masking, validation, or phone-input behavior and can be built from their published npm entry. Active official framework adapters and the only measurable Nuxt-specific alternative are included even when adoption is still small.

Generic input-mask libraries, API clients, React Native packages, and near-identical abandoned forks are outside this comparison. Feature sets still vary; this report measures shipped code and phone-data overhead, not subjective UI quality.

<!-- package-sizes:start -->

## 📦 Current package sizes

These values come from packed workspace packages installed into clean consumer projects, then bundled and minified for production. Framework peer dependencies are external. The Nuxt total includes its Vue runtime component.

| Package                                                                                    | Minified |    Gzip |
| ------------------------------------------------------------------------------------------ | -------: | ------: |
| [`@desource/phone-mask`](https://www.npmjs.com/package/@desource/phone-mask)               |   6.1 KB |  2.8 KB |
| [`@desource/phone-mask-react`](https://www.npmjs.com/package/@desource/phone-mask-react)   |  24.3 KB |  9.4 KB |
| [`@desource/phone-mask-vue`](https://www.npmjs.com/package/@desource/phone-mask-vue)       |  30.3 KB | 10.8 KB |
| [`@desource/phone-mask-svelte`](https://www.npmjs.com/package/@desource/phone-mask-svelte) |  31.6 KB | 11.3 KB |
| [`@desource/phone-mask-nuxt`](https://www.npmjs.com/package/@desource/phone-mask-nuxt)     |  31.0 KB | 11.3 KB |

The repository generates these values and the README badges with the [bundle-size script](../scripts/update-bundle-size-badges.mts) in a [dedicated GitHub workflow](../.github/workflows/bundle-size.yml).
<!-- package-sizes:end -->

<!-- benchmarks:start -->

## 🌐 Published ecosystem comparison

Published packages are installed into isolated projects and bundled with the same production settings. The phone-data column makes limited masks, included metadata, peer engines, and optional validators visible beside the size result.
Snapshot: **2026-08-27** ([benchmark script](https://github.com/DeSource-Labs/phone-mask/blob/main/scripts/update-readme-benchmarks.mts), [npm Registry API](https://registry.npmjs.org/%40desource%2Fphone-mask)).

- Use `Total gzip` for the closest like-for-like comparison.
- `Gzip` is the locally measured package bundle.
- `Data overhead` adds required phone-data code excluded from that bundle.
- Values are displayed to the nearest 0.1 KB; packages in the same displayed size tier are reported together.

### Framework-agnostic / vanilla

| Package                                                                                                                                    | Last published | Phone data          | Data overhead |     Gzip | Total gzip |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------------: | ------------------- | ------------: | -------: | ---------: |
| [**@desource/phone-mask**](https://www.npmjs.com/package/@desource/phone-mask) · [Repo](https://github.com/DeSource-Labs/phone-mask)       |     2026-08-24 | Included in package |        0.0 KB |   2.8 KB |     2.8 KB |
| [phone](https://www.npmjs.com/package/phone) · [Repo](https://github.com/aftership/phone)                                                  |     2026-08-12 | Included in package |        0.0 KB |   7.9 KB |     7.9 KB |
| [intl-tel-input](https://www.npmjs.com/package/intl-tel-input) · [Repo](https://github.com/jackocnr/intl-tel-input)                        |     2026-08-14 | Included in package |        0.0 KB |  16.0 KB |    16.0 KB |
| [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) · [Repo](https://gitlab.com/catamphetamine/libphonenumber-js)         |     2026-08-27 | Included in package |        0.0 KB |  43.9 KB |    43.9 KB |
| [awesome-phonenumber](https://www.npmjs.com/package/awesome-phonenumber) · [Repo](https://github.com/grantila/awesome-phonenumber)         |     2026-02-18 | Included in package |        0.0 KB |  74.7 KB |    74.7 KB |
| [google-libphonenumber](https://www.npmjs.com/package/google-libphonenumber) · [Repo](https://github.com/ruimarinho/google-libphonenumber) |     2026-07-30 | Included in package |        0.0 KB | 115.3 KB |   115.3 KB |

Smallest measured bundle: **@desource/phone-mask** (2.8 KB).

Related package reviewed: [`@maskito/phone`](https://www.npmjs.com/package/@maskito/phone) is an optional Maskito plugin rather than a standalone package. It requires `@maskito/core`, `@maskito/kit`, and `libphonenumber-js` peers, so a package-only result would omit required runtime code and is not ranked here.

### React

| Package                                                                                                                                                 | Last published | Phone data                                                                       | Data overhead |    Gzip | Total gzip |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------: | -------------------------------------------------------------------------------- | ------------: | ------: | ---------: |
| [react-international-phone](https://www.npmjs.com/package/react-international-phone) · [Repo](https://github.com/ybrusentsov/react-international-phone) |     2026-02-21 | Built-in masks; external validator optional                                      |        0.0 KB |  9.4 KB |     9.4 KB |
| [**@desource/phone-mask-react**](https://www.npmjs.com/package/@desource/phone-mask-react) · [Repo](https://github.com/DeSource-Labs/phone-mask)        |     2026-08-24 | [@desource/phone-mask](https://www.npmjs.com/package/@desource/phone-mask) (dep) |        0.0 KB |  9.4 KB |     9.4 KB |
| [@intl-tel-input/react](https://www.npmjs.com/package/@intl-tel-input/react) · [Repo](https://github.com/jackocnr/intl-tel-input)                       |     2026-08-14 | [intl-tel-input](https://www.npmjs.com/package/intl-tel-input) (dep)             |        0.0 KB | 16.8 KB |    16.8 KB |
| [react-phone-input-2](https://www.npmjs.com/package/react-phone-input-2) · [Repo](https://github.com/bl00mber/react-phone-input-2)                      |     2022-07-01 | Included in package                                                              |        0.0 KB | 17.1 KB |    17.1 KB |
| [react-intl-tel-input](https://www.npmjs.com/package/react-intl-tel-input) · [Repo](https://github.com/patw0929/react-intl-tel-input)                   |     2021-11-17 | Included in package                                                              |        0.0 KB | 17.2 KB |    17.2 KB |
| [mui-tel-input](https://www.npmjs.com/package/mui-tel-input) · [Repo](https://github.com/viclafouch/mui-tel-input)                                      |     2026-04-24 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) (dep)       |        0.0 KB | 46.7 KB |    46.7 KB |
| [react-phone-number-input](https://www.npmjs.com/package/react-phone-number-input) · [Repo](https://gitlab.com/catamphetamine/react-phone-number-input) |     2026-08-20 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) (dep)       |        0.0 KB | 47.4 KB |    47.4 KB |

Smallest measured bundles at displayed precision: **react-international-phone** and **@desource/phone-mask-react** (9.4 KB).

React ecosystem note: `react-international-phone` includes built-in formatting masks, but its current [validation guide](https://github.com/ybrusentsov/react-international-phone/blob/master/packages/docs/docs/02-Usage/03-PhoneValidation/index.md) says validation is not provided and recommends adding [`google-libphonenumber`](https://www.npmjs.com/package/google-libphonenumber). Its raw gzip result does not include that optional validator.

### Vue

| Package                                                                                                                                       | Last published | Phone data                                                                                              | Data overhead |     Gzip | Total gzip |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------: | ------------------------------------------------------------------------------------------------------- | ------------: | -------: | ---------: |
| [**@desource/phone-mask-vue**](https://www.npmjs.com/package/@desource/phone-mask-vue) · [Repo](https://github.com/DeSource-Labs/phone-mask)  |     2026-08-24 | [@desource/phone-mask](https://www.npmjs.com/package/@desource/phone-mask) (dep)                        |        0.0 KB |  10.8 KB |    10.8 KB |
| [@intl-tel-input/vue](https://www.npmjs.com/package/@intl-tel-input/vue) · [Repo](https://github.com/jackocnr/intl-tel-input)                 |     2026-08-14 | [intl-tel-input](https://www.npmjs.com/package/intl-tel-input) (dep)                                    |        0.0 KB |  17.1 KB |    17.1 KB |
| [base-vue-phone-input](https://www.npmjs.com/package/base-vue-phone-input) · [Repo](https://github.com/SidVerson/base-vue-phone-input)        |     2024-08-23 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) (dep)                              |        0.0 KB |  35.8 KB |    35.8 KB |
| [vue-tel-input](https://www.npmjs.com/package/vue-tel-input) · [Repo](https://github.com/iamstevendao/vue-tel-input)                          |     2026-03-19 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) (peer: parsePhoneNumberFromString) |       28.6 KB |  10.3 KB |    38.9 KB |
| [vue-phone-number-input](https://www.npmjs.com/package/vue-phone-number-input) · [Repo](https://github.com/LouisMazel/vue-phone-number-input) |     2022-09-20 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) (dep)                              |        0.0 KB |  96.3 KB |    96.3 KB |
| [v-phone-input](https://www.npmjs.com/package/v-phone-input) · [Repo](https://github.com/paul-thebaud/v-phone-input)                          |     2026-03-11 | [awesome-phonenumber](https://www.npmjs.com/package/awesome-phonenumber) (dep)                          |        0.0 KB | 150.5 KB |   150.5 KB |

Smallest measured bundle: **@desource/phone-mask-vue** (10.8 KB).

### Svelte

| Package                                                                                                                                            | Last published | Phone data                                                                       | Data overhead |    Gzip | Total gzip |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------: | -------------------------------------------------------------------------------- | ------------: | ------: | ---------: |
| [**@desource/phone-mask-svelte**](https://www.npmjs.com/package/@desource/phone-mask-svelte) · [Repo](https://github.com/DeSource-Labs/phone-mask) |     2026-08-24 | [@desource/phone-mask](https://www.npmjs.com/package/@desource/phone-mask) (dep) |        0.0 KB | 11.3 KB |    11.3 KB |
| [@intl-tel-input/svelte](https://www.npmjs.com/package/@intl-tel-input/svelte) · [Repo](https://github.com/jackocnr/intl-tel-input)                |     2026-08-14 | [intl-tel-input](https://www.npmjs.com/package/intl-tel-input) (dep)             |        0.0 KB | 29.1 KB |    29.1 KB |
| [svelte-tel-input](https://www.npmjs.com/package/svelte-tel-input) · [Repo](https://github.com/gyurielf/svelte-tel-input)                          |     2026-07-12 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) (dep)       |        0.0 KB | 74.4 KB |    74.4 KB |

Smallest measured bundle: **@desource/phone-mask-svelte** (11.3 KB).

### Nuxt

| Package                                                                                                                                        | Last published | Phone data                                                                                            | Data overhead |    Gzip | Total gzip |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------: | ----------------------------------------------------------------------------------------------------- | ------------: | ------: | ---------: |
| [**@desource/phone-mask-nuxt**](https://www.npmjs.com/package/@desource/phone-mask-nuxt) · [Repo](https://github.com/DeSource-Labs/phone-mask) |     2026-08-24 | [@desource/phone-mask-vue](https://www.npmjs.com/package/@desource/phone-mask-vue) (runtime: install) |       10.5 KB |  0.8 KB |    11.3 KB |
| [nuxt-phone-number](https://www.npmjs.com/package/nuxt-phone-number) · [Repo](https://github.com/thecodemaker12/nuxt-phone-number)             |     2026-04-04 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) (dep)                            |        0.0 KB | 81.1 KB |    81.1 KB |

Smallest measured bundle: **@desource/phone-mask-nuxt** (11.3 KB).

Nuxt ecosystem note: this category is still small. The table includes the dedicated Nuxt modules that are published and measurable; Nuxt apps can also use the Vue packages above directly.

<!-- benchmarks:end -->

## 🔬 Method

- Each package is installed into an isolated temporary project.
- The published root entry and any stylesheet it imports are bundled and minified; optional styles, assets, and alternate entry points are excluded.
- Gzip values use Node.js compression and sum the entry's emitted JavaScript and CSS without bundler runtime chunks.
- Framework peer dependencies stay external.
- Required phone-data packages are included in the comparable total.
- Results are reproducible from the linked scripts and should be read as a dated snapshot, not a permanent claim.
