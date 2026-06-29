import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA & Copyright Complaint Policy | MooEarth.Live',
  description: 'Procedures for reporting copyright infringement on MooEarth.Live under the DMCA.',
  alternates: {
    canonical: 'https://www.mooearth.live/dmca'
  }
};

export default function DMCAPolicy() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">DMCA / Copyright Complaint Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <p>
            MooEarth.Live respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond expeditiously to claims of copyright infringement committed using the MooEarth.Live platform that are reported to our Designated Copyright Agent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Submitting a Copyright Complaint (Takedown Notice)</h2>
          <p>
            If you are a copyright owner, authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by submitting a complete DMCA Notice.
          </p>
          <p className="mt-4">Your notice must include the following information:</p>
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
            <li>Identification of the copyrighted work claimed to have been infringed (or, if multiple copyrighted works are covered by a single notification, a representative list of such works).</li>
            <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material (e.g., the specific URL on MooEarth.Live).</li>
            <li>Information reasonably sufficient to permit us to contact the complaining party, such as an address, telephone number, and, if available, an electronic mail address at which the complaining party may be contacted.</li>
            <li>A statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement that the information in the notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Submitting a Counter-Notice</h2>
          <p>
            If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to post and use the material in your content, you may send a counter-notice.
          </p>
          <p className="mt-4">Your counter-notice must include the following:</p>
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>Your physical or electronic signature.</li>
            <li>Identification of the content that has been removed or to which access has been disabled and the location (URL) at which the content appeared before it was removed or disabled.</li>
            <li>A statement that you have a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content.</li>
            <li>Your name, address, telephone number, and e-mail address, a statement that you consent to the jurisdiction of the federal court in the jurisdiction in which you reside (or if outside the US, where MooEarth.Live operates), and a statement that you will accept service of process from the person who provided notification of the alleged infringement.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Designated Copyright Agent Contact Details</h2>
          <p>
            Please submit all DMCA takedown notices and counter-notices to our Designated Copyright Agent at the following email address:
          </p>
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="font-semibold text-emerald-400">MooEarth.Live Copyright Agent</p>
            <p>Email: <a href="mailto:dmca@mooearth.live" className="text-emerald-300 hover:underline">dmca@mooearth.live</a></p>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            *Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing may be subject to liability for damages.
          </p>
        </section>
      </div>
    </>
  );
}
