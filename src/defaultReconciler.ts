import { AracariReconciler } from "./types";

export const defaultReconciler: AracariReconciler = {
  onCreateElement: () => {
    return document.createElement("span");
  },
  onCreateTextNode: (textContent: string) => {
    return document.createTextNode(textContent);
  },
  onReplaceWith: (target, replacements) => {
    target.replaceWith(...replacements);
  },
};
