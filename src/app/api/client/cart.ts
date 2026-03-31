export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

const CART_STORAGE_KEY = "cart";
const CART_UPDATED_EVENT = "cart-updated";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Cart parse error", error);
    return [];
  }
}

export function writeCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function subscribeCart(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === CART_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_UPDATED_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_UPDATED_EVENT, listener);
  };
}

export function getCartItemsCount(cart: CartItem[]) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

export function setCartItemQuantity(item: Omit<CartItem, "quantity">, quantity: number) {
  const safeQuantity = Math.max(0, Math.floor(quantity));
  const currentCart = readCart();

  const nextCart =
    safeQuantity === 0
      ? currentCart.filter((cartItem) => cartItem.id !== item.id)
      : (() => {
          const existing = currentCart.find((cartItem) => cartItem.id === item.id);

          if (existing) {
            return currentCart.map((cartItem) =>
              cartItem.id === item.id ? { ...cartItem, quantity: safeQuantity } : cartItem
            );
          }

          return [...currentCart, { ...item, quantity: safeQuantity }];
        })();

  writeCart(nextCart);
  return nextCart;
}

export function changeCartItemQuantity(item: Omit<CartItem, "quantity">, delta: number) {
  const currentCart = readCart();
  const existing = currentCart.find((cartItem) => cartItem.id === item.id);
  const nextQuantity = Math.max(0, (existing?.quantity ?? 0) + delta);
  return setCartItemQuantity(item, nextQuantity);
}
