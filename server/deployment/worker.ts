import { requests } from '../../src/shared/assistant/schemas';
import type { JobInput } from '../assistant/store';
import type { AssistantService } from '../assistant/service';
import type { JobWork } from '../assistant/jobs';

/** Durable inputs are revalidated; closures and HTTP requests never enter the queue. */
export function resolveWork(service:AssistantService,input:JobInput):JobWork {
  const {owner,route,body}=input, path=route.replace('/api/v1/assistant','');
  if(path==='/profile/interpret') {const b=requests.profileInterpret.parse(body);return signal=>service.interpretProfile(owner,b,signal);}
  if(path==='/map/interpret') {const b=requests.mapInterpret.parse(body);return signal=>service.interpretMap(owner,b,signal);}
  const message=/^\/conversations\/(conv_[a-f0-9]+)\/messages$/.exec(path);
  if(message) {const b=requests.message.parse(body);return (signal,stage)=>service.message(owner,message[1],b,signal,stage);}
  if(path==='/research') {const b=requests.research.parse(body);return (signal,stage)=>service.research(owner,b.contextRef,b.question,b.refresh,'travellerId' in b?b.travellerId:undefined,signal,stage);}
  if(path==='/explanations') {const b=requests.explanation.parse(body);return signal=>service.explanation(owner,b,signal);}
  const enrich=/^\/trips\/(trip_[a-f0-9]+)\/enrichment$/.exec(path);
  if(enrich) {const b=requests.enrichment.parse(body);return (signal,stage)=>service.enrich(owner,enrich[1],b,signal,stage);}
  if(path==='/checklists') {const b=requests.checklist.parse(body);return ()=>service.contexts.checklist(owner,b.contextRef,b.destinationIds);}
  if(path==='/briefs') {const b=requests.brief.parse(body);return signal=>service.brief(owner,b,signal);}
  throw new Error('Unsupported durable operation.');
}
