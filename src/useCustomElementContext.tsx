import * as tg from "@gabrielurbina/type-guard";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export type Value = Readonly<{
  xml: string;
  dataUrl: string;
  dimensions: Readonly<{
    width: number;
    height: number;
  }>;
}>;

export type Config = Readonly<{
  previewBorder?: Readonly<{
    color: string;
    weight: number;
  }>;
  previewImageFormat?: PngImageFormatConfig | SvgImageFormatConfig; // svg is the default
  configuration?: Readonly<Record<string, unknown>>;
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

  const updateValue = useCallback((v: Value | null) => {
    setValue(v);
    CustomElement.setValue(JSON.stringify(v));
    setHeight((v?.dimensions.height ?? emptyHeight) + heightPadding);
  }, [emptyHeight, heightPadding]);

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
      setHeight((parsedValue?.dimensions.height ?? emptyHeight) + heightPadding);
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
  configuration: tg.OptionalOf(tg.isObject),
});

const isConfig: (v: unknown) => v is Config | null = tg.OneOf([tg.isNull, isStrictlyConfig]);

const isValue: (v: unknown) => v is Value = tg.ObjectOf({
  xml: tg.isString,
  dataUrl: tg.isString,
  dimensions: tg.ObjectOf({
    width: tg.isNumber,
    height: tg.isNumber,
  }),
});

const parseValue = (value: string): Value | null => {
  const parsedValue = JSON.parse(value);

  if (!isValue(parsedValue)) {
    console.warn(`Found invalid value "${value}". The element will consider the value missing and replace it upon first save.`);

    return null;
  }

  return parsedValue;
}

