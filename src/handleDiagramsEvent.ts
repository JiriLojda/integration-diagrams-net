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
        format: "svg",
      });
    };

    // You can find more info about events and messages here https://www.diagrams.net/doc/faq/embed-mode
    switch (data.event) {
      case "init": {
        postMessage({
          action: "load",
          xml: value?.xml ?? '',
          autosave: 1,
        });
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
        setValue({
          xml: data.xml,
          dataUrl: data.data,
          dimensions: {
            width: Math.ceil(data.bounds.width),
            height: Math.ceil(data.bounds.height),
          },
        });
        return;
      }
      case "exit": {
        closeEditor();
        return;
      }
    }
  }

type ExportMessage = Readonly<{
  action: "export";
  format: "svg";
}>;

type LoadMessage = Readonly<{
  action: "load";
  xml: string;
  autosave?: 1;
}>;

type ConfigureMessage = Readonly<{
  action: "configure",
  config: Readonly<Record<string, unknown>>;
}>;

const createPostMessage = (targetWindow: Window, windowOrigin: string) => (message: ExportMessage | LoadMessage | ConfigureMessage) =>
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

type PossibleEventsOrdered = readonly [InitEvent, AutosaveEvent, SaveEvent, ExportEvent, ExitEvent, ConfigureEvent];

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

type MakeGuards<T, Accum extends readonly any[] = []> = T extends readonly [infer First, ...infer Rest]
  ? MakeGuards<Rest, [...Accum, tg.Guard<First>]>
  : Accum;

type EventGuards = MakeGuards<PossibleEventsOrdered>;

const eventGuards: EventGuards = [isInitEvent, isAutosaveEvent, isSaveEvent, isExportEvent, isExitEvent, isConfigureEvent];

const isExpectedEvent: (v: unknown) => v is ExpectedEvent = tg.OneOf(eventGuards);

