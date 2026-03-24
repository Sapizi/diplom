import styles from "./CartStyles.module.scss";
import { createStyledComponent } from "@/lib/scssComponents";

export const CartList = createStyledComponent("div", styles.cartList);
export const CartItem = createStyledComponent("div", styles.cartItem);
export const CartItemImg = createStyledComponent("img", styles.cartItemImg);
export const CartDesc = createStyledComponent("div", styles.cartDesc);
export const CartQuantity = createStyledComponent("div", styles.cartQuantity);
export const CartContainer = createStyledComponent("div", styles.cartContainer);
export const CartSummary = createStyledComponent("div", styles.cartSummary);
export const BonusRow = createStyledComponent("div", styles.bonusRow);
export const BonusToggle = createStyledComponent("div", styles.bonusToggle);
