import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {available,nights,quote,search,createBooking} from './domain.mjs';
const db=JSON.parse(readFileSync(new URL('./seed.json',import.meta.url),'utf8'));
describe('availability and pricing',()=>{
 it('uses exclusive checkout',()=>{expect(available(db,'p2-101','2027-06-15','2027-06-17')).toBe(true);expect(available(db,'p2-101','2027-06-14','2027-06-16')).toBe(false)});
 it('blocks repairs and pending requests',()=>{expect(available(db,'p2-202','2027-06-12','2027-06-16')).toBe(false);expect(available(db,'p2-302','2027-06-12','2027-06-16')).toBe(false)});
 it('ignores cancellation',()=>expect(available(db,'p7-whole','2027-06-12','2027-06-16')).toBe(true));
 it('quotes reference apartment',()=>expect(quote(db.units[0],'2027-06-12','2027-06-16').total).toBe(16800));
 it('rejects invalid dates and ranges',()=>{expect(()=>nights('2027-06-12','2027-06-12')).toThrow();expect(()=>nights('2027-02-30','2027-03-05')).toThrow()});
 it('excludes drafts and beds for two guests',()=>{const r=search(db,{checkIn:'2027-06-12',checkOut:'2027-06-16',guests:2});expect(r.some(p=>['p3','p4'].includes(p.id))).toBe(false)});
 it('filters together',()=>expect(search(db,{...db.defaultSearch,maxPrice:6000,amenities:['sea_view']}).map(p=>p.id)).toEqual(['p1']));
 it('prevents double booking and preserves seed',()=>{const input={id:'test',unitId:'p1-whole',guestId:'guest1',guests:2,checkIn:'2027-06-12',checkOut:'2027-06-16'};const next=createBooking(db,input);expect(next.bookings.at(-1).total).toBe(16800);expect(db.bookings).toHaveLength(47);expect(()=>createBooking(next,{...input,id:'test2'})).toThrow('Unavailable')});
});
