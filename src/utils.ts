const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);

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
