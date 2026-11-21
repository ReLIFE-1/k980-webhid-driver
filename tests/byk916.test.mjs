import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VENDOR_ID,
  PRODUCT_ID,
  REPORT_ID_CMD,
  REPORT_ID_DATA,
  LIGHTING_PAYLOAD_SIZE,
  stripLeadingReportId,
  buildLightingPayload,
  parseConfigPayload,
  inspectDeviceCollections,
  formatDescriptorSummary,
  findBestConfigDevice,
  getFeatureReportLength,
  createHidQueue,
  readKeyboardParamsProtocol
} from '../src/protocol/byk916.js';

function makeDataViewWithOffset(bytes, prefixBytes = 3) {
  const buf = new ArrayBuffer(prefixBytes + bytes.length + 2);
  const full = new Uint8Array(buf);
  full.fill(0xee);
  full.set(bytes, prefixBytes);
  return new DataView(buf, prefixBytes, bytes.length);
}

function makeFakeDevice({
  vendorId = VENDOR_ID,
  productId = PRODUCT_ID,
  productName = 'K980 Keyboard',
  collections = [],
  sendFeatureReport = async () => {},
  receiveFeatureReport = async () => new DataView(new ArrayBuffer(0))
} = {}) {
  const listeners = new Map();
  return {
    vendorId,
    productId,
    productName,
    collections,
    sendFeatureReport,
    receiveFeatureReport,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatchInputReport(reportId, payloadBytes) {
      const data = makeDataViewWithOffset(payloadBytes, 2);
      for (const fn of listeners.get('inputreport') || []) {
        fn({ reportId, data });
      }
    }
  };
}

const FULL_CONFIG_COLLECTIONS = [
  {
    usagePage: 0xff00,
    usage: 0x01,
    featureReports: [
      { reportId: 0x05, items: [{ reportSize: 8, reportCount: 7 }] },
      { reportId: 0x06, items: [{ reportSize: 8, reportCount: 1031 }] }
    ],
    inputReports: [
      { reportId: 0x05, items: [{ reportSize: 8, reportCount: 7 }] }
    ],
    outputReports: []
  }
];

test('stripLeadingReportId handles DataView byteOffset and Feature/Input distinction', () => {
  const view05 = makeDataViewWithOffset([0x05, 0x10, 0x3c, 0x00]);
  assert.deepEqual(Array.from(stripLeadingReportId(view05, 0x05, true)), [0x10, 0x3c, 0x00]);

  const inputPayload = makeDataViewWithOffset([0x05, 0x11, 0x45]);
  assert.deepEqual(Array.from(stripLeadingReportId(inputPayload, 0x05, false)), [0x05, 0x11, 0x45]);

  const unprefixed = makeDataViewWithOffset([0x11, 0x55, 0x00]);
  assert.deepEqual(Array.from(stripLeadingReportId(unprefixed, 0x05, true)), [0x11, 0x55, 0x00]);
});

test('buildLightingPayload builds valid 1031B packet and safely preserves validated basePayload fields', () => {
  assert.equal(LIGHTING_PAYLOAD_SIZE, 1031);
  const base = buildLightingPayload({
    selectedModeId: 1,
    modeCode: 1,
    brightness: 4,
    speed: 2,
    hwColor: 7
  });
  assert.equal(base.length, 1031);
  assert.equal(base[0], 0x03);
  assert.equal(base[1], 0xb6);
  assert.equal(base[13], 0x5a);
  assert.equal(base[14], 0xa5);
  assert.equal(base[15], 0x03);
  assert.equal(base[16], 0x03);
  assert.equal(base[17], 0x05);
  assert.equal(base[19], 0x00);
  assert.equal(base[20], 0x01);
  assert.equal(base[37], 7);
  assert.equal(base[38], 2 * 16 + 4);
  assert.equal(base[136], 0x5a);
  assert.equal(base[137], 0xa5);

  // Customize debounce and sidelight in valid base
  base[17] = 0x08;
  base[18] = 0x01;
  base[27] = 0xaa;
  base[36] = 0xbb;

  const updated = buildLightingPayload({
    selectedModeId: 21,
    modeCode: 21,
    brightness: 3,
    speed: 1,
    hwColor: 2,
    basePayload: base
  });
  assert.equal(updated[17], 0x08);
  assert.equal(updated[18], 0x01);
  assert.equal(updated[19], 0x01);
  assert.equal(updated[20], 21);
  assert.equal(updated[27], 0xaa);
  assert.equal(updated[36], 0xbb);
  assert.equal(updated[37], 2);
  assert.equal(updated[38], 1 * 16 + 3);

  // Off mode writes modeCode 0
  const offPayload = buildLightingPayload({
    selectedModeId: 22,
    modeCode: 0,
    brightness: 0,
    speed: 0,
    hwColor: 0
  });
  assert.equal(offPayload[19], 0x00);
  assert.equal(offPayload[20], 0x00);
});

test('parseConfigPayload handles 1031B and 1032B FeatureReport payloads and validates ranges', () => {
  const payload = buildLightingPayload({
    selectedModeId: 6,
    modeCode: 6,
    brightness: 3,
    speed: 4,
    hwColor: 2 // Green -> index 1 in PRESET_COLORS
  });

  // 1031B without leading Report ID
  const parsedRaw = parseConfigPayload(payload);
  assert.equal(parsedRaw.valid, true);
  assert.equal(parsedRaw.modeId, 6);
  assert.equal(parsedRaw.brightness, 3);
  assert.equal(parsedRaw.speed, 4);
  assert.equal(parsedRaw.colorIndex, 1);

  // 1032B with leading 0x06 Report ID
  const prefixed = new Uint8Array(payload.length + 1);
  prefixed[0] = REPORT_ID_DATA;
  prefixed.set(payload, 1);
  const parsedPrefixed = parseConfigPayload(makeDataViewWithOffset(prefixed, 4));
  assert.equal(parsedPrefixed.valid, true);
  assert.equal(parsedPrefixed.modeId, 6);
  assert.equal(parsedPrefixed.brightness, 3);
  assert.equal(parsedPrefixed.speed, 4);
  assert.equal(parsedPrefixed.colorIndex, 1);

  // Out-of-range appearance fields are clamped to null rather than corrupting UI
  const badRange = payload.slice();
  badRange[37 + 5 * 2] = 99;
  badRange[37 + 5 * 2 + 1] = 0x99;
  const parsedBadRange = parseConfigPayload(badRange);
  assert.equal(parsedBadRange.valid, true);
  assert.equal(parsedBadRange.brightness, null);
  assert.equal(parsedBadRange.speed, null);
  assert.equal(parsedBadRange.colorIndex, null);

  // Invalid magic header
  const badHeader = new Uint8Array(1032);
  assert.equal(parseConfigPayload(badHeader).valid, false);
});

test('inspectDeviceCollections, getFeatureReportLength, and findBestConfigDevice select vendor config interface', () => {
  const stdKeyboard = makeFakeDevice({
    collections: [
      {
        usagePage: 0x01,
        usage: 0x06,
        featureReports: [],
        inputReports: [{ reportId: 0, items: [{ reportSize: 8, reportCount: 8 }] }]
      }
    ]
  });

  const vendorConfig = makeFakeDevice({
    collections: FULL_CONFIG_COLLECTIONS
  });

  const summary = inspectDeviceCollections(vendorConfig);
  assert.equal(summary.hasConfigReports, true);
  assert.equal(summary.hasVendorUsagePage, true);
  assert.equal(getFeatureReportLength(vendorConfig, REPORT_ID_CMD, 5), 7);
  assert.equal(getFeatureReportLength(vendorConfig, REPORT_ID_DATA, 100), 1031);
  assert.equal(getFeatureReportLength(stdKeyboard, REPORT_ID_CMD, 7), 7);

  const chosen = findBestConfigDevice([stdKeyboard, vendorConfig]);
  assert.equal(chosen, vendorConfig);
  assert.equal(findBestConfigDevice([]), null);
});

test('createHidQueue executes tasks strictly sequentially and isolates errors', async () => {
  const queue = createHidQueue();
  const events = [];

  const t1 = queue.enqueue(async () => {
    events.push('t1:start');
    await new Promise((r) => setTimeout(r, 25));
    events.push('t1:end');
    return 'ok1';
  });

  const t2 = queue.enqueue(async () => {
    events.push('t2:start');
    throw new Error('boom');
  });

  const t3 = queue.enqueue(async () => {
    events.push('t3:start');
    events.push('t3:end');
    return 'ok3';
  });

  assert.equal(await t1, 'ok1');
  await assert.rejects(t2, /boom/);
  assert.equal(await t3, 'ok3');
  assert.deepEqual(events, ['t1:start', 't1:end', 't2:start', 't3:start', 't3:end']);
});

test('readKeyboardParamsProtocol queries 0x83 0xb6 and parses 1032B FeatureReport 0x06 response', async () => {
  const expected = buildLightingPayload({
    selectedModeId: 3,
    modeCode: 3,
    brightness: 4,
    speed: 1,
    hwColor: 7
  });
  const prefixed = new Uint8Array(expected.length + 1);
  prefixed[0] = REPORT_ID_DATA;
  prefixed.set(expected, 1);

  let sent = null;
  const device = makeFakeDevice({
    collections: FULL_CONFIG_COLLECTIONS,
    sendFeatureReport: async (reportId, data) => {
      sent = { reportId, data: Array.from(data) };
    },
    receiveFeatureReport: async (reportId) => {
      assert.equal(reportId, REPORT_ID_DATA);
      return makeDataViewWithOffset(prefixed, 2);
    }
  });

  const res = await readKeyboardParamsProtocol({ device, queue: createHidQueue() });
  assert.equal(sent.reportId, REPORT_ID_CMD);
  assert.deepEqual(sent.data, [0x83, 0xb6, 0x00, 0x00, 0x00, 0x00, 0x00]);
  assert.equal(res.ok, true);
  assert.equal(res.rawPayload.length, 1031);
  assert.equal(res.parsed.modeId, 3);
  assert.equal(res.parsed.brightness, 4);
  assert.equal(res.parsed.speed, 1);
  assert.equal(res.parsed.colorIndex, 7);
});

test('buildLightingPayload supports 261B payloadSize and preserves real hardware 261B basePayload tail', () => {
  const shortDefault = buildLightingPayload({
    selectedModeId: 12,
    modeCode: 12,
    brightness: 4,
    speed: 2,
    hwColor: 7,
    payloadSize: 261
  });
  assert.equal(shortDefault.length, 261);
  assert.equal(shortDefault[0], 0x03);
  assert.equal(shortDefault[1], 0xb6);
  assert.equal(shortDefault[13], 0x5a);
  assert.equal(shortDefault[14], 0xa5);
  assert.equal(shortDefault[19], 0x00);
  assert.equal(shortDefault[20], 12);
  assert.equal(shortDefault[37], 7);
  assert.equal(shortDefault[38], 2 * 16 + 4);
  assert.equal(shortDefault[136], 0x5a);
  assert.equal(shortDefault[137], 0xa5);

  // Simulate real 261B readback starting with [0x83, 0xb6, ...]
  const hwBase = new Uint8Array(261);
  hwBase[0] = 0x83;
  hwBase[1] = 0xb6;
  hwBase[13] = 0x5a;
  hwBase[14] = 0xa5;
  hwBase[15] = 0x03;
  hwBase[16] = 0x03;
  hwBase[17] = 0x07;
  hwBase[18] = 0x02;
  hwBase[27] = 0x11;
  hwBase[36] = 0x22;
  hwBase[95] = 0xaa;
  hwBase[200] = 0x7c;
  hwBase[260] = 0xef;

  const updated = buildLightingPayload({
    selectedModeId: 8,
    modeCode: 8,
    brightness: 3,
    speed: 4,
    hwColor: 2,
    basePayload: hwBase,
    payloadSize: 261
  });
  assert.equal(updated.length, 261);
  assert.equal(updated[0], 0x03);
  assert.equal(updated[1], 0xb6);
  assert.equal(updated[17], 0x07);
  assert.equal(updated[18], 0x02);
  assert.equal(updated[20], 8);
  assert.equal(updated[27], 0x11);
  assert.equal(updated[36], 0x22);
  assert.equal(updated[37 + 7 * 2], 2);
  assert.equal(updated[37 + 7 * 2 + 1], 4 * 16 + 3);
  assert.equal(updated[95], 0xaa);
  assert.equal(updated[200], 0x7c);
  assert.equal(updated[260], 0xef);
});

test('buildLightingPayload updates BOTH Block 1 (15..137) and Block 2 (138..260) on real dual-block K980 261B basePayload -> 1031B', () => {
  const dualBase = new Uint8Array(261);
  // Header 0..14
  dualBase.set([0x83, 0xb6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x5a, 0xa5], 0);

  const fillBlock = (offset, modeByte) => {
    dualBase[offset] = 0x03;
    dualBase[offset + 1] = 0x03;
    dualBase[offset + 2] = 0x05; // debounce
    dualBase[offset + 3] = 0x00;
    dualBase[offset + 4] = 0x00; // customFlag
    dualBase[offset + 5] = modeByte;
    dualBase.set([0x20, 0x01, 0x00, 0x00, 0x00, 0x00], offset + 6); // miscHeader (offset+6..offset+11 => 21..26)
    dualBase.set([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff], offset + 12); // sidelight/halo (27..36)
    for (let i = 0; i < 29; i++) {
      dualBase[offset + 22 + i * 2] = 0x07;
      dualBase[offset + 22 + i * 2 + 1] = 0x24;
    }
    dualBase.set([0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04], offset + 80); // 95..104 / 218..227
    dualBase.set([0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x00, 0x01, 0x01, 0x01], offset + 90);
    dualBase[offset + 121] = 0x5a;
    dualBase[offset + 122] = 0xa5;
  };

  fillBlock(15, 0x08);
  fillBlock(138, 0x07);

  const out = buildLightingPayload({
    selectedModeId: 2,
    modeCode: 2,
    brightness: 3,
    speed: 1,
    hwColor: 2,
    basePayload: dualBase,
    payloadSize: 1031
  });

  assert.equal(out.length, 1031);
  // Header rewritten to 0x03 0xb6
  assert.equal(out[0], 0x03);
  assert.equal(out[1], 0xb6);

  // Block 1 (15..137) updated + non-lighting bytes preserved
  assert.equal(out[17], 0x05);
  assert.equal(out[18], 0x00);
  assert.equal(out[19], 0x00);
  assert.equal(out[20], 0x02);
  assert.deepEqual(Array.from(out.subarray(21, 37)), Array.from(dualBase.subarray(21, 37)));
  for (let i = 0; i < 29; i++) {
    assert.equal(out[37 + i * 2], 2);
    assert.equal(out[37 + i * 2 + 1], 1 * 16 + 3);
  }
  assert.deepEqual(Array.from(out.subarray(95, 138)), Array.from(dualBase.subarray(95, 138)));

  // Block 2 (138..260) ALSO updated + non-lighting bytes preserved
  assert.equal(out[140], 0x05);
  assert.equal(out[141], 0x00);
  assert.equal(out[142], 0x00);
  assert.equal(out[143], 0x02);
  assert.deepEqual(Array.from(out.subarray(144, 160)), Array.from(dualBase.subarray(144, 160)));
  for (let i = 0; i < 29; i++) {
    assert.equal(out[160 + i * 2], 2);
    assert.equal(out[160 + i * 2 + 1], 1 * 16 + 3);
  }
  assert.deepEqual(Array.from(out.subarray(218, 261)), Array.from(dualBase.subarray(218, 261)));

  // Tail 261..1030 all zeroed
  assert.equal(out.subarray(261).some((b) => b !== 0), false);
});

test('parseConfigPayload handles 261B and 262B prefixed FeatureReport 0x06 payloads', () => {
  const payload261 = buildLightingPayload({
    selectedModeId: 12,
    modeCode: 12,
    brightness: 4,
    speed: 2,
    hwColor: 7,
    payloadSize: 261
  });

  const parsed261 = parseConfigPayload(payload261);
  assert.equal(parsed261.valid, true);
  assert.equal(parsed261.modeId, 12);
  assert.equal(parsed261.brightness, 4);
  assert.equal(parsed261.speed, 2);
  assert.equal(parsed261.colorIndex, 7);

  const prefixed262 = new Uint8Array(262);
  prefixed262[0] = REPORT_ID_DATA;
  prefixed262.set(payload261, 1);

  const parsed262 = parseConfigPayload(makeDataViewWithOffset(prefixed262, 1));
  assert.equal(parsed262.valid, true);
  assert.equal(parsed262.modeId, 12);
  assert.equal(parsed262.payload.length, 261);
});

test('formatDescriptorSummary includes Output reports', () => {
  const dev = makeFakeDevice({
    collections: [
      {
        usagePage: 0xff00,
        usage: 0x01,
        featureReports: [{ reportId: 0x05, items: [{ reportSize: 8, reportCount: 5 }] }],
        inputReports: [{ reportId: 0x05, items: [{ reportSize: 8, reportCount: 5 }] }],
        outputReports: [{ reportId: 0x09, items: [{ reportSize: 8, reportCount: 64 }] }]
      }
    ]
  });
  const text = formatDescriptorSummary(inspectDeviceCollections(dev));
  assert.ok(text.includes('Feature:0x05(5B)'));
  assert.ok(text.includes('Input:0x05(5B)'));
  assert.ok(text.includes('Output:0x09(64B)'));
});
