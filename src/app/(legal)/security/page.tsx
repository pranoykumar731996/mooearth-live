import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Policy | MooEarth.Live',
  description: 'How MooEarth.Live secures your data and our responsible disclosure guidelines.',
  alternates: {
    canonical: 'https://www.mooearth.live/security'
  }
};

export default function SecurityPolicy() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Security Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Our Commitment to Security</h2>
          <p>
            At MooEarth.Live, the security of our platform and the protection of user data is a top priority. We utilize industry-standard practices and infrastructure to ensure that your experience checking live scores, news, and interacting with our 3D globe remains secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Infrastructure and Data Protection</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <strong>Encryption in Transit:</strong> All data transferred between your browser and our servers is encrypted using HTTPS/TLS. We enforce strict HTTPS routing across the entire application.
            </li>
            <li>
              <strong>Authentication:</strong> We use Google Sign-In via Firebase Authentication. We do not store, process, or manage your passwords directly. Your login credentials remain securely managed by Google.
            </li>
            <li>
              <strong>Hosting:</strong> Our application is hosted on modern, secure cloud infrastructure (Vercel and Firebase), which provides built-in DDoS protection, automated patching, and secure edge networks.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Best Practices</h2>
          <p>While we secure the platform on our end, we encourage you to follow security best practices:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Ensure your Google account (used for Sign-In) is protected with a strong password and Two-Factor Authentication (2FA).</li>
            <li>Always access MooEarth.Live from trusted networks and devices.</li>
            <li>Be cautious of phishing attempts. Official communications from us will only come from an `@mooearth.live` email address.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Responsible Vulnerability Disclosure</h2>
          <p>
            We appreciate the efforts of security researchers in keeping the internet safe. If you believe you have discovered a security vulnerability on MooEarth.Live, we ask that you follow these responsible disclosure guidelines:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Do not exploit the vulnerability</strong> beyond what is necessary to confirm its existence (e.g., do not download user data, alter configurations, or disrupt the service).</li>
            <li><strong>Keep it confidential:</strong> Please do not publicly disclose the vulnerability until we have had a reasonable amount of time to patch it.</li>
            <li><strong>Report it promptly:</strong> Send a detailed report, including steps to reproduce the issue, to <a href="mailto:security@mooearth.live" className="text-emerald-400 hover:underline">security@mooearth.live</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Incident Response</h2>
          <p>
            In the highly unlikely event of a data breach or security incident that affects user data, we are committed to promptly notifying affected users and relevant authorities in accordance with applicable international data protection laws (such as GDPR).
          </p>
        </section>
      </div>
    </>
  );
}
