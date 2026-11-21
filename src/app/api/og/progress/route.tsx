import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Vocational Course';
    const percent = Math.min(100, Math.max(0, parseInt(searchParams.get('percent') || '0', 10)));
    const category = searchParams.get('category') || 'Vocational Craft';
    const completed = searchParams.get('completed') || '';
    const total = searchParams.get('total') || '';
    const name = searchParams.get('name') || 'Learner';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 70px',
            background: 'linear-gradient(135deg, #161233 0%, #201a4c 50%, #2c2263 100%)',
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Brand Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '28px',
                  color: '#FFFFFF',
                }}
              >
                H
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                  Hamplard
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#FBBF24',
                    letterSpacing: '1px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Learning Milestone
                </span>
              </div>
            </div>

            {/* Category badge */}
            <div
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '16px',
                fontWeight: 600,
                color: '#FDE68A',
              }}
            >
              {category}
            </div>
          </div>

          {/* Center Card Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div style={{ fontSize: '18px', color: '#9CA3AF', fontWeight: 500 }}>
              {name ? `${name} is currently learning` : 'Course Progress'}
            </div>

            <div
              style={{
                fontSize: '44px',
                fontWeight: 800,
                lineHeight: 1.2,
                color: '#FFFFFF',
                maxWidth: '900px',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>

            {/* Progress Bar Container */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '10px',
                padding: '24px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '38px', fontWeight: 900, color: '#FBBF24' }}>
                    {percent}%
                  </span>
                  <span style={{ fontSize: '18px', color: '#D1D5DB' }}>completed</span>
                </div>

                {completed && total ? (
                  <span style={{ fontSize: '16px', color: '#9CA3AF' }}>
                    {completed} of {total} lectures done
                  </span>
                ) : null}
              </div>

              {/* Progress Track */}
              <div
                style={{
                  width: '100%',
                  height: '16px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    background:
                      percent >= 100
                        ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
                        : 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)',
                    borderRadius: '999px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '20px',
              fontSize: '15px',
              color: '#9CA3AF',
            }}
          >
            <span>Learn real-world vocational craft on Hamplard</span>
            <span style={{ color: '#FBBF24', fontWeight: 600 }}>hamplard.com</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    return new Response(`Failed to generate OG progress image: ${String(error)}`, { status: 500 });
  }
}
