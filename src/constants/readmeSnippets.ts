import { Config, Value } from "../useCustomElementContext";

export const exampleConfiguration: Required<Config> = {
  previewBorder: { // if defined, show a border around the diagram preview
    color: "#000000", // border color
    weight: 1, // border width
  },
  previewImageFormat: {
    format: "png", // one of "svg" or "png". Set this to png when you use custom font as diagrams.net includes the font in the generated preview data-url which makes it too large.
    // customFont: { // this can only be used with format: "svg"
    //   customFontConfigType: "nameAndUrl", // alternatively this can also be "fontFaceDefinition"
    //   fontUrl: "<url to our custom font>", // this must only be used with customFontConfigType: "nameAndUrl"
    //   fontName: "<name of our custom font, this must be used inside the svg elements>", // this must only be used with customFontConfigType: "nameAndUrl"
    //   // fontFaceDefinition: "<font face definition>", // this must only be used with customFontConfigType: "fontFaceDefinition"
    // }
  },
  imageStorage: { // specify to save the generated diagram svg into a remote storage
    read: {
      url: "https://my-storage.com/blob/{fileName}", // url of a remote storage to read the diagram image
    },
    create: {
      url: "https://my-storage.com/blob/{fileName}?create=true", // url of a remote storage to save the diagram image
      httpMethod: "PUT", // optional custom http method (the image is put into the body), the default is POST
      headers: {}, // optional custom headers to add to the request (e.g. authorization)
    },
    delete: { // optionally specify a request to trigger when the diagram is removed (to remove it from the remote storage)
      url: "https://my-storage.com/blob/{fileName}", // url to use to delete the diagram image
      httpMethod: "PUT", // optional custom http method (the image is put into the body), the default is DELETE
      headers: {}, // optional custom headers to add to the request (e.g. authorization)
    }
  },
  configuration: { // diagrams.net configuration, see https://www.diagrams.net/doc/faq/configure-diagram-editor for available keys
    colorNames: {
      "000000": "Our color",
    },
  },
};

export const exampleValue: Value = {
  xml: "...", // the diagram in xml format used by diagrams.net
  image: {
    url: "...", // data-url of svg preview of the diagram for preview or a url to the remote storage specified in configuration
    dimensions: { // dimensions of the diagram calculated by diagrams.net
      width: 100,
      height: 100,
    },
  }
};

