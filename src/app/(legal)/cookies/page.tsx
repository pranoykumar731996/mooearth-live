import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | MooEarth.Live',
  description: 'Understand how MooEarth.Live uses cookies and similar technologies.',
  alternates: {
    canonical: 'https://www.mooearth.live/cookies'
  }
};

export default function CookiePolicy() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Cookie Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
          <p>
            As is common practice with almost all professional web applications, MooEarth.Live uses cookies, which are tiny files that are downloaded to your computer or mobile device, to improve your experience. This page describes what information they gather, how we use it, and why we sometimes need to store these cookies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
          <p>We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. The Cookies We Set</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <strong>Account related cookies:</strong> If you create an account using Google Sign-In, we will use cookies for the management of the signup process and general administration. These cookies will usually be destroyed when you log out.
            </li>
            <li>
              <strong>Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page.
            </li>
            <li>
              <strong>Site preferences cookies:</strong> In order to provide you with a great experience on MooEarth.Live, we provide the functionality to set your preferences for how this site runs when you use it (such as 3D globe settings, theme preference, or favorite teams). In order to remember your preferences we need to set cookies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third Party Cookies</h2>
          <p>In some special cases we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.</p>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <strong>Analytics:</strong> We use analytics solutions to help us understand how you use the site and ways that we can improve your experience. These cookies may track things such as how long you spend on the site, which football matches you view, and the pages that you visit.
            </li>
            <li>
              <strong>Authentication:</strong> We use Google Firebase for authentication. Firebase sets necessary cookies to maintain your session securely.
            </li>
            <li>
              <strong>Advertising (Future):</strong> As MooEarth.Live grows, we may use advertising to offset the costs of running the site. The behavioral advertising cookies used by these platforms are designed to ensure that we provide you with the most relevant adverts where possible.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Managing and Disabling Cookies</h2>
          <p>
            You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of MooEarth.Live and many other websites that you visit. Therefore, it is recommended that you do not disable cookies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. More Information</h2>
          <p>
            Hopefully, that has clarified things for you. If there is something that you aren't sure whether you need or not, it's usually safer to leave cookies enabled in case it does interact with one of the features you use on our site.
          </p>
          <p className="mt-4">
            For more information on how we handle your data, please visit our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
