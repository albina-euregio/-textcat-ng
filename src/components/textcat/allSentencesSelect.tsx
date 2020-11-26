import { FunctionalComponent, h } from "preact";
import { useContext, useState } from "preact/hooks";
import plusSquare from "bootstrap-icons/icons/plus-square.svg";
import { t } from "../../i18n";
import {
  sentencePreview,
  WrittenPhrase,
  newSentence,
  defaultNewSentenceCurlyName
} from "../../model";
import { CatalogContext } from "./contexts";

interface Props {
  addWrittenPhrase: (writtenPhrase: WrittenPhrase) => void;
}

const AllSentencesSelect: FunctionalComponent<Props> = (props: Props) => {
  const catalog = useContext(CatalogContext);
  const [curlyName, setCurlyName] = useState(defaultNewSentenceCurlyName());
  return (
    <div class="block">
      <h2>{`${t("heading.allSentences")} `}</h2>
      <label class="d-flex mt-10">
        <select
          class="f-auto"
          value={curlyName}
          onChange={(e): void =>
            setCurlyName((e.target as HTMLSelectElement).value)
          }
        >
          {catalog.sentences.map(sentence => (
            <option key={sentence.curlyName} value={sentence.curlyName}>
              {sentencePreview(sentence, catalog)}
            </option>
          ))}
        </select>{" "}
        <button
          title={t("sentence.add")}
          onClick={(): void => props.addWrittenPhrase(newSentence(curlyName))}
        >
          <img src={plusSquare} width={16} height={16} />
        </button>
      </label>
    </div>
  );
};

export default AllSentencesSelect;