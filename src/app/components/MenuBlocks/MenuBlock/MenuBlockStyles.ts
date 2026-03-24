import styles from "./MenuBlockStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const MenuBlockMaket = createStyledComponent(
  "div",
  styles.menuBlockMaket,
);
export const MenuBlockContentLeft = createStyledComponent(
  "div",
  styles.menuBlockContentLeft,
);
export const MenuBlockTitle = createStyledComponent("h2", styles.menuBlockTitle);
export const MenuBlockDescription = createStyledComponent(
  "p",
  styles.menuBlockDescription,
);
export const MenuBlockLink = createStyledLink(styles.menuBlockLink);
export const MenuBlockContentRight = createStyledComponent(
  "div",
  styles.menuBlockContentRight,
);
export const MenuBlockImages = createStyledComponent(
  "div",
  styles.menuBlockImages,
);
export const MenuBlockImage = createStyledComponent("img", styles.menuBlockImage);
