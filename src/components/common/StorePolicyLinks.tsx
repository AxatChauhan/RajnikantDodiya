import React from 'react';
import { STORE_POLICY_LINKS } from '../../config/storeConfig';

export type PolicyTab = 'terms' | 'privacy' | 'refund' | 'delivery' | 'contact';

interface StorePolicyLinksProps {
  onSelectPolicy: (tab: PolicyTab) => void;
  variant?: 'store' | 'academic' | 'compact';
  className?: string;
}

/**
 * Shared Razorpay-compliant legal & policy link bar rendered cleanly across
 * the root homepage footer, /store, #bookstore, and checkout footers.
 */
export const StorePolicyLinks: React.FC<StorePolicyLinksProps> = ({
  onSelectPolicy,
  variant = 'store',
  className = ''
}) => {
  const linkClass =
    variant === 'academic'
      ? 'hover:text-claret underline transition-colors cursor-pointer'
      : variant === 'compact'
      ? 'hover:text-blue-700 underline transition-colors cursor-pointer'
      : 'hover:text-blue-700 underline transition-colors cursor-pointer';

  const containerClass =
    variant === 'compact'
      ? `flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-gray-500 ${className}`
      : `flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] font-medium ${
          variant === 'academic' ? 'text-ink-muted' : 'text-gray-600'
        } ${className}`;

  return (
    <nav aria-label="Store Legal and Compliance Policies" className={containerClass}>
      {STORE_POLICY_LINKS.map((item, idx) => (
        <React.Fragment key={item.id}>
          {idx > 0 && <span aria-hidden="true">•</span>}
          <a
            href={item.policyPath}
            onClick={(e) => {
              e.preventDefault();
              onSelectPolicy(item.id);
            }}
            className={linkClass}
          >
            {item.label}
          </a>
        </React.Fragment>
      ))}
    </nav>
  );
};
