import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.info('[Analytics Stub]', payload);
    return NextResponse.json({ ok: true, received: payload }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 202 });
  }
}
