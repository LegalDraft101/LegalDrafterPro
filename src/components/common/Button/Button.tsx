import { Button as FluentButton } from '@fluentui/react-components';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

function mapAppearance(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return 'primary' as const;
    case 'secondary':
      return 'outline' as const;
    case 'ghost':
      return 'transparent' as const;
  }
}

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  fullWidthMobile?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <FluentButton
      appearance={mapAppearance(variant)}
      className={className}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </FluentButton>
  );
}

interface ButtonSubmitProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  fullWidthMobile?: boolean;
}

export function ButtonSubmit({
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonSubmitProps) {
  return (
    <FluentButton
      type="submit"
      appearance={mapAppearance(variant)}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </FluentButton>
  );
}
