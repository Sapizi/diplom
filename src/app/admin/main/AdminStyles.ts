import styles from "./AdminStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const AdminContainer = createStyledComponent(
  "div",
  styles.adminContainer,
);
export const AdminBlock = createStyledLink(styles.adminBlock);
