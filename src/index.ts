import { AracariNode } from "./nodes";
import {
  Instruction,
  InstructionType,
  Config,
  Mapping,
  ReplaceOptions,
  NodeType,
} from "./types";

export class Aracari {
  root: HTMLElement | undefined;
  mapping: string[][];
  config: Config;
  tree: AracariNode;
  intructions: Instruction[];

  constructor(root: HTMLElement, options: Partial<Config> | undefined = {}) {
    this.config = {
      textNodeType: options.textNodeType || Node.TEXT_NODE,
      createTextNode:
        options.createTextNode || document.createTextNode.bind(document),
    };

    // Setup instructions cache.
    this.intructions = [];
    this.onUpdate = this.onUpdate.bind(this);

    // Setup initial data structures
    if (Array.isArray(root)) {
      this.mapping = root;
    } else if (typeof root === "object" && root.childNodes) {
      this.tree = AracariNode.from({
        originalNode: root,
        onUpdate: this.onUpdate,
        root: this,
      });
      this.root = root;
      this.mapping = this.getTextNodeMapping(this.tree);
    }
  }

  public getText() {
    return this.mapping.map(([text]) => text).join("");
  }

  public getAddressForText(
    text,
    caseSensitive: boolean = true,
    perserveWord: boolean = false
  ): string | null {
    const matchedNode = this.getMappingsForText(
      text,
      caseSensitive,
      perserveWord
    );
    return matchedNode && matchedNode[0] ? matchedNode[0][1] : null;
  }

  public getAddressesForText(
    text,
    caseSensitive: boolean = true,
    perserveWord: boolean = false
  ): string[] | null {
    const matchedNode = this.getMappingsForText(
      text,
      caseSensitive,
      perserveWord
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

  public replaceText(
    text: string,
    nodes: AracariNode | AracariNode[],
    // Need to add in cursorPosition
    // to support multiple words in the same text node
    options: ReplaceOptions = {}
  ) {
    let node;
    const { at, perserveWord, replacementIndex = 0 } = options;
    if (at) {
      node = this.getNodeByAddress(at);
    } else {
      node = this.getTextNode(text);
    }

    // Handling text around replacement text
    if (!node.textContent.match(text)) {
      throw new Error("Text not found in node");
    }
    const delimiter = perserveWord ? "\\b" : "";
    const contents = node.textContent.split(
      new RegExp(`${delimiter}${text}${delimiter}`, "g")
    );
    const preText = contents.slice(0, replacementIndex + 1);
    const postText = contents.slice(replacementIndex + 1);
    const replacementNodes = [
      this.maybeCreateTextNode(preText.join(text)),
      ...(Array.isArray(nodes) ? nodes : [nodes]),
      this.maybeCreateTextNode(postText.join(text)),
    ].filter((x) => x);

    // Replace existing text node with new nodelist.
    node.replaceWith(...replacementNodes);
    return this;
  }

  public remap(mapping?: Mapping) {
    this.mapping = mapping ?? this.getTextNodeMapping(this.tree);
    return this;
  }

  public getNodeByAddress(address: string) {
    const path = address.split(".").map((i) => parseInt(i, 10));
    return this.walkNodes(this.tree, path);
  }

  public createElement() {
    const nodeType = NodeType.HTMLElement;
    const node = AracariNode.from({
      originalNode: {
        nodeType,
        childNodes: null,
      },
      onUpdate: this.onUpdate,
    });
    this.onUpdate({
      target: null,
      type: InstructionType.CreateElement,
      value: node,
    });
    return node;
  }

  public createTextNode(textContent: string) {
    const nodeType = NodeType.Text;
    const node = AracariNode.from({
      originalNode: {
        nodeType,
        childNodes: null,
        textContent: textContent,
      },
    });
    this.onUpdate({
      target: null,
      type: InstructionType.CreateText,
      value: textContent,
    });
    return node;
  }

  // Takes a node and path and then will recursively call itself
  // to find the node or return undefined
  public walkNodes(
    parent: AracariNode | undefined,
    path: number[]
  ): AracariNode | undefined {
    if (!path.length || !parent) {
      return parent;
    }
    const newPath = [...path];
    const childNth = newPath.shift();
    const child = parent.childNodes[childNth];
    return this.walkNodes(child, newPath);
  }

  public getDiff() {
    return this.intructions;
  }

  public getAddressFromNode(node: AracariNode, path: number[] = []): string {
    if (node === this.tree) {
      return path.join(".");
    }
    if (!node.parentNode) {
      throw new Error("Unable address of node, not in same node tree");
    }
    const newPath = [...path];
    const nodeIndex = node.parentNode.childNodes.indexOf(node);
    newPath.unshift(nodeIndex);
    return this.getAddressFromNode(node.parentNode, newPath);
  }

  private getMappingsForText(
    text: string,
    caseSensitive: boolean = true,
    perserveWord: boolean = false
  ): string[][] {
    const delimiter = perserveWord ? "\\b" : "";
    const pattern = new RegExp(
      `${delimiter}${text}${delimiter}`,
      `${caseSensitive ? "i" : ""}g`
    );
    return this.mapping.filter(([text]) => !!text.match(pattern));
  }

  private getMappingFromAddress(address: string): string[] | undefined {
    return this.mapping.find(([_text, nodeAddress]) => nodeAddress === address);
  }

  private maybeCreateTextNode(text: string) {
    const { createTextNode } = this.config;
    if (!text.length) {
      return null;
    }
    return this.createTextNode(text);
  }

  // Builds up a mapping of text and path to location of text node.
  // [['Foo Bar', '23.1.0.0']]
  private getTextNodeMapping(parent: AracariNode, path: number[] = []) {
    const { textNodeType } = this.config;
    return Array.from(parent.childNodes).flatMap((node, i) => {
      if (node.nodeType === textNodeType) {
        return [[node.textContent, [...path, i].join(".")]];
      }
      if (typeof node === "object" && node?.childNodes?.length) {
        return this.getTextNodeMapping(node, [...path, i]);
      }
      return [];
    });
  }

  private onUpdate(instruction: Instruction) {
    this.intructions.push(instruction);
    if (instruction.type === InstructionType.ReplaceWith) {
      this.remap();
    }
  }
}
