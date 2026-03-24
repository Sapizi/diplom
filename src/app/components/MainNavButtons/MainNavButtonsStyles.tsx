import styles from "./MainNavButtonsStyles.module.scss";
import { createStyledComponent } from "@/lib/scssComponents";

export const MainNavButton = createStyledComponent(
  "button",
  styles.mainNavButton,
);
export const MainNavButtonsContainer = createStyledComponent(
  "div",
  styles.mainNavButtonsContainer,
);
