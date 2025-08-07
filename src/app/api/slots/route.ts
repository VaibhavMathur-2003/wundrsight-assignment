
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slotsQuerySchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_PARAMS',
            message: 'Both "from" and "to" query parameters are required',
          },
        },
        { status: 400 }
      )
    }

    const result = slotsQuerySchema.safeParse({ from, to })

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format',
            details: result.error.cause,
          },
        },
        { status: 400 }
      )
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999) 

    
    const availableSlots = await db.slot.findMany({
      where: {
        startAt: {
          gte: fromDate,
          lte: toDate,
        },
        booking: null, 
      },
      orderBy: {
        startAt: 'asc',
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
      },
    })

    return NextResponse.json(availableSlots)
  } catch (error) {
    console.error('Slots error:', error)
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