import { AracariNode } from "./AracariNode";
import {
  Instruction,
  InstructionType,
  Config,
  Mapping,
  ReplaceOptions,
  NodeType,
  MinimalNode,
} from "./types";

export class Aracari {
  root: HTMLElement | AracariNode | MinimalNode;
  mapping: string[][];
  config: Config;
  tree: AracariNode;
  intructions: Instruction[];

  constructor(
    root: HTMLElement | AracariNode | MinimalNode,
    options: Partial<Config> | undefined = {}
  ) {
    this.config = {
      textNodeType: options.textNodeType || Node.TEXT_NODE,
      createTextNode:
        options.createTextNode || document.createTextNode.bind(document),
    };

    // Setup instructions cache.
    this.intructions = [];
    this.onUpdate = this.onUpdate.bind(this);

    // Setup initial data structures
    const isRootAracariNode =
      "__type" in root && root.__type === AracariNode.prototype.__type;
    this.tree = AracariNode.from({
      // @ts-ignore
      originalNode: root,
      onUpdate: this.onUpdate,
      root: this,
    });
    if (!isRootAracariNode) {
      this.root = root;
    }
    this.mapping = this.getTextNodeMapping(this.tree);
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

    const delimiter = perserveWord ? "\\b" : "";
    const pattern = new RegExp(`${delimiter}${text}${delimiter}`, "g");

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

    // Replace existing text node with new nodelist.
    node.replaceWith(...replacementNodes);
    return this;
  }

  public getNodeByAddress(address: string, base?: HTMLElement) {
    const path = address.split(".").map((i) => parseInt(i, 10));
    // @ts-ignore
    return this.walkNodes(base ?? this.tree, path);
  }

  public createElement() {
    const nodeType = NodeType.HTMLElement;
    const node = AracariNode.from({
      originalNode: {
        nodeType,
        childNodes: null,
      },
      onUpdate: this.onUpdate,
      root: this,
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
      onUpdate: this.onUpdate,
      root: this,
    });
    this.onUpdate({
      target: null,
      type: InstructionType.CreateText,
      value: node,
    });
    return node;
  }

  // Takes a node and path and then will recursively call itself
  // to find the node or return undefined
  public walkNodes(
    parent: MinimalNode | undefined,
    path: number[]
  ): MinimalNode | undefined {
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

  public hydrateDiff(instructions: Instruction[]) {
    this.intructions = instructions;
    return this;
  }

  public commit() {
    const nodes: Record<string, Text | HTMLElement> = {};
    this.intructions.forEach((instruction) => {
      // apply instructions to actual DOM.
      // these should be a configuration
      // that can be passed, sorta like a reconsiler
      switch (instruction.type) {
        case InstructionType.CreateText:
          nodes[instruction.value.id] = document.createTextNode(
            instruction.value.textContent
          );
          if (instruction.target) {
            const node = nodes[instruction.target];
            node?.appendChild(nodes[instruction.value.id]);
          }
          break;
        case InstructionType.CreateElement: {
          nodes[instruction.value.id] = document.createElement("span");
          break;
        }
        case InstructionType.ReplaceWith: {
          const targetNode = this.getNodeByAddress(
            instruction.target,
            // @ts-ignore
            this.root
          );
          targetNode?.replaceWith(
            // @ts-ignore
            ...instruction.value.map((node) => nodes[node.id])
          );
          break;
        }
      }
    });
    this.intructions = [];
  }

  public getAddressFromNode(node: AracariNode, path: number[] = []): string {
    if (node === this.tree) {
      return path.join(".");
    }
    if (!node.parentNode) {
      throw new Error("Unable to get address of node, not in same node tree");
    }
    const newPath = [...path];
    const nodeIndex = node.parentNode.childNodes.indexOf(node);
    newPath.unshift(nodeIndex);
    return this.getAddressFromNode(node.parentNode, newPath);
  }

  private remap() {
    this.mapping = this.getTextNodeMapping(this.tree);
    return this;
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
