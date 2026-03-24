import styles from "./FooterStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const FooterContainer = createStyledComponent(
  "footer",
  styles.footerContainer,
);
export const FooterTop = createStyledComponent("div", styles.footerTop);
export const FooterLinks = createStyledComponent("div", styles.footerLinks);
export const FooterPhoneAndTime = createStyledComponent(
  "div",
  styles.footerPhoneAndTime,
);
export const FooterPhone = createStyledComponent("a", styles.footerPhone);
export const FooterTime = createStyledComponent("p", styles.footerTime);
export const FooterSocials = createStyledComponent("div", styles.footerSocials);
export const FooterBottom = createStyledComponent("div", styles.footerBottom);
export const FooterLinksBottom = createStyledComponent(
  "div",
  styles.footerLinksBottom,
);
export const FooterLink = createStyledLink(styles.footerLink);
export const SystemsOfPayment = createStyledComponent(
  "div",
  styles.systemsOfPayment,
);
export const SystemOfPayment = createStyledComponent("img");
