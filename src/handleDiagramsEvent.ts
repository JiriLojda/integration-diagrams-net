import * as tg from "@gabrielurbina/type-guard";
import { Value } from "./useCustomElementContext";

export const handleDiagramsEvent = (windowOrigin: string, editorWindow: Window, closeEditWindow: () => void, value: Value | null, saveValue: (v: Value) => void) =>
  (event: any) => {
    if (event.origin !== windowOrigin) {
      return;
    }
    const postMessage = createPostMessage(editorWindow, windowOrigin);
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
      case "autosave": {
        sendExportMessage();
        return;
      }
      case "save": {
        sendExportMessage();
        if (data.exit) {
          closeEditWindow();
        }
        return;
      }
      case "export": {
        saveValue({
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
        closeEditWindow();
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

const createPostMessage = (targetWindow: Window, windowOrigin: string) => (message: ExportMessage | LoadMessage) =>
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

type ExpectedEvent = InitEvent | AutosaveEvent | SaveEvent | ExportEvent | ExitEvent;

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

const isExportEvent: (v: unknown) => v is ExpectedEvent = tg.ObjectOf({
  event: tg.ValueOf(["export" as const]),
  xml: tg.isString,
  data: tg.isString,
  bounds: tg.ObjectOf({
    width: tg.isNumber,
    height: tg.isNumber,
  }),
});

const isExpectedEvent: (v: unknown) => v is ExpectedEvent = tg.OneOf([isInitEvent, isAutosaveEvent, isSaveEvent, isExportEvent]);

