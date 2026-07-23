// ────────────────────────────────────────────────────────────────────────────
// Unit tests for Code39 and UPC-E barcode encoding.
// Run with: npx tsx lib/features/barcode/__tests__/barcodeService.test.ts
// ────────────────────────────────────────────────────────────────────────────
import assert from 'node:assert/strict';
import { generateBarcode, getTotalWidth } from '../barcodeService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip quiet-zone segments (width 9 or 10) from both ends. */
function dataSegs(segs: ReturnType<typeof generateBarcode>) {
  return segs.filter(s => s.width !== 9 && s.width !== 10);
}

let pass = 0;
let fail = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    pass++;
  } catch (e: any) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${e.message}`);
    fail++;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Code 39
// ═══════════════════════════════════════════════════════════════════════════
console.log('\nCode 39');

test('generates segments for all valid characters without throwing', () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  for (const ch of chars) {
    generateBarcode(ch, 'CODE39'); // must not throw
  }
});

test('throws for characters outside Code39 character set', () => {
  assert.throws(() => generateBarcode('@', 'CODE39'), /not supported/i);
  assert.throws(() => generateBarcode('€', 'CODE39'), /not supported/i);
});

test('every character in data encodes to exactly 9 elements (5 bars + 4 spaces)', () => {
  // Single char "A": [quiet] * gap A gap * [quiet] → 9+1+9+1+9 = 29 data segs
  const segs = dataSegs(generateBarcode('A', 'CODE39'));
  assert.equal(segs.length, 29, `expected 29 data segs, got ${segs.length}`);
});

test('every Code39 character block has exactly 3 wide elements (3-of-9 rule)', () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  for (const ch of chars) {
    const segs = dataSegs(generateBarcode(ch, 'CODE39'));
    // Layout: *(9) + gap(1) + ch(9) + gap(1) + *(9) = indices 0..8, 9, 10..18, 19, 20..28
    const charBlock = segs.slice(10, 19);
    assert.equal(charBlock.length, 9, `char ${ch}: expected 9-element block`);
    const wideCount = charBlock.filter(s => s.width === 3).length;
    assert.equal(wideCount, 3, `char ${ch}: expected 3 wide elements, got ${wideCount}`);
  }
});

test('start/stop * character also has exactly 3 wide elements', () => {
  const segs = dataSegs(generateBarcode('A', 'CODE39'));
  const startBlock = segs.slice(0, 9);
  const stopBlock = segs.slice(20, 29);
  const startWide = startBlock.filter(s => s.width === 3).length;
  const stopWide = stopBlock.filter(s => s.width === 3).length;
  assert.equal(startWide, 3, `start *: expected 3 wide, got ${startWide}`);
  assert.equal(stopWide, 3, `stop *: expected 3 wide, got ${stopWide}`);
});

test('all element widths are only narrow(1) or wide(3)', () => {
  const segs = dataSegs(generateBarcode('HELLO WORLD', 'CODE39'));
  for (const s of segs) {
    assert.ok(s.width === 1 || s.width === 3, `unexpected width ${s.width}`);
  }
});

test('elements strictly alternate bar/space (no consecutive same type)', () => {
  const segs = dataSegs(generateBarcode('TEST', 'CODE39'));
  // The data starts with a bar
  assert.equal(segs[0]?.isBar, true, 'first data segment should be a bar');
  for (let i = 0; i < segs.length - 1; i++) {
    assert.notEqual(segs[i]!.isBar, segs[i + 1]!.isBar,
      `segments ${i} and ${i + 1} are both ${segs[i]!.isBar ? 'bars' : 'spaces'}`);
  }
});

test('known pattern: "0" encodes with space2=W, bar3=W, bar4=W (0x034)', () => {
  // Pattern 0x034 = 000110100: bit5(s2)=1, bit4(b3)=1, bit2(b4)=1
  // In the char block: b1=N,s1=N,b2=N,s2=W,b3=W,s3=N,b4=W,s4=N,b5=N
  const segs = dataSegs(generateBarcode('0', 'CODE39'));
  const block = segs.slice(10, 19); // data char block (after start + gap)
  // Positions: 0=b1,1=s1,2=b2,3=s2,4=b3,5=s3,6=b4,7=s4,8=b5
  assert.equal(block[0]?.width, 1); // b1=N
  assert.equal(block[3]?.width, 3); // s2=W
  assert.equal(block[4]?.width, 3); // b3=W
  assert.equal(block[6]?.width, 3); // b4=W
  assert.equal(block[8]?.width, 1); // b5=N
});

test('known pattern: "A" encodes with bar1=W, space3=W, bar5=W (0x109)', () => {
  // 0x109 = 100001001: bit8(b1)=1, bit3(s3)=1, bit0(b5)=1
  const segs = dataSegs(generateBarcode('A', 'CODE39'));
  const block = segs.slice(10, 19);
  assert.equal(block[0]?.width, 3); // b1=W
  assert.equal(block[5]?.width, 3); // s3=W
  assert.equal(block[8]?.width, 3); // b5=W
});

test('"CODE39" multi-char: has positive total width and starts/ends with quiet zone', () => {
  const segs = generateBarcode('CODE39', 'CODE39');
  assert.ok(getTotalWidth(segs) > 0);
  assert.equal(segs[0]?.isBar, false, 'must start with quiet zone (space)');
  assert.equal(segs[segs.length - 1]?.isBar, false, 'must end with quiet zone (space)');
});

// ═══════════════════════════════════════════════════════════════════════════
// UPC-E
// ═══════════════════════════════════════════════════════════════════════════
console.log('\nUPC-E');

test('generates segments without throwing for 6-digit inputs', () => {
  generateBarcode('012345', 'UPCE');
  generateBarcode('000000', 'UPCE');
  generateBarcode('999999', 'UPCE');
});

test('total width is exactly 69 modules (3 start + 42 data + 6 end + 9+9 quiet)', () => {
  // UPC-E: 9(quiet)+3(start)+42(data)+6(end)+9(quiet) = 69
  for (const input of ['012345', '000000', '123456']) {
    const w = getTotalWidth(generateBarcode(input, 'UPCE'));
    assert.equal(w, 69, `input ${input}: expected width 69, got ${w}`);
  }
});

test('each of 6 data digits encodes to exactly 7 modules', () => {
  const segs = generateBarcode('123456', 'UPCE');
  const stripped = segs.filter(s => s.width !== 9); // strip quiet zones
  // start guard(3) + 6×7 digits(42) + end guard(6) = 51 modules
  const digitSegs = stripped.slice(3, 3 + 42);
  assert.equal(digitSegs.length, 42, 'expected 42 total digit segments');
  for (let d = 0; d < 6; d++) {
    const dBlock = digitSegs.slice(d * 7, d * 7 + 7);
    const w = dBlock.reduce((a, s) => a + s.width, 0);
    assert.equal(w, 7, `digit ${d}: expected 7 modules, got ${w}`);
  }
});

test('all 6 data digits use L or G encoding (first module is a space, not a bar)', () => {
  // R-encoding starts with a bar (1-bit). L and G encodings both start with a space (0-bit).
  // UPC-E must NEVER use R encoding.
  for (const input of ['012345', '000000', '999999', '123456']) {
    const segs = generateBarcode(input, 'UPCE');
    const stripped = segs.filter(s => s.width !== 9);
    const digitSegs = stripped.slice(3, 3 + 42);
    for (let d = 0; d < 6; d++) {
      const firstSeg = digitSegs[d * 7];
      assert.equal(firstSeg?.isBar, false,
        `input ${input} digit ${d}: first module should be a SPACE (L/G encoding), not a bar (R encoding)`);
    }
  }
});

test('start guard is bar(1)-space(1)-bar(1) = 3 modules', () => {
  const segs = generateBarcode('012345', 'UPCE');
  const stripped = segs.filter(s => s.width !== 9);
  const startGuard = stripped.slice(0, 3);
  assert.equal(startGuard[0]?.isBar, true);
  assert.equal(startGuard[1]?.isBar, false);
  assert.equal(startGuard[2]?.isBar, true);
  assert.equal(startGuard.reduce((a, s) => a + s.width, 0), 3);
});

test('end guard is space(1)-bar(1)-space(1)-bar(1)-space(1)-bar(1) = 6 modules', () => {
  const segs = generateBarcode('012345', 'UPCE');
  const stripped = segs.filter(s => s.width !== 9);
  const endGuard = stripped.slice(3 + 42); // after 6 digits
  assert.equal(endGuard.length, 6);
  assert.equal(endGuard[0]?.isBar, false);
  assert.equal(endGuard[1]?.isBar, true);
  assert.equal(endGuard[5]?.isBar, true);
  assert.equal(endGuard.reduce((a, s) => a + s.width, 0), 6);
});

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
