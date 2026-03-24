import styles from "./MainPageStyles.module.scss";
import { createStyledComponent } from "@/lib/scssComponents";

export const RecommendationBlock = createStyledComponent(
  "div",
  styles.recommendationBlock,
);
export const Title = createStyledComponent("h1", styles.title);
