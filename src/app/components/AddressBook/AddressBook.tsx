'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  createAddress,
  deleteAddress,
  fetchAddressesByUser,
  formatAddressDetails,
  formatAddressTitle,
  getEmptyDeliveryAddress,
  setDefaultAddress,
  updateAddress,
  type DeliveryAddress,
  type DeliveryAddressInput,
} from '@/app/api/client/addresses';
import {
  hasYandexMapsKey,
  reverseGeocodeYandex,
  searchYandexAddress,
} from './yandexMaps';
import styles from './AddressBook.module.scss';

const AddressMapPicker = dynamic(() => import('./AddressMapPicker'), {
  ssr: false,
});

type AddressBookProps = {
  userId: string;
  title?: string;
  description?: string;
  compact?: boolean;
  selectedAddressId?: string | null;
  onSelectAddress?: (address: DeliveryAddress | null) => void;
};

function firstNonEmpty(values: Array<string | undefined>) {
  return values.find((value) => value && value.trim())?.trim() ?? '';
}

export default function AddressBook({
  userId,
  title = 'Адреса доставки',
  description,
  compact = false,
  selectedAddressId = null,
  onSelectAddress,
}: AddressBookProps) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'manual' | 'map'>('manual');
  const [form, setForm] = useState<DeliveryAddressInput>(getEmptyDeliveryAddress());
  const [mapQuery, setMapQuery] = useState('');
  const [mapStatus, setMapStatus] = useState<string | null>(null);

  const syncSelectedAddress = (nextAddresses: DeliveryAddress[], preferredId?: string | null) => {
    if (!onSelectAddress) {
      return;
    }

    const nextSelected =
      nextAddresses.find((address) => address.id === preferredId) ??
      nextAddresses.find((address) => address.is_default) ??
      nextAddresses[0] ??
      null;

    onSelectAddress(nextSelected);
  };

  const loadAddresses = async (preferredId?: string | null) => {
    setIsLoading(true);
    setErrorText(null);

    const { data, error } = await fetchAddressesByUser(userId);

    if (error) {
      console.error('Address load error:', error);
      setErrorText('Не удалось загрузить адреса.');
      setAddresses([]);
      syncSelectedAddress([], null);
      setIsLoading(false);
      return;
    }

    setAddresses(data);
    syncSelectedAddress(data, preferredId ?? selectedAddressId);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAddresses(selectedAddressId);
  }, [selectedAddressId, userId]);

  const resetForm = () => {
    setEditingAddressId(null);
    setForm(getEmptyDeliveryAddress());
    setFormMode('manual');
    setMapQuery('');
    setMapStatus(null);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setEditingAddressId(null);
    setForm({
      ...getEmptyDeliveryAddress(),
      is_default: addresses.length === 0,
    });
    setFormMode('manual');
    setMapQuery('');
    setMapStatus(null);
    setIsFormOpen(true);
  };

  const openEditForm = (address: DeliveryAddress) => {
    setEditingAddressId(address.id);
    setForm({
      city: address.city,
      street: address.street,
      house: address.house,
      entrance: address.entrance,
      apartment: address.apartment,
      floor: address.floor,
      comment: address.comment,
      latitude: address.latitude,
      longitude: address.longitude,
      is_default: address.is_default,
    });
    setFormMode(address.latitude != null && address.longitude != null ? 'map' : 'manual');
    setMapQuery(formatAddressTitle(address));
    setMapStatus(null);
    setIsFormOpen(true);
  };

  const updateFormField = <K extends keyof DeliveryAddressInput>(
    key: K,
    value: DeliveryAddressInput[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const applyCoordinates = async (latitude: number, longitude: number) => {
    if (!hasYandexMapsKey()) {
      setMapStatus('Для карты нужен ключ Яндекс Карт. Пока можно заполнить адрес вручную.');
      return;
    }

    setMapStatus('Подтягиваем адрес через Яндекс Карты...');
    updateFormField('latitude', latitude);
    updateFormField('longitude', longitude);

    try {
      const result = await reverseGeocodeYandex(latitude, longitude);

      if (!result) {
        setMapStatus('Точка выбрана. Проверьте адрес вручную перед сохранением.');
        return;
      }

      setForm((current) => ({
        ...current,
        city: firstNonEmpty([result.city]) || current.city,
        street: firstNonEmpty([result.street]) || current.street,
        house: firstNonEmpty([result.house]) || current.house,
        latitude,
        longitude,
      }));

      setMapStatus(result.addressLine ? `Точка выбрана: ${result.addressLine}` : 'Точка выбрана.');
    } catch (error) {
      console.error('Yandex reverse geocode error:', error);
      setMapStatus('Точка выбрана. Проверьте адрес вручную перед сохранением.');
    }
  };

  const handleMapSearch = async () => {
    if (!mapQuery.trim()) {
      setMapStatus('Введите адрес или название улицы.');
      return;
    }

    if (!hasYandexMapsKey()) {
      setMapStatus('Добавьте ключ Яндекс Карт, чтобы искать адреса на карте.');
      return;
    }

    setMapStatus('Ищем место через Яндекс Карты...');

    try {
      const result = await searchYandexAddress(mapQuery);

      if (!result) {
        setMapStatus('Ничего не нашли. Попробуйте другой запрос.');
        return;
      }

      await applyCoordinates(result.latitude, result.longitude);
    } catch (error) {
      console.error('Yandex map search error:', error);
      setMapStatus('Не удалось найти адрес. Попробуйте еще раз.');
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setMapStatus('Геолокация недоступна на этом устройстве.');
      return;
    }

    setMapStatus('Определяем текущее местоположение...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await applyCoordinates(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setMapStatus('Не удалось получить вашу геолокацию.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const handleSaveAddress = async () => {
    if (!form.city.trim() || !form.street.trim() || !form.house.trim()) {
      setErrorText('Заполните город, улицу и дом.');
      return;
    }

    setIsSaving(true);
    setErrorText(null);

    const payload: DeliveryAddressInput = {
      ...form,
      city: form.city.trim(),
      street: form.street.trim(),
      house: form.house.trim(),
      entrance: form.entrance.trim(),
      apartment: form.apartment.trim(),
      floor: form.floor.trim(),
      comment: form.comment.trim(),
    };

    const result = editingAddressId
      ? await updateAddress(editingAddressId, userId, payload)
      : await createAddress(userId, payload);

    if (result.error || !result.data) {
      console.error('Address save error:', result.error);
      setErrorText('Не удалось сохранить адрес.');
      setIsSaving(false);
      return;
    }

    let selectedId = result.data.id;

    if (payload.is_default) {
      const defaultResult = await setDefaultAddress(result.data.id, userId);

      if (defaultResult.error || !defaultResult.data) {
        console.error('Address default error:', defaultResult.error);
        setErrorText('Адрес сохранен, но не удалось сделать его адресом по умолчанию.');
      } else {
        selectedId = defaultResult.data.id;
      }
    }

    await loadAddresses(selectedId);
    resetForm();
    setIsSaving(false);
  };

  const handleDeleteAddress = async (address: DeliveryAddress) => {
    const confirmed = window.confirm(
      `Удалить адрес "${formatAddressTitle(address)}"?`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await deleteAddress(address.id, userId);

    if (error) {
      console.error('Address delete error:', error);
      setErrorText('Не удалось удалить адрес.');
      return;
    }

    const nextPreferredId = selectedAddressId === address.id ? null : selectedAddressId;
    await loadAddresses(nextPreferredId);
  };

  const handleMakeDefault = async (addressId: string) => {
    const result = await setDefaultAddress(addressId, userId);

    if (result.error) {
      console.error('Address default error:', result.error);
      setErrorText('Не удалось обновить адрес по умолчанию.');
      return;
    }

    await loadAddresses(addressId);
  };

  return (
    <section className={`${styles.addressBook} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>

        <button type="button" className={styles.primaryButton} onClick={openCreateForm}>
          Добавить адрес
        </button>
      </div>

      {errorText ? <p className={styles.error}>{errorText}</p> : null}

      {isLoading ? (
        <p className={styles.state}>Загружаем адреса...</p>
      ) : addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Адресов пока нет</p>
          <p className={styles.emptyText}>Сохраните первый адрес для доставки или самовывоза.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {addresses.map((address) => {
            const isSelected = address.id === selectedAddressId;
            const details = formatAddressDetails(address);

            return (
              <article
                key={address.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTop}>
                      <h3 className={styles.cardTitle}>{formatAddressTitle(address)}</h3>
                      {address.is_default ? <span className={styles.badge}>По умолчанию</span> : null}
                    </div>
                    {details ? <p className={styles.cardDetails}>{details}</p> : null}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {onSelectAddress ? (
                    <button
                      type="button"
                      className={`${styles.secondaryButton} ${isSelected ? styles.secondaryButtonActive : ''}`}
                      onClick={() => onSelectAddress(address)}
                    >
                      {isSelected ? 'Выбран' : 'Выбрать'}
                    </button>
                  ) : null}

                  {!address.is_default ? (
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => handleMakeDefault(address.id)}
                    >
                      Сделать основным
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => openEditForm(address)}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => handleDeleteAddress(address)}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isFormOpen ? (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <h3 className={styles.formTitle}>
                {editingAddressId ? 'Редактирование адреса' : 'Новый адрес'}
              </h3>
              <p className={styles.formText}>
                Можно заполнить вручную или выбрать точку на карте.
              </p>
            </div>

            <button type="button" className={styles.closeButton} onClick={resetForm}>
              Закрыть
            </button>
          </div>

          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={`${styles.modeButton} ${formMode === 'manual' ? styles.modeButtonActive : ''}`}
              onClick={() => setFormMode('manual')}
            >
              Вручную
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${formMode === 'map' ? styles.modeButtonActive : ''}`}
              onClick={() => setFormMode('map')}
            >
              На карте
            </button>
          </div>

          {formMode === 'map' ? (
            <div className={styles.mapTools}>
              <div className={styles.mapSearch}>
                <input
                  value={mapQuery}
                  onChange={(event) => setMapQuery(event.target.value)}
                  placeholder="Найти адрес на карте"
                  className={styles.input}
                />
                <button type="button" className={styles.secondaryButton} onClick={handleMapSearch}>
                  Найти
                </button>
              </div>

              <button type="button" className={styles.ghostButton} onClick={handleUseCurrentLocation}>
                Использовать мою геолокацию
              </button>

              <AddressMapPicker
                className={styles.map}
                latitude={form.latitude}
                longitude={form.longitude}
                onPick={({ latitude, longitude }) => applyCoordinates(latitude, longitude)}
              />

              <p className={styles.mapHint}>
                Тапните по дому на карте Яндекса. После этого поля адреса заполнятся автоматически.
              </p>

              {mapStatus ? <p className={styles.mapStatus}>{mapStatus}</p> : null}
            </div>
          ) : null}

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Город</span>
              <input
                className={styles.input}
                value={form.city}
                onChange={(event) => updateFormField('city', event.target.value)}
                placeholder="Екатеринбург"
              />
            </label>

            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>Улица</span>
              <input
                className={styles.input}
                value={form.street}
                onChange={(event) => updateFormField('street', event.target.value)}
                placeholder="Малышева"
              />
            </label>

            <label className={styles.field}>
              <span>Дом</span>
              <input
                className={styles.input}
                value={form.house}
                onChange={(event) => updateFormField('house', event.target.value)}
                placeholder="8"
              />
            </label>

            <label className={styles.field}>
              <span>Подъезд</span>
              <input
                className={styles.input}
                value={form.entrance}
                onChange={(event) => updateFormField('entrance', event.target.value)}
                placeholder="2"
              />
            </label>

            <label className={styles.field}>
              <span>Квартира</span>
              <input
                className={styles.input}
                value={form.apartment}
                onChange={(event) => updateFormField('apartment', event.target.value)}
                placeholder="14"
              />
            </label>

            <label className={styles.field}>
              <span>Этаж</span>
              <input
                className={styles.input}
                value={form.floor}
                onChange={(event) => updateFormField('floor', event.target.value)}
                placeholder="6"
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>Комментарий</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={form.comment}
                onChange={(event) => updateFormField('comment', event.target.value)}
                placeholder="Необязательно. Например: домофон не работает."
              />
            </label>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) => updateFormField('is_default', event.target.checked)}
            />
            <span>Сделать адресом по умолчанию</span>
          </label>

          <div className={styles.formActions}>
            <button type="button" className={styles.ghostButton} onClick={resetForm}>
              Отмена
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSaveAddress}
              disabled={isSaving}
            >
              {isSaving ? 'Сохраняем...' : 'Сохранить адрес'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
