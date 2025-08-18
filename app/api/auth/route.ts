import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { secretKey } = await request.json();

    if (!process.env.SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'SECRET_ACCESS_KEY не настроен на сервере' },
        { status: 500 }
      );
    }

    if (secretKey === process.env.SECRET_ACCESS_KEY) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Неверный секретный ключ' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Ошибка при аутентификации:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}