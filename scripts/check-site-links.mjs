import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "parse5";

const defaultOutputDirectory = resolve(process.cwd(), "dist");
const runtimePaths = new Set(["/api/contact"]);
const canonicalOrigin = "https://datumstudio.xyz";

const walkNodes = (node, callback) => {
  callback(node);
  node.childNodes?.forEach((child) => walkNodes(child, callback));
};

const attributes = (node) => Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));

const sourceRoute = (outputDirectory, file) => {
  const relativeFile = relative(outputDirectory, file).replaceAll("\\", "/");
  if (relativeFile === "index.html") return "/";
  if (relativeFile.endsWith("/index.html")) return `/${relativeFile.slice(0, -"index.html".length)}`;
  return `/${relativeFile}`;
};

const targetFile = (outputDirectory, pathname) => {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const safePath = decodedPath.replace(/^\/+/, "");
  if (safePath.split("/").includes("..")) return null;
  if (safePath === "404/" || safePath === "404") return resolve(outputDirectory, "404.html");
  if (!safePath || decodedPath.endsWith("/")) return resolve(outputDirectory, safePath, "index.html");
  if (/\.[a-z0-9]+$/i.test(safePath)) return resolve(outputDirectory, safePath);
  return resolve(outputDirectory, safePath, "index.html");
};

const idsIn = (file) => {
  const document = parse(readFileSync(file, "utf8"));
  const ids = new Set();
  walkNodes(document, (node) => {
    const id = attributes(node).id;
    if (id) ids.add(id);
  });
  return ids;
};

const collectHtmlFiles = (directory) => {
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
    }
  };
  visit(directory);
  return files;
};

export const checkSiteLinks = (outputDirectory = defaultOutputDirectory) => {
  if (!existsSync(outputDirectory)) throw new Error(`Output directory does not exist: ${outputDirectory}`);
  const failures = [];
  const idsByFile = new Map();
  for (const sourceFile of collectHtmlFiles(outputDirectory)) {
    const document = parse(readFileSync(sourceFile, "utf8"));
    const source = sourceRoute(outputDirectory, sourceFile);
    walkNodes(document, (node) => {
      const { href, src } = attributes(node);
      const value = href ?? src;
      if (!value || value.startsWith("mailto:") || value.startsWith("tel:") || value.startsWith("data:") || value.startsWith("javascript:")) return;
      let url;
      try {
        url = new URL(value, new URL(source, canonicalOrigin));
      } catch {
        failures.push(`${source}: invalid URL ${JSON.stringify(value)}`);
        return;
      }
      if (url.origin !== canonicalOrigin || runtimePaths.has(url.pathname)) return;
      const target = targetFile(outputDirectory, url.pathname);
      if (!target || !existsSync(target)) {
        failures.push(`${source}: ${value} resolves to missing ${url.pathname || "/"}`);
        return;
      }
      if (url.hash) {
        const ids = idsByFile.get(target) ?? idsIn(target);
        idsByFile.set(target, ids);
        let id;
        try {
          id = decodeURIComponent(url.hash.slice(1));
        } catch {
          failures.push(`${source}: ${value} has an invalid fragment`);
          return;
        }
        if (!ids.has(id)) failures.push(`${source}: ${value} has no #${id} target`);
      }
    });
  }
  return failures;
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const outputDirectory = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultOutputDirectory;
  const failures = checkSiteLinks(outputDirectory);
  if (failures.length) {
    console.error(`Link check failed (${failures.length}):\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log(`Link check passed for ${outputDirectory}`);
  }
}
