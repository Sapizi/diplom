const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

let yandexMapsPromise: Promise<any> | null = null;

declare global {
  interface Window {
    ymaps?: any;
  }
}

export type YandexAddressResult = {
  latitude: number;
  longitude: number;
  city: string;
  street: string;
  house: string;
  addressLine: string;
};

export function hasYandexMapsKey() {
  return Boolean(YANDEX_MAPS_API_KEY);
}

function getComponent(components: Array<{ kind?: string; name?: string }>, kind: string) {
  return components.find((component) => component.kind === kind)?.name ?? '';
}

function mapGeoObject(geoObject: any): YandexAddressResult {
  const coords = geoObject.geometry.getCoordinates() as [number, number];
  const components =
    geoObject.properties.get('metaDataProperty.GeocoderMetaData.Address.Components') ?? [];
  const city =
    getComponent(components, 'locality') ||
    getComponent(components, 'province') ||
    getComponent(components, 'area');

  return {
    latitude: Number(coords[0]),
    longitude: Number(coords[1]),
    city,
    street:
      getComponent(components, 'street') ||
      getComponent(components, 'route') ||
      getComponent(components, 'district'),
    house: getComponent(components, 'house'),
    addressLine:
      geoObject.getAddressLine?.() ||
      geoObject.properties.get('name') ||
      geoObject.properties.get('text') ||
      '',
  };
}

export async function loadYandexMaps() {
  if (typeof window === 'undefined') {
    throw new Error('yandex_maps_browser_only');
  }

  if (!YANDEX_MAPS_API_KEY) {
    throw new Error('missing_yandex_maps_key');
  }

  if (window.ymaps) {
    await new Promise<void>((resolve) => window.ymaps.ready(() => resolve()));
    return window.ymaps;
  }

  if (!yandexMapsPromise) {
    yandexMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        if (!window.ymaps) {
          reject(new Error('yandex_maps_not_loaded'));
          return;
        }

        window.ymaps.ready(() => resolve(window.ymaps));
      };
      script.onerror = () => reject(new Error('yandex_maps_script_failed'));
      document.head.appendChild(script);
    });
  }

  return yandexMapsPromise;
}

export async function reverseGeocodeYandex(latitude: number, longitude: number) {
  const ymaps = await loadYandexMaps();
  const response = await ymaps.geocode([latitude, longitude], {
    results: 1,
  });
  const geoObject = response.geoObjects.get(0);

  if (!geoObject) {
    return null;
  }

  return mapGeoObject(geoObject);
}

export async function searchYandexAddress(query: string) {
  const ymaps = await loadYandexMaps();
  const response = await ymaps.geocode(query, {
    results: 1,
  });
  const geoObject = response.geoObjects.get(0);

  if (!geoObject) {
    return null;
  }

  return mapGeoObject(geoObject);
}
