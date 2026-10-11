import test from 'node:test'
import assert from 'node:assert/strict'
import {
  sortKeysDeep, jsonErrorLocation, jsonToTypeScript, utf8ToBase64, base64ToUtf8, encodeHtml, decodeHtml,
  decodeJwt, digest, parseColor, rgbToHex, rgbToHsl, hslToRgb, contrastRatio, diffLines, parseTimestamp
} from '../src/utils/devtools.js'

test('JSON helpers sort keys, locate errors and infer types', () => {
  assert.equal(JSON.stringify(sortKeysDeep({ b: 1, a: { d: 1, c: [{ z: 1, y: 2 }] } })), '{"a":{"c":[{"y":2,"z":1}],"d":1},"b":1}')
  const text = '{\n  "a": 1,\n  "b": }'
  assert.deepEqual(jsonErrorLocation(text), { line: 3, column: 8, position: 19 })
  assert.equal(jsonErrorLocation('{"a": [1, 2, {"b": "c\\u00e9"}]}'), null)
  assert.equal(jsonErrorLocation('[1,]').column, 4)
  const ts = jsonToTypeScript({ id: 1, name: 'x', tags: ['a'], owner: { login: 'dev' }, 'my-key': null })
  assert.match(ts, /interface Root \{/)
  assert.match(ts, /owner: Owner;/)
  assert.match(ts, /"my-key": null;/)
  assert.match(ts, /tags: string\[\];/)
  assert.match(jsonToTypeScript([1, 2]), /type Root = number\[\];/)
})
test('Encoders round-trip unicode and decode JWT claims', async () => {
  assert.equal(base64ToUtf8(utf8ToBase64('ação 🚀')), 'ação 🚀')
  assert.equal(base64ToUtf8(utf8ToBase64('???>>>', true)), '???>>>')
  assert.equal(encodeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  assert.equal(decodeHtml('&lt;b&gt; &#233; &#x1F680; &amp;'), '<b> é 🚀 &')
  const token = `${utf8ToBase64('{"alg":"HS256"}', true)}.${utf8ToBase64('{"sub":"1","exp":1}', true)}.sig`
  const jwt = decodeJwt(token)
  assert.equal(jwt.header.alg, 'HS256')
  assert.equal(jwt.expired, true)
  assert.throws(() => decodeJwt('abc'))
  assert.equal(await digest('SHA-256', 'abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})
test('Colors convert between formats and compute WCAG contrast', () => {
  assert.deepEqual(parseColor('#0a84ff'), { r: 10, g: 132, b: 255, a: 1 })
  assert.deepEqual(parseColor('fff'), { r: 255, g: 255, b: 255, a: 1 })
  assert.deepEqual(parseColor('rgb(10, 20, 30)'), { r: 10, g: 20, b: 30, a: 1 })
  assert.equal(rgbToHex(parseColor('hsl(0, 100%, 50%)')), '#ff0000')
  assert.deepEqual(rgbToHsl({ r: 255, g: 0, b: 0 }), { h: 0, s: 100, l: 50 })
  assert.deepEqual(hslToRgb(120, 100, 25), { r: 0, g: 128, b: 0 })
  assert.equal(Math.round(contrastRatio(parseColor('#000'), parseColor('#fff'))), 21)
  assert.equal(parseColor('nope'), null)
})
test('Line diff marks additions and removals', () => {
  const result = diffLines('a\nb\nc', 'a\nB\nc\nd')
  assert.deepEqual(result.map(r => r.type + r.text), ['samea', 'delb', 'addB', 'samec', 'addd'])
  assert.ok(diffLines(' x', 'x', { ignoreWhitespace: true }).every(r => r.type === 'same'))
})
test('Timestamps detect seconds versus milliseconds', () => {
  assert.equal(parseTimestamp('1700000000').unit, 's')
  assert.equal(parseTimestamp('1700000000000').date.toISOString(), '2023-11-14T22:13:20.000Z')
  assert.equal(parseTimestamp('2024-01-01T00:00:00Z').unit, 'texto')
  assert.equal(parseTimestamp('xyz'), null)
})
