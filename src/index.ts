interface Config {
  textNodeType: number;
}

export class Aracari<T extends HTMLElement = HTMLElement> {
  root: T;
  mapping: string[][];
  config: Config;

  constructor(root: T, options: Partial<Config> | undefined = {}) {
    this.root = root;
    this.config = {
      textNodeType: options.textNodeType || Node.TEXT_NODE
    };
    this.mapping = this.getTextNodeMapping(root);
  }

  public getText() {
    return this.mapping.map(([text]) => text).join("");
  }

  public isInSingleNode(text: string, caseSenative: boolean = true) {
    return !!this.getTextNode(text, caseSenative);
  }

  public getTextNode(text: string, caseSenative: boolean = true) {
    const pattern = new RegExp(text, `g${caseSenative ? "" : "i"}`);
    const matchedNode = this.mapping.find(([text]) => !!text.match(pattern));
    if (!matchedNode) return null;
    const [, nodeMapping] = matchedNode;
    const path = nodeMapping.split(".").map(i => parseInt(i, 10));
    return this.walkNodes(this.root, path);
  }

  public replaceText(text: string, nodes: T | Node | (T | Node)[]) {
    // TODO: aracari should not only replace nodes here but figure out
    // if on replacement that there is additional characters around
    // the replaced nodes. Eg we need to create more text node to accomidate those chars.
    const node = this.getTextNode(text);
    if (!node) {
      return;
    }
    node.replaceWith(...(Array.isArray(nodes) ? nodes : [nodes]));
    return this;
  }

  public remap() {
    this.mapping = this.getTextNodeMapping(this.root);
    return this;
  }

  private walkNodes(parent: T | undefined, path: number[]) {
    if (!path.length || !parent) {
      return parent;
    }
    const newPath = [...path];
    const childNth = newPath.shift();
    const child = parent.childNodes[childNth] as T | undefined;
    return this.walkNodes(child, newPath);
  }

  private getTextNodeMapping(parent: T, path: number[] = []) {
    const { textNodeType } = this.config;
    return Array.from(parent.childNodes).flatMap((node, i) => {
      if (node.nodeType === textNodeType) {
        return [[node.textContent, [...path, i].join(".")]];
      }
      if (typeof node === "object" && node?.childNodes?.length) {
        return this.getTextNodeMapping(node as T, [...path, i]);
      }
      return [];
    });
  }
}
