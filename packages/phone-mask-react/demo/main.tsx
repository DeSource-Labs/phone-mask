import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Import directly from source to ensure live edits
import { PhoneInput, usePhoneMask } from '../src';
import type { Size, Theme } from '../src';

function DemoPhoneInput() {
  const [digits, setDigits] = useState('');

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>PhoneInput Component</h2>
      <PhoneInput
        value={digits}
        onChange={(data) => setDigits(data.digits)}
        onCountryChange={(c) => console.log('Country:', c.name)}
        onValidationChange={(v) => console.log('Valid:', v)}
        country="US"
        detect={true}
        showCopy
        showClear
        size="normal"
        theme="dark"
      />
      <div style={metaStyle}>
        <div><strong>Digits:</strong> {digits || '—'}</div>
      </div>
    </section>
  );
}

function DemoHook() {
  const { ref, digits, full, fullFormatted, isComplete, setCountry, clear } = usePhoneMask({
    country: 'GB',
    detect: false,
    onChange: (p) => console.log('Hook change:', p)
  });

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>usePhoneMask Hook</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input ref={ref} type="tel" placeholder="Phone number" style={inputStyle} />
        <button onClick={() => setCountry('US')} style={btnStyle}>US</button>
        <button onClick={() => setCountry('DE')} style={btnStyle}>DE</button>
        <button onClick={() => clear()} style={btnStyle}>Clear</button>
      </div>
      <div style={metaStyle}>
        <div><strong>Digits:</strong> {digits || '—'}</div>
        <div><strong>Full:</strong> {full || '—'}</div>
        <div><strong>Formatted:</strong> {fullFormatted || '—'}</div>
        <div><strong>Valid:</strong> {isComplete ? 'Yes' : 'No'}</div>
      </div>
    </section>
  );
}

function Playground() {
  const [digits, setDigits] = useState('');
  const [country, setCountry] = useState('');
  const [detect, setDetect] = useState(true);
  const [showCopy, setShowCopy] = useState(true);
  const [showClear, setShowClear] = useState(true);
  const [size, setSize] = useState<Size>('normal');
  const [theme, setTheme] = useState<Theme>('dark');
  const [withValidity, setWithValidity] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readonly, setReadonly] = useState(false);

  const onDetectChange = (checked: boolean) => {
    setDetect(checked);
    if (checked) {
      setCountry('');
    }
  };

  return (
    <section style={playgroundStyle}>
      <h2 style={headingStyle}>Component Playground</h2>
      
      <div style={playgroundGridStyle}>
        {/* Component Preview */}
        <div style={previewPanelStyle}>
          <h3 style={subheadingStyle}>Preview</h3>
          <div style={previewAreaStyle}>
            <PhoneInput
              value={digits}
              onChange={setDigits}
              onCountryChange={(c) => console.log('Country:', c.name)}
              onValidationChange={(v) => console.log('Valid:', v)}
              country={country || undefined}
              detect={detect}
              showCopy={showCopy}
              showClear={showClear}
              size={size}
              theme={theme}
              withValidity={withValidity}
              disabled={disabled}
              readonly={readonly}
            />
            <div style={metaStyle}>
              <div><strong>Value:</strong> {digits || '—'}</div>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div style={controlsPanelStyle}>
          <h3 style={subheadingStyle}>Props</h3>
          
          <div style={controlGroupStyle}>
            <label style={labelStyle}>
              <span>Country:</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)} style={selectStyle}>
                <option value="">Not Selected</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="UA">Ukraine</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="JP">Japan</option>
              </select>
            </label>

            <label style={labelStyle}>
              <span>Size:</span>
              <select value={size} onChange={(e) => setSize(e.target.value as Size)} style={selectStyle}>
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </label>

            <label style={labelStyle}>
              <span>Theme:</span>
              <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} style={selectStyle}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </label>
          </div>

          <div style={controlGroupStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={detect}
                onChange={(e) => onDetectChange(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Auto-detect country</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={showCopy}
                onChange={(e) => setShowCopy(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Show copy button</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={showClear}
                onChange={(e) => setShowClear(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Show clear button</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={withValidity}
                onChange={(e) => setWithValidity(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Show validity indicators</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Disabled</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={readonly}
                onChange={(e) => setReadonly(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Readonly</span>
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
        <DemoPhoneInput />
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
  gridTemplateColumns: '1fr 1fr',
  gap: 24,
  '@media (maxWidth: 768px)': {
    gridTemplateColumns: '1fr'
  }
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

