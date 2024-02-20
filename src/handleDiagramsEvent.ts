import * as tg from "@gabrielurbina/type-guard";
import { Config, Value } from "./useCustomElementContext";

type Params = Readonly<{
  editorWindowOrigin: string;
  editorWindow: Window;
  closeEditor: () => void;
  value: Value | null;
  setValue: (v: Value) => void;
  config: Config | null;
}>;

export const handleDiagramsEvent = ({ config, editorWindowOrigin, editorWindow, closeEditor, value, setValue }: Params) =>
  (event: any) => {
    if (event.origin !== editorWindowOrigin) {
      return;
    }
    const postMessage = createPostMessage(editorWindow, editorWindowOrigin);
    const data = JSON.parse(event.data);

    if (!isExpectedEvent(data)) {
      return;
    }

    const sendExportMessage = () => {
      postMessage({
        action: "export",
        format: config?.previewImageFormat?.format,
      });
    };

    // You can find more info about events and messages here https://www.diagrams.net/doc/faq/embed-mode
    switch (data.event) {
      case "init": {
        if (!value) {
          postMessage({
            action: "template",
            callback: true,
          });
        }
        else {
          postMessage({
            action: "load",
            xml: value?.xml ?? '',
            autosave: 1,
          });
        }
        return;
      }
      case "configure": {
        postMessage({
          action: "configure",
          config: config?.configuration ?? {},
        });
        return;
      }
      case "autosave": {
        sendExportMessage();
        return;
      }
      case "save": {
        sendExportMessage();
        if (data.exit) {
          closeEditor();
        }
        return;
      }
      case "export": {
        const svgStyleDef = config?.previewImageFormat?.format === "svg" ? createSvgStyleDef(config.previewImageFormat) : null;
        setValue({
          xml: data.xml,
          dataUrl: svgStyleDef ? replaceStyleDef(data.data, svgStyleDef) : data.data,
          dimensions: {
            width: Math.ceil(data.bounds.width),
            height: Math.ceil(data.bounds.height),
          },
        });
        return;
      }
      case "template": {
        postMessage({
          action: "load",
          xml: (data.blank || !data.xml) ? "" : data.xml,
          autosave: 1,
        });
        sendExportMessage();
        return;
      }
      case "exit": {
        closeEditor();
        return;
      }
    }
  };

const createSvgStyleDef = (config: Config["previewImageFormat"] & { format: "svg" }) => {
  switch (config.customFont?.customFontConfigType) {
    case undefined:
      return null;
    case "nameAndUrl":
      return `@font-face { font-family: "${config.customFont.fontName}"; src: url("${config.customFont.fontUrl}"); }`;
    case "fontFaceDefinition":
      return config.customFont.fontFaceDefinition;
    default:
      throw new Error(`Unknown customFontConfigType "${(config.customFont as any).customFontConfigType}"`);
  }
};

const replaceStyleDef = (dataUrl: string, newStyleDef: string): string => {
  const dataUrlPrefix = "data:image/svg+xml;base64,";
  const inputBase64 = dataUrl.replace(dataUrlPrefix, "");
  const inputBase64Bytes = Uint8Array.from(atob(inputBase64), m => m?.codePointAt(0) ?? 0);
  const decodedSvg = new TextDecoder().decode(inputBase64Bytes);

  // replace the style tag
  const svgWithReplacedStyleDef = decodedSvg.replace(/<defs><style type="text\/css">.+<\/style><\/defs>/, `<defs><style type="text/css">${newStyleDef}</style></defs>`);

  const resultBytes = new TextEncoder().encode(svgWithReplacedStyleDef);
  const resultBase64 = btoa(String.fromCodePoint(...resultBytes));

  return dataUrlPrefix + resultBase64;
};

type ExportMessage = Readonly<{
  action: "export";
  format: "svg" | "png" | undefined;
}>;

type LoadMessage = Readonly<{
  action: "load";
  xml: string;
  autosave?: 1;
}>;

type ConfigureMessage = Readonly<{
  action: "configure";
  config: Readonly<Record<string, unknown>>;
}>;

type TemplateMessage = Readonly<{
  action: "template";
  callback?: true;
}>;

const createPostMessage = (targetWindow: Window, windowOrigin: string) => (message: ExportMessage | LoadMessage | ConfigureMessage | TemplateMessage) =>
  targetWindow.postMessage(JSON.stringify(message), windowOrigin);

type InitEvent = Readonly<{
  event: "init";
}>;
type AutosaveEvent = Readonly<{
  event: "autosave";
}>;
type SaveEvent = Readonly<{
  event: "save";
  exit?: boolean;
}>;
type ExportEvent = Readonly<{
  event: "export";
  xml: string;
  data: string;
  bounds: Readonly<{
    width: number;
    height: number;
  }>;
}>;
type ExitEvent = Readonly<{
  event: "exit";
}>;
type ConfigureEvent = Readonly<{
  event: "configure";
}>;
type TemplateEvent = Readonly<{
  event: "template";
  xml?: string;
  blank?: boolean;
}>;

type PossibleEventsOrdered = readonly [InitEvent, AutosaveEvent, SaveEvent, ExportEvent, ExitEvent, ConfigureEvent, TemplateEvent];

type ExpectedEvent = PossibleEventsOrdered[number];

const isInitEvent: (v: unknown) => v is InitEvent = tg.ObjectOf({
  event: tg.ValueOf(["init" as const]),
});

const isAutosaveEvent: (v: unknown) => v is AutosaveEvent = tg.ObjectOf({
  event: tg.ValueOf(["autosave" as const]),
});

const isSaveEvent: (v: unknown) => v is SaveEvent = tg.ObjectOf({
  event: tg.ValueOf(["save" as const]),
  exit: tg.OptionalOf(tg.isBoolean),
});

const isExportEvent: (v: unknown) => v is ExportEvent = tg.ObjectOf({
  event: tg.ValueOf(["export" as const]),
  xml: tg.isString,
  data: tg.isString,
  bounds: tg.ObjectOf({
    width: tg.isNumber,
    height: tg.isNumber,
  }),
});

const isExitEvent: (v: unknown) => v is ExitEvent = tg.ObjectOf({
  event: tg.ValueOf(["exit" as const]),
});

const isConfigureEvent: (v: unknown) => v is ConfigureEvent = tg.ObjectOf({
  event: tg.ValueOf(["configure" as const]),
});

const isTemplateEvent: (v: unknown) => v is TemplateEvent = tg.ObjectOf({
  event: tg.ValueOf(["template"] as const),
  xml: tg.OptionalOf(tg.isString),
  blank: tg.OptionalOf(tg.isBoolean),
});

type MakeGuards<T, Accum extends readonly any[] = []> = T extends readonly [infer First, ...infer Rest]
  ? MakeGuards<Rest, [...Accum, tg.Guard<First>]>
  : Accum;

type EventGuards = MakeGuards<PossibleEventsOrdered>;

const eventGuards: EventGuards = [isInitEvent, isAutosaveEvent, isSaveEvent, isExportEvent, isExitEvent, isConfigureEvent, isTemplateEvent];

const isExpectedEvent: (v: unknown) => v is ExpectedEvent = tg.OneOf(eventGuards);

