interface Config {
  textNodeType: number;
  createTextNode?: (text: string) => Node;
}

interface ReplaceOptions {
  at?: string
}

type Mapping = string[][];

export class Aracari<T extends HTMLElement = HTMLElement> {
  root: T | undefined;
  mapping: string[][];
  config: Config;

  constructor(root: T | Mapping, options: Partial<Config> | undefined = {}) {
    this.config = {
      textNodeType: options.textNodeType || Node.TEXT_NODE,
      createTextNode:
        options.createTextNode || document.createTextNode.bind(document)
    };
    if (Array.isArray(root)) {
      this.mapping = root;
    } else if (typeof root === "object" && root.childNodes) {
      this.root = root;
      this.mapping = this.getTextNodeMapping(root);
    }
  }

  public getText() {
    return this.mapping.map(([text]) => text).join("");
  }

  public getAddressForText (text, caseSenative: boolean = true): string | null {
    const matchedNode = this.getMappingForText(text, caseSenative);
    return matchedNode ? matchedNode[1] : null;
  }

  public getTextByAddress (address: string): string | null   {
    const node = this.getMappingFromAddress(address);
    return node ? node[0] : null;
  }

  public isInSingleNode(text: string, caseSenative: boolean = true) {
    return !!this.getAddressForText(text, caseSenative);
  }

  public getTextNode(text: string, caseSenative: boolean = true) {
    const address = this.getAddressForText(text, caseSenative);
    if (!address) return null;
    return this.getNodeByAddress(address);
  }

  public replaceText(text: string, nodes: T | Node | (T | Node)[], options: ReplaceOptions = {}) {

    let node;
    if (options.at) {
      node = this.getNodeByAddress(options.at);
    } else {
      node = this.getTextNode(text);
    }
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

  public remap(mapping?: Mapping) {
    this.mapping = mapping ?? this.getTextNodeMapping(this.root);
    return this;
  }

  private getNodeByAddress (address: string) {
    const path = address.split(".").map(i => parseInt(i, 10));
    return this.walkNodes(this.root, path);
  }

  private getMappingForText (text: string, caseSenative: boolean = true): string[] | undefined {
    const pattern = new RegExp(text, `${caseSenative ? 'i' : ''}g`);
    return this.mapping.find(([text]) => !!text.match(pattern));
  }

  private getMappingFromAddress (address: string): string[] | undefined {
    return this.mapping.find(([text, nodeAddress]) => nodeAddress === address);
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
