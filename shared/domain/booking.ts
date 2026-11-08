import type { Database, Unit, SearchFilters, BookingInput, BookingStatus } from '../types/demo'
import { propertyRegion } from '../locations'
export const blockingStatuses = new Set<BookingStatus>(['pending_host', 'confirmed', 'paid', 'checked_in']);
export const day = (s: string) => {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Invalid date');
 const n = Date.parse(s + 'T00:00:00Z');
 if (!Number.isFinite(n) || new Date(n).toISOString().slice(0,10) !== s) throw new Error('Invalid date');
 return n / 86400000;
};
export function nights(start: string, end: string) { const n = day(end)-day(start); if(n <= 0) throw new Error('Invalid range'); return n; }
export function overlaps(a: string,b: string,c: string,d: string) { nights(a,b); nights(c,d); return a < d && c < b; }
export function available(db: Database, unitId: string, start: string, end: string) {
 nights(start,end);
 if(!db.units.some(u=>u.id===unitId)) return false;
 return !db.bookings.some(b=>b.unitId===unitId && blockingStatuses.has(b.status) && overlaps(start,end,b.checkIn,b.checkOut)) && !db.blocks.some(b=>b.unitId===unitId && overlaps(start,end,b.start,b.end));
}
export function quote(unit: Unit,start: string,end: string) {
 const count=nights(start,end);
 if(unit.baseMonthly != null && count < 30) throw new Error('Minimum 30 nights');
 const accommodation=unit.baseMonthly == null ? count*unit.baseNightly : Math.round(unit.baseMonthly*count/30);
 return {nights:count,nightly:unit.baseNightly,monthly:unit.baseMonthly,cleaningFee:unit.cleaningFee,total:accommodation+unit.cleaningFee};
}
export function search(db: Database,f: SearchFilters) {
 nights(f.checkIn,f.checkOut);
 if(!Number.isInteger(f.guests)||f.guests<1) throw new Error('Invalid guests');
 if(f.maxPrice != null && (!Number.isSafeInteger(f.maxPrice) || f.maxPrice < 0)) throw new Error('Invalid price');
 if(f.rentalMode === 'long_term' && nights(f.checkIn,f.checkOut) < 30) throw new Error('Minimum 30 nights');
 return db.properties.filter(p=>p.status==='published' && (p.rentalMode || 'short_term')===(f.rentalMode || 'short_term') && (!f.region||propertyRegion(p)===f.region) && (!f.city||p.city===f.city) && (!f.type||p.type===f.type) && (!f.premium||p.premium === true) && (!f.videoVerified||p.videoVerified) && (f.amenities||[]).every(a=>p.amenities.includes(a))).flatMap(p=>{
 const rate=(unit: Unit)=>unit.baseMonthly ?? unit.baseNightly;
 const candidates=db.units.filter(u=>u.propertyId===p.id && u.capacity>=f.guests && (f.maxPrice==null||rate(u)<=f.maxPrice) && available(db,u.id,f.checkIn,f.checkOut));
 return candidates.length ? [{...p,availableUnitIds:candidates.map(u=>u.id),priceFrom:Math.min(...candidates.map(rate))}] : [];
 });
}
export function createBooking(db: Database,input: BookingInput): Database {
 const unit=db.units.find(u=>u.id===input.unitId);
 const property=unit && db.properties.find(p=>p.id===unit.propertyId);
 if(!unit||property?.status!=='published'||!db.users.some(u=>u.id===input.guestId && u.role==='guest')||!Number.isInteger(input.guests)||input.guests<1||input.guests>unit.capacity) throw new Error('Invalid booking');
 if(db.bookings.some(b=>b.id===input.id)) throw new Error('Duplicate id');
 if(!available(db,unit.id,input.checkIn,input.checkOut)) throw new Error('Unavailable');
 const q=quote(unit,input.checkIn,input.checkOut);
 const booking={...input,status:'pending_host' as const,nightlySnapshot:q.nightly,...(q.monthly == null ? {} : { monthlySnapshot:q.monthly }),cleaningSnapshot:q.cleaningFee,total:q.total};
 return {...db,bookings:[...db.bookings,booking]};
}
