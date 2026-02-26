import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Library imports
// Import styles
import '../src/style.scss';
// Import components and hooks
import { PhoneInput, usePhoneMask } from '../src';
// Import types
import type {
  PCountryKey as CountryKey,
  PMaskFull as MaskFull,
  PhoneInputSize as Size,
  PhoneInputTheme as Theme,
  PhoneNumber
} from '../src';

function DemoHook() {
  const [value, setValue] = useState('');
  const [countryOption, setCountryOption] = useState('GB');

  const onPhoneChange = useCallback((p: PhoneNumber) => {
    console.log('Hook change:', p);
  }, []);

  const onCountryChange = useCallback((country: MaskFull) => {
    setCountryOption(country.code);
  }, []);

  const { ref, digits, full, fullFormatted, isComplete, setCountry, clear } = usePhoneMask({
    value,
    country: countryOption,
    detect: false,
    onChange: setValue,
    onPhoneChange,
    onCountryChange
  });

  return (
    <section style={sectionStyle} data-testid="hook">
      <h2 style={headingStyle}>usePhoneMask Hook</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input ref={ref} type="tel" placeholder="Phone number" style={inputStyle} data-testid="phone-input" />
        <button onClick={() => setCountry('US')} style={btnStyle} data-testid="control-country-us">
          US
        </button>
        <button onClick={() => setCountry('DE')} style={btnStyle} data-testid="control-country-de">
          DE
        </button>
        <button onClick={() => clear()} style={btnStyle} data-testid="control-clear">
          Clear
        </button>
      </div>
      <div style={metaStyle}>
        <div data-testid="meta-digits">
          <strong>Digits:</strong> {digits || '—'}
        </div>
        <div data-testid="meta-full">
          <strong>Full:</strong> {full || '—'}
        </div>
        <div data-testid="meta-formatted">
          <strong>Formatted:</strong> {fullFormatted || '—'}
        </div>
        <div data-testid="meta-valid">
          <strong>Valid:</strong> {isComplete ? 'Yes' : 'No'}
        </div>
      </div>
    </section>
  );
}

function Playground() {
  const [digits, setDigits] = useState('');
  const [country, setCountry] = useState<CountryKey | undefined>(undefined);
  const [locale, setLocale] = useState<string | undefined>(undefined);
  const [detect, setDetect] = useState(true);
  const [showCopy, setShowCopy] = useState(true);
  const [showClear, setShowClear] = useState(true);
  const [size, setSize] = useState<Size>('normal');
  const [theme, setTheme] = useState<Theme>('dark');
  const [withValidity, setWithValidity] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState('');
  const [noResultsText, setNoResultsText] = useState('');
  const [clearButtonLabel, setClearButtonLabel] = useState('');
  const [dropdownClass, setDropdownClass] = useState('');
  const [disableDefaultStyles, setDisableDefaultStyles] = useState(false);

  const onDetectChange = useCallback((checked: boolean) => {
    setDetect(checked);
    if (checked) {
      setCountry(undefined);
    }
  }, []);

  const onCountryChange = useCallback((c: MaskFull) => {
    console.log('Country:', c.name);
  }, []);

  const onValidationChange = useCallback((v: boolean) => {
    console.log('Valid:', v);
  }, []);

  return (
    <section style={playgroundStyle} data-testid="playground">
      <h2 style={headingStyle}>Component Playground</h2>

      <div style={playgroundGridStyle}>
        {/* Component Preview */}
        <div style={previewPanelStyle}>
          <h3 style={subheadingStyle}>Preview</h3>
          <div style={previewAreaStyle}>
            <PhoneInput
              value={digits}
              onChange={setDigits}
              onCountryChange={onCountryChange}
              onValidationChange={onValidationChange}
              country={country}
              locale={locale}
              detect={detect}
              showCopy={showCopy}
              showClear={showClear}
              size={size}
              theme={theme}
              withValidity={withValidity}
              disabled={disabled}
              readonly={readonly}
              searchPlaceholder={searchPlaceholder || undefined}
              noResultsText={noResultsText || undefined}
              clearButtonLabel={clearButtonLabel || undefined}
              dropdownClass={dropdownClass || undefined}
              disableDefaultStyles={disableDefaultStyles}
              data-testid="phone-input"
            />
            <div style={metaStyle}>
              <div>
                <strong data-testid="phone-input-value">Value:</strong> {digits || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div style={controlsPanelStyle} data-testid="phone-input-props">
          <h3 style={subheadingStyle}>Props</h3>

          <div style={controlGroupStyle}>
            <label style={labelStyle}>
              <span>Country:</span>
              <select
                value={country || ''}
                onChange={(e) => setCountry((e.target.value as CountryKey) || undefined)}
                style={selectStyle}
                data-testid="props-country"
              >
                <option value="" style={optionStyle}>
                  Not Selected
                </option>
                <option value="US" style={optionStyle}>
                  United States
                </option>
                <option value="GB" style={optionStyle}>
                  United Kingdom
                </option>
                <option value="DE" style={optionStyle}>
                  Germany
                </option>
                <option value="FR" style={optionStyle}>
                  France
                </option>
                <option value="UA" style={optionStyle}>
                  Ukraine
                </option>
                <option value="CA" style={optionStyle}>
                  Canada
                </option>
                <option value="AU" style={optionStyle}>
                  Australia
                </option>
                <option value="JP" style={optionStyle}>
                  Japan
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              <span>Locale:</span>
              <select
                value={locale || ''}
                onChange={(e) => setLocale(e.target.value || undefined)}
                style={selectStyle}
                data-testid="props-locale"
              >
                <option value="" style={optionStyle}>
                  Not Selected
                </option>
                <option value="en-US" style={optionStyle}>
                  English (US)
                </option>
                <option value="de-DE" style={optionStyle}>
                  German
                </option>
                <option value="ru-RU" style={optionStyle}>
                  Russian
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              <span>Size:</span>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as Size)}
                style={selectStyle}
                data-testid="props-size"
              >
                <option value="compact" style={optionStyle}>
                  Compact
                </option>
                <option value="normal" style={optionStyle}>
                  Normal
                </option>
                <option value="large" style={optionStyle}>
                  Large
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              <span>Theme:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                style={selectStyle}
                data-testid="props-theme"
              >
                <option value="light" style={optionStyle}>
                  Light
                </option>
                <option value="dark" style={optionStyle}>
                  Dark
                </option>
                <option value="auto" style={optionStyle}>
                  Auto
                </option>
              </select>
            </label>
          </div>

          <div style={controlGroupStyle}>
            <label style={labelStyle}>
              <span>Search placeholder:</span>
              <input
                type="text"
                value={searchPlaceholder}
                onChange={(e) => setSearchPlaceholder(e.target.value)}
                style={textInputStyle}
                placeholder="Search country or code..."
                data-testid="props-search-placeholder"
              />
            </label>

            <label style={labelStyle}>
              <span>No results text:</span>
              <input
                type="text"
                value={noResultsText}
                onChange={(e) => setNoResultsText(e.target.value)}
                style={textInputStyle}
                placeholder="No countries found"
                data-testid="props-no-results-text"
              />
            </label>

            <label style={labelStyle}>
              <span>Clear button label:</span>
              <input
                type="text"
                value={clearButtonLabel}
                onChange={(e) => setClearButtonLabel(e.target.value)}
                style={textInputStyle}
                placeholder="Clear phone number"
                data-testid="props-clear-button-label"
              />
            </label>

            <label style={labelStyle}>
              <span>Dropdown class:</span>
              <input
                type="text"
                value={dropdownClass}
                onChange={(e) => setDropdownClass(e.target.value)}
                style={textInputStyle}
                placeholder="my-custom-class"
                data-testid="props-dropdown-class"
              />
            </label>
          </div>

          <div style={controlGroupStyle}>
            <label style={checkboxLabelStyle} data-testid="props-detect">
              <input
                type="checkbox"
                checked={detect}
                onChange={(e) => onDetectChange(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Auto-detect country</span>
            </label>

            <label style={checkboxLabelStyle} data-testid="props-show-copy">
              <input
                type="checkbox"
                checked={showCopy}
                onChange={(e) => setShowCopy(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Show copy button</span>
            </label>

            <label style={checkboxLabelStyle} data-testid="props-show-clear">
              <input
                type="checkbox"
                checked={showClear}
                onChange={(e) => setShowClear(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Show clear button</span>
            </label>

            <label style={checkboxLabelStyle} data-testid="props-with-validity">
              <input
                type="checkbox"
                checked={withValidity}
                onChange={(e) => setWithValidity(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Show validity indicators</span>
            </label>

            <label style={checkboxLabelStyle} data-testid="props-disabled">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Disabled</span>
            </label>

            <label style={checkboxLabelStyle} data-testid="props-readonly">
              <input
                type="checkbox"
                checked={readonly}
                onChange={(e) => setReadonly(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Readonly</span>
            </label>

            <label style={checkboxLabelStyle} data-testid="props-disable-default-styles">
              <input
                type="checkbox"
                checked={disableDefaultStyles}
                onChange={(e) => setDisableDefaultStyles(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Disable default styles</span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <main style={mainStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>@desource/phone-mask-react</h1>
        <p style={subtitleStyle}>Interactive Component Demo & Playground</p>
      </header>

      <div style={contentStyle}>
        <Playground />
        <DemoHook />
      </div>

      <footer style={footerStyle}>
        <p>💡 Tip: Open console to see event logs</p>
      </footer>
    </main>
  );
}

// Styles
const mainStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100vw',
  background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #0f0f1e 100%)',
  color: '#fff',
  fontFamily: "'Nunito', sans-serif",
  position: 'relative',
  overflow: 'auto',
  padding: '40px 20px'
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 48,
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  padding: '32px 24px',
  maxWidth: 1200,
  margin: '0 auto 48px'
};

const titleStyle: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 700,
  marginBottom: 8,
  background: 'linear-gradient(135deg, #fff 0%, #a0a0ff 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 300,
  color: 'rgba(255, 255, 255, 0.7)'
};

const contentStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const sectionStyle: React.CSSProperties = {
  padding: 32,
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
};

const playgroundStyle: React.CSSProperties = {
  ...sectionStyle,
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(16px)'
};

const headingStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 20,
  color: '#fff'
};

const subheadingStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 16,
  color: 'rgba(255, 255, 255, 0.9)'
};

const playgroundGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 24
};

const previewPanelStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  padding: 24
};

const previewAreaStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(4px)',
  borderRadius: 8,
  padding: 24,
  border: '1px solid rgba(255, 255, 255, 0.05)'
};

const controlsPanelStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  padding: 24
};

const controlGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 16
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.9)'
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#fff',
  fontSize: 14,
  fontFamily: "'Nunito', sans-serif",
  outline: 'none',
  cursor: 'pointer'
};

const optionStyle: React.CSSProperties = {
  color: '#000'
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 400,
  color: 'rgba(255, 255, 255, 0.9)',
  cursor: 'pointer'
};

const checkboxStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  cursor: 'pointer',
  accentColor: '#a0a0ff'
};

const textInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#fff',
  fontSize: 14,
  fontFamily: "'Nunito', sans-serif",
  outline: 'none'
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#fff',
  outline: 'none',
  fontSize: 16,
  fontFamily: "'Nunito', sans-serif"
};

const btnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "'Nunito', sans-serif",
  transition: 'all 0.2s ease'
};

const metaStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 8,
  fontSize: 14,
  display: 'grid',
  gap: 6,
  border: '1px solid rgba(255, 255, 255, 0.05)'
};

const footerStyle: React.CSSProperties = {
  marginTop: 48,
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: 16,
  fontWeight: 300,
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 24,
  maxWidth: 1200,
  margin: '48px auto 0'
};

createRoot(document.getElementById('root')!).render(<App />);
