export interface LegalSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
}

const UPDATED = 'September 30, 2026';

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  summary: 'The rules for using SEO Scan Pro. Short version: audit sites you are allowed to audit, do not abuse the service, and treat AI-written findings as guidance, not guarantees.',
  updated: UPDATED,
  sections: [
    {
      heading: '1. Agreement',
      body: [
        'By creating an account or using SEO Scan Pro (the “Service”), you agree to these Terms and to our Privacy Policy. If you use the Service on behalf of a company or client, you confirm you are authorised to accept these Terms for them.'
      ]
    },
    {
      heading: '2. Your account',
      body: [
        'You must provide a valid email address and confirm it before you can run scans. Keep your password and any API keys secret; you are responsible for activity under your account. Tell us promptly if you believe your account has been compromised.'
      ]
    },
    {
      heading: '3. What you may scan',
      body: ['The Service loads web pages in a real browser and analyses them. You may only scan websites that you own or have permission to audit. You must not use the Service to:'],
      bullets: [
        'probe, attack or overload any site or network, or attempt to reach private or internal addresses (these are blocked);',
        'bypass rate limits, daily allowances or other technical limits, including by creating multiple accounts;',
        'scrape, resell or republish other people’s content;',
        'break the law or infringe anyone’s rights.'
      ]
    },
    {
      heading: '4. Limits and fair use',
      body: [
        'Scans cost real compute and AI usage, so each account has rate limits and a daily scan allowance. We may change these limits, and we may pause or remove access that puts the Service or other users at risk.'
      ]
    },
    {
      heading: '5. Reports and AI-generated content',
      body: [
        'Findings, scores and recommendations are produced by automated crawling and an AI model (DeepSeek), or by a rule-based fallback when the AI is unavailable. They can be incomplete or wrong. Measurements such as load time are taken from our servers and may differ from what your visitors experience. Nothing in a report is a guarantee of search ranking, traffic or revenue; check important findings before acting on them.',
        'When a target site cannot be reached, the Service may show illustrative placeholder data and will label it as simulated. Do not present simulated data as a real audit.'
      ]
    },
    {
      heading: '6. Your content and your clients’ data',
      body: [
        'You keep ownership of what you submit and of the reports you generate. You grant us permission to process it only as needed to run the Service. If you use the lead-capture widget, the prospects’ names and email addresses it collects are yours to manage; you are responsible for having a lawful basis to collect and use them and for telling those people how you will use them.'
      ]
    },
    {
      heading: '7. Plans and fees',
      body: [
        'The Service has a free plan and paid subscription plans (currently Starter and Agency). The features, scan allowances and prices of each plan are shown on our pricing page when you subscribe. Allowances are measured over a rolling 30 days.',
        'Paid plans renew automatically each month or year until you cancel. Payments are processed by Stripe; we never see or store your card number. You can cancel at any time from Manage billing in the app: cancellation takes effect at the end of the period you have already paid for, and you keep access until then. Fees for a period that has already started are not refunded, except where the law requires it.',
        'If a payment fails we will ask you to update your card, and we may move the account to the free plan if it stays unpaid. We will give notice before changing the price of an existing subscription.'
      ]
    },
    {
      heading: '8. Availability and changes',
      body: [
        'We work to keep the Service running but do not promise uninterrupted or error-free operation. We may change or discontinue features. We will try to give notice of changes that materially affect you.'
      ]
    },
    {
      heading: '9. Ending your use',
      body: [
        'You can delete your account at any time from the Account tab, which removes your scans, settings, leads, monitors and API keys. We may suspend or end access if these Terms are broken or the Service is being abused.'
      ]
    },
    {
      heading: '10. Disclaimers and liability',
      body: [
        'The Service is provided “as is” and “as available”, without warranties of any kind to the extent the law allows. To the extent the law allows, we are not liable for indirect or consequential loss, lost profits or lost data arising from your use of the Service, and our total liability for any claim is limited to the amount you paid us for the Service in the 12 months before the claim (which may be nothing).'
      ]
    },
    {
      heading: '11. Changes to these Terms',
      body: ['We may update these Terms. If a change is material we will post it here and update the date above. Continuing to use the Service after a change means you accept it.']
    }
  ]
};

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  summary: 'What SEO Scan Pro collects, who else handles it, and how you can see or delete it. We do not sell your data and we do not use advertising or analytics trackers.',
  updated: UPDATED,
  sections: [
    {
      heading: '1. What we collect',
      body: ['We collect only what the Service needs to work:'],
      bullets: [
        'Account data: your email address, optional name, and a password stored only as a one-way bcrypt hash.',
        'Scan data: the URLs you ask us to scan, the results of crawling them (page metadata, headings, link and image counts, security headers, performance timings), the AI-written report, and the audit log of each scan.',
        'Settings you choose: agency name, colours, logo URL, report footer, webhook URL, monitoring email address and scheduled monitors.',
        'Billing data: if you subscribe, your Stripe customer and subscription identifiers, your plan, its status and renewal date. Your card number and payment details are handled by Stripe and never reach our servers.',
        'Lead data: if you use the embeddable widget, the name and email address a visitor types in, stored in your account against the scan they ran.',
        'Technical data: your IP address is used to apply rate limits and may appear in our hosting provider’s request logs. We store a session token in your browser’s local storage to keep you signed in.'
      ]
    },
    {
      heading: '2. How we use it',
      body: [
        'To run scans and produce reports, to sign you in and keep your account secure, to send the emails described below, to apply rate limits and prevent abuse, and to keep the Service working. We do not sell personal data and we do not use it for advertising.'
      ]
    },
    {
      heading: '3. Who else handles your data',
      body: ['We use a small number of service providers who process data on our behalf:'],
      bullets: [
        'Railway — hosts the application and its database.',
        'DeepSeek — receives a structured summary of each crawl so it can write the analysis: the page URL, meta tags, heading text, structured-data types, counts of links and images, security headers and performance timings. It does not receive the full page content. If the AI is unavailable or not configured, a rule-based report is generated without sending anything to it.',
        'Stripe — processes subscription payments and sends receipts. It receives your email address and what you buy.',
        'Resend — delivers our emails (address confirmation, password reset, and score-drop alerts you turn on).',
        'If you configure a webhook, your report data is sent to the address you provide.'
      ]
    },
    {
      heading: '4. Emails we send',
      body: [
        'We send transactional email only: confirming your address, resetting your password, and monitoring alerts you enable. We do not send marketing email.'
      ]
    },
    {
      heading: '5. Cookies and storage',
      body: [
        'We do not use advertising or analytics cookies. The Service stores a sign-in token in your browser’s local storage, which is necessary for it to work.'
      ]
    },
    {
      heading: '6. How long we keep data',
      body: [
        'We keep your data until you delete it. You can delete individual scans and monitors at any time, and deleting your account from the Account tab permanently removes your scans, settings, leads, monitors and API keys. Backups may retain data for a short period afterwards.'
      ]
    },
    {
      heading: '7. Your choices and rights',
      body: [
        'You can view your data in the app, export your scans as CSV or JSON, change your email and password, sign out of every device, and delete your account. Depending on where you live you may have further rights, such as access, correction, portability or objection; contact us and we will help.'
      ]
    },
    {
      heading: '8. Security',
      body: [
        'Connections use HTTPS, passwords are hashed, reset and confirmation tokens are stored only as hashes, API keys are shown once, and requests to private network addresses are blocked. No system is perfectly secure, so we cannot guarantee absolute security.'
      ]
    },
    {
      heading: '9. Children',
      body: ['The Service is for businesses and professionals and is not directed at children under 16.']
    },
    {
      heading: '10. Changes',
      body: ['We may update this policy. If a change is material we will post it here and update the date above.']
    }
  ]
};
