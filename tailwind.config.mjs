/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				bg: '#1a1a1a',
				chip: '#262626',
				rule: '#333333',
				'rule-dashed': '#3a3a3a',
				underline: '#5a5a5a',
				text: '#ececec',
				'text-bright': '#ffffff',
				'text-soft': '#d6d6d6',
				'text-muted': '#9b9b9b',
				'text-code': 'rgba(240, 240, 240, 0.82)',
			},
			fontFamily: {
				serif: ['Newsreader', 'Georgia', 'serif'],
				mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
			},
			maxWidth: {
				content: '1180px',
				article: '680px',
			},
			letterSpacing: {
				eyebrow: '0.08em',
			},
		},
	},
	plugins: [],
}
