import { Config, Value } from "../useCustomElementContext";

export const exampleConfiguration: Required<Config> = {
  previewBorder: { // if defined, show a border around the diagram preview
    color: "#000000", // border color
    weight: 1, // border width
  },
  previewImageFormat: "png", // one of "svg" or "png". Set this to png when you use custom font as diagrams.net includes the font in the generated preview data-url which makes it too large.
  configuration: { // diagrams.net configuration, see https://www.diagrams.net/doc/faq/configure-diagram-editor for available keys
    colorNames: {
      "000000": "Our color",
    },
  },
};

export const exampleValue: Value = {
  xml: "...", // the diagram in xml format used by diagrams.net
  dataUrl: "...", // data-url of svg preview of the diagram for preview
  dimensions: { // dimensions of the diagram calculated by diagrams.net
    width: 100,
    height: 100,
  },
};

