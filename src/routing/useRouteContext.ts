import { useParams } from "react-router-dom";

const VALID_DEVICES = ["desktop", "mobile"] as const;
const LOCALE_PATTERN = /^[a-z]{2}-[a-z]{2}$/i;

type ValidDevice = (typeof VALID_DEVICES)[number];

interface RouteContext {
  device: string | undefined;
  locale: string | undefined;
  category: string | undefined;
  isValidDevice: boolean;
  isValidLocale: boolean;
}

interface RouteParams {
  device?: string;
  locale?: string;
  category?: string;
}

function isValidDevice(device: string | undefined): device is ValidDevice {
  return device !== undefined && VALID_DEVICES.includes(device as ValidDevice);
}

function isValidLocale(locale: string | undefined): boolean {
  return locale !== undefined && LOCALE_PATTERN.test(locale);
}

export function useRouteContext(): RouteContext {
  const { device, locale, category } = useParams<RouteParams>();

  return {
    device,
    locale,
    category,
    isValidDevice: isValidDevice(device),
    isValidLocale: isValidLocale(locale),
  };
}
