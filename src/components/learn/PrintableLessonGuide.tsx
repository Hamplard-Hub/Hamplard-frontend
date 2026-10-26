import type { Course, Lesson } from '@/types';

interface PrintableLessonGuideProps {
  course: Course;
  lesson: Lesson;
}

/**
 * PrintableLessonGuide
 *
 * A print-only rendering of the active lesson: the lesson title, the materials
 * needed to attempt it and the numbered step-by-step instructions with their
 * reference images.
 *
 * The block is hidden on screen and revealed by the print stylesheet in
 * `src/styles/globals.css`, so the printed page contains the guide and
 * nothing else — no navigation, no sidebar and no video.
 */
export default function PrintableLessonGuide({
  course,
  lesson,
}: PrintableLessonGuideProps) {
  const materials = lesson.materials ?? [];
  const steps = lesson.steps ?? [];
  // Steps are stored with an optional `stepNumber`; fall back to array order so
  // the printed guide is always numbered 1..n.
  const orderedSteps = steps
    .map((step, index) => ({ step, number: step.stepNumber ?? index + 1 }))
    .sort((a, b) => a.number - b.number);

  return (
    <article className="hidden print-only print:block" aria-hidden="true">
      <header className="print-guide-header">
        <p className="print-guide-eyebrow">{course.title}</p>
        <h1 className="print-guide-title">{lesson.title}</h1>
        {lesson.description ? (
          <p className="print-guide-description">{lesson.description}</p>
        ) : null}
      </header>

      {materials.length > 0 && (
        <section className="print-guide-section">
          <h2 className="print-guide-heading">Materials</h2>
          <table className="print-guide-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>
                    {material.purchaseUrl ? (
                      <a href={material.purchaseUrl}>{material.name}</a>
                    ) : (
                      material.name
                    )}
                  </td>
                  <td>
                    {material.quantity} {material.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {orderedSteps.length > 0 && (
        <section className="print-guide-section">
          <h2 className="print-guide-heading">Step-by-step</h2>
          <ol className="print-guide-steps">
            {orderedSteps.map(({ step, number }) => (
              <li key={step.id} className="print-guide-step print-avoid-break">
                <p className="print-guide-step-title">
                  <span className="print-guide-step-number">{number}</span>
                  {step.title}
                </p>
                {step.description ? (
                  <p className="print-guide-step-description">{step.description}</p>
                ) : null}
                {step.imageUrl ? (
                  <img
                    src={step.imageUrl}
                    alt={step.title}
                    className="print-guide-step-image"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      )}

      {lesson.resourceUrl ? (
        <section className="print-guide-section">
          <h2 className="print-guide-heading">Resources</h2>
          <p className="print-guide-step-description">
            <a href={lesson.resourceUrl}>Download the lesson resource</a>
          </p>
        </section>
      ) : null}

      <footer className="print-guide-footer">
        <p>hamplard.com — {course.title}</p>
      </footer>
    </article>
  );
}
