import { FC, useCallback, useEffect, useState } from 'react';
import { handleDiagramsEvent } from './handleDiagramsEvent';
import { Button } from './ui/Button';
import { NotificationBar } from './ui/NotificationBar';
import { useCustomElementContext } from './useCustomElementContext';

const editorWindowOrigin = "https://embed.diagrams.net";
const editorUrl = `${editorWindowOrigin}?embed=1&configure=1&libraries=1&saveAndExit=1&proto=json`;

export const IntegrationApp: FC = () => {
  const [editorWindow, setEditorWindow] = useState<null | Window>(null);
  const [isUnmountingNotificationBar, setIsUnmountingNotificationBar] = useState(false);

  const {
    config,
    value,
    setValue,
  } = useCustomElementContext({
    heightPadding: 100,
    emptyHeight: 80,
  });

  useEffect(() => {
    const listener = () => setTimeout(() => editorWindow?.closed && setIsUnmountingNotificationBar(true), 100);

    document.addEventListener("visibilitychange", listener);

    return () => document.removeEventListener("visibilitychange", listener);
  }, [editorWindow]);

  useEffect(() => {
    if (isUnmountingNotificationBar) {
      setTimeout(() => {
        setEditorWindow(null);
        setIsUnmountingNotificationBar(false);
      }, 500);
    }
  }, [isUnmountingNotificationBar]);

  const closeEditor = useCallback(() => {
    setIsUnmountingNotificationBar(true);
    editorWindow?.close();
  }, [editorWindow]);

  useEffect(() => {
    if (!editorWindow) {
      return;
    }
    const listener = handleDiagramsEvent({
      editorWindowOrigin,
      editorWindow,
      closeEditor,
      value,
      setValue,
      config,
    });
    window.addEventListener("message", listener);

    return () => window.removeEventListener("message", listener);
  }, [editorWindow, closeEditor, value]);

  const editDiagram = () => setEditorWindow(window.open(editorUrl, "_blank"));

  const focusEditor = () => editorWindow?.focus();

  return (
    <>
      {editorWindow && (
        <NotificationBar isUnmounting={isUnmountingNotificationBar}>
          You are currently editting the diagram.
          <Button isInverted onClick={focusEditor}>Go to the editor</Button>
          <Button isInverted onClick={closeEditor}>Close the editor</Button>
        </NotificationBar>
      )}
      <main className="container_center">
        {value
          ? <img
            height={value.dimensions.height}
            width={value.dimensions.width}
            src={value.dataUrl}
            onClick={editorWindow ? focusEditor : editDiagram}
            style={{
              border: config?.previewBorder ? `${config.previewBorder.color} solid ${config.previewBorder.weight}px` : undefined,
            }}
          />
          : <Button onClick={editorWindow ? focusEditor : editDiagram}>No diagram yet, click here to create one</Button>
        }
      </main>
    </>
  );
};

IntegrationApp.displayName = 'IntegrationApp';


