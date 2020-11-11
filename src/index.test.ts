import { Aracari } from ".";

// Taken from https://en.wikipedia.org/wiki/Aracari
const html = `<p>An <b>aracari</b> or <b>araçari</b> (<span class="rt-commentedText nowrap"><small><a href="/wiki/American_English" title="American English">US</a>: </small><span class="IPA nopopups noexcerpt"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span style="border-bottom:1px dotted"><span title="/ˌ/: secondary stress follows">ˌ</span><span title="/ɑːr/: 'ar' in 'far'">ɑːr</span><span title="/ə/: 'a' in 'about'">ə</span><span title="/ˈ/: primary stress follows">ˈ</span><span title="'s' in 'sigh'">s</span><span title="/ɑːr/: 'ar' in 'far'">ɑːr</span><span title="/i/: 'y' in 'happy'">i</span></span>/</a></span></span> <a href="/wiki/Help:Pronunciation_respelling_key" title="Help:Pronunciation respelling key"><i title="English pronunciation respelling"><span style="font-size:90%">AR</span>-ə-<span style="font-size:90%">SAR</span>-ee</i></a>,<sup id="cite_ref-1" class="reference"><a href="#cite_note-1">[1]</a></sup> <span class="rt-commentedText nowrap"><small><a href="/wiki/British_English" title="British English">UK</a>: </small><span class="IPA nopopups noexcerpt"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span style="border-bottom:1px dotted"><span title="/ˌ/: secondary stress follows">ˌ</span><span title="/ær/: 'arr' in 'marry'">ær</span><span title="/ə/: 'a' in 'about'">ə</span><span title="/ˈ/: primary stress follows">ˈ</span><span title="'s' in 'sigh'">s</span><span title="/ɑːr/: 'ar' in 'far'">ɑːr</span><span title="/i/: 'y' in 'happy'">i</span></span>/</a></span></span> <a href="/wiki/Help:Pronunciation_respelling_key" title="Help:Pronunciation respelling key"><i title="English pronunciation respelling"><span style="font-size:90%">ARR</span>-ə-<span style="font-size:90%">SAR</span>-ee</i></a>, <span class="rt-commentedText nowrap"><span class="IPA nopopups noexcerpt"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/-<span style="border-bottom:1px dotted"><span title="/ˈ/: primary stress follows">ˈ</span><span title="'k' in 'kind'">k</span><span title="/ɑːr/: 'ar' in 'far'">ɑːr</span><span title="/i/: 'y' in 'happy'">i</span></span>/</a></span></span> <a href="/wiki/Help:Pronunciation_respelling_key" title="Help:Pronunciation respelling key"><i title="English pronunciation respelling">-⁠<span style="font-size:90%">KAR</span>-ee</i></a>)<sup id="cite_ref-2" class="reference"><a href="#cite_note-2">[2]</a></sup> is any of the medium-sized <a href="/wiki/Toucan" title="Toucan">toucans</a> that, together with the <a href="/wiki/Saffron_toucanet" title="Saffron toucanet">saffron toucanet</a>, make up the genus <i><b>Pteroglossus</b></i>.</p>`;

describe("Aracari", () => {
  let aracari: Aracari | undefined;
  beforeEach(() => {
    const element = document.createElement("div");
    element.innerHTML = html;
    aracari = new Aracari(element);
  });
  test("getText should return no html", () => {
    expect(aracari.getText()).toEqual(
      `An aracari or araçari (US: /ˌɑːrəˈsɑːri/ AR-ə-SAR-ee,[1] UK: /ˌærəˈsɑːri/ ARR-ə-SAR-ee, /-ˈkɑːri/ -⁠KAR-ee)[2] is any of the medium-sized toucans that, together with the saffron toucanet, make up the genus Pteroglossus.`
    );
  });
  test("isInSingleNode should be true if a text is passed from a single text node", () => {
    expect(aracari.isInSingleNode("toucans")).toBe(true);
  });
  test("isInSingleNode should be false if a text is passed from a multiple text nodes", () => {
    expect(aracari.isInSingleNode("An aracari")).toBe(false);
  });
  test("getAddressForText should return the correct address for text", () => {
    expect(aracari.getAddressForText("toucans")).toBe("0.21.0");
  });
  test("getTextByAddress should return the correct address for text", () => {
    expect(aracari.getTextByAddress("0.21.0")).toBe("toucans");
  });
  test("getTextNode should return a text node when passed text in a single node.", () => {
    const node = aracari.getTextNode("toucans");
    expect(node.nodeType).toBe(Node.TEXT_NODE);
    expect(node.textContent).toEqual("toucans");
  });
  test("replaceText should replace text nodes with passed text nodes", () => {
    const parentNode = aracari.getTextNode("toucans").parentNode;
    // Create some new nodes
    const adjective = document.createElement("strong");
    adjective.textContent = "hermosa";
    const replacementNodes = [adjective, document.createTextNode(" toucans")];

    // Check initial nodes
    expect(parentNode.childNodes.length).toBe(1);
    aracari.replaceText("toucans", replacementNodes).remap();
    // Check to see that there is more nodes now
    expect(parentNode.childNodes.length).toBe(2);
    expect(aracari.getText()).toEqual(
      `An aracari or araçari (US: /ˌɑːrəˈsɑːri/ AR-ə-SAR-ee,[1] UK: /ˌærəˈsɑːri/ ARR-ə-SAR-ee, /-ˈkɑːri/ -⁠KAR-ee)[2] is any of the medium-sized hermosa toucans that, together with the saffron toucanet, make up the genus Pteroglossus.`
    );
  });

  test("replaceText should replace text nodes with passed text nodes", () => {
    const parentNode = aracari.getTextNode("toucans").parentNode;
    const adjective = document.createElement("strong");
    adjective.textContent = "hermosa";
    const replacementNodes = [adjective, document.createTextNode(" toucans")];

    expect(parentNode.childNodes.length).toBe(1);
    aracari.replaceText("toucans", replacementNodes).remap();
    expect(parentNode.childNodes.length).toBe(2);
    expect(aracari.getText()).toEqual(
      `An aracari or araçari (US: /ˌɑːrəˈsɑːri/ AR-ə-SAR-ee,[1] UK: /ˌærəˈsɑːri/ ARR-ə-SAR-ee, /-ˈkɑːri/ -⁠KAR-ee)[2] is any of the medium-sized hermosa toucans that, together with the saffron toucanet, make up the genus Pteroglossus.`
    );
  });
  test("replaceText should replace text nodes with passed text nodes at a specific address if passed", () => {
    const parentNode = aracari.getTextNode("the").parentNode;
    const node = document.createElement("strong");
    node.textContent = "el";
    const replacementNodes = [node];

    aracari.replaceText("the", replacementNodes, { at: "0.24" }).remap();
    expect(aracari.getText()).toEqual(
      `An aracari or araçari (US: /ˌɑːrəˈsɑːri/ AR-ə-SAR-ee,[1] UK: /ˌærəˈsɑːri/ ARR-ə-SAR-ee, /-ˈkɑːri/ -⁠KAR-ee)[2] is any of the medium-sized toucans that, together with the saffron toucanet, make up el genus Pteroglossus.`
    );
  });
  test("replaceText should replace text and make sure to perserve other text in the text node", () => {
    const node = aracari.getTextNode("genus");
    const parentNode = node.parentNode;
    const replacementNode = document.createTextNode("genus");

    // This is the amount of nodes in the original document
    expect(parentNode.childNodes.length).toBe(27);
    // Test to make sure we are looking at the correct node
    expect(node.textContent).toBe(", make up the genus ");
    aracari.replaceText("genus", replacementNode).remap();
    const newNode = aracari.getTextNode("genus");
    // Correct node added
    expect(newNode).toBe(replacementNode);
    // Two nodes appended around the replacement node
    expect(parentNode.childNodes.length).toBe(29);
    // Check sibling content
    expect(newNode.previousSibling.textContent).toBe(", make up the ");
    expect(newNode.nextSibling.textContent).toBe(" ");

    expect(aracari.getText()).toEqual(
      `An aracari or araçari (US: /ˌɑːrəˈsɑːri/ AR-ə-SAR-ee,[1] UK: /ˌærəˈsɑːri/ ARR-ə-SAR-ee, /-ˈkɑːri/ -⁠KAR-ee)[2] is any of the medium-sized toucans that, together with the saffron toucanet, make up the genus Pteroglossus.`
    );
  });
  test("replaceText should be to perserve text when there is two instances of the same word in a single text node", () => {
    const element = document.createElement("div");
    element.innerHTML = "<p>all the foo people are all bar</p>";
    aracari = new Aracari(element);
    aracari.replaceText("all", [document.createTextNode("todo")]).remap();
    expect(aracari.getText()).toBe("todo the foo people are all bar");
  });
  test("replaceText when passed an option of perserveWord should not replace fragments", () => {
    const element = document.createElement("div");
    element.innerHTML = "<p>Done is the one thing.</p>";
    aracari = new Aracari(element);
    aracari
      .replaceText("one", [document.createTextNode("uno")], {
        perserveWord: true,
      })
      .remap();
    expect(aracari.getText()).toBe("Done is the uno thing.");
  });
  test("replaceText when passed an option of perserveWord and a sentence should still work", () => {
    const element = document.createElement("div");
    element.innerHTML = "<p>Foo bar or oo bar</p>";
    aracari = new Aracari(element);
    aracari
      .replaceText("oo bar", [document.createTextNode("foo bar")], {
        perserveWord: true,
      })
      .remap();
    expect(aracari.getText()).toBe("Foo bar or foo bar");
  });
});
