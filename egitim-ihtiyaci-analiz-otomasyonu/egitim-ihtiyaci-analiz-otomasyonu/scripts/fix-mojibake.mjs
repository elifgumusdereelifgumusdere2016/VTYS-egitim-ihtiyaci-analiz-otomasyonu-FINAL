import fs from "fs";
import path from "path";

const roots = ["app", "components", "lib"];

const extensions = new Set([".ts", ".tsx", ".css"]);

const fixes = [
  // Ç / ç
  ["\u00C3\u2021", "\u00C7"],
  ["\u00C3\u0087", "\u00C7"],
  ["\u00C3\u00A7", "\u00E7"],

  // ı / İ
  ["\u00C4\u00B1", "\u0131"],
  ["\u00C4\u00B0", "\u0130"],

  // ğ / Ğ
  ["\u00C4\u0178", "\u011F"],
  ["\u00C4\u017E", "\u011E"],

  // ü / Ü
  ["\u00C3\u00BC", "\u00FC"],
  ["\u00C3\u0153", "\u00DC"],
  ["\u00C3\u009C", "\u00DC"],

  // ö / Ö
  ["\u00C3\u00B6", "\u00F6"],
  ["\u00C3\u2013", "\u00D6"],
  ["\u00C3\u0096", "\u00D6"],

  // ş / Ş
  ["\u00C5\u0178", "\u015F"],
  ["\u00C5\u017E", "\u015E"],
  ["\u00C5\u017D", "\u015E"],

  // Common punctuation mojibake
  ["\u00E2\u20AC\u2122", "'"],
  ["\u00E2\u20AC\u0153", '"'],
  ["\u00E2\u20AC\u009D", '"'],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    if (extensions.has(path.extname(entry.name))) {
      return [fullPath];
    }

    return [];
  });
}

let changedCount = 0;

for (const root of roots) {
  for (const file of walk(root)) {
    let content = fs.readFileSync(file, "utf8");
    const original = content;

    for (const [broken, fixed] of fixes) {
      content = content.split(broken).join(fixed);
    }

    if (content !== original) {
      fs.writeFileSync(file, content, "utf8");
      changedCount++;
      console.log("Fixed:", file);
    }
  }
}

console.log(`Done. Changed files: ${changedCount}`);
