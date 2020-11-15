<img src="./assets/aracari.svg" height="300" style="float: right; margin-left: 10px margin-bottom: 10px" />

# Aracari

This is a small utility to pull text from html and also replace text in html. This is used to be able to do text replacement in a html document without messing with any html elements or breaking any references.

## Usage

Aracari takes a DOM node and gives you a series of tools to deal with the text in that DOM node. If you want the full text no html you can have that. If you want to safely replace the text in a node you can do that as well.

```shell
npm install aracari --save
# or
yarn add aracari
```

### Initializing

To setup aracari you just need to pass a root element to the constructor.

```typescript
import { Aracari } from "aracari";

const aracari = new Aracari(document.getElementById("content"));
```

### Getting text

After initializing aracari you just need to call `getText` to pull the text from
aracari.

```typescript
const aracari = new Aracari(document.getElementById("content"));
const text = aracari.getText(); // Text of #content no html.
// text: This is aracari!
```

### Replacing text

To replace text with aracari it needs to be in a single text node. This is so aracari does not have to evaluate html. We have a set of tools to test if a given word is in a single text node it will replace it. If its not a single text node it will simply not replace it.

```typescript
// Check for node.
const canReplace = aracari.isInSingleNode("aracari");

if (canReplace) {
  // Replace on the fly text on a page with other TextNodes or
  // DOM nodes.
  // Build up some DOM nodes.
  const boldNode = document.createElement("strong");
  bold.textContent = "araçari";
  const textNode = document.createTextNode("a hermosa ");
  // Do the replacment and reload aracari cache.
  const newText = aracari
    .replaceText("aracari", [textNode, boldNode])
    .remap() // changes internal mapping (not need if used as side effect)
    .text();
  // newText: This is a hermosa aracari!
  // html will be updated with new nodes
}
```
