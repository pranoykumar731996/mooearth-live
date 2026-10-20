import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Transparency Policy | MooEarth.Live',
  description: 'How Artificial Intelligence is used on MooEarth.Live and our commitment to transparency.',
  alternates: {
    canonical: 'https://www.mooearth.live/ai-transparency'
  }
};

export default function AITransparency() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">AI Transparency Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Our Commitment to Transparency</h2>
          <p>
            At MooEarth.Live, we leverage modern technology to enhance planetary exploration and geographic discovery. This includes the use of Artificial Intelligence (AI) and Large Language Models (LLMs) to help process and synthesize scientific event telemetry and educational geographic information quickly. We believe in being fully transparent about when and how AI is used on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Where AI is Used on MooEarth.Live</h2>
          <p>You may encounter AI-generated or AI-assisted content in the following areas of our site:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Geophysical & Planetary Event Briefings:</strong> Objective, evidence-grounded scientific explanations of real-time earthquakes, space weather events, and thermal anomalies synthesized directly from official sensor telemetry (USGS, NOAA, NASA).</li>
            <li><strong>Educational Geography Insights:</strong> Curated cultural, geographic, and demographic overviews synthesized for global cities and countries.</li>
            <li><strong>Translation Assistance:</strong> Helping to translate global scientific context and planetary dispatches into your preferred language.</li>
            <li><strong>Chat & Discovery Assistants:</strong> Interactive features designed to help you navigate geospatial layers, climate anomalies, and country geography.</li>
          </ul>
          <p className="mt-4">
            <em>Note: The live seismic magnitudes, focal depths, Kp indices, radar grids, and raw statistical telemetry are ingested directly from official government and open scientific APIs and are <strong>not</strong> generated or fabricated by AI.</em>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. The Limitations of AI (Hallucinations)</h2>
          <p>
            While AI is powerful, it is not perfect. AI models can sometimes misunderstand context or produce "hallucinations" (plausible-sounding but factually incorrect statements). 
          </p>
          <div className="mt-4 p-4 border-l-4 border-amber-500 bg-amber-500/10 rounded-r-lg">
            <p className="font-semibold text-amber-500 mb-2">Important Disclaimer:</p>
            <p>AI-generated summaries may contain inaccuracies regarding event details, names, or historical context. They should <strong>never</strong> replace official announcements from primary sources, official governing bodies, or credited scientific publishers.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Verification</h2>
          <p>
            We strongly encourage all users to verify important information. If an AI summary mentions a seismic alert, severe weather advisory, or planetary observation, please cross-reference this information with official primary agency releases or event pages.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Continuous Improvement</h2>
          <p>
            We are constantly monitoring and refining the prompts and guardrails used by our AI systems to improve accuracy and reduce errors. If you spot an AI-generated summary that is wildly inaccurate, you can help us improve by reporting it to <a href="mailto:support@mooearth.live" className="text-emerald-400 hover:underline">support@mooearth.live</a>.
          </p>
        </section>
      </div>
    </>
  );
}
