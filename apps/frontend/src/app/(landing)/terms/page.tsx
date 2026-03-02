export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="text-muted-foreground mb-8 text-sm">
        Last updated: February 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using OpenChat, you agree to be bound
            by these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Use of Service</h2>
          <p>You agree to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Use the platform responsibly</li>
            <li>Comply with applicable laws</li>
            <li>Respect other users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality
            of your account credentials and for all activity under your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. User Content</h2>
          <p>
            You retain ownership of the content you create.
            By using OpenChat, you grant us a limited license
            to host and display that content for service operation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Prohibited Activities</h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Attempting to disrupt or hack the platform</li>
            <li>Spreading malware or harmful code</li>
            <li>Harassing or abusing other users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts
            that violate these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Disclaimer</h2>
          <p>
            The service is provided "as is" without warranties
            of any kind, express or implied.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time.
            Continued use of OpenChat means acceptance of changes.
          </p>
        </section>

      </div>
    </main>
  )
}
