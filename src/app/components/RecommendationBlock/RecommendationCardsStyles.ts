import styles from "./RecommendationCardsStyles.module.scss";
import { createStyledComponent } from "@/lib/scssComponents";

export const RecommendationCardContainer = createStyledComponent(
  "div",
  styles.recommendationCardContainer,
);
