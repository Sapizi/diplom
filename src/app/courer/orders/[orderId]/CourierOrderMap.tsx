'use client';

import { useEffect, useRef, useState } from 'react';
import { loadYandexMaps, searchYandexAddress } from '@/app/components/AddressBook/yandexMaps';
import styles from './page.module.scss';

type CourierOrderMapProps = {
  latitude: number | null;
  longitude: number | null;
  addressLine: string;
};

export default function CourierOrderMap({ latitude, longitude, addressLine }: CourierOrderMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!containerRef.current) {
        return;
      }

      try {
        const ymaps = await loadYandexMaps();

        if (!isMounted || !containerRef.current) {
          return;
        }

        let coords: [number, number] | null =
          latitude != null && longitude != null ? [latitude, longitude] : null;

        if (!coords && addressLine.trim()) {
          const foundAddress = await searchYandexAddress(addressLine);

          if (!isMounted) {
            return;
          }

          if (foundAddress) {
            coords = [foundAddress.latitude, foundAddress.longitude];
          }
        }

        if (!coords) {
          setErrorMessage('Не удалось определить точку доставки');
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new ymaps.Map(
            containerRef.current,
            {
              center: coords,
              zoom: 16,
              controls: [],
            },
            {
              suppressMapOpenBlock: true,
            }
          );

          placemarkRef.current = new ymaps.Placemark(
            coords,
            {
              balloonContent: addressLine || 'Точка доставки',
            },
            {
              preset: 'islands#redDotIcon',
            }
          );

          mapRef.current.geoObjects.add(placemarkRef.current);
        } else {
          mapRef.current.setCenter(coords, 16, { duration: 200 });
          placemarkRef.current?.geometry?.setCoordinates(coords);
        }

        mapRef.current.container.fitToViewport();
        setErrorMessage(null);
      } catch (error) {
        console.error('Courier order map error:', error);
        setErrorMessage('Карта временно недоступна');
      }
    };

    initMap();

    return () => {
      isMounted = false;
      placemarkRef.current = null;

      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [addressLine, latitude, longitude]);

  if (errorMessage) {
    return (
      <div className={styles.mapFallback}>
        <span>Точка доставки</span>
        <strong>{addressLine}</strong>
        <em>{errorMessage}</em>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.mapCanvas} />;
}
