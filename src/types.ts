export interface Config {
  textNodeType: number;
  reconciler?: AracariReconciler;
}

export enum NodeType {
  HTMLElement = 1,
  Text = 3,
}

export interface ReplaceOptions {
  at?: string;
  preserveWord?: boolean;
  replacementIndex?: number;
}

export type Mapping = Array<[string, string]>;

export interface MinimalBaseNode {
  parentNode?: MinimalNode;
  nodeType: number;
  childNodes?: ArrayLike<MinimalNode>;
  textContent?: string;
  previousSibling?: MinimalNode;
  nextSibling?: MinimalNode;
  replaceWith?: (...nodes: MinimalNode[]) => void;
}

export interface MinimalVirtualNode extends MinimalBaseNode {
  id?: string;
}

export type MinimalNode = MinimalBaseNode | MinimalVirtualNode;

export enum InstructionType {
  CreateElement = "CREATE_ELEMENT",
  CreateText = "CREATE_TEXT",
  ReplaceWith = "REPLACE_WITH",
}

export interface InstructionBase {
  target: string | null;
}

export interface ReplaceWithInstruction extends InstructionBase {
  type: InstructionType.ReplaceWith;
  value: MinimalVirtualNode[];
}

export interface CreateElementInstruction extends InstructionBase {
  type: InstructionType.CreateElement;
  value: MinimalVirtualNode & { tagName: string };
}

export interface CreateTextInstruction extends InstructionBase {
  type: InstructionType.CreateText;
  value: MinimalVirtualNode;
}

export type Instruction =
  | ReplaceWithInstruction
  | CreateElementInstruction
  | CreateTextInstruction;

export interface AracariReconciler {
  onCreateTextNode: (text: string) => Text;
  onCreateElement: (tagName: string) => HTMLElement;
  onReplaceWith: (
    target: Text | HTMLElement,
    replacements: Array<Text | HTMLElement>
  ) => void;
}
