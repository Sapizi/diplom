import styles from "./HeaderStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const Wrapper = createStyledComponent("div", styles.wrapper);
export const HeaderContainer = createStyledComponent(
  "header",
  styles.headerContainer,
);
export const HeaderContent = createStyledComponent("div", styles.headerContent);
export const SocialLinks = createStyledComponent("div", styles.socialLinks);
export const SocialLink = createStyledLink(styles.socialLink);
export const LogoContainer = createStyledComponent("div", styles.logoContainer);
export const Logo = createStyledComponent("img");
export const UserButtons = createStyledComponent("div", styles.userButtons);
export const UserButtonLink = createStyledLink(styles.userButtonLink);
