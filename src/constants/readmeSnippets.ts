import { Config, Value } from "../useCustomElementContext";

export const exampleConfiguration: Config = {
  previewBorder: { // if defined, show a border around the diagram preview
    color: "#000000", // border color
    weight: 1, // border width
  },
  configuration: { // diagrams.net configuration, see https://www.diagrams.net/doc/faq/configure-diagram-editor for available keys
    colorNames: {
      "000000": "Our color",
    },
  },
};

export const exampleValue: Value = {
  xml: "...", // the diagram in xml format used by diagrams.net
  dataUrl: "...", // data url of svg preview of the diagram for preview
  dimensions: { // dimensions of the diagram calculated by diagrams.net
    width: 100,
    height: 100,
  },
};

