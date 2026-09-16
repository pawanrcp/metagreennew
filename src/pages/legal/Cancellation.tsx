import React from 'react';
import { RotateCcw } from 'lucide-react';
import { LegalLayout, TocItem } from '@/src/components/legal/LegalLayout';

interface PageProps {
  onNavigateHome: () => void;
}

const TOC: TocItem[] = [
  { id: 'subscription-cancellation', label: '1. Subscription Cancellation' },
  { id: 'refund-policy', label: '2. Refund Policy' },
  { id: 'free-trial', label: '3. 7-Day Free Trial' },
  { id: 'custom-contracts', label: '4. Enterprise Contracts' },
  { id: 'process', label: '5. How to Initiate' },
];

export function Cancellation({ onNavigateHome }: PageProps) {
  return (
    <LegalLayout
      icon={RotateCcw}
      eyebrow="Billing & Refund Policy"
      title="Cancellation & Refunds"
      description="Clear, transparent terms regarding MetaGreen subscription cancellations, free trials, and refund processing."
      updatedAt="September 2026"
      toc={TOC}
      onBackToHome={onNavigateHome}
    >
      <section id="subscription-cancellation">
        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Subscription Cancellation</h2>
        <p>
          You may cancel your MetaGreen platform subscription at any time directly through your billing portal settings. Upon cancellation, your account remains active with full functionality until the conclusion of your current prepaid billing cycle.
        </p>
      </section>

      <section id="refund-policy">
        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Refund Policy</h2>
        <p>
          Monthly subscription fees are non-refundable once the billing cycle begins. For annual subscriptions cancelled within the first 14 days of activation, a pro-rated refund will be credited minus applicable payment processing gateway charges.
        </p>
      </section>

      <section id="free-trial">
        <h2 className="text-xl font-bold text-slate-900 mb-3">3. 7-Day Free Trial</h2>
        <p>
          MetaGreen provides a no-risk 7-day free trial for new EPC partners. No charges will be incurred if cancelled prior to the conclusion of the trial period.
        </p>
      </section>

      <section id="custom-contracts">
        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Enterprise Contracts</h2>
        <p>
          Utility and megawatt enterprise plans governed by signed Master Services Agreements (MSAs) are subject to the specific cancellation schedules stipulated in their respective contracts.
        </p>
      </section>

      <section id="process">
        <h2 className="text-xl font-bold text-slate-900 mb-3">5. How to Initiate a Request</h2>
        <p>
          To request billing assistance, email <span className="font-semibold text-emerald-700">billing@metagreen.in</span> with your Partner Account ID and registered GSTIN. Refund approvals are processed within 5-7 business days back to the original payment source.
        </p>
      </section>
    </LegalLayout>
  );
}
