import { FC, useCallback, useEffect, useState } from 'react';
import { handleDiagramsEvent } from './handleDiagramsEvent';
import { Button } from './ui/Button';
import { NotificationBar } from './ui/NotificationBar';
import { useCustomElementContext, Value } from './useCustomElementContext';

const windowOrigin = "https://embed.diagrams.net";
const iframeUrl = `${windowOrigin}?embed=1&libraries=1&saveAndExit=1&proto=json`;

export const IntegrationApp: FC = () => {
  const [editWindow, setEditWindow] = useState<null | Window>(null);
  const [isUnmountingNotificationBar, setIsUnmountingNotificationBar] = useState(false);

  const {
    value,
    setValue,
  } = useCustomElementContext({
    heightPadding: 100,
    emptyHeight: 80,
  });

  useEffect(() => {
    const listener = () => setTimeout(() => editWindow?.closed && setIsUnmountingNotificationBar(true), 100);

    document.addEventListener("visibilitychange", listener);

    return () => document.removeEventListener("visibilitychange", listener);
  }, [editWindow]);

  useEffect(() => {
    if (isUnmountingNotificationBar) {
      setTimeout(() => {
        setEditWindow(null);
        setIsUnmountingNotificationBar(false);
      }, 500);
    }
  }, [isUnmountingNotificationBar]);

  const closeEditor = useCallback(() => {
    setIsUnmountingNotificationBar(true);
    editWindow?.close();
  }, [editWindow]);

  useEffect(() => {
    if (!editWindow) {
      return;
    }
    const listener = handleDiagramsEvent(windowOrigin, editWindow, closeEditor, value, setValue);
    window.addEventListener("message", listener);

    return () => window.removeEventListener("message", listener);
  }, [editWindow, closeEditor, value]);

  const editDiagram = () => setEditWindow(window.open(iframeUrl, "_blank"));

  const focusEditor = () => editWindow?.focus();

  return (
    <>
      {editWindow && (
        <NotificationBar isUnmounting={isUnmountingNotificationBar}>
          You are currently editting the diagram.
          <Button isInverted onClick={focusEditor}>Go to the editor</Button>
          <Button isInverted onClick={closeEditor}>Close the editor</Button>
        </NotificationBar>
      )}
      <main className="container_center">
        {value
          ? <img
            className="diagram-preview"
            height={value.dimensions.height}
            width={value.dimensions.width}
            src={value.dataUrl}
            onClick={editWindow ? focusEditor : editDiagram}
          />
          : <Button onClick={editWindow ? focusEditor : editDiagram}>No diagram yet, click here to create one</Button>
        }
      </main>
    </>
  );
};

IntegrationApp.displayName = 'IntegrationApp';


