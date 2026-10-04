/**
 * A deliberately small syntax highlighter, run at build time on the server. It knows comments,
 * strings, numbers, keywords and capitalised type names: enough to make code readable, nothing
 * like a full parser. Output is plain tokens, rendered as text (never as HTML).
 */

export type Lang = "python" | "typescript" | "tsx" | "java" | "csharp" | "html" | "css";
export type TokenKind = "plain" | "comment" | "string" | "number" | "keyword" | "type" | "tag" | "attr";
export type Token = { kind: TokenKind; text: string };

const keywords: Record<Lang, string[]> = {
  python: ["import", "from", "def", "return", "if", "elif", "else", "for", "while", "in", "not", "and", "or", "True", "False", "None", "with", "as", "class", "lambda", "yield", "pass", "break", "continue"],
  typescript: ["import", "export", "from", "const", "let", "function", "return", "if", "else", "switch", "case", "type", "interface", "as", "new", "true", "false", "null", "undefined", "typeof", "default", "for", "of", "in", "async", "await"],
  tsx: [],
  java: ["import", "enum", "record", "final", "class", "static", "private", "public", "return", "switch", "case", "new", "if", "throw", "this", "void", "boolean", "true", "false", "extends", "implements"],
  csharp: ["using", "public", "private", "readonly", "record", "struct", "sealed", "class", "enum", "new", "return", "if", "throw", "this", "with", "var", "int", "string", "bool", "get", "nameof"],
  html: [],
  css: [],
};
keywords.tsx = keywords.typescript;

const commentFor: Record<Lang, RegExp> = {
  python: /#[^\n]*|"""[\s\S]*?"""/y,
  typescript: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y,
  tsx: /\/\/[^\n]*|\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}/y,
  java: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y,
  csharp: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y,
  html: /<!--[\s\S]*?-->/y,
  css: /\/\*[\s\S]*?\*\//y,
};

function tokenizeMarkup(code: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /(<!--[\s\S]*?-->)|(<\/?[\w-]+)|([\w-:]+)(=)("[^"]*")|(\/?>)|(\s+|[^<\s]+)/g;
  for (const match of code.matchAll(pattern)) {
    if (match[1]) tokens.push({ kind: "comment", text: match[1] });
    else if (match[2]) tokens.push({ kind: "tag", text: match[2] });
    else if (match[3]) tokens.push({ kind: "attr", text: match[3] }, { kind: "plain", text: match[4] }, { kind: "string", text: match[5] });
    else if (match[6]) tokens.push({ kind: "tag", text: match[6] });
    else tokens.push({ kind: "plain", text: match[0] });
  }
  return tokens;
}

function tokenizeCss(code: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /(\/\*[\s\S]*?\*\/)|(--[\w-]+)|([\w-]+)(?=\s*:)|(#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:rem|em|px|%|ch|vw|svh|fr|s|ms|deg)?)|("[^"]*")|(@[\w-]+)|([^\s])|(\s+)/g;
  for (const match of code.matchAll(pattern)) {
    if (match[1]) tokens.push({ kind: "comment", text: match[1] });
    else if (match[2]) tokens.push({ kind: "type", text: match[2] });
    else if (match[3]) tokens.push({ kind: "attr", text: match[3] });
    else if (match[4]) tokens.push({ kind: "number", text: match[4] });
    else if (match[5]) tokens.push({ kind: "string", text: match[5] });
    else if (match[6]) tokens.push({ kind: "keyword", text: match[6] });
    else tokens.push({ kind: "plain", text: match[0] });
  }
  return tokens;
}

export function tokenize(code: string, lang: Lang): Token[] {
  if (lang === "html") return tokenizeMarkup(code);
  if (lang === "css") return tokenizeCss(code);
  const words = new Set(keywords[lang]);
  const comment = commentFor[lang];
  const string = lang === "python" ? /f?("[^"\n]*"|'[^'\n]*')/y : /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y;
  const number = /\b\d[\d_]*(\.\d+)?\b/y;
  const word = /[A-Za-z_][\w]*/y;
  const tokens: Token[] = [];
  let plain = "";
  const flush = () => {
    if (plain) tokens.push({ kind: "plain", text: plain });
    plain = "";
  };
  let i = 0;
  const at = (re: RegExp) => {
    re.lastIndex = i;
    const match = re.exec(code);
    return match ? match[0] : null;
  };
  while (i < code.length) {
    const found =
      (() => { const m = at(comment); return m && { kind: "comment" as const, text: m }; })() ??
      (() => { const m = at(string); return m && { kind: "string" as const, text: m }; })() ??
      (() => { const m = at(number); return m && { kind: "number" as const, text: m }; })();
    if (found) {
      flush();
      tokens.push(found);
      i += found.text.length;
      continue;
    }
    const name = at(word);
    if (name) {
      flush();
      const kind: TokenKind = words.has(name) ? "keyword" : /^[A-Z]/.test(name) ? "type" : "plain";
      tokens.push({ kind, text: name });
      i += name.length;
      continue;
    }
    plain += code[i];
    i += 1;
  }
  flush();
  return tokens;
}

/** Tokens split into lines, for line numbers. */
export function highlightLines(code: string, lang: Lang): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(code.replace(/\r\n/g, "\n").replace(/\n$/, ""), lang)) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ kind: token.kind, text: part });
    });
  }
  return lines;
}
