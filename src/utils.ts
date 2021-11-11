const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);
const wordBoundaryChars = [".", "!", "?", "'", '"', "-", ",", "\\s"];
const wordBoundaryStartsWith = new RegExp(`^[${wordBoundaryChars.join("")}]`);
const wordBoundaryEndsWith = new RegExp(`[${wordBoundaryChars.join("")}]$`);

/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * @param {string} text The string to escape.
 * @returns {string} Returns the escaped string.
 */

export const escapeRegExp = (text: string) => {
  return text && reHasRegExpChar.test(text)
    ? text.replace(reRegExpChar, "\\$&")
    : text || "";
};

export const createRegExpSearch = (search: string, preserveWord: boolean) => {
  const startDelimiter = preserveWord
    ? `(?:^|[${wordBoundaryChars.join("")}])`
    : "";
  const endDelimiter = preserveWord
    ? `(?:$|[${wordBoundaryChars.join("")}])`
    : "";
  return new RegExp(
    `${startDelimiter}${escapeRegExp(search)}${endDelimiter}`,
    "g"
  );
};

export const getSurroundingChars = (matchText: string): [string, string] => {
  const leadingChar = wordBoundaryStartsWith.test(matchText)
    ? matchText.charAt(0)
    : "";
  const endingChar = wordBoundaryEndsWith.test(matchText)
    ? matchText.charAt(matchText.length - 1)
    : "";
  return [leadingChar, endingChar];
};
