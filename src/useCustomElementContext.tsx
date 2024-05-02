import * as tg from "@gabrielurbina/type-guard";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { decodeDataUrl } from "./utils/dataUrls";
import { v4 as createUuid } from "uuid";

export type Value = Readonly<{
  xml: string;
  image: Readonly<{
    url: string;
    fileName?: string;
    dimensions: Readonly<{
      width: number;
      height: number;
    }>;
  }>;
}>;

export type DiagramsNetExport = Readonly<{
  xml: string;
  image: Readonly<{
    dataUrl: string;
    dimensions: Readonly<{
      width: number;
      height: number;
    }>;
  }>;
}>;

const fileNameMacro = "{fileName}";

export type Config = Readonly<{
  previewBorder?: Readonly<{
    color: string;
    weight: number;
  }>;
  previewImageFormat?: PngImageFormatConfig | SvgImageFormatConfig; // svg is the default
  imageStorage?: Readonly<{
    read: Readonly<{ url: string }>;
    create: HttpResource;
    delete?: HttpResource;
  }>;
  configuration?: Readonly<Record<string, unknown>>;
}>;

type HttpResource = Readonly<{
  url: string;
  httpMethod?: string;
  headers?: Readonly<Record<string, string>>;
}>;

type PngImageFormatConfig = Readonly<{ format: "png" }>;

type SvgImageFormatConfig = Readonly<{
  format: "svg";
  customFont?: SvgFontUrlConfig | SvgFontFaceDefinitionConfig;
}>;

type SvgFontUrlConfig = Readonly<{ customFontConfigType: "nameAndUrl"; fontName: string; fontUrl: string }>;

type SvgFontFaceDefinitionConfig = Readonly<{ customFontConfigType: "fontFaceDefinition"; fontFaceDefinition: string }>;

type Params = Readonly<{
  heightPadding: number;
  emptyHeight: number;
}>;

export const useCustomElementContext = ({ heightPadding, emptyHeight }: Params) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [value, setValue] = useState<Value | null>(null);
  const [height, setHeight] = useState(heightPadding + emptyHeight)
  const [isLoading, setIsLoading] = useState(true);

  const updateValue = useCallback(async (v: DiagramsNetExport | null) => {
    if (v === null) {
      setValue(null);
      CustomElement.setValue(JSON.stringify(null));
      setHeight(emptyHeight);
      if (value?.image.fileName && config?.imageStorage?.delete) {
        await fetch(replaceMacros({ url: config.imageStorage.delete.url, fileName: value.image.fileName }), {
          method: config.imageStorage.delete.httpMethod ?? "DELETE",
          headers: config.imageStorage.delete.headers,
        });
      }
      return;
    }
    const newValue = await prepareExportToSave(v, config ?? {}, value);
    setValue(newValue);
    CustomElement.setValue(JSON.stringify(newValue));
    setHeight((newValue?.image.dimensions.height ?? emptyHeight) + heightPadding);
  }, [emptyHeight, heightPadding, config, value]);

  useLayoutEffect(() => {
    CustomElement.setHeight(height);
  }, [height]);


  useEffect(() => {
    CustomElement.init((element) => {
      const { config, value } = element;
      if (!isConfig(config)) {
        throw new Error("Invalid configuration of the custom element. Please check the documentation.");
      }
      const parsedValue = parseValue(value);

      setConfig(element.config);
      setIsDisabled(element.disabled);
      setValue(parsedValue);
      setHeight((parsedValue?.image.dimensions.height ?? emptyHeight) + heightPadding);
      setIsLoading(false);
    });
  }, [emptyHeight, heightPadding]);

  useEffect(() => {
    CustomElement.onDisabledChanged(setIsDisabled);
  }, []);

  return {
    config,
    isDisabled,
    value,
    setValue: updateValue,
    isLoading,
  }
};

const isPngFormatConfig: (v: unknown) => v is PngImageFormatConfig = tg.ObjectOf({ format: tg.ValueOf(["png"]) });

const isSvgFontUrlConfig: (v: unknown) => v is SvgFontUrlConfig = tg.ObjectOf({ customFontConfigType: tg.ValueOf(["nameAndUrl"]), fontName: tg.isString, fontUrl: tg.isString });

const isSvgFontFaceDefinitionConfig: (v: unknown) => v is SvgFontFaceDefinitionConfig = tg.ObjectOf({ customFontConfigType: tg.ValueOf(["fontFaceDefinition"]), fontFaceDefinition: tg.isString });

const isSvgFormatConfig: (v: unknown) => v is SvgImageFormatConfig = tg.ObjectOf({
  format: tg.ValueOf(["svg"]),
  customFont: tg.OptionalOf(tg.OneOf([isSvgFontUrlConfig, isSvgFontFaceDefinitionConfig])),
});

const isStrictlyConfig: (v: unknown) => v is Config = tg.ObjectOf({
  previewBorder: tg.OptionalOf(tg.ObjectOf({
    color: tg.isString,
    weight: tg.isNumber,
  })),
  previewImageFormat: tg.OptionalOf(tg.OneOf([isPngFormatConfig, isSvgFormatConfig])),
  imageStorage: tg.OptionalOf(tg.ObjectOf({
    url: tg.isString,
    httpMethod: tg.OptionalOf(tg.isString),
    headers: tg.OptionalOf(tg.isObject),
    delete: tg.OptionalOf(tg.ObjectOf({
      url: tg.isString,
      httpMethod: tg.OptionalOf(tg.isString),
      headers: tg.OptionalOf(tg.isObject),
    })),
  })),
  configuration: tg.OptionalOf(tg.isObject),
});

const isConfig: (v: unknown) => v is Config | null = tg.OneOf([tg.isNull, isStrictlyConfig]);

const isValue: (v: unknown) => v is Value = tg.ObjectOf({
  xml: tg.isString,
  image: tg.ObjectOf({
    url: tg.isString,
    fileName: tg.OptionalOf(tg.isString),
    dimensions: tg.ObjectOf({
      width: tg.isNumber,
      height: tg.isNumber,
    }),
  })
});

const parseValue = (value: string): Value | null => {
  const parsedValue = JSON.parse(value);

  if (!isValue(parsedValue)) {
    console.warn(`Found invalid value "${value}". The element will consider the value missing and replace it upon first save.`);

    return null;
  }

  return parsedValue;
};

const prepareExportToSave = async (exportData: DiagramsNetExport, config: Config, oldValue: Value | null): Promise<Value> => {
  if (config.imageStorage && config.previewImageFormat?.format === "png") {
    throw new Error("Only svg format is supported for remote storage option for now.");
  }
  if (config.imageStorage) {
    const fileContent = decodeDataUrl(exportData.image.dataUrl);
    const fileName = oldValue?.image.fileName ?? `${createUuid()}.svg`;
    const createUrl = replaceMacros({ url: config.imageStorage.create.url, fileName });

    await fetch(createUrl, {
      body: fileContent,
      method: config.imageStorage.create.httpMethod ?? "POST",
      headers: {
        "content-length": fileContent.length.toString(),
        "content-type": "image/svg",
        "date": new Date().toUTCString(),
        ...config.imageStorage.create.headers ?? {},
      },
    });

    return {
      xml: exportData.xml,
      image: {
        url: replaceMacros({ url: config.imageStorage.read.url, fileName }),
        fileName,
        dimensions: exportData.image.dimensions,
      },
    };
  }

  return {
    xml: exportData.xml,
    image: {
      url: exportData.image.dataUrl,
      dimensions: exportData.image.dimensions,
    },
  };
};

type ReplaceMacrosParams = Readonly<{
  url: string;
  fileName: string;
}>;

const replaceMacros = (params: ReplaceMacrosParams) =>
  params.url.replaceAll(fileNameMacro, params.fileName);
