/**
 * Stage 11 portable build: one self-contained HTML file that runs from file:// (a USB drive) with
 * no server, no Node and no network. Used only by vite.portable.config.ts.
 *
 * The bundle is built as one JS chunk (dynamic imports inlined) and one CSS file; this plugin then
 * moves both into the HTML in memory (`generateBundle`), so nothing is fetched at run time and no
 * module or CORS rule applies: an inline module script needs no request. `closeBundle` copies the
 * README and, when present, the backup video next to the page.
 */
import { copyFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';

export interface PortableOptions {
  /** Name of the single HTML file. */
  htmlName: string;
  /** Files copied into the output folder: [source, target name]; missing sources are reported. */
  extras: readonly (readonly [string, string])[];
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Script text must not close the inline <script> element early. */
const escapeScript = (code: string) => code.replace(/<\/script/gi, '<\\/script');

export function portableSingleFile(options: PortableOptions): Plugin {
  let outDir = '';
  return {
    name: 'bwrx300-portable-single-file',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    // After every other generateBundle hook (Vite resolves its preload helper there).
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.html'));
        if (!html || html.type !== 'asset') throw new Error('[portable] no HTML entry in the bundle');
        let page = String(html.source);
        const chunks = Object.values(bundle).filter((f) => f.type === 'chunk');
        if (chunks.length !== 1) throw new Error(`[portable] expected one JS chunk, got ${chunks.length}`);
        for (const file of Object.values(bundle)) {
          const name = escapeRegExp(file.fileName);
          const ref = new RegExp(`<script[^>]*src="[^"]*${name}"[^>]*></script>`);
          const css = new RegExp(`<link[^>]*href="[^"]*${name}"[^>]*>`);
          if (file.type === 'chunk' && ref.test(page)) {
            page = page.replace(ref, () => `<script type="module">\n${escapeScript(file.code)}\n</script>`);
            delete bundle[file.fileName];
          } else if (file.type === 'asset' && file.fileName.endsWith('.css') && css.test(page)) {
            page = page.replace(css, () => `<style>\n${String(file.source)}\n</style>`);
            delete bundle[file.fileName];
          }
        }
        if (/<script[^>]*\ssrc=|<link[^>]*stylesheet/i.test(page)) throw new Error('[portable] an external script or stylesheet is left in the page');
        const left = Object.keys(bundle).filter((name) => name !== html.fileName);
        if (left.length) throw new Error(`[portable] files left outside the page: ${left.join(', ')}`);
        html.source = page;
        html.fileName = options.htmlName;
      },
    },
    closeBundle() {
      for (const [source, target] of options.extras) {
        if (!existsSync(source)) {
          this.warn(`[portable] ${source} not found: ${target} is missing from the package`);
          continue;
        }
        copyFileSync(source, join(outDir, target));
        this.info?.(`[portable] ${target} (${(statSync(source).size / 1e6).toFixed(1)} MB)`);
      }
    },
  };
}
