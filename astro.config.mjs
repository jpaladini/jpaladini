import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Turn ```mermaid code fences into <pre class="mermaid"> blocks so the
// client-side mermaid runtime can render them as diagrams. Syntax
// highlighting is disabled for mermaid (see markdown.syntaxHighlight) so the
// code node still holds the raw diagram text.
function rehypeMermaid() {
  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (
        child.type === 'element' &&
        child.tagName === 'pre' &&
        child.children?.[0]?.type === 'element' &&
        child.children[0].tagName === 'code'
      ) {
        const code = child.children[0];
        const className = code.properties?.className || [];
        if (className.includes('language-mermaid')) {
          const value = code.children.map((c) => c.value || '').join('');
          return {
            type: 'element',
            tagName: 'pre',
            properties: { className: ['mermaid'] },
            children: [{ type: 'text', value }],
          };
        }
      }
      walk(child);
      return child;
    });
  };
  return (tree) => {
    walk(tree);
    return tree;
  };
}

export default defineConfig({
  integrations: [tailwind()],
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    rehypePlugins: [rehypeMermaid],
  },
});
