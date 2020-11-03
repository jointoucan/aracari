interface Config {
  textNodeType: number;
  createTextNode?: (text: string) => Node;
}

export class Aracari<T extends HTMLElement = HTMLElement> {
  root: T;
  mapping: string[][];
  config: Config;

  constructor(root: T, options: Partial<Config> | undefined = {}) {
    this.root = root;
    this.config = {
      textNodeType: options.textNodeType || Node.TEXT_NODE,
      createTextNode:
        options.createTextNode || document.createTextNode.bind(document)
    };
    this.mapping = this.getTextNodeMapping(root);
  }

  public getText() {
    return this.mapping.map(([text]) => text).join("");
  }

  public isInSingleNode(text: string, caseSenative: boolean = true) {
    return !!this.getTextNode(text, caseSenative);
  }

  // TODO: this needs some options to do a couple of things
  // find multiple instances of the work in a text node
  // "and v. sand" be able to potentially pass regexp with a capture group
  public getTextNode(
    text: string,
    caseSenative: boolean = true
  ): ChildNode | undefined {
    const pattern = new RegExp(text, `g${caseSenative ? "" : "i"}`);
    const matchedNode = this.mapping.find(([text]) => !!text.match(pattern));
    if (!matchedNode) return null;
    const [, nodeMapping] = matchedNode;
    // Get mapping and walk path to node.
    const path = nodeMapping.split(".").map(i => parseInt(i, 10));
    return this.walkNodes(this.root, path);
  }

  public replaceText(text: string, nodes: T | Node | (T | Node)[]) {
    const node = this.getTextNode(text);
    if (!node) {
      return;
    }
    // Handling text around replacement text
    const [preText, postText] = node.textContent.split(text);
    const replacementNodes = [
      this.maybeCreateTextNode(preText),
      ...(Array.isArray(nodes) ? nodes : [nodes]),
      this.maybeCreateTextNode(postText)
    ].filter(x => x);

    // Replace existing text node with new nodelist.
    node.replaceWith(...replacementNodes);
    return this;
  }

  public remap() {
    this.mapping = this.getTextNodeMapping(this.root);
    return this;
  }

  private maybeCreateTextNode(text: string) {
    const { createTextNode } = this.config;
    if (!text.length) {
      return null;
    }
    return createTextNode(text);
  }

  // Takes a node and path and then will recursively call itself
  // to find the node or return undefined
  private walkNodes(
    parent: T | undefined,
    path: number[]
  ): ChildNode | undefined {
    if (!path.length || !parent) {
      return parent;
    }
    const newPath = [...path];
    const childNth = newPath.shift();
    const child = parent.childNodes[childNth] as T | undefined;
    return this.walkNodes(child, newPath);
  }

  // Builds up a mapping of text and path to location of text node.
  // [['Foo Bar', '23.1.0.0']]
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
