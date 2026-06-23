export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <h1 className="text-3xl font-semibold">Terms of Use</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: June 23, 2026</p>

      <section className="mt-8 space-y-4">
        <p>
          These Terms govern your use of Aloyz, a business dashboard for
          messaging, appointment, and automation workflows.
        </p>
        <h2 className="text-xl font-semibold">Use of the Service</h2>
        <p>
          You are responsible for the accuracy of the business and customer data
          you enter, for obtaining any required customer permissions, and for
          complying with applicable messaging, privacy, and consumer protection
          laws.
        </p>
        <h2 className="text-xl font-semibold">Connected Platforms</h2>
        <p>
          When you connect WhatsApp, Instagram, Google Calendar, or other third
          party services, you authorize Aloyz to access and process data from
          those services only as needed to provide the requested functionality.
          You must also comply with each third party platform's terms.
        </p>
        <h2 className="text-xl font-semibold">Subscription</h2>
        <p>
          Aloyz includes a 14-day free trial. After the trial, continued access
          may require payment of the monthly subscription fee shown in the
          dashboard.
        </p>
        <h2 className="text-xl font-semibold">Acceptable Use</h2>
        <p>
          You may not use Aloyz to send spam, unlawful content, deceptive
          messages, or content that violates third party platform policies.
        </p>
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          For questions, contact:{" "}
          <a className="text-blue-700 underline" href="mailto:info@aloyz.co">
            info@aloyz.co
          </a>
        </p>
      </section>
    </main>
  );
}
