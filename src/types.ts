import { AracariNode } from "./nodes";

export interface Config {
  textNodeType: number;
  createTextNode?: (text: string) => Node;
}

export enum NodeType {
  HTMLElement = 1,
  Text = 3,
}

export interface ReplaceOptions {
  at?: string;
  perserveWord?: boolean;
  replacementIndex?: number;
}

export type Mapping = string[][];

export type MinimalNode = {
  nodeType: number;
  childNodes: ArrayLike<MinimalNode> | null | undefined;
  textContent?: string;
};

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
  value: MinimalNode[];
}

export interface CreateElementInstruction extends InstructionBase {
  type: InstructionType.CreateElement;
  value: MinimalNode;
}

export interface CreateTextInstruction extends InstructionBase {
  type: InstructionType.CreateText;
  value: string;
}

export type Instruction =
  | ReplaceWithInstruction
  | CreateElementInstruction
  | CreateTextInstruction;
