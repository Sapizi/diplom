'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createMenuItem,
  deleteMenuItem,
  fetchAdminMenuItems,
  getMenuImagePublicUrl,
  updateMenuItem,
  uploadMenuImage,
} from '@/app/api/client/menu';
import { createCategory, fetchCategories as fetchCategoriesApi } from '@/app/api/client/categories';
import PageLoader from '@/app/components/PageLoader/PageLoader';
import {
  Description,
  LoginButton,
  MenuItem,
  MenuItemButtons,
  MenuItemDesc,
  MenuItemImg,
  MenuList,
  PopupButtons,
  PopupCancelButton,
  PopupContainer,
  PopupFileInput,
  PopupForm,
  PopupInput,
  PopupOverlay,
  PopupSaveButton,
  PopupSelect,
  PopupTextarea,
  PopupTitle,
  Price,
  Subtitle,
} from './AdminMenuStyles';
import AdminShell from '@/app/admin/components/AdminShell/AdminShell';
import { useAdminAccess } from '@/app/admin/useAdminAccess';
import styles from './page.module.scss';

type MenuItemType = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  calories?: number | null;
  is_available?: boolean | null;
};

type CategoryType = {
  id: string;
  name: string;
};

export default function AdminMenuPage() {
  const { profile, isChecking } = useAdminAccess();
  const [menu, setMenu] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [calories, setCalories] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [image, setImage] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await fetchAdminMenuItems();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setMenu(data || []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data, error } = await fetchCategoriesApi();

    if (error) {
      console.error(error);
      return;
    }

    setCategories(data || []);
  };

  useEffect(() => {
    if (!profile) return;

    const loadInitial = async () => {
      setLoading(true);
      const [menuResult, categoriesResult] = await Promise.all([
        fetchAdminMenuItems(),
        fetchCategoriesApi(),
      ]);

      if (menuResult.error) {
        console.error(menuResult.error);
      } else {
        setMenu(menuResult.data || []);
      }

      if (categoriesResult.error) {
        console.error(categoriesResult.error);
      } else {
        setCategories(categoriesResult.data || []);
      }

      setLoading(false);
    };

    loadInitial();
  }, [profile]);

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Удалить эту позицию?');
    if (!confirmDelete) return;

    const { error } = await deleteMenuItem(id);
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMenu((prev) => prev.filter((item) => item.id !== id));
  };

  const openCreateMenuPopup = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice('');
    setCalories('');
    setCategoryId('');
    setIsAvailable(true);
    setImage(null);
    setIsMenuPopupOpen(true);
  };

  const openEditMenuPopup = (item: MenuItemType) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    setCalories(item.calories != null ? item.calories.toString() : '');
    setCategoryId(item.category_id);
    setIsAvailable(item.is_available !== false);
    setImage(null);
    setIsMenuPopupOpen(true);
  };

  const handleSaveMenu = async () => {
    const resolvedCategoryId = categoryId || editingItem?.category_id || '';
    if (!name || !price || !resolvedCategoryId) {
      alert('Заполните все обязательные поля');
      return;
    }

    let imageUrl = editingItem?.image_url || null;

    if (image) {
      const fileName = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await uploadMenuImage(fileName, image);
      if (uploadError) {
        console.error(uploadError);
        alert('Ошибка загрузки картинки');
        return;
      }

      const { data } = getMenuImagePublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const payload = {
      name,
      description,
      price: Number(price),
      calories: calories.trim() ? Number(calories) : null,
      category_id: resolvedCategoryId,
      image_url: imageUrl,
      is_available: isAvailable,
    };

    if (editingItem) {
      const { error } = await updateMenuItem(editingItem.id, payload);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }
    } else {
      const { error } = await createMenuItem(payload);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }
    }

    setIsMenuPopupOpen(false);
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice('');
    setCalories('');
    setCategoryId('');
    setIsAvailable(true);
    setImage(null);
    fetchMenu();
  };

  const openCategoryPopup = () => {
    setNewCategoryName('');
    setIsCategoryPopupOpen(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Введите название категории');
      return;
    }

    const { error } = await createCategory(newCategoryName.trim());
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    loadCategories();
    setIsCategoryPopupOpen(false);
  };

  const filteredMenu = useMemo(
    () =>
      menu.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter ? item.category_id === categoryFilter : true;
        return matchesSearch && matchesCategory;
      }),
    [categoryFilter, menu, searchTerm]
  );

  if (isChecking) return <PageLoader label="Проверяем доступ..." />;
  if (!profile) return null;
  if (loading) return <PageLoader label="Загружаем меню..." />;

  return (
    <AdminShell
      profile={profile}
      active="menu"
      title="Меню"
      subtitle="Управление позициями, категориями, калориями и доступностью блюд."
      actions={
        <>
          <button type="button" className={styles.primaryAction} onClick={openCreateMenuPopup}>
            Добавить позицию
          </button>
          <button type="button" className={styles.secondaryAction} onClick={openCategoryPopup}>
            Добавить категорию
          </button>
        </>
      }
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Редактор меню</p>
            <h2 className={styles.panelTitle}>Позиции и фильтры</h2>
          </div>

          <span className={styles.panelMeta}>{filteredMenu.length} позиций</span>
        </div>

        <div className={styles.filters}>
          <PopupInput
            placeholder="Поиск по названию"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.filterControl}
          />
          <PopupSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterControl}
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </PopupSelect>
        </div>

        <MenuList>
          {filteredMenu.map((item) => (
            <MenuItem key={item.id}>
              <MenuItemImg src={item.image_url || "/TestRecImg.svg"} alt={item.name} />
              <MenuItemDesc>
                <Subtitle>{item.name}</Subtitle>
                <Description>{item.description}</Description>
                <div className="" style={{display: 'flex', gap: '20px'}}>

                  <Price>{item.price} ₽</Price>
                  <Description>
                    {item.calories != null ? `${item.calories} ккал` : "Калории не указаны"}
                  </Description>
                  <Description
                    className={item.is_available === false ? styles.unavailableText : styles.availableText}
                  >
                    {item.is_available === false ? "Нет в наличии" : "В наличии"}
                  </Description>
                </div>
              </MenuItemDesc>
              <MenuItemButtons>
                <LoginButton onClick={() => openEditMenuPopup(item)}>Редактировать</LoginButton>
                <LoginButton className={styles.deleteButton} onClick={() => handleDelete(item.id)}>
                  Удалить
                </LoginButton>
              </MenuItemButtons>
            </MenuItem>
          ))}
        </MenuList>
      </section>

      {isMenuPopupOpen && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>{editingItem ? "Редактировать позицию" : "Новая позиция"}</PopupTitle>
            <PopupForm>
              <PopupFileInput
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              <PopupInput
                placeholder="Название"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <PopupTextarea
                placeholder="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <PopupInput
                type="number"
                placeholder="Цена"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <PopupInput
                type="number"
                placeholder="Калории"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
              <PopupSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Категория</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </PopupSelect>
              <label className={styles.availabilityToggle}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <span>Доступно для заказа</span>
              </label>
              <PopupButtons>
                <PopupCancelButton onClick={() => setIsMenuPopupOpen(false)}>
                  Отмена
                </PopupCancelButton>
                <PopupSaveButton type="button" onClick={handleSaveMenu}>
                  Сохранить
                </PopupSaveButton>
              </PopupButtons>
            </PopupForm>
          </PopupContainer>
        </PopupOverlay>
      )}

      {isCategoryPopupOpen && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>Создать новую категорию</PopupTitle>
            <PopupForm>
              <PopupInput
                placeholder="Название категории"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <PopupButtons>
                <PopupCancelButton onClick={() => setIsCategoryPopupOpen(false)}>
                  Отмена
                </PopupCancelButton>
                <PopupSaveButton type="button" onClick={handleCreateCategory}>
                  Создать
                </PopupSaveButton>
              </PopupButtons>
            </PopupForm>
          </PopupContainer>
        </PopupOverlay>
      )}
    </AdminShell>
  );
}
