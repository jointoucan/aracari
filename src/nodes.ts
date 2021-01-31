// https://www.notion.so/jointoucan/Aracari-upgrades-90d50e5f7ba54e33b3a6a64093f81f3f

import { Instruction, InstructionType, MinimalNode, NodeType } from "./types";
import { Aracari } from ".";

interface AracariNodeOptions {
  originalNode: MinimalNode;
  parentNode?: AracariNode;
  onUpdate?: (instruction: Instruction) => void;
  root?: Aracari;
}

const noop = () => {};

export class AracariNode {
  nodeType: number;
  _content?: string;
  childNodes: AracariNode[];
  parentNode?: AracariNode;
  originalNode: MinimalNode;
  onUpdate: (instruction: Instruction) => void;
  root?: Aracari;

  // Need someway to load this in the background process.
  constructor({
    originalNode,
    parentNode,
    onUpdate,
    root,
  }: AracariNodeOptions) {
    this.nodeType = originalNode.nodeType;
    this.root = root;
    this.childNodes =
      originalNode.childNodes &&
      Array.from(originalNode.childNodes).map((node) =>
        AracariNode.from({
          originalNode: node,
          parentNode: this,
          onUpdate,
          root,
        })
      );
    this.parentNode = parentNode;
    if (this.nodeType === NodeType.Text) {
      this.textContent = originalNode.textContent;
    }

    this.onUpdate = onUpdate ?? noop;
  }

  get textContent() {
    return this._content;
  }

  set textContent(text) {
    if (this.nodeType === NodeType.HTMLElement) {
      this.onUpdate({
        target: this.root?.getAddressFromNode(this),
        type: InstructionType.CreateText,
        value: text,
      });
      const node = AracariNode.from({
        originalNode: {
          nodeType: NodeType.Text,
          textContent: text,
          childNodes: null,
        },
        parentNode: this,
      });
      this.childNodes = [node];
    } else {
      this._content = text;
    }
  }

  get previousSibling() {
    const nodeIndex = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[nodeIndex - 1];
  }

  get nextSibling() {
    const nodeIndex = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[nodeIndex + 1];
  }

  replaceWith(...nodes: AracariNode[]) {
    if (!this.parentNode) {
      throw new Error("Can not 'replaceWith' on node with no parent");
    }
    const nodeIndex = this.parentNode.childNodes.indexOf(this);

    if (nodeIndex === -1) {
      throw new Error(
        "Can not 'replaceWith' because unable to find 'childNode' in 'parentNode' "
      );
    }

    const { parentNode } = this;
    const { childNodes } = parentNode;
    const targetAddress = this.root?.getAddressFromNode(this);
    const insertableChildNodes = Array.isArray(nodes) ? nodes : [nodes];
    insertableChildNodes
      .filter((x) => x)
      .forEach((node) => {
        node.parentNode = parentNode;
      });

    const appendedChildNodes = [
      ...childNodes.slice(0, nodeIndex),
      ...insertableChildNodes,
      ...childNodes.slice(nodeIndex + 1),
    ];
    parentNode.childNodes = appendedChildNodes;
    this.onUpdate({
      target: targetAddress,
      type: InstructionType.ReplaceWith,
      value: appendedChildNodes,
    });
  }

  toJSON() {
    const { nodeType, childNodes, textContent } = this;
    return {
      nodeType,
      textContent: nodeType === NodeType.Text ? textContent : undefined,
      childNodes:
        childNodes &&
        Array.from(childNodes).map((node) =>
          AracariNode.prototype.toJSON.call(node)
        ),
    };
  }

  static from({
    originalNode,
    parentNode,
    onUpdate,
    root,
  }: AracariNodeOptions) {
    return new AracariNode({ originalNode, parentNode, onUpdate, root });
  }
}
