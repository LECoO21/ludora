import ludoraAppIcon from '../assets/ludora-app-icon.png';

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img src={ludoraAppIcon} alt="" />
    </span>
  );
}
