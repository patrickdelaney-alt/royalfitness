export const metadata = {
  title: "Privacy Policy — Royal",
  description: "Privacy policy for the Royal fitness tracking app.",
};

export default function PrivacyPage() {
  const lastUpdated = "March 2026";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {lastUpdated}</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Royal (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is a fitness tracking and wellness community
              application. This Privacy Policy explains what information we collect, how we use it,
              and your rights regarding that information. By using Royal, you agree to this policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <ul className="text-sm leading-relaxed text-muted-foreground space-y-2 list-disc list-inside">
              <li>
                <strong className="text-foreground">Account information:</strong> name, email address,
                and password (stored as a one-way hash) when you create an account.
              </li>
              <li>
                <strong className="text-foreground">Fitness & health data:</strong> workouts (exercises,
                sets, reps, weight), nutrition logs (meals, macros, calories), wellness activities
                (meditation, yoga, sleep), and step counts that you voluntarily enter.
              </li>
              <li>
                <strong className="text-foreground">Profile information:</strong> profile photo, bio,
                and social connections (followers/following) that you choose to add.
              </li>
              <li>
                <strong className="text-foreground">Content:</strong> posts, comments, and media you
                share within the app.
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong> app interactions and feature
                usage to improve the product.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="text-sm leading-relaxed text-muted-foreground space-y-2 list-disc list-inside">
              <li>To provide and operate the Royal app and its features.</li>
              <li>To display your fitness progress, history, and insights to you.</li>
              <li>To enable social features such as posts, comments, and following other users.</li>
              <li>To send notifications about activity on your posts (likes, comments, follows).</li>
              <li>To improve the app based on aggregated, anonymised usage patterns.</li>
              <li>To respond to support requests.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We do <strong className="text-foreground">not</strong> sell, rent, or trade your personal
              information to third parties. We do not share your health or fitness data with
              advertisers. We may share information only in the following limited circumstances:
            </p>
            <ul className="text-sm leading-relaxed text-muted-foreground space-y-2 list-disc list-inside mt-3">
              <li>
                <strong className="text-foreground">Service providers:</strong> trusted infrastructure
                partners (hosting, database, file storage) who process data solely to operate the app
                under strict confidentiality agreements.
              </li>
              <li>
                <strong className="text-foreground">Legal requirements:</strong> if required by law or
                to protect the safety of our users.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">5. Data Storage & Security</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your data is stored on secure, encrypted servers. Passwords are never stored in plain
              text — they are hashed using bcrypt. We use industry-standard HTTPS for all data
              transmission. While we take security seriously, no system is completely immune to risk;
              please use a strong, unique password.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights & Choices</h2>
            <ul className="text-sm leading-relaxed text-muted-foreground space-y-2 list-disc list-inside">
              <li>
                <strong className="text-foreground">Access & correction:</strong> you can view and
                edit your profile and data at any time within the app.
              </li>
              <li>
                <strong className="text-foreground">Data deletion:</strong> to delete your account and
                all associated data, contact us at{" "}
                <a href="mailto:support@royalwellness.app" className="underline">
                  support@royalwellness.app
                </a>
                . We will process deletion requests within 30 days.
              </li>
              <li>
                <strong className="text-foreground">Data portability:</strong> you may request an
                export of your data by contacting us.
              </li>
              <li>
                <strong className="text-foreground">Opt-out of notifications:</strong> notification
                preferences can be managed in the app settings.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">7. Children&apos;s Privacy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Royal is not directed to children under 13. We do not knowingly collect personal
              information from children under 13. If you believe a child under 13 has provided us
              with information, please contact us and we will delete it promptly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may update this policy occasionally. When we do, we will revise the &quot;Last
              updated&quot; date at the top of this page. Continued use of the app after changes
              constitutes acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If you have questions or concerns about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:support@royalwellness.app" className="underline">
                support@royalwellness.app
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
