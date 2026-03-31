"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { changeCartItemQuantity, readCart, setCartItemQuantity, subscribeCart, type CartItem } from "@/app/api/client/cart";
import { getCurrentUser } from "@/app/api/client/auth";
import { fetchCategories, type CategoryType } from "@/app/api/client/categories";
import { fetchMenuItems } from "@/app/api/client/menu";
import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import PageLoader from "@/app/components/PageLoader/PageLoader";
import { LoginButton } from "@/app/components/auth/AuthStyles";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Title } from "@/app/MainPageStyles";
import {
  Description,
  MenuItem,
  MenuItemButtons,
  MenuItemDesc,
  MenuItemImg,
  MenuList,
  Price,
  Subtitle,
  TitleBlock,
} from "../admin/menu/AdminMenuStyles";
import { SortBlock, SortOption, SortSelect } from "./MenuPageStyles";
import styles from "./page.module.scss";

type MenuItemType = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id?: string | null;
  calories?: number | null;
  is_available?: boolean | null;
};

const MENU_CACHE_TTL_MS = 5 * 60 * 1000;
const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "kombo-obedy": "комбо-обеды",
  shaurma: "шаурма",
  kesadilya: "кесадилья",
  tako: "тако",
  burrito: "буррито",
  "goryachie-blyuda": "горячие-блюда",
  frityur: "фритюр",
  dopolneniya: "дополнения",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getCartQuantityById(cart: CartItem[], itemId: string) {
  return cart.find((item) => item.id === itemId)?.quantity ?? 0;
}

export default function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menu, setMenu] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"asc" | "desc" | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const syncCart = () => {
      setCart(readCart());
    };

    syncCart();
    return subscribeCart(syncCart);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const cacheKey = `menu_cache_${sort || "default"}`;

    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { ts: number; data: MenuItemType[] };
        if (Date.now() - cached.ts < MENU_CACHE_TTL_MS) {
          setMenu(cached.data);
          setLoading(false);
        }
      } catch (error) {
        console.warn("Menu cache parse error", error);
      }
    }

    const loadMenu = async () => {
      const { data, error } = await fetchMenuItems(sort);
      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const items = data || [];
      setMenu(items);
      setLoading(false);
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: items }));
    };

    setLoading((prev) => prev && menu.length === 0);
    loadMenu();

    return () => {
      isMounted = false;
    };
  }, [sort]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      const { data, error } = await fetchCategories();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(error);
        return;
      }

      setCategories(data || []);
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCategorySlug = searchParams.get("category");

  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) {
      return null;
    }

    const normalizedRequestedSlug =
      CATEGORY_SLUG_ALIASES[selectedCategorySlug] || selectedCategorySlug;

    return (
      categories.find((category) => slugify(category.name) === normalizedRequestedSlug) || null
    );
  }, [categories, selectedCategorySlug]);

  useEffect(() => {
    setCategoryFilter(selectedCategory?.id || "");
  }, [selectedCategory?.id]);

  const filteredMenu = useMemo(() => {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;

    return menu.filter((item) => {
      const isAvailable = item.is_available !== false;
      const matchesCategory = categoryFilter ? item.category_id === categoryFilter : true;
      const matchesMin = min == null || item.price >= min;
      const matchesMax = max == null || item.price <= max;
      const matchesAvailability = !availableOnly || isAvailable;

      return matchesCategory && matchesMin && matchesMax && matchesAvailability;
    });
  }, [availableOnly, categoryFilter, maxPrice, menu, minPrice]);

  const updateMenuItemQuantity = async (item: MenuItemType, nextQuantity: number) => {
    const user = await getCurrentUser();
    if (!user) {
      alert("Нужно войти в аккаунт");
      router.push("/login");
      return;
    }

    const cartItemBase = {
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
    };

    setCart(setCartItemQuantity(cartItemBase, nextQuantity));
  };

  const handleAddToCart = (item: MenuItemType) => {
    void updateMenuItemQuantity(item, 1);
  };

  const handleChangeQuantity = (item: MenuItemType, delta: number) => {
    const cartItemBase = {
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
    };

    setCart(changeCartItemQuantity(cartItemBase, delta));
  };

  if (loading) {
    return <PageLoader label="Загружаем меню..." />;
  }

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Меню</Title>
        </TitleBlock>

        <div className={styles.toolbar}>
          <SortBlock>
            <SortSelect value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <SortOption value="" disabled>
                Сортировка
              </SortOption>
              <SortOption value="asc">По стоимости ↑</SortOption>
              <SortOption value="desc">По стоимости ↓</SortOption>
            </SortSelect>
          </SortBlock>

          <div className={styles.filters}>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Цена от"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className={styles.filterInput}
            />

            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Цена до"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className={styles.filterInput}
            />

            <label className={styles.filterCheckbox}>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
              />
              <span>Только в наличии</span>
            </label>
          </div>
        </div>

        {selectedCategory ? (
          <div className={styles.categoryBanner}>
            <span className={styles.categoryBadge}>Категория: {selectedCategory.name}</span>
            <button
              type="button"
              className={styles.resetCategoryButton}
              onClick={() => {
                setCategoryFilter("");
                router.push("/menu");
              }}
            >
              Сбросить категорию
            </button>
          </div>
        ) : null}

        {filteredMenu.length === 0 ? (
          <div className={styles.emptyState}>
            <p>По текущим фильтрам ничего не найдено.</p>
          </div>
        ) : (
          <MenuList>
            {filteredMenu.map((item) => {
              const quantity = getCartQuantityById(cart, item.id);
              const isAvailable = item.is_available !== false;

              return (
                <MenuItem key={item.id} className={styles.menuItemCard}>
                  <MenuItemImg
                    src={item.image_url || "/TestRecImg.svg"}
                    alt={item.name}
                    className={styles.menuImage}
                  />
                  <MenuItemDesc className={styles.menuItemDesc}>
                    <div className={styles.itemHeader}>
                      <Subtitle>{item.name}</Subtitle>
                      <span
                        className={`${styles.availabilityBadge} ${
                          isAvailable ? styles.available : styles.unavailable
                        }`}
                      >
                        {isAvailable ? "В наличии" : "Нет в наличии"}
                      </span>
                    </div>

                    <Description>{item.description}</Description>

                    <div className={styles.metaRow}>
                      <Price>{item.price} ₽</Price>
                      {item.calories != null ? (
                        <span className={styles.calories}>{item.calories} ккал</span>
                      ) : null}
                    </div>
                  </MenuItemDesc>

                  <MenuItemButtons className={styles.actionsColumn}>
                    {quantity > 0 ? (
                      <div className={styles.quantityControl}>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          onClick={() => handleChangeQuantity(item, -1)}
                        >
                          −
                        </button>
                        <span className={styles.quantityValue}>{quantity}</span>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          onClick={() => handleChangeQuantity(item, 1)}
                          disabled={!isAvailable}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <LoginButton
                        onClick={() => handleAddToCart(item)}
                        className={styles.addButton}
                        disabled={!isAvailable}
                      >
                        В корзину
                      </LoginButton>
                    )}
                  </MenuItemButtons>
                </MenuItem>
              );
            })}
          </MenuList>
        )}
      </Wrapper>
      <Footer />
    </>
  );
}
