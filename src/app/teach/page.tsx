import InstructorApplicationForm from '@/components/teach/InstructorApplicationForm';
import FAQAccordion from '@/components/ui/FAQAccordion';

const faqs = [
  { question: 'Do I need teaching experience?', answer: 'Not necessarily, but subject expertise is important.' },
  { question: 'How much can I earn?', answer: 'Earnings vary based on course quality and demand.' },
  { question: 'What tools are provided?', answer: 'We provide free course creation and marketing tools.' },
];

const benefits = [
  { title: 'Earn Money', description: 'Set your own price and earn revenue from your courses.' },
  { title: 'Reach Students', description: 'Access a global community of learners eager to grow.' },
  { title: 'Free Tools', description: 'Use our free platform to create and host your courses.' },
];

const steps = [
  'Apply with your details and expertise area.',
  'Create your course using our tools.',
  'Publish and earn money as students enroll.',
];

export default function TeachPage() {
  const scrollToApply = () => {
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 text-center text-white">
        <h1 className="text-4xl font-bold">Share Your Knowledge, Earn Income</h1>
        <p className="mt-4 text-lg">Turn your expertise into revenue.</p>
        <button onClick={scrollToApply} className="mt-8 rounded-bg white px 6 py-3 font-semibold text-blue-600">
          Start Teaching Today
        </button>
      </section>

      <section className="py-16">
        <h2 className="text-center text-3 x font-bold">Why Teach with Us?</h2>
        <div className="mx-auto mt-10 grid max-w-5xl gap-8 px-4 md-grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-bg border p-6 text-center shadow">
              <h3 className="text-xl font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <h2 className="text-center text-3x font-bold">How it Works</h2>
        <ol className="mx-auto mt-10 max-w-2xl space-y-6">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">{i + 1}</span>
              <p className="text-lg">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="apply" className="py-16">
        <h2 className="text-center text-3x font-bold">Apply Now</h2>
        <div className="mx-auto mt-8 max-w-xl px-4">
          <InstructorApplicationForm />
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-center text-3x font-bold">Frequently Asked Questions</h2>
        <div className="mx-auto mt-8 max-w-2xl px-4">
          <FAQAccordion items={faqs} />
        </div>
      </section>
    </main>
  );
}
