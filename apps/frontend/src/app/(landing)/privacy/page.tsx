export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="text-muted-foreground mb-8 text-sm">
        Last updated: February 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
          <p>
            OpenChat ("we", "our", or "us") values your privacy.
            This Privacy Policy explains how we collect, use,
            and safeguard your information when you use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Account information (name, email address)</li>
            <li>Profile details you choose to provide</li>
            <li>Messages and content created within the platform</li>
            <li>Technical data (IP address, browser type, device information)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide and maintain the service</li>
            <li>Authenticate users securely</li>
            <li>Improve performance and reliability</li>
            <li>Prevent fraud and abuse</li>
            <li>Respond to support requests</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Data Security</h2>
          <p>
            OpenChat is built with privacy and security in mind.
            We use secure authentication systems and encrypted communication
            channels to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Data Sharing</h2>
          <p>
            We do not sell or rent your personal information.
            We may disclose information only if required by law
            or to protect the security and integrity of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Data Retention</h2>
          <p>
            We retain user information only as long as necessary
            to provide the service or comply with legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access your personal data</li>
            <li>Request corrections</li>
            <li>Request deletion of your data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time.
            Continued use of OpenChat after changes means you accept the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
          <p>
            If you have questions about this Privacy Policy,
            please contact us at: dev.connor@proton.me
          </p>
        </section>

      </div>
    </main>
  )
}
