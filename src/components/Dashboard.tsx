"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface Slot {
  id: string;
  startAt: string;
  endAt: string;
}

interface Booking {
  id: string;
  userId: string;
  slotId: string;
  createdAt: string;
  slot: Slot;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    if (!token) return;

    setIsLoading(true);
    setError("");

    try {
      const [slotsResponse, bookingsResponse] = await Promise.all([
        api.getSlots(today, nextWeek),
        isAdmin ? api.getAllBookings(token) : api.getMyBookings(token),
      ]);

      setAvailableSlots(slotsResponse as Slot[]);
      setBookings(bookingsResponse as Booking[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSlot = async (slotId: string) => {
    if (!token || isAdmin) return;

    setBookingSlot(slotId);
    setError("");

    try {
      await api.bookSlot(slotId, token);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book slot");
    } finally {
      setBookingSlot(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const groupSlotsByDate = (slots: Slot[]) => {
    const grouped: { [key: string]: Slot[] } = {};

    slots.forEach((slot) => {
      const date = new Date(slot.startAt).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(slot);
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(availableSlots);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
  {/* HEADER */}
  <header className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isAdmin ? "Admin Dashboard" : "Patient Dashboard"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}</p>
      </div>
      <button
        onClick={logout}
        className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 transition"
      >
        Logout
      </button>
    </div>
  </header>

  {/* MAIN */}
  <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
    {/* ERROR */}
    {error && (
      <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
        {error}
      </div>
    )}

    {/* GRID BLOCKS */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* PATIENT APPOINTMENTS */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Available Appointments
          </h2>

          {Object.keys(groupedSlots).length === 0 ? (
            <p className="text-gray-500 text-sm">No available slots found.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {date}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          setShowConfirmModal(true);
                        }}
                        disabled={bookingSlot === slot.id}
                        className={`px-3 py-2 rounded-lg text-sm border transition font-medium
                          ${
                            bookingSlot === slot.id
                              ? "bg-gray-200 text-gray-500 cursor-wait"
                              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                      >
                        {bookingSlot === slot.id ? (
                          "Booking..."
                        ) : (
                          <>
                            {new Date(slot.startAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(slot.endAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPOINTMENTS */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isAdmin ? "All Appointments" : "My Appointments"}
        </h2>

        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No bookings found.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(booking.slot.startAt)} -{" "}
                      {new Date(booking.slot.endAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isAdmin && booking.user && (
                      <p className="text-sm text-gray-600">
                        Patient: {booking.user.name} ({booking.user.email})
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Booked: {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* ADMIN STATS */}
    {isAdmin && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Total Bookings", value: bookings.length, color: "blue" },
          { title: "Available Slots", value: availableSlots.length, color: "green" },
          {
            title: "Today's Appointments",
            value: bookings.filter(
              (b) =>
                new Date(b.slot.startAt).toDateString() ===
                new Date().toDateString()
            ).length,
            color: "purple",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center"
          >
            <h3 className="text-sm font-medium text-gray-700">{stat.title}</h3>
            <p className={`text-4xl font-bold text-${stat.color}-600 mt-2`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    )}

    {/* MODAL */}
    {showConfirmModal && (
      <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm transform transition-all scale-100 animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Confirm Booking
          </h2>
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to book this slot?
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedSlotId(null);
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedSlotId) handleBookSlot(selectedSlotId);
                setShowConfirmModal(false);
                setSelectedSlotId(null);
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}
  </main>
</div>

  );
}
