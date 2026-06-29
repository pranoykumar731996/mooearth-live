import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines | MooEarth.Live',
  description: 'Community guidelines and rules for user behavior on MooEarth.Live.',
  alternates: {
    canonical: 'https://www.mooearth.live/community'
  }
};

export default function CommunityGuidelines() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Community Guidelines</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Welcome to the Global Pitch</h2>
          <p>
            MooEarth.Live is designed to bring football fans from across the globe together. Whether you are checking live scores, exploring our 3D interactive globe, or reading AI-assisted match summaries, we want this platform to be a welcoming, safe, and enjoyable space for everyone. To ensure this, we ask all users to adhere to these Community Guidelines.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Rules of Play (What is Not Allowed)</h2>
          <p>By using MooEarth.Live and interacting with any community features (such as user profiles via Google Sign-In or potential future forums), you agree <strong>NOT</strong> to engage in the following behaviors:</p>
          
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-xl font-medium text-emerald-300">No Harassment or Bullying</h3>
              <p>Do not attack, harass, threaten, or insult other users, teams, or players. Passion for football is great, but toxic behavior, hate speech, racism, sexism, or discrimination of any kind is strictly prohibited.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-emerald-300">No Spam</h3>
              <p>Do not use our platform to distribute unsolicited advertising, promotional materials, affiliate links, or repetitive messages. Do not attempt to artificially inflate metrics or manipulate the site's functionalities.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-emerald-300">No Illegal Content</h3>
              <p>Do not share, link to, or promote any content that violates international laws, including pirated sports streams, illegal betting rings, or any form of explicit, violent, or illegal material.</p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-emerald-300">No Impersonation</h3>
              <p>Do not impersonate other users, MooEarth.Live staff, official sports figures, or journalists. Use your Google Sign-In account authentically.</p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-emerald-300">No Malicious Activity</h3>
              <p>Do not attempt to scrape our APIs, reverse-engineer our 3D globe visualization, distribute malware, or interfere with the normal operation of the MooEarth.Live servers and applications.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Reporting Violations</h2>
          <p>
            If you witness behavior that violates these guidelines, please report it immediately. You can contact our moderation team at <a href="mailto:support@mooearth.live" className="text-emerald-400 hover:underline">support@mooearth.live</a>. Please include any relevant screenshots, usernames, or URLs to help us investigate efficiently.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Enforcement Actions (The Red Card)</h2>
          <p>
            MooEarth.Live reserves the right to take action against any account or IP address that violates these guidelines. Depending on the severity of the violation, enforcement actions may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>A formal warning.</li>
            <li>Temporary suspension of your account and access to personalized features.</li>
            <li>Permanent ban from the MooEarth.Live platform.</li>
            <li>Reporting severe, illegal activities to the relevant law enforcement authorities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Updates to Guidelines</h2>
          <p>
            As MooEarth.Live evolves and adds new features, these guidelines may be updated. We encourage you to review them periodically to ensure you remain in good standing with the community.
          </p>
        </section>
      </div>
    </>
  );
}
