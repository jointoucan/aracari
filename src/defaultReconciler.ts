import { AracariReconciler } from "./types";

export const defaultReconciler: AracariReconciler = {
  onCreateElement: (tagName) => {
    return document.createElement(tagName);
  },
  onCreateTextNode: (textContent: string) => {
    return document.createTextNode(textContent);
  },
  onReplaceWith: (target, replacements) => {
    target.replaceWith(...replacements);
  },
};
