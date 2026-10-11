import { isTravelDetails, travelKey, type TravelDetails } from '../../src/shared/travelDetails';
import type { DiskCache, TravelStorage } from '../travel-cache';
import { locked, type Database } from './database';
import { acquireLease, releaseLease } from './leases';

export class PostgresTravelCache implements TravelStorage {
  constructor(private db: Database, private retentionMs = 30 * 86_400_000) {}
  private retained(d: TravelDetails) { const age = Date.now()-Date.parse(d.fetchedAt); return age >= -60_000 && age < this.retentionMs; }
  private validateQuota(q:DiskCache['quota']) {
    if(!q || !Number.isSafeInteger(q.remaining) || !Number.isSafeInteger(q.limit) || q.limit<1 || q.remaining<0 || q.remaining>q.limit || !Number.isFinite(q.resetAt) || !Number.isFinite(q.retryAt) || typeof q.blocked!=='boolean') throw new Error('Quota accounting needs recovery.');
    return q;
  }
  async read(passport: string, destination?: string) {
    const rows = await this.db.query<{ data: unknown }>("SELECT data FROM aperiron_records WHERE scope='travel' AND kind='entries' AND expires_at > now() AND data->>'passportId'=$1", [passport]);
    return rows.map(r=>r.data).filter(isTravelDetails).filter(d=>this.retained(d) && (!destination || d.destinationId===destination))
      .map(d=>({...d,expiresAt:new Date(Date.parse(d.fetchedAt)+this.retentionMs).toISOString()}));
  }
  async quota() {
    const rows = await this.db.query<{ data: DiskCache['quota'] }>("SELECT data FROM aperiron_records WHERE scope='travel' AND kind='quota' AND id='account'");
    return this.validateQuota(rows[0]?.data ?? { remaining:0,limit:120,resetAt:0,blocked:false,retryAt:0,initialized:true });
  }
  async mutate(update: (data: DiskCache)=>void) {
    await locked(this.db,'travel',async c=> {
      const rows=await c.query<{kind:string;id:string;data:unknown}>("SELECT kind,id,data FROM aperiron_records WHERE scope='travel'");
      const data: DiskCache={version:1,entries:{},quota:{remaining:0,limit:120,resetAt:0,blocked:false,retryAt:0,initialized:true}};
      for(const r of rows) {
        if(r.kind==='quota') data.quota=this.validateQuota(r.data as DiskCache['quota']);
        else if(r.kind==='entries' && isTravelDetails(r.data) && this.retained(r.data)) data.entries[r.id]=r.data;
      }
      const before=structuredClone(data); update(data);
      this.validateQuota(data.quota);
      await c.query("INSERT INTO aperiron_records(scope,kind,id,data) VALUES ('travel','quota','account',$1::jsonb) ON CONFLICT(scope,kind,id) DO UPDATE SET data=excluded.data",[JSON.stringify(data.quota)]);
      for(const [id,d] of Object.entries(data.entries)) if(JSON.stringify(before.entries[id])!==JSON.stringify(d)) {
        if(!isTravelDetails(d)) throw new Error('Invalid cache entry.');
        await c.query("INSERT INTO aperiron_records(scope,kind,id,data,expires_at) VALUES ('travel','entries',$1,$2::jsonb,$3) ON CONFLICT(scope,kind,id) DO UPDATE SET data=excluded.data,expires_at=excluded.expires_at",[id,JSON.stringify(d),new Date(Date.parse(d.fetchedAt)+this.retentionMs).toISOString()]);
      }
      await c.query("DELETE FROM aperiron_records WHERE scope='travel' AND kind='entries' AND expires_at <= now()");
    });
  }
  async put(d:TravelDetails) { if(!isTravelDetails(d)) throw new Error('Invalid cache entry.'); await this.mutate(data=>{data.entries[travelKey(d.passportId,d.destinationId)]=d;}); }
  async remember(d:TravelDetails) { await this.put(d); return true; }
  acquire(key:string,limit:number) { return acquireLease(this.db,key,'travel:',limit,120_000); }
  release(key:string,token:string) { return releaseLease(this.db,key,token); }
}
