import logoUrl from '../../assets/ganeum-logo.png';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return <img alt="가늠" className={className} src={logoUrl} />;
}
