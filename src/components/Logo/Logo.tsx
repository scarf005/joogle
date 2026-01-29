import "./Logo.css"

interface LogoProps {
  size?: "small" | "large"
  animated?: boolean
}

export function Logo({ size = "large", animated = false }: LogoProps) {
  const textClass = size === "small"
    ? "logo__text logo__text--small"
    : "logo__text"
  const logoClass = animated ? "logo logo--animated" : "logo"

  return (
    <div class={logoClass}>
      <span class={textClass}>
        <span class="logo__letter logo__letter--j">J</span>
        <span class="logo__letter logo__letter--o1">o</span>
        <span class="logo__letter logo__letter--o2">o</span>
        <span class="logo__letter logo__letter--g">g</span>
        <span class="logo__letter logo__letter--l">l</span>
        <span class="logo__letter logo__letter--e">e</span>
      </span>
    </div>
  )
}
