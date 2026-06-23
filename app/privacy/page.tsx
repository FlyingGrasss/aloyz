export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: June 23, 2026</p>

      <section className="mt-8 space-y-4">
        <p>
          Aloyz provides customer messaging, appointment, and business automation
          tools for businesses. This policy explains what data we collect and how
          we use it.
        </p>
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <p>
          We collect account information, business profile information, customer
          records entered by the business, appointment data, payment records
          entered in the dashboard, and messages received through connected
          channels such as WhatsApp and Instagram.
        </p>
        <h2 className="text-xl font-semibold">Meta Platform Data</h2>
        <p>
          If a business connects an Instagram professional account, Aloyz may
          receive Instagram account identifiers, username/profile metadata,
          access tokens, webhook events, and message content. We use this data to
          identify the connected business account, display and manage Instagram
          conversations, and send replies when authorized by the business.
        </p>
        <h2 className="text-xl font-semibold">How We Use Data</h2>
        <p>
          We use data to operate the dashboard, route messages to the correct
          business, create appointments, provide bot automation when enabled,
          provide support, maintain security, and improve the service.
        </p>
        <h2 className="text-xl font-semibold">Sharing and Processors</h2>
        <p>
          We do not sell personal data. We may use service providers for hosting,
          database storage, messaging APIs, analytics, and AI response generation
          where necessary to provide the service.
        </p>
        <h2 className="text-xl font-semibold">Retention and Deletion</h2>
        <p>
          Businesses may request deletion of their account data or connected
          channel data by contacting us. We retain data only as needed to provide
          the service, comply with legal obligations, and resolve disputes.
        </p>
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          For privacy requests, contact:{" "}
          <a className="text-blue-700 underline" href="mailto:info@aloyz.co">
            info@aloyz.co
          </a>
        </p>
      </section>
    </main>
  );
}
