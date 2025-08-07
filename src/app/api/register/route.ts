
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registerSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: result.error.cause,
          },
        },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: 'EMAIL_EXISTS',
            message: 'User with this email already exists',
          },
        },
        { status: 400 }
      )
    }

    
    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'PATIENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      },
      { status: 500 }
    )
  }
}