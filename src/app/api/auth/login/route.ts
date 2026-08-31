import { NextResponse } from 'next/server';
import { LoginSchema } from '@/validators';
import { UserRepository } from '@/repositories/user.repository';
import { AuthService } from '@/services/auth.service';

/**
 * API Route: User Authentication / Login
 * POST /api/auth/login
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request schema
    const validationResult = LoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Fetch user and verify credentials
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password credentials.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await AuthService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password credentials.' },
        { status: 401 }
      );
    }

    // Generate JWT session token
    const token = await AuthService.generateToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}
