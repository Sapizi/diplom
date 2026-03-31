'use client';

import { useEffect, useRef } from 'react';
import { hasYandexMapsKey, loadYandexMaps } from './yandexMaps';
import styles from './AddressBook.module.scss';

type AddressMapPickerProps = {
  latitude: number | null;
  longitude: number | null;
  className?: string;
  onPick: (coords: { latitude: number; longitude: number }) => void;
};

const DEFAULT_CENTER: [number, number] = [56.8389, 60.6057];

export default function AddressMapPicker({
  latitude,
  longitude,
  className,
  onPick,
}: AddressMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const isPlacemarkAddedRef = useRef(false);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let isMounted = true;

    if (!hasYandexMapsKey() || !containerRef.current) {
      return;
    }

    const initMap = async () => {
      try {
        const ymaps = await loadYandexMaps();

        if (!isMounted || !containerRef.current || mapRef.current) {
          return;
        }

        const center =
          latitude != null && longitude != null
            ? [latitude, longitude]
            : DEFAULT_CENTER;

        const map = new ymaps.Map(containerRef.current, {
          center,
          zoom: latitude != null && longitude != null ? 17 : 12,
          controls: ['zoomControl', 'geolocationControl'],
        }, {
          suppressMapOpenBlock: true,
        });

        const placemark = new ymaps.Placemark(
          center,
          {},
          {
            preset: 'islands#circleDotIcon',
            iconColor: '#f99026',
          }
        );

        if (latitude != null && longitude != null) {
          map.geoObjects.add(placemark);
          isPlacemarkAddedRef.current = true;
        }

        map.events.add('click', (event: any) => {
          const coords = event.get('coords') as [number, number];

          placemark.geometry.setCoordinates(coords);

          if (!isPlacemarkAddedRef.current) {
            map.geoObjects.add(placemark);
            isPlacemarkAddedRef.current = true;
          }

          onPickRef.current({
            latitude: Number(coords[0]),
            longitude: Number(coords[1]),
          });
        });

        mapRef.current = map;
        placemarkRef.current = placemark;

        const syncViewport = () => {
          window.requestAnimationFrame(() => {
            try {
              map.container.fitToViewport();
            } catch (error) {
              console.error('Yandex fitToViewport error:', error);
            }
          });
        };

        const resizeObserver = new ResizeObserver(() => {
          syncViewport();
        });

        resizeObserver.observe(containerRef.current);

        const handleViewportChange = () => {
          syncViewport();
        };

        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);
        window.visualViewport?.addEventListener('resize', handleViewportChange);
        window.visualViewport?.addEventListener('scroll', handleViewportChange);

        const syncTimers = [0, 150, 400].map((delay) =>
          window.setTimeout(() => {
            syncViewport();
          }, delay)
        );

        (mapRef.current as any).__cleanup = () => {
          resizeObserver.disconnect();
          window.removeEventListener('resize', handleViewportChange);
          window.removeEventListener('scroll', handleViewportChange, true);
          window.visualViewport?.removeEventListener('resize', handleViewportChange);
          window.visualViewport?.removeEventListener('scroll', handleViewportChange);
          syncTimers.forEach((timerId) => window.clearTimeout(timerId));
        };
      } catch (error) {
        console.error('Yandex map init error:', error);
      }
    };

    initMap();

    return () => {
      isMounted = false;

      if (mapRef.current) {
        mapRef.current.__cleanup?.();
        mapRef.current.destroy();
        mapRef.current = null;
        placemarkRef.current = null;
        isPlacemarkAddedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !placemarkRef.current || latitude == null || longitude == null) {
      return;
    }

    const coords: [number, number] = [latitude, longitude];
    placemarkRef.current.geometry.setCoordinates(coords);

    if (!isPlacemarkAddedRef.current) {
      mapRef.current.geoObjects.add(placemarkRef.current);
      isPlacemarkAddedRef.current = true;
    }

    mapRef.current.setCenter(coords, 17, {
      duration: 250,
    });
  }, [latitude, longitude]);

  if (!hasYandexMapsKey()) {
    return (
      <div className={`${styles.mapPlaceholder} ${className ?? ''}`}>
        Добавьте `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`, и интерактивная карта Яндекса появится здесь.
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
