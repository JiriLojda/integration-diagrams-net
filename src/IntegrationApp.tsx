import { FC, useCallback, useEffect, useRef, useState } from 'react';

const windowOrigin = "https://embed.diagrams.net";
const iframeUrl = `${windowOrigin}?embed=1&libraries=1&saveAndExit=1&proto=json`;

export const IntegrationApp: FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [elementValue, setElementValue] = useState<Value | null>(null);
  const [editWindow, setEditWindow] = useState<null | Window>(null);

  const setValue = useCallback((v: Value) => {
    setElementValue(v);
    CustomElement.setValue(JSON.stringify(v));
  }, []);

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isConfig(element.config)) {
        // throw new Error('Invalid configuration of the custom element. Please check the documentation.');
      }

      setConfig(element.config);
      setIsDisabled(element.disabled);
      setElementValue(JSON.parse(element.value || "null"));
    });
  }, []);

  useEffect(() => {
    CustomElement.setHeight(1200);
  }, []);

  useEffect(() => {
    CustomElement.onDisabledChanged(setIsDisabled);
  }, []);

  useEffect(() => {
    const listener = () => setTimeout(() => editWindow?.closed && setEditWindow(null), 100);

    document.addEventListener("visibilitychange", listener);

    return () => document.removeEventListener("visibilitychange", listener);
  }, [editWindow]);

  console.log(editWindow);

  useEffect(() => {
    if (!editWindow) {
      return;
    }
    const listener = eventHandler(editWindow, () => setEditWindow(null), elementValue, setValue);
    window.addEventListener("message", listener);

    return () => window.removeEventListener("message", listener);
  }, [editWindow, elementValue]);

  const editDiagram = () => setEditWindow(window.open(iframeUrl, "_blank"));

  const focusEditor = () => editWindow?.focus();

  // if (!config) {
  //   return null;
  // }

  return (
    <>
      {editWindow && <div>You are currently editting the diagram.</div>}
      {elementValue
        ? <img src={elementValue.dataUrl} onClick={editWindow ? focusEditor : editDiagram} />
        : <button onClick={editWindow ? focusEditor : editDiagram}>No diagram yet, click here to create one</button>
      }
    </>
  );
};

IntegrationApp.displayName = 'IntegrationApp';

type Config = Readonly<{
  // expected custom element's configuration
}>;

// check it is the expected configuration
const isConfig = (v: unknown): v is Config =>
  isObject(v);

const hasProperty = <PropName extends string, Input extends {}>(propName: PropName, v: Input): v is Input & { [key in PropName]: unknown } =>
  v.hasOwnProperty(propName);

const isObject = (v: unknown): v is {} =>
  typeof v === 'object' &&
  v !== null;

const nameOf = <Obj extends Readonly<Record<string, unknown>>>(prop: keyof Obj) => prop;

type Value = Readonly<{
  xml: string;
  dataUrl: string;
}>;

const eventHandler = (editorWindow: Window, onEditWindowClosed: () => void, value: Value | null, saveValue: (v: Value) => void) => (event: any) => {
  if (event.origin !== windowOrigin) {
    return;
  }
  const data = JSON.parse(event.data);

  const sendExportMessage = () => {
    editorWindow.postMessage(JSON.stringify({
      action: "export",
      format: "svg",
    }), "*");
  };

  switch (data.event) {
    case "init": {
      editorWindow.postMessage(JSON.stringify({
        action: "load",
        xml: value?.xml ?? '',
        autosave: 1,
      }), "*");
      return;
    }
    case "autosave": {
      sendExportMessage();
      return;
    }
    case "save": {
      sendExportMessage();
      if (data.exit) {
        editorWindow.close();
        onEditWindowClosed();
      }
      return;
    }
    case "export": {
      saveValue({
        xml: data.xml,
        dataUrl: data.data,
      });
      return;
    }
    case "exit": {
      editorWindow.close();
      onEditWindowClosed();
      return;
    }
  }
}
