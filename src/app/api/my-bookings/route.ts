
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    
    const auth = authenticateRequest(request)
    if (!auth) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    
    if (auth.role !== 'PATIENT') {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        },
        { status: 403 }
      )
    }

    const bookings = await db.booking.findMany({
      where: {
        userId: auth.userId,
      },
      include: {
        slot: true,
      },
      orderBy: {
        slot: {
          startAt: 'asc',
        },
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('My bookings error:', error)
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