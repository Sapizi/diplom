import styles from "./MenuPageStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const SortBlock = createStyledComponent("div", styles.sortBlock);
export const SortSelect = createStyledComponent("select", styles.sortSelect);
export const SortOption = createStyledComponent("option");
export const PopupSaveLink = createStyledLink(styles.popupSaveLink);
