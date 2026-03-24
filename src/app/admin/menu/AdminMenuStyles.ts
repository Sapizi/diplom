import styles from "./AdminMenuStyles.module.scss";
import { createStyledComponent } from "@/lib/scssComponents";

export const MenuList = createStyledComponent("div", styles.menuList);
export const MenuItem = createStyledComponent("div", styles.menuItem);
export const MenuItemImg = createStyledComponent("img", styles.menuItemImg);
export const MenuItemDesc = createStyledComponent("div", styles.menuItemDesc);
export const Subtitle = createStyledComponent("h2");
export const Description = createStyledComponent("p", styles.description);
export const Price = createStyledComponent("p", styles.price);
export const MenuItemButtons = createStyledComponent(
  "div",
  styles.menuItemButtons,
);
export const LoginButton = createStyledComponent("button", styles.loginButton);
export const PopupOverlay = createStyledComponent("div", styles.popupOverlay);
export const PopupContainer = createStyledComponent(
  "div",
  styles.popupContainer,
);
export const PopupTitle = createStyledComponent("h2", styles.popupTitle);
export const PopupForm = createStyledComponent("div", styles.popupForm);
export const PopupInput = createStyledComponent("input", styles.popupInput);
export const PopupTextarea = createStyledComponent(
  "textarea",
  styles.popupTextarea,
);
export const PopupSelect = createStyledComponent("select", styles.popupSelect);
export const PopupFileInput = createStyledComponent("input");
export const PopupButtons = createStyledComponent("div", styles.popupButtons);
export const PopupCancelButton = createStyledComponent(
  "button",
  styles.popupCancelButton,
);
export const PopupSaveButton = createStyledComponent(
  "button",
  styles.popupSaveButton,
);
export const TitleBlock = createStyledComponent("div", styles.titleBlock);
