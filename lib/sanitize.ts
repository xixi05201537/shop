import sanitizeHtml from "sanitize-html";

const cssLength = "(?:0|auto|-?\\d+(?:\\.\\d+)?(?:px|rem|em|%)?)";
const cssLengthList = new RegExp(`^${cssLength}(?:\\s+${cssLength}){0,3}$`);
const cssLengthPair = new RegExp(`^${cssLength}(?:\\s+${cssLength})?$`);

export function sanitizeEmailHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "table",
      "tbody",
      "tr",
      "td",
      "th",
      "div",
      "span",
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "code",
      "pre",
    ],
    allowedAttributes: {
      "*": ["style", "role", "align", "width", "height", "cellspacing", "cellpadding", "border"],
      a: ["href", "target", "rel", "style"],
    },
    allowedStyles: {
      "*": {
        "background": [/^[#a-zA-Z0-9\s,().%-]+$/],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\([0-9\s,.%]+\)$/],
        "border": [/^[#a-zA-Z0-9\s,().%-]+$/],
        "border-bottom": [/^[#a-zA-Z0-9\s,().%-]+$/],
        "border-collapse": [/^(collapse|separate)$/],
        "border-radius": [cssLengthList],
        "border-spacing": [cssLengthPair],
        "box-shadow": [/^[#a-zA-Z0-9\s,().%-]+$/],
        "color": [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\([0-9\s,.%]+\)$/],
        "display": [/^(block|inline|inline-block|table|table-row|table-cell)$/],
        "font-family": [/^[a-zA-Z0-9\s"',-]+$/],
        "font-size": [/^[0-9.]+(px|rem|em|%)$/],
        "font-weight": [/^(normal|bold|bolder|lighter|[1-9]00)$/],
        "letter-spacing": [/^-?[0-9.]+(px|em|rem)$/],
        "line-height": [/^[0-9.]+(px|em|rem|%)?$/],
        "margin": [cssLengthList],
        "max-width": [/^[0-9.]+(px|%)$/],
        "overflow": [/^(hidden|auto|visible)$/],
        "padding": [cssLengthList],
        "text-align": [/^(left|center|right)$/],
        "text-decoration": [/^(none|underline)$/],
        "text-transform": [/^(none|uppercase|lowercase|capitalize)$/],
        "width": [/^[0-9.]+(px|%)$/],
        "word-break": [/^(normal|break-all|break-word|keep-all)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
