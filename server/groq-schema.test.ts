import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileGroqSchema } from './assistant/groq';
import { enumeration, nullable, object, str } from '../src/shared/assistant/schema';
import { generatedAnswer, mapProposal, profileProposal } from '../src/shared/assistant/schemas';

test('Groq nullable enums admit null without losing their allowed values', () => {
  const source = object({ country: nullable(enumeration(['IN', 'JP'])), note: nullable(str(80)) });
  const before = structuredClone(source.json);
  const compiled = compileGroqSchema(source.json);
  const properties = compiled.properties as Record<string, Record<string, unknown>>;
  assert.deepEqual(properties.country.type, ['string', 'null']);
  assert.deepEqual(properties.country.enum, ['IN', 'JP', null]);
  assert.deepEqual(properties.note.type, ['string', 'null']);
  assert.equal(properties.note.maxLength, 80);
  assert.deepEqual(source.parse({ country: null, note: null }), { country: null, note: null });
  assert.throws(() => source.parse({ country: 'invented', note: null }));
  assert.deepEqual(source.json, before, 'Provider compilation must not change public schemas');
});

test('all assistant generation schemas use null type unions and resolved discriminated object unions', () => {
  for (const schema of [generatedAnswer, mapProposal, profileProposal]) {
    const compiled = compileGroqSchema(schema.json);
    const definitions = compiled.$defs as Record<string, Record<string, unknown>>;
    const resolve = (node: Record<string, unknown>): Record<string, unknown> =>
      typeof node.$ref === 'string' ? resolve(definitions[node.$ref.replace('#/$defs/', '')]) : node;
    const visit = (value: unknown) => {
      if (Array.isArray(value)) { value.forEach(visit); return; }
      if (!value || typeof value !== 'object') return;
      const node = value as Record<string, unknown>;
      if (Array.isArray(node.anyOf)) {
        const discriminators = node.anyOf.map(branch => {
          const resolved = resolve(branch);
          assert.equal(resolved.type, 'object', 'Groq rejects nullable primitive anyOf branches');
          assert.equal(resolved.additionalProperties, false);
          const properties = resolved.properties as Record<string, Record<string, unknown>>;
          const required = resolved.required as string[];
          assert.ok(required.includes('type'));
          return resolve(properties.type).enum as string[];
        }).flat();
        assert.equal(new Set(discriminators).size, discriminators.length, 'Union types must be disjoint');
      }
      if (Array.isArray(node.type) && node.type.includes('null') && Array.isArray(node.enum)) assert.ok(node.enum.includes(null));
      Object.values(node).forEach(visit);
    };
    visit(compiled);
  }
});
