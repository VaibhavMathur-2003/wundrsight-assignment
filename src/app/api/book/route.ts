// app/api/book/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bookSlotSchema } from '@/lib/validations'
import { authenticateRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
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

    // Only patients can book slots
    if (auth.role !== 'PATIENT') {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Only patients can book appointments',
          },
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = bookSlotSchema.safeParse(body)

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

    const { slotId } = result.data

    // Use database transaction for atomic booking operation
    // This ensures atomicity and handles concurrency properly
    const booking = await db.$transaction(async (tx) => {
      // First, check if slot exists and is available within the transaction
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { booking: true },
      })

      if (!slot) {
        throw new Error('SLOT_NOT_FOUND')
      }

      if (slot.booking) {
        throw new Error('SLOT_TAKEN')
      }

      // Check if slot is in the future (additional business logic)
      if (new Date(slot.startAt) <= new Date()) {
        throw new Error('SLOT_EXPIRED')
      }

      // Atomic create - will fail if another transaction books the same slot
      // due to unique constraint on slotId
      try {
        return await tx.booking.create({
          data: {
            userId: auth.userId,
            slotId: slotId,
          },
          include: {
            slot: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      } catch (error) {
        // Handle unique constraint violation within transaction
        if (error instanceof Error && error.message.includes('unique constraint')) {
          throw new Error('SLOT_TAKEN')
        }
        throw error
      }
    })

    return NextResponse.json(booking, { status: 201 })

  } catch (error) {
    console.error('Booking error:', error)
    
    // Handle specific business logic errors from transaction
    if (error instanceof Error) {
      if (error.message === 'SLOT_NOT_FOUND') {
        return NextResponse.json(
          {
            error: {
              code: 'SLOT_NOT_FOUND',
              message: 'Slot not found',
            },
          },
          { status: 404 }
        )
      }
      
      if (error.message === 'SLOT_TAKEN') {
        return NextResponse.json(
          {
            error: {
              code: 'SLOT_TAKEN',
              message: 'This slot is already booked',
            },
          },
          { status: 409 }
        )
      }
      
      if (error.message === 'SLOT_EXPIRED') {
        return NextResponse.json(
          {
            error: {
              code: 'SLOT_EXPIRED',
              message: 'Cannot book slots in the past',
            },
          },
          { status: 400 }
        )
      }
    }

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