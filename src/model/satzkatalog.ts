import { Identifier, Lang, Phrase, Sentence } from ".";
import { WrittenText, getPhrase } from "./writtenText";
import { IntlText, mergeIntlText } from "./intlText";
import { mapLinePhrase } from "./phrase";

export interface TextcatCatalog {
  sentence(curlyName: Identifier): Sentence | undefined;
  searchSentences(search: string): Sentence[];
  phrase(curlyName: Identifier): Phrase | undefined;
  translate(writtenTexts: WrittenText[]): IntlText;
}

type Data = Record<Identifier, Sentence | Phrase>;

export class Satzkatalog implements TextcatCatalog {
  private data: Data = {};

  sentence(curlyName: Identifier): Sentence | undefined {
    const sentence = this.data[curlyName];
    return sentence?.$type === "Sentence" ? sentence : undefined;
  }

  searchSentences(): Sentence[] {
    return [];
  }

  phrase(curlyName: Identifier): Phrase | undefined {
    const phrase = this.data[curlyName];
    return phrase?.$type === "Phrase" ? phrase : undefined;
  }

  parse(text: string, lang: Lang): void {
    let current: Sentence | Phrase | undefined;
    let currentRegion: string | undefined = undefined;
    text.split(/[\r\n]+/).forEach(line => {
      if (!line) {
        return;
      }
      const [key, value] = line.split(/\s*:\s*/, 2);
      switch (key) {
        case "ST_Header":
          current = {
            $type: "Sentence",
            header: { [lang]: value },
            curlyName: "",
            pos: [],
            posGerman: [],
            phrases: []
          };
          break;
        case "ST_CurlyName":
          if (current?.$type === "Sentence") {
            current.curlyName = value;
            this.data[current.curlyName] = current;
          } else {
            console.warn("Ignoring", line);
          }
          break;
        case "PA_Pos":
          if (current?.$type === "Sentence") {
            current.pos?.push(+value);
          } else {
            console.warn("Ignoring", line);
          }
          break;
        case "PA_PosGerman":
          if (current?.$type === "Sentence") {
            current.posGerman?.push(+value);
          } else {
            console.warn("Ignoring", line);
          }
          break;
        case "RS_Header":
          current = {
            $type: "Phrase",
            header: { [lang]: value },
            curlyName: "",
            lines: []
          };
          break;
        case "RS_CurlyName":
          if (current?.$type === "Sentence") {
            current.phrases?.push(value);
          } else if (current?.$type === "Phrase") {
            current.curlyName = value;
            this.data[current.curlyName] = current;
          }
          break;
        case "Line":
          if (current?.$type === "Phrase") {
            current.lines?.push({
              line: { [lang]: value },
              linePhrases: (value.match(/{[^}]+}|[^{}]+/g) ?? []).map(
                phrase => ({
                  [lang]: phrase
                })
              ),
              region: currentRegion
            });
          }
          break;
        case "Begin":
          currentRegion = value;
          break;
        case "End":
          currentRegion = undefined;
          break;
        default:
          console.warn("Ignoring", line);
      }
    });
  }

  translate(writtenTexts: WrittenText[]): IntlText {
    return writtenTexts
      .map(writtenText => this.translateSentence(writtenText))
      .reduce(mergeIntlText);
  }

  private translateSentence(writtenText: WrittenText): IntlText {
    const sentence = this.sentence(writtenText.curlyName);
    if (!sentence)
      throw new Error(`Unknown sentence ${writtenText.curlyName}!`);
    return sentence.phrases
      .map(phrase => this.translatePhrase(getPhrase(writtenText, phrase)))
      .reduce(mergeIntlText);
  }

  private translatePhrase(writtenText: WrittenText): IntlText {
    const phrase = this.phrase(writtenText.curlyName);
    if (!phrase) throw new Error(`Unknown phrase ${writtenText.curlyName}!`);
    const line = phrase?.lines[writtenText.line];
    const linePhrases = line?.linePhrases;
    if (!line || !linePhrases)
      throw new Error(
        `Unknown line ${writtenText.line} in phrase ${writtenText.curlyName}!`
      );
    return linePhrases
      .map(linePhrase =>
        mapLinePhrase(
          linePhrase,
          curlyName => this.translatePhrase(getPhrase(writtenText, curlyName)),
          text => text
        )
      )
      .reduce(mergeIntlText);
  }
}

export async function buildTextcat(): Promise<TextcatCatalog> {
  // awk '{print $0}' DE/Sentences/* DE/Ranges/* > assets/satzkatalog.DE.txt
  const response = await fetch("/assets/satzkatalog.DE.txt");
  const text = await response.text();

  const catalog = new Satzkatalog();
  console.time("parse satzkatalog.DE.txt");
  catalog.parse(text, "de");
  console.timeEnd("parse satzkatalog.DE.txt");
  return catalog;
}
