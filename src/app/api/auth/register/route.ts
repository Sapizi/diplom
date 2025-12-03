import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
};
export async function POST(request: NextRequest) {
    let client;

    try {
        const { name, email, phone, password } = await request.json();

        if (!name || !email || !phone || !password) {
            return NextResponse.json(
                { error: 'Все поля обязательны' },
                { status: 400 }
            );
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Некорректный email' },
                { status: 400 }
            );
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        client = new Client(dbConfig);
        await client.connect();
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return NextResponse.json(
                { error: 'Пользователь с таким email уже существует' },
                { status: 409 }
            );
        }
        const result = await client.query(
            'INSERT INTO users (name, phone, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
            [name, phone, email, hashedPassword]
        );
        return NextResponse.json({
            message: 'Регистрация успешна',
            user: result.rows[0],
        });
    } catch (error: any) {
        console.error('Ошибка при регистрации:', error.message || error);
        if (error.code === '23505') { 
            return NextResponse.json(
                { error: 'Пользователь с таким email уже существует' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Внутренняя ошибка сервера', details: error.message },
            { status: 500 }
        );
    } finally {
        if (client) {
            try {
                await client.end();
            } catch (err) {
                console.error('Ошибка при закрытии соединения с БД:', err);
            }
        }
    }
}
