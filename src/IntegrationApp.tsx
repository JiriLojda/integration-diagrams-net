import { FC, useCallback, useEffect, useState } from 'react';
import { handleDiagramsEvent } from './handleDiagramsEvent';
import { Button, ButtonType } from './ui/Button';
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
    isLoading,
  } = useCustomElementContext({
    heightPadding: 180,
    emptyHeight: 0,
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
  }, [editorWindow, closeEditor, value, setValue, config]);

  const editDiagram = () => setEditorWindow(window.open(editorUrl, "_blank"));

  const focusEditor = () => editorWindow?.focus();

  if (isLoading) {
    return null;
  }

  return (
    <>
      {editorWindow && (
        <NotificationBar isUnmounting={isUnmountingNotificationBar}>
          You are currently editting the diagram.
          <Button type={ButtonType.PrimaryInverted} onClick={focusEditor}>Go to the editor</Button>
          <Button type={ButtonType.PrimaryInverted} onClick={closeEditor}>Close the editor</Button>
        </NotificationBar>
      )}
      <main>
        {value
          ? (
            <div className="preview-grid">
              <div className="edit-btns" style={{ gridArea: "btns" }}>
                <Button
                  type={ButtonType.Primary}
                  onClick={editorWindow ? focusEditor : editDiagram}
                >
                  {editorWindow ? "Focus diagram editor" : "Edit diagram"}
                </Button>
                <Button
                  type={ButtonType.SecondaryDestructive}
                  onClick={() => setValue(null)}
                >
                  Delete diagram
                </Button>
              </div>
              {config?.previewImageFormat?.format === "svg" && config.previewImageFormat.customFont
                ? (
                  <div
                    onClick={editorWindow ? focusEditor : editDiagram}
                    style={{
                      border: config?.previewBorder ? `${config.previewBorder.color} solid ${config.previewBorder.weight}px` : undefined,
                      gridArea: "preview",
                      cursor: "pointer",
                    }}
                  >
                    <object
                      data={value.dataUrl}
                      type="image/svg+xml"
                      height={value.dimensions.height}
                      width={value.dimensions.width}
                      style={{ pointerEvents: "none" }} // we must handle click in the parent div as click events are not triggered from the object element 
                    >
                      Preview of the current diagram
                    </object>
                  </div>
                )
                : (
                  <img
                    alt="Preview of the current diagram"
                    height={value.dimensions.height}
                    width={value.dimensions.width}
                    src={value.dataUrl}
                    onClick={editorWindow ? focusEditor : editDiagram}
                    style={{
                      border: config?.previewBorder ? `${config.previewBorder.color} solid ${config.previewBorder.weight}px` : undefined,
                      gridArea: "preview",
                      cursor: "pointer",
                    }}
                  />
                )
              }
            </div>
          )
          : (
            <Button
              type={ButtonType.Primary}
              onClick={editorWindow ? focusEditor : editDiagram}
            >
              No diagram yet, click here to create one
            </Button>
          )
        }
      </main>
    </>
  );
};

IntegrationApp.displayName = 'IntegrationApp';

