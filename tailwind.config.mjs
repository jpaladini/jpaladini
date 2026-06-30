/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				bg: '#0a0d10',
				panel: '#0c0f13',
				'panel-hover': '#0e1318',
				accent: '#6ee7c7',
				'accent-bright': '#8af0d6',
				'accent-ink': '#06120f',
				'accent-soft': '#cffaed',
				text: '#e6edf0',
				'text-2': '#cfd8db',
				'text-3': '#9fb0b6',
				'text-faint': '#6a7b81',
				'text-dim': '#7d8e94',
				arrow: '#3a4a4f',
			},
			fontFamily: {
				sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
			},
			maxWidth: {
				content: '1120px',
				article: '720px',
			},
			letterSpacing: {
				eyebrow: '0.18em',
			},
		},
	},
	plugins: [],
}
