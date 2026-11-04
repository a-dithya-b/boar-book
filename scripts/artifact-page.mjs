// Turns the artifact build's index.html into the page body claude.ai expects:
// the host adds its own <!doctype>/<head>/<body>, so we keep only the title,
// our stylesheet and script tags, and the root element.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const dir = "dist-artifact";
const html = readFileSync(path.join(dir, "index.html"), "utf8");
const tags = [...html.matchAll(/<(?:script\b[^>]*><\/script>|link\b[^>]*rel="(?:stylesheet|modulepreload)"[^>]*>)/g)].map((m) => m[0]);
if (!tags.some((t) => t.startsWith("<script"))) throw new Error("no entry script found in index.html");

const page = [
  "<title>Boar Book</title>",
  '<meta name="description" content="Interactive, hands-on chapter recaps for Designing Data-Intensive Applications (2nd edition).">',
  ...tags,
  '<div id="root"></div>',
  "",
].join("\n");
writeFileSync(path.join(dir, "artifact.html"), page);

// list what has to be published alongside the page
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = path.join(d, f);
  statSync(p).isDirectory() ? walk(p) : files.push(path.relative(dir, p));
});
walk(dir);
const assets = files.filter((f) => !["index.html", "artifact.html"].includes(f));
writeFileSync(path.join(dir, "files.json"), JSON.stringify(Object.fromEntries(assets.map((f) => [f, path.join(dir, f)])), null, 2));
console.log(`artifact.html written; ${assets.length} supporting files listed in ${dir}/files.json`);
