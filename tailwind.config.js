/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        hamplard: {
          deep: '#26215C',
          primary: '#7F77DD',
          lilac: '#EEEDFE',
          white: '#FFFFFF',
          mid: '#3C3489',
        },
        semantic: {
          bg: {
            page: 'var(--color-bg-page)',
            surface: 'var(--color-bg-surface)',
            subtle: 'var(--color-bg-subtle)',
            primary: 'var(--color-bg-primary)',
          },
          text: {
            body: 'var(--color-text-body)',
            heading: 'var(--color-text-heading)',
            muted: 'var(--color-text-muted)',
            link: 'var(--color-text-link)',
          },
          border: {
            DEFAULT: 'var(--color-border-default)',
            strong: 'var(--color-border-strong)',
          },
        },
        // Warm saffron — primary brand colour, inspired by West African textiles
        saffron: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Deep ink — text and structure
        ink: {
          50:  '#f8f7f4',
          100: '#f0ede6',
          200: '#e2ddd3',
          500: '#8b7d6b',
          700: '#3d3228',
          900: '#1a1208',
        },
        // Leaf green — success / completion states
        leaf: {
          50:  '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        h1: ['var(--type-h1-size)', { lineHeight: 'var(--type-h1-line-height)', letterSpacing: 'var(--type-h1-letter-spacing)', fontWeight: 'var(--type-h1-font-weight)' }],
        h2: ['var(--type-h2-size)', { lineHeight: 'var(--type-h2-line-height)', letterSpacing: 'var(--type-h2-letter-spacing)', fontWeight: 'var(--type-h2-font-weight)' }],
        h3: ['var(--type-h3-size)', { lineHeight: 'var(--type-h3-line-height)', letterSpacing: 'var(--type-h3-letter-spacing)', fontWeight: 'var(--type-h3-font-weight)' }],
        h4: ['var(--type-h4-size)', { lineHeight: 'var(--type-h4-line-height)', letterSpacing: 'var(--type-h4-letter-spacing)', fontWeight: 'var(--type-h4-font-weight)' }],
        h5: ['var(--type-h5-size)', { lineHeight: 'var(--type-h5-line-height)', letterSpacing: 'var(--type-h5-letter-spacing)', fontWeight: 'var(--type-h5-font-weight)' }],
        h6: ['var(--type-h6-size)', { lineHeight: 'var(--type-h6-line-height)', letterSpacing: 'var(--type-h6-letter-spacing)', fontWeight: 'var(--type-h6-font-weight)' }],
        body: ['var(--type-body-size)', { lineHeight: 'var(--type-body-line-height)', letterSpacing: 'var(--type-body-letter-spacing)', fontWeight: 'var(--type-body-font-weight)' }],
        caption: ['var(--type-caption-size)', { lineHeight: 'var(--type-caption-line-height)', letterSpacing: 'var(--type-caption-letter-spacing)', fontWeight: 'var(--type-caption-font-weight)' }],
        label: ['var(--type-label-size)', { lineHeight: 'var(--type-label-line-height)', letterSpacing: 'var(--type-label-letter-spacing)', fontWeight: 'var(--type-label-font-weight)' }],
        overline: ['var(--type-overline-size)', { lineHeight: 'var(--type-overline-line-height)', letterSpacing: 'var(--type-overline-letter-spacing)', fontWeight: 'var(--type-overline-font-weight)' }],
      },
      letterSpacing: {
        tight: 'var(--letter-spacing-tight)',
        normal: 'var(--letter-spacing-normal)',
        wide: 'var(--letter-spacing-wide)',
        wider: 'var(--letter-spacing-wider)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl:  '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        pill: 'var(--radius-pill)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'progress': 'progress 1s ease-out forwards',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },  to: { opacity: '1' } },
        slideUp:  {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        progress: { from: { width: '0%' }, to: { width: 'var(--progress)' } },
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'focus': 'var(--shadow-focus)',
        'warm':  '0 2px 16px 0 rgba(180,83,9,0.08)',
        'card':  '0 1px 4px 0 rgba(26,18,8,0.06), 0 4px 16px 0 rgba(26,18,8,0.04)',
        'lifted':'0 8px 32px 0 rgba(26,18,8,0.12)',
      },
    },
  },
  plugins: [],
};
