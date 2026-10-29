
type PartyAvatarProps = {
  name: string;
  color?: string;
  image?: string;
  size?: number;
};

export function PartyAvatar({ name, color = '#22364F', image, size = 32 }: PartyAvatarProps) {
  // Avatar fills are identity data, so choose their foreground independently of the page theme.
  const channels = /^#[0-9a-f]{6}$/i.test(color) ? [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255) : [0, 0, 0];
  const [r, g, b] = channels.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const foreground = 1.05 / (lightness + 0.05) >= 4.5 ? '#FFFFFF' : '#0B1A2C';
  const initials = name.
  replace(/^Md\.\s*/, '').
  split(/\s+/).
  filter((w) => /^[A-Za-z]/.test(w)).
  slice(0, 2).
  map((w) => w[0]).
  join('').
  toUpperCase();

  if (image) {
    return (
      <img
        src={image}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }} />);


  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, color: foreground, fontSize: size * 0.36 }}>
      
      {initials}
    </span>);

}
