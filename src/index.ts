interface Config {
  textNodeType: number;
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
      textNodeType: options.textNodeType || Node.TEXT_NODE
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
    // TODO: aracari should not only replace nodes here but figure out
    // if on replacement that there is additional characters around
    // the replaced nodes. Eg we need to create more text node to accomidate those chars.
    let node;
    if (options.at) {
      node = this.getNodeByAddress(options.at);
    } else {
      node = this.getTextNode(text);
    }
    if (!node) {
      return;
    }
    node.replaceWith(...(Array.isArray(nodes) ? nodes : [nodes]));
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
