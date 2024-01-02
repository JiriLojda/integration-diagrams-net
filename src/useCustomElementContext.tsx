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
  previewImageFormat?: "svg" | "png"; // svg is the default
  configuration?: Readonly<Record<string, unknown>>;
}>;

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

const isStrictlyConfig: (v: unknown) => v is Config = tg.ObjectOf({
  previewBorder: tg.OptionalOf(tg.ObjectOf({
    color: tg.isString,
    weight: tg.isNumber,
  })),
  previewImageFormat: tg.ValueOf(["svg", "png"] as const),
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

