export type PropertyType = 'apartment' | 'hotel' | 'hostel' | 'house'
export type Region = 'crimea' | 'krasnodar' | 'south'
export type RentalMode = 'short_term' | 'long_term'
export type BookingStatus = 'pending_host' | 'confirmed' | 'paid' | 'checked_in' | 'completed' | 'cancelled'
export interface User { id: string; name: string; role: 'host' | 'guest' }
export interface Property { id: string; ownerId: string; title: string; type: PropertyType; rentalMode?: RentalMode; region?: Region; city: string; location: { lat: number; lon: number }; status: 'draft' | 'published'; amenities: string[]; videoVerified: boolean; rating: number; reviewCount: number; description: string; images: string[] }
export interface Unit { id: string; propertyId: string; label: string; kind: 'entire' | 'room' | 'bed'; capacity: number; baseNightly: number; baseMonthly?: number; cleaningFee: number; image?: string }
export interface BookingInput { id: string; unitId: string; guestId: string; guests: number; checkIn: string; checkOut: string }
export interface Booking extends BookingInput { status: BookingStatus; nightlySnapshot: number; monthlySnapshot?: number; cleaningSnapshot: number; total: number; source?: 'manual' }
export interface Block { id: string; unitId: string; start: string; end: string; reason: string }
export interface SearchFilters { checkIn: string; checkOut: string; guests: number; rentalMode?: RentalMode; region?: Region | null; maxPrice?: number | null; city?: string | null; amenities?: string[]; type?: PropertyType | ''; videoVerified?: boolean }
export interface Database { schemaVersion: number; demoToday: string; timezone: string; defaultSearch: SearchFilters; users: User[]; properties: Property[]; units: Unit[]; bookings: Booking[]; blocks: Block[] }
export interface DemoState { db: Database; favorites: string[]; filters: SearchFilters; role: 'guest' | 'host'; personalBot: {name: string; token: string; active: boolean} | null; audit: {id: string; message: string; at: string}[] }
