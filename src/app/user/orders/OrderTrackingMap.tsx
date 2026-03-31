'use client';

import { useEffect, useRef, useState } from 'react';
import { loadYandexMaps, searchYandexAddress } from '@/app/components/AddressBook/yandexMaps';
import styles from './OrderTrackingMap.module.scss';

type OrderTrackingMapProps = {
  addressLine: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  courierLatitude: number | null;
  courierLongitude: number | null;
  trackingEnabled: boolean;
};

export default function OrderTrackingMap({
  addressLine,
  deliveryLatitude,
  deliveryLongitude,
  courierLatitude,
  courierLongitude,
  trackingEnabled,
}: OrderTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const deliveryPlacemarkRef = useRef<any>(null);
  const courierPlacemarkRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
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

        let deliveryCoords: [number, number] | null =
          deliveryLatitude != null && deliveryLongitude != null ? [deliveryLatitude, deliveryLongitude] : null;

        if (!deliveryCoords && addressLine.trim()) {
          const foundAddress = await searchYandexAddress(addressLine);

          if (!isMounted) {
            return;
          }

          if (foundAddress) {
            deliveryCoords = [foundAddress.latitude, foundAddress.longitude];
          }
        }

        if (!deliveryCoords) {
          setErrorMessage('Не удалось определить адрес доставки на карте');
          return;
        }

        const courierCoords =
          trackingEnabled && courierLatitude != null && courierLongitude != null
            ? ([courierLatitude, courierLongitude] as [number, number])
            : null;

        if (!mapRef.current) {
          mapRef.current = new ymaps.Map(
            containerRef.current,
            {
              center: deliveryCoords,
              zoom: 14,
              controls: ['zoomControl'],
            },
            {
              suppressMapOpenBlock: true,
            }
          );

          deliveryPlacemarkRef.current = new ymaps.Placemark(
            deliveryCoords,
            {
              balloonContent: addressLine || 'Адрес доставки',
              iconCaption: 'Адрес',
            },
            {
              preset: 'islands#redDotIcon',
            }
          );

          mapRef.current.geoObjects.add(deliveryPlacemarkRef.current);
        } else {
          deliveryPlacemarkRef.current?.geometry?.setCoordinates(deliveryCoords);
        }

        if (courierCoords) {
          if (!courierPlacemarkRef.current) {
            courierPlacemarkRef.current = new ymaps.Placemark(
              courierCoords,
              {
                balloonContent: 'Курьер в пути',
                iconCaption: 'Курьер',
              },
              {
                preset: 'islands#blueCircleDotIcon',
              }
            );
            mapRef.current.geoObjects.add(courierPlacemarkRef.current);
          } else {
            courierPlacemarkRef.current.geometry?.setCoordinates(courierCoords);
          }

          if (!routeLineRef.current) {
            routeLineRef.current = new ymaps.Polyline([courierCoords, deliveryCoords], {}, {
              strokeColor: '#f99026',
              strokeWidth: 4,
              strokeOpacity: 0.75,
            });
            mapRef.current.geoObjects.add(routeLineRef.current);
          } else {
            routeLineRef.current.geometry?.setCoordinates([courierCoords, deliveryCoords]);
          }

          mapRef.current.setBounds([courierCoords, deliveryCoords], {
            checkZoomRange: true,
            duration: 200,
          });
        } else {
          if (courierPlacemarkRef.current) {
            mapRef.current.geoObjects.remove(courierPlacemarkRef.current);
            courierPlacemarkRef.current = null;
          }

          if (routeLineRef.current) {
            mapRef.current.geoObjects.remove(routeLineRef.current);
            routeLineRef.current = null;
          }

          mapRef.current.setCenter(deliveryCoords, 15, { duration: 200 });
        }

        mapRef.current.container.fitToViewport();
        setErrorMessage(null);
      } catch (error) {
        console.error('User order tracking map error:', error);
        setErrorMessage('Карта временно недоступна');
      }
    };

    initMap();

    return () => {
      isMounted = false;

      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }

      deliveryPlacemarkRef.current = null;
      courierPlacemarkRef.current = null;
      routeLineRef.current = null;
    };
  }, [addressLine, courierLatitude, courierLongitude, deliveryLatitude, deliveryLongitude, trackingEnabled]);

  if (errorMessage) {
    return (
      <div className={styles.mapFallback}>
        <strong>{addressLine}</strong>
        <span>{errorMessage}</span>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.mapCanvas} />;
}
