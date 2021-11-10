import { escapeRegExp } from "./utils";

export { escapeRegExp } from "./utils";

interface Config {
  textNodeType: number;
  createTextNode?: (text: string) => Node;
}

interface ReplaceOptions {
  at?: string;
  preserveWord?: boolean;
  replacementIndex?: number;
  nonWordBoundMatch?: boolean;
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
        options.createTextNode || document.createTextNode.bind(document),
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

  public getAddressForText(
    text,
    caseSensitive: boolean = true,
    preserveWord: boolean = false
  ): string | null {
    const matchedNode = this.getMappingsForText(
      text,
      caseSensitive,
      preserveWord
    );
    return matchedNode && matchedNode[0] ? matchedNode[0][1] : null;
  }

  public getAddressesForText(
    text,
    caseSensitive: boolean = true,
    preserveWord: boolean = false
  ): string[] | null {
    const matchedNode = this.getMappingsForText(
      text,
      caseSensitive,
      preserveWord
    );
    return matchedNode ? matchedNode.map((node) => node[1]) : null;
  }

  public getTextByAddress(address: string): string | null {
    const node = this.getMappingFromAddress(address);
    return node ? node[0] : null;
  }

  public isInSingleNode(text: string, caseSensitive: boolean = true) {
    return !!this.getAddressForText(text, caseSensitive);
  }

  public getTextNode(text: string, caseSensitive: boolean = true) {
    const address = this.getAddressForText(text, caseSensitive);
    if (!address) return null;
    return this.getNodeByAddress(address);
  }

  private nonWordBoundMatchReplacement = (
    { node,
      text,
      nodes,
      replacementIndex
    }: {
      node: any;
      text: string,
      nodes: T | Node | (T | Node)[];
      replacementIndex: number;
    }) => {
    // Using this pattern because look-around regex not supported in some browsers
    // \b Word bound works with latin based characters and does not work with other characters
    const pattern = new RegExp(
      `(?:^|\\s)${escapeRegExp(text)}(?:$|\\s|[.!?,"'])`,
      "g"
    );
    if (!node.textContent.match(pattern)) {
      throw new Error("Text not found in node");
    }
    const matchingPhrase = node.textContent.match(pattern)[0];
    // Preceding character matching and delimiting
    const isFirstDelimitingCharacter = matchingPhrase.charAt(0).match(new RegExp(`\\s|^|[ ]`))[0] !== "";
    const precedingCharacter = isFirstDelimitingCharacter ? matchingPhrase.charAt(0) : "";
    // Following character matching and delimiting
    const isLastDelimitingCharacter = matchingPhrase.charAt(matchingPhrase - 1).match(new RegExp(`($|\\s|[.!?,"'])`))[0] !== "";
    const lastCharacter = isLastDelimitingCharacter ? matchingPhrase.charAt(matchingPhrase - 1) : "";
    const contents = node.textContent.split(pattern);
    const preText = contents.slice(0, replacementIndex + 1);
    const postText = contents.slice(replacementIndex + 1);

    const replacementNodes = [
      this.maybeCreateTextNode(preText.join(text) + precedingCharacter),
      ...(Array.isArray(nodes) ? nodes : [nodes]),
      this.maybeCreateTextNode(lastCharacter + postText.join(text)),
    ].filter((x) => x);

    // Replace existing text node with new node-list.
    node.replaceWith(...replacementNodes);
    return this;
  }

  public replaceText(
    text: string,
    nodes: T | Node | (T | Node)[],
    options: ReplaceOptions = {}
  ) {
    let node;
    const { at, preserveWord, replacementIndex = 0, nonWordBoundMatch = false } = options;;

    if (at) {
      node = this.getNodeByAddress(at);
    } else {
      node = this.getTextNode(text);
    }

    // Use non word bound '\b' matching and replacement
    if (nonWordBoundMatch) {
      return this.nonWordBoundMatchReplacement({ node, text, nodes, replacementIndex });
    }

    const delimiter = preserveWord ? "\\b" : "";
    const pattern = new RegExp(
      `${delimiter}${escapeRegExp(text)}${delimiter}`,
      "g"
    );
    // Handling text around replacement text
    if (!node.textContent.match(pattern)) {
      throw new Error("Text not found in node");
    }
    const contents = node.textContent.split(pattern);
    const preText = contents.slice(0, replacementIndex + 1);
    const postText = contents.slice(replacementIndex + 1);
    const replacementNodes = [
      this.maybeCreateTextNode(preText.join(text)),
      ...(Array.isArray(nodes) ? nodes : [nodes]),
      this.maybeCreateTextNode(postText.join(text)),
    ].filter((x) => x);

    // Replace existing text node with new node-list.
    node.replaceWith(...replacementNodes);
    return this;
  }

  public remap(mapping?: Mapping) {
    this.mapping = mapping ?? this.getTextNodeMapping(this.root);
    return this;
  }

  public getNodeByAddress(address: string) {
    const path = address.split(".").map((i) => parseInt(i, 10));
    return this.walkNodes(this.root, path);
  }

  // Takes a node and path and then will recursively call itself
  // to find the node or return undefined
  public walkNodes(
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

  private getMappingsForText(
    text: string,
    caseSensitive: boolean = true,
    preserveWord: boolean = false
  ): string[][] {
    const delimiter = preserveWord ? "\\b" : "";
    const pattern = new RegExp(
      `${delimiter}${escapeRegExp(text)}${delimiter}`,
      `${caseSensitive ? "i" : ""}g`
    );
    return this.mapping.filter(([text]) => !!text.match(pattern));
  }

  private getMappingFromAddress(address: string): string[] | undefined {
    return this.mapping.find(([text, nodeAddress]) => nodeAddress === address);
  }

  private maybeCreateTextNode(text: string) {
    const { createTextNode } = this.config;
    if (!text.length) {
      return null;
    }
    return createTextNode(text);
  }

  // Builds up a mapping of text and path to location of text node.
  // [['Foo Bar', '23.1.0.0']]
  private getTextNodeMapping(parent: T, path: number[] = []) {
    const { textNodeType } = this.config;
    return Array.from(parent.childNodes).flatMap((node, i) => {
      if (node.nodeType === textNodeType) {
        return [[node.textContent, [...path, i].join(".")]];
      }
      if (typeof node === "object" && node ?.childNodes ?.length) {
        return this.getTextNodeMapping(node as T, [...path, i]);
      }
      return [];
    });
  }
}
