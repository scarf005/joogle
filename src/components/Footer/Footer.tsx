import "./Footer.css"
import { locale } from "../../stores/locale.ts"

const footerLinks = {
  ko: {
    location: "대한민국",
    about: "JOOGLE 소개",
    advertising: "광고",
    business: "비즈니스",
    privacy: "개인정보처리방침",
    terms: "약관",
    settings: "설정",
  },
  ja: {
    location: "日本",
    about: "JOOGLEについて",
    advertising: "広告",
    business: "ビジネス",
    privacy: "プライバシー",
    terms: "利用規約",
    settings: "設定",
  },
}

export function Footer() {
  const currentLocale = locale.value as "ko" | "ja"
  const links = footerLinks[currentLocale]

  return (
    <footer class="footer">
      <div class="footer__top">{links.location}</div>
      <div class="footer__bottom">
        <div class="footer__links">
          <a href="#about" class="footer__link">{links.about}</a>
          <a href="#advertising" class="footer__link">{links.advertising}</a>
          <a href="#business" class="footer__link">{links.business}</a>
        </div>
        <div class="footer__right">
          <a href="#privacy" class="footer__link">{links.privacy}</a>
          <a href="#terms" class="footer__link">{links.terms}</a>
          <a href="#settings" class="footer__link">{links.settings}</a>
        </div>
      </div>
    </footer>
  )
}
