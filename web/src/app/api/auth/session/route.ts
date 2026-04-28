import { NextRequest, NextResponse } from 'next/server';
import { KEYS } from '@/paths';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(KEYS.COOKIES.USER_SESSIONS, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(KEYS.COOKIES.USER_SESSIONS, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return res;
}
