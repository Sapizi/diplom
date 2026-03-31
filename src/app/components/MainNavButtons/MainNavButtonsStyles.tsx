import styles from "./MainNavButtonsStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const MainNavButton = createStyledLink(styles.mainNavButton);
export const MainNavButtonsContainer = createStyledComponent(
  "div",
  styles.mainNavButtonsContainer,
);
