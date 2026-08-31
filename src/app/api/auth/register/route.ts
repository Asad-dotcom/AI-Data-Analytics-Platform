import { NextResponse } from 'next/server';
import { RegisterSchema } from '@/validators';
import { UserRepository } from '@/repositories/user.repository';
import { AuthService } from '@/services/auth.service';

/**
 * API Route: User Registration
 * POST /api/auth/register
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body schema
    const validationResult = RegisterSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    // Hash user password and persist
    const passwordHash = await AuthService.hashPassword(password);
    const user = await UserRepository.create(email, passwordHash);

    // Generate session JWT token
    const token = await AuthService.generateToken({ userId: user.id, email: user.email });

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Registration API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}
