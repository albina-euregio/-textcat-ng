import { FunctionalComponent, h } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import {
  buildTextcat,
  buildAllTextcat,
  TextCatalogue,
  translateAll,
  Translations
} from "../model";
import { CatalogContext } from "./textcat/contexts";
import BulletinComposer from "./textcat/bulletinComposer";
import {
  arrayMove,
  defaultLang,
  defaultWrittenText,
  Lang,
  LANGUAGES,
  newSentence,
  WrittenText
} from "../model";
import TranslationPreview from "./textcat/translationPreview";
import { usePmData } from "./textcat/pmData";
import TextcatFooter from "./textcat/textcatFooter";
import { t, setI18nLang } from "../i18n";

const App: FunctionalComponent = () => {
  const [srcRegion, setSrcRegion] = useState<string>("");

  const [srcLang, setSrcLang] = useState<Lang>(defaultLang());
  const [catalog, setCatalog] = useState<TextCatalogue>(
    new TextCatalogue(srcLang)
  );
  useEffect(() => {
    buildTextcat(srcLang).then(c => setCatalog(c));
    setI18nLang(srcLang);
  }, [srcLang]);

  const [writtenTexts, setWrittenTexts] = useState<WrittenText[]>([
    defaultWrittenText()
  ]);

  const [catalogs, setCatalogs] = useState<TextCatalogue[]>([]);
  useEffect(() => {
    buildAllTextcat().then(cs => setCatalogs(cs));
  }, []);
  const translations: Translations = useMemo(
    () => translateAll(catalogs, writtenTexts),
    [catalogs, writtenTexts]
  );

  const { postPmData } = usePmData(setSrcLang, setWrittenTexts);

  return (
    <section>
      <h1 class="d-none">textcat-ng</h1>

      <h2>
        {`${t("input")} `}
        <small>
          <label>
            {`[${t("language")}: `}
            <select
              value={srcLang}
              onChange={(e): void =>
                setSrcLang((e.target as HTMLSelectElement).value as Lang)
              }
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            {"]"}
          </label>{" "}
          <label>
            {`[${t("region")}: `}
            <select
              value={srcRegion}
              onChange={(e): void =>
                setSrcRegion((e.target as HTMLSelectElement).value)
              }
            >
              <option value=""></option>
              {Array.from(catalog.regions)
                .sort()
                .map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
            </select>
            {"]"}
          </label>
        </small>
      </h2>

      <CatalogContext.Provider value={catalog}>
        <BulletinComposer
          writtenTexts={writtenTexts}
          srcRegion={srcRegion}
          updateWrittenText={(newText, index): void =>
            setWrittenTexts(ts => {
              const newTexts = [...ts];
              newTexts[index] = newText;
              return newTexts;
            })
          }
          addSentence={(curlyName): void =>
            setWrittenTexts(ts => [...ts, newSentence(curlyName)])
          }
          moveSentence={(index, direction): void => {
            setWrittenTexts(ts =>
              arrayMove(
                ts,
                index,
                direction === 0 ? undefined : index + direction
              )
            );
          }}
        />
      </CatalogContext.Provider>

      <h2>{t("translations")}</h2>
      <TranslationPreview
        translations={translations}
        writtenTexts={writtenTexts}
      />
      <input
        type="submit"
        value={t("translations.submit")}
        onClick={(): void => postPmData(writtenTexts, translations)}
      />

      <TextcatFooter />
    </section>
  );
};

export default App;
