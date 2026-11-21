export const VENDOR_ID = 0x258a;
export const PRODUCT_ID = 0x0049;
export const REPORT_ID_CMD = 0x05;
export const REPORT_ID_DATA = 0x06;
export const REPORT_ID_INPUT_KEY = 0x04;
export const LIGHTING_PAYLOAD_SIZE = 1031;
export const MIN_LIGHTING_PAYLOAD_SIZE = 138;
const CONFIG_BLOCK_1_OFFSET = 15;
const CONFIG_BLOCK_2_OFFSET = 138;
const CONFIG_BLOCK_LENGTH = 123;

// 22 种官方灯效模式数据 (根据 Cfg.ini 的 hw 代码映射)
export const LIGHT_MODES = [
  { id: 1, name: '常亮模式', code: 1, speed: false, bright: true, color: true },
  { id: 2, name: '呼吸模式', code: 2, speed: true, bright: true, color: true },
  { id: 3, name: '梦幻彩虹', code: 3, speed: true, bright: true, color: false },
  { id: 4, name: '一触即发', code: 4, speed: true, bright: true, color: true },
  { id: 5, name: '雨中漫步', code: 5, speed: true, bright: true, color: true },
  { id: 6, name: '彩虹轮盘', code: 6, speed: true, bright: true, color: true },
  { id: 7, name: '涟漪扩散', code: 7, speed: true, bright: true, color: true },
  { id: 8, name: '繁星点点', code: 8, speed: true, bright: true, color: true },
  { id: 9, name: '踏雪无痕', code: 9, speed: true, bright: true, color: true },
  { id: 10, name: '川流不息', code: 10, speed: true, bright: true, color: true },
  { id: 11, name: '随波逐流', code: 11, speed: true, bright: true, color: true },
  { id: 12, name: '如影随形', code: 12, speed: true, bright: true, color: true },
  { id: 13, name: '正弦光波', code: 13, speed: true, bright: true, color: true },
  { id: 14, name: '左右扫描', code: 14, speed: true, bright: true, color: true },
  { id: 15, name: '旋转风车', code: 15, speed: true, bright: true, color: false },
  { id: 16, name: '七彩瀑布', code: 16, speed: true, bright: true, color: false },
  { id: 17, name: '花开富贵', code: 17, speed: true, bright: true, color: false },
  { id: 18, name: '旋转风暴', code: 18, speed: true, bright: true, color: true },
  { id: 19, name: '来回碰撞', code: 19, speed: true, bright: true, color: true },
  { id: 20, name: '十全十美', code: 20, speed: true, bright: true, color: true },
  { id: 21, name: '游戏模式', code: 21, speed: false, bright: false, color: false },
  { id: 22, name: '关闭灯光', code: 0, speed: false, bright: false, color: false }
];

// 8 种预设颜色 (针对 BYK916 PCB 固件校准，修复绿蓝通道反转)
export const PRESET_COLORS = [
  { name: '红色', bg: '#ef4444', hwCode: 0 },
  { name: '绿色', bg: '#22c55e', hwCode: 2 },
  { name: '蓝色', bg: '#3b82f6', hwCode: 1 },
  { name: '黄色', bg: '#eab308', hwCode: 4 },
  { name: '紫色', bg: '#a855f7', hwCode: 3 },
  { name: '青色', bg: '#06b6d4', hwCode: 5 },
  { name: '白色', bg: '#f8fafc', hwCode: 6 },
  { name: '幻彩', bg: 'linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)', hwCode: 7 }
];

export const MEDIA_KEYS = [
  { name: '音量增加', code: 0x80 },
  { name: '音量减小', code: 0x81 },
  { name: '静音切换', code: 0x7f },
  { name: '上一曲目', code: 0xdf },
  { name: '下一曲目', code: 0xde },
  { name: '播放 / 暂停', code: 0xcd },
  { name: '停止播放', code: 0xb7 }
];

export const SYSTEM_KEYS = [
  { name: '我的电脑', code: 0x194 },
  { name: '计算器', code: 0x192 },
  { name: '默认浏览器', code: 0x223 },
  { name: '主页', code: 0x22a },
  { name: '搜索', code: 0x221 },
  { name: '锁屏', code: 0x19e }
];

export const MOUSE_KEYS = [
  { name: '鼠标左键', code: 0xf0 },
  { name: '鼠标右键', code: 0xf1 },
  { name: '鼠标中键', code: 0xf2 },
  { name: '滚轮向上', code: 0xf3 },
  { name: '滚轮向下', code: 0xf4 }
];

const LIGHTING_HEADER = [
  0x03, 0xb6, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x5a, 0xa5
];

const LIGHTING_MISC_HEADER = [0x20, 0x00, 0x00, 0x00, 0x00, 0x00];
const LIGHTING_SIDELIGHT_HALO = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff];

const LIGHTING_SUFFIX = [
  0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x00, 0x01, 0x01, 0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x5a, 0xa5
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calcReportByteLength(report) {
  const items = report?.items;
  if (!Array.isArray(items) || items.length === 0) return 0;
  const totalBits = items.reduce(
    (sum, item) => sum + (item?.reportSize || 0) * (item?.reportCount || 0),
    0
  );
  return Math.ceil(totalBits / 8);
}

/**
 * 将 WebHID DataView / TypedArray / ArrayBuffer 统一转换为 Uint8Array 视图
 */
export function toUint8Array(dataViewOrArray) {
  if (!dataViewOrArray) return new Uint8Array(0);
  if (dataViewOrArray instanceof Uint8Array) return dataViewOrArray;
  if (ArrayBuffer.isView(dataViewOrArray)) {
    return new Uint8Array(
      dataViewOrArray.buffer,
      dataViewOrArray.byteOffset,
      dataViewOrArray.byteLength
    );
  }
  if (dataViewOrArray instanceof ArrayBuffer) {
    return new Uint8Array(dataViewOrArray);
  }
  if (Array.isArray(dataViewOrArray)) {
    return new Uint8Array(dataViewOrArray);
  }
  return new Uint8Array(0);
}

export function formatHex(data, maxBytes) {
  const u8 = toUint8Array(data);
  const slice = typeof maxBytes === 'number' ? u8.subarray(0, maxBytes) : u8;
  return Array.from(slice)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * 遵循 W3C WebHID 规范：receiveFeatureReport() 返回的首字节为 Report ID，
 * 而 inputreport 事件的 data 不包含 Report ID 前缀。
 */
export function stripLeadingReportId(raw, reportId, fromFeatureReport = true) {
  const u8 = toUint8Array(raw);
  if (fromFeatureReport && u8.length > 1 && u8[0] === reportId) {
    return u8.subarray(1);
  }
  return u8;
}

/**
 * 解析 HIDDevice.collections，统计 Feature / Input / Output Report ID 与字节长度
 */
export function inspectDeviceCollections(device) {
  const rawCollections = Array.isArray(device?.collections) ? device.collections : [];
  const featureReportMap = new Map();
  const inputReportMap = new Map();
  const outputReportMap = new Map();

  const normalizeReports = (reports, targetMap) =>
    (Array.isArray(reports) ? reports : []).map((rep) => {
      const reportId = typeof rep?.reportId === 'number' ? rep.reportId : 0;
      const byteLength = calcReportByteLength(rep);
      const prev = targetMap.get(reportId) || 0;
      if (byteLength > prev || !targetMap.has(reportId)) {
        targetMap.set(reportId, byteLength);
      }
      return { reportId, byteLength };
    });

  const collections = rawCollections.map((col) => ({
    usagePage: col?.usagePage ?? 0,
    usage: col?.usage ?? 0,
    featureReports: normalizeReports(col?.featureReports, featureReportMap),
    inputReports: normalizeReports(col?.inputReports, inputReportMap),
    outputReports: normalizeReports(col?.outputReports, outputReportMap)
  }));

  const hasVendorUsagePage = collections.some((c) => c.usagePage >= 0xff00);
  const hasConfigReports =
    featureReportMap.has(REPORT_ID_CMD) && featureReportMap.has(REPORT_ID_DATA);

  return {
    collections,
    featureReportMap,
    inputReportMap,
    outputReportMap,
    hasVendorUsagePage,
    hasConfigReports
  };
}

export function formatDescriptorSummary(summary) {
  if (!summary || summary.collections.length === 0) {
    return '无 HID Collections 元数据';
  }
  return summary.collections
    .map((c, idx) => {
      const up = `0x${c.usagePage.toString(16).padStart(4, '0')}`;
      const u = `0x${c.usage.toString(16).padStart(2, '0')}`;
      const f =
        c.featureReports
          .map((r) => `0x${r.reportId.toString(16).padStart(2, '0')}(${r.byteLength}B)`)
          .join(',') || '无';
      const inp =
        c.inputReports
          .map((r) => `0x${r.reportId.toString(16).padStart(2, '0')}(${r.byteLength}B)`)
          .join(',') || '无';
      const out =
        (c.outputReports || [])
          .map((r) => `0x${r.reportId.toString(16).padStart(2, '0')}(${r.byteLength}B)`)
          .join(',') || '无';
      return `#${idx}[UP=${up},U=${u} Feature:${f} Input:${inp} Output:${out}]`;
    })
    .join(' | ');
}

/**
 * 从多个 HID 接口中筛选支持 BYK916 Feature Report (0x05/0x06) 的配置接口
 */
export function findBestConfigDevice(devices) {
  if (!Array.isArray(devices) || devices.length === 0) return null;

  let bestDevice = null;
  let bestScore = -1;

  for (const dev of devices) {
    if (!dev) continue;
    const summary = inspectDeviceCollections(dev);
    let score = 0;

    if (dev.vendorId === VENDOR_ID && dev.productId === PRODUCT_ID) score += 100;
    else if (dev.vendorId === VENDOR_ID) score += 20;

    if (summary.hasConfigReports) {
      score += 1000;
    } else if (
      summary.featureReportMap.has(REPORT_ID_DATA) ||
      summary.featureReportMap.has(REPORT_ID_CMD)
    ) {
      score += 300;
    }

    if (summary.hasVendorUsagePage) score += 100;
    if (summary.featureReportMap.size > 0) score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestDevice = dev;
    }
  }

  return bestDevice;
}

export function getFeatureReportLength(device, reportId, fallbackLength) {
  const { featureReportMap } = inspectDeviceCollections(device);
  const declared = featureReportMap.get(reportId);
  return typeof declared === 'number' && declared > 0 ? declared : fallbackLength;
}

/**
 * 判断设备是否处于 K980 USB 有线直连模式 (0x258A:0x0049 且 Feature Report 0x05 为 5B)
 * 反编译 OemDrv.exe (CDrv196::IsWireless) 确认有线模式下固件不开放 0x90 电量回读接口
 */
export function isWiredUsbDevice(device) {
  return (
    Boolean(device) &&
    device.vendorId === VENDOR_ID &&
    device.productId === PRODUCT_ID &&
    getFeatureReportLength(device, REPORT_ID_CMD, 0) === 5
  );
}

/**
 * 解析电量与供电状态字节 (SinoWealth BYK916 CDrv196::ReadPower 协议)
 */
export function parseBatteryPayload(payload) {
  const u8 = toUint8Array(payload);
  const rawHex = formatHex(u8, 16);
  if (u8.length < 2) {
    return {
      recognized: false,
      cmd: u8.length > 0 ? u8[0] : null,
      val: null,
      rawHex
    };
  }

  const cmd = u8[0];
  const val = u8[1];

  if (cmd === 0x10) {
    if (val === 1) {
      return {
        recognized: true,
        powerMode: 'wired',
        isCharging: false,
        batteryLevel: 100,
        statusText: 'USB 供电 (电池已充满 100%)',
        cmd,
        val,
        rawHex
      };
    }
    if (val >= 2 && val <= 100) {
      return {
        recognized: true,
        powerMode: 'wired',
        isCharging: true,
        batteryLevel: val,
        statusText: 'USB 供电 (正在为内置电池充电)',
        cmd,
        val,
        rawHex
      };
    }
    if (val === 0) {
      return {
        recognized: true,
        powerMode: 'wired',
        isCharging: true,
        batteryLevel: null,
        statusText: 'USB 供电 (正在充电，电量读数暂未就绪)',
        cmd,
        val,
        rawHex
      };
    }
    return { recognized: false, cmd, val, rawHex };
  }

  if (cmd === 0x11 && val <= 100) {
    return {
      recognized: true,
      powerMode: 'wireless',
      isCharging: false,
      batteryLevel: val,
      statusText: `无线供电 (电量剩余 ${val}%)`,
      cmd,
      val,
      rawHex
    };
  }

  return { recognized: false, cmd, val, rawHex };
}

/**
 * 串行 HID 传输队列，避免灯效写入、参数读取与电量轮询并发产生 USB 控制传输冲突
 */
export function createHidQueue() {
  let tail = Promise.resolve();
  return {
    enqueue(task) {
      const run = tail.then(() => task());
      tail = run.catch(() => {});
      return run;
    }
  };
}

function createDeviceInputWaiter(device, timeoutMs) {
  let settled = false;
  let timer = null;
  let resolvedValue = null;
  let resolveFn = null;
  let listener = null;

  const cleanup = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (listener && typeof device?.removeEventListener === 'function') {
      device.removeEventListener('inputreport', listener);
      listener = null;
    }
  };

  const promise = new Promise((resolve) => {
    resolveFn = resolve;
    if (typeof device?.addEventListener !== 'function') {
      settled = true;
      resolve(null);
      return;
    }

    listener = (event) => {
      const parsed = parseBatteryPayload(toUint8Array(event?.data));
      if (parsed.recognized && !settled) {
        settled = true;
        resolvedValue = {
          ...parsed,
          reportId: event.reportId
        };
        cleanup();
        resolve(resolvedValue);
      }
    };

    device.addEventListener('inputreport', listener);
    timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(null);
      }
    }, timeoutMs);
  });

  return {
    promise,
    getImmediate: () => resolvedValue,
    cancel: () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolveFn?.(resolvedValue);
      }
    }
  };
}

/**
 * 多策略安全电量查询协议：
 * 1. USB 有线直连模式 (0x258A:0x0049, Report 0x05=5B) 直接返回有线供电状态，不发送 0x90 以免阻塞固件通道
 * 2. 2.4G 无线接收器模式按 HID 描述符匹配长度发送 Report 0x05 [0x90, 0x00...]
 * 3. 优先捕获键盘主动回传的 InputReport (0x10/0x11)
 * 4. 仅读取 FeatureReport 0x05（绝不回退读取 Report 0x06，避免引发 STALL 影响灯效写入）
 */
export async function queryBatteryProtocol({
  device,
  queue,
  waitForInputReport,
  forceProbe = false,
  onLog
} = {}) {
  if (!device) {
    return {
      ok: false,
      attempts: [],
      descriptorSummary: '未连接设备',
      hint: '请先连接键盘。'
    };
  }

  const runTask = async () => {
    const summary = inspectDeviceCollections(device);
    const descriptorSummary = formatDescriptorSummary(summary);
    const attempts = [];

    if (isWiredUsbDevice(device) && !forceProbe) {
      onLog?.(
        'Power',
        '当前为 USB 有线直连模式 (PID 0x0049，Report 0x05=5B)，官方固件仅在 2.4G 接收器模式下开放 0x90 电量回读接口，已自动跳过轮询避免干扰灯效通道',
        'info'
      );
      return {
        ok: true,
        recognized: true,
        wiredOnly: true,
        source: 'USB Wired (PID 0x0049)',
        powerMode: 'wired',
        isCharging: false,
        batteryLevel: null,
        statusText: 'USB 有线直连供电',
        hint: '经反编译官方驱动确认，K980 在 USB 有线模式 (PID 0x0049) 下不开放 0x90 电量百分比读取接口，仅在 2.4G 无线接收器模式下支持实时电量查询。如需查看电量百分比，请插入 2.4G 接收器（FN + R）并在本页面连接接收器设备。',
        attempts: [{ step: 'detectConnectionMode', ok: true, mode: 'usb-wired-0049' }],
        descriptorSummary
      };
    }

    const reqLength = getFeatureReportLength(device, REPORT_ID_CMD, 7);
    const req = new Uint8Array(Math.max(2, reqLength));
    req[0] = 0x90;

    // 启动短暂 InputReport 捕获窗口
    let externalValue = null;
    let inputWaiter = null;
    let externalPromise = Promise.resolve(null);

    if (typeof waitForInputReport === 'function') {
      externalPromise = Promise.resolve(waitForInputReport({ timeoutMs: 120 })).then((res) => {
        if (res && res.recognized) {
          externalValue = res;
        }
        return res;
      });
    } else {
      inputWaiter = createDeviceInputWaiter(device, 120);
      externalPromise = inputWaiter.promise;
    }

    try {
      onLog?.(
        'TX',
        `查询电量与供电状态: 下发 Report 0x05 (${req.length}B) [${formatHex(req, 7)}]`,
        'tx'
      );
      await device.sendFeatureReport(REPORT_ID_CMD, req);
      attempts.push({
        step: 'sendFeatureReport(0x05)',
        ok: true,
        length: req.length
      });
    } catch (err) {
      inputWaiter?.cancel();
      attempts.push({
        step: 'sendFeatureReport(0x05)',
        ok: false,
        error: err.message
      });
      onLog?.('Power', `发送电量查询指令失败: ${err.message}`, 'error');
      return {
        ok: false,
        attempts,
        descriptorSummary,
        hint: '发送 Report 0x05 查询指令失败，请确认当前处于 2.4G 无线接收器模式或已选对包含配置通道的 HID 接口。'
      };
    }

    await delay(25);

    // 优先采用已到达的 InputReport 电源帧
    const earlyInput = externalValue || inputWaiter?.getImmediate();
    if (earlyInput && earlyInput.recognized) {
      inputWaiter?.cancel();
      const source =
        earlyInput.reportId !== undefined
          ? `InputReport 0x${earlyInput.reportId.toString(16).padStart(2, '0')}`
          : 'InputReport';
      onLog?.(
        'Power',
        `[${source}] 状态: ${earlyInput.statusText}, 原始码: [${earlyInput.rawHex}]`,
        'info'
      );
      return {
        ok: true,
        source,
        ...earlyInput,
        attempts,
        descriptorSummary
      };
    }

    const hasDeclaredFeatures = summary.featureReportMap.size > 0;
    const canTry05 = !hasDeclaredFeatures || summary.featureReportMap.has(REPORT_ID_CMD);

    if (canTry05) {
      try {
        const resp05 = await device.receiveFeatureReport(REPORT_ID_CMD);
        const raw05 = toUint8Array(resp05);
        const stripped05 = stripLeadingReportId(raw05, REPORT_ID_CMD, true);
        const parsed05 = parseBatteryPayload(stripped05);
        attempts.push({
          step: 'receiveFeatureReport(0x05)',
          ok: true,
          rawHex: formatHex(raw05, 16),
          payloadHex: formatHex(stripped05, 16),
          recognized: parsed05.recognized
        });

        if (parsed05.recognized) {
          inputWaiter?.cancel();
          onLog?.(
            'Power',
            `[FeatureReport 0x05] 状态: ${parsed05.statusText}, 载荷: [${parsed05.rawHex}]`,
            'info'
          );
          return {
            ok: true,
            source: 'FeatureReport 0x05',
            ...parsed05,
            attempts,
            descriptorSummary
          };
        }
        onLog?.(
          'Power',
          `FeatureReport 0x05 返回未识别数据: [${formatHex(stripped05, 16)}]`,
          'info'
        );
      } catch (err) {
        attempts.push({
          step: 'receiveFeatureReport(0x05)',
          ok: false,
          error: err.message
        });
        onLog?.('Power', `读取 FeatureReport 0x05 失败: ${err.message}`, 'info');
      }
    }

    // 若之前仍在 120ms 捕获窗口内，等待结果再做最终判定
    const lateInput = await externalPromise;
    const finalInput = externalValue || lateInput;
    if (finalInput && finalInput.recognized) {
      const source =
        finalInput.reportId !== undefined
          ? `InputReport 0x${finalInput.reportId.toString(16).padStart(2, '0')}`
          : 'InputReport';
      onLog?.(
        'Power',
        `[${source}] 状态: ${finalInput.statusText}, 原始码: [${finalInput.rawHex}]`,
        'info'
      );
      return {
        ok: true,
        source,
        ...finalInput,
        attempts,
        descriptorSummary
      };
    }

    const failed05 = attempts.find((a) => a.step === 'receiveFeatureReport(0x05)' && !a.ok);
    let hint = '未能获取有效电量数据。';
    if (failed05) {
      hint =
        '键盘未返回 Report 0x05 电量帧：0x90 电量回读通常仅在 2.4G 无线接收器模式下受支持，或官方驱动在后台占用了 HID 通道。请确认是否已关闭官方驱动并切换至 2.4G 接收器模式后重试。';
    } else if (!canTry05) {
      hint =
        '当前选中的 HID 接口未声明 Feature Report 0x05，请尝试断开后重新选择包含配置通道的 K980 接口。';
    } else {
      hint =
        '设备已响应 Feature Report 0x05 但数据格式不在已知 0x10/0x11 电量帧规范内，可复制诊断信息进一步分析。';
    }

    return {
      ok: false,
      attempts,
      descriptorSummary,
      hint
    };
  };

  return queue ? queue.enqueue(runTask) : runTask();
}

function isValidConfigBase(basePayload) {
  return (
    basePayload instanceof Uint8Array &&
    basePayload.length >= MIN_LIGHTING_PAYLOAD_SIZE &&
    basePayload[13] === 0x5a &&
    basePayload[14] === 0xa5 &&
    basePayload[15] === 0x03 &&
    basePayload[16] === 0x03
  );
}

function applyLightingToBlock(
  payload,
  blockOffset,
  { selectedModeId, modeCode, hwColor, appearance }
) {
  if (blockOffset + CONFIG_BLOCK_LENGTH > payload.length) return;
  payload[blockOffset + 4] = selectedModeId === 21 ? 0x01 : 0x00;
  payload[blockOffset + 5] = selectedModeId === 22 ? 0x00 : modeCode;
  for (let i = 0; i < 29; i++) {
    payload[blockOffset + 22 + i * 2] = hwColor;
    payload[blockOffset + 22 + i * 2 + 1] = appearance;
  }
}

/**
 * 构建 BYK916 灯光与参数下发报文 (Report ID 0x06，自动匹配接口声明的字节长度)
 * 若传入经校验的 basePayload，则保留设备原配置块其余字节 (debounce/misc/sidelight/suffix)，
 * 并同步更新 Block 1 (15..137) 与双块固件的 Block 2 (138..260) 灯效字段
 */
export function buildLightingPayload({
  selectedModeId,
  modeCode,
  brightness,
  speed,
  hwColor,
  basePayload,
  payloadSize
}) {
  const hasValidBase = isValidConfigBase(basePayload);
  const targetSize =
    typeof payloadSize === 'number' && payloadSize >= MIN_LIGHTING_PAYLOAD_SIZE
      ? payloadSize
      : hasValidBase
        ? basePayload.length
        : LIGHTING_PAYLOAD_SIZE;

  const payload = new Uint8Array(targetSize);

  if (hasValidBase) {
    payload.set(basePayload.subarray(0, Math.min(basePayload.length, targetSize)), 0);
    payload.set(LIGHTING_HEADER, 0);
  } else {
    payload.set(LIGHTING_HEADER, 0);
    payload[15] = 0x03;
    payload[16] = 0x03;
    payload[17] = 0x05;
    payload[18] = 0x00;
    payload.set(LIGHTING_MISC_HEADER, 21);
    payload.set(LIGHTING_SIDELIGHT_HALO, 27);
    payload.set(LIGHTING_SUFFIX, 95);
  }

  const safeSpeed = Math.max(0, Math.min(4, Number(speed) || 0));
  const safeBright = Math.max(0, Math.min(4, Number(brightness) || 0));
  const appearance = safeSpeed * 16 + safeBright;

  applyLightingToBlock(payload, CONFIG_BLOCK_1_OFFSET, {
    selectedModeId,
    modeCode,
    hwColor,
    appearance
  });

  if (
    hasValidBase &&
    payload.length >= CONFIG_BLOCK_2_OFFSET + CONFIG_BLOCK_LENGTH &&
    payload[CONFIG_BLOCK_2_OFFSET] === 0x03 &&
    payload[CONFIG_BLOCK_2_OFFSET + 1] === 0x03
  ) {
    applyLightingToBlock(payload, CONFIG_BLOCK_2_OFFSET, {
      selectedModeId,
      modeCode,
      hwColor,
      appearance
    });
  }

  return payload;
}

/**
 * 解析 Report 0x06 回读配置包，自动剥离 Feature Report 首字节并校验魔数与数值范围
 */
export function parseConfigPayload(rawData) {
  const payload = stripLeadingReportId(rawData, REPORT_ID_DATA, true);
  if (payload.length < 39 || payload[13] !== 0x5a || payload[14] !== 0xa5) {
    return { valid: false, reason: 'invalid_header', payload };
  }

  const customFlag = payload[19];
  const modeCode = payload[20];

  let modeObj = null;
  if (customFlag === 1 && modeCode === 21) {
    modeObj = LIGHT_MODES.find((m) => m.id === 21) || null;
  } else if (modeCode === 0) {
    modeObj = LIGHT_MODES.find((m) => m.id === 22) || null;
  } else {
    modeObj =
      LIGHT_MODES.find((m) => m.code === modeCode && m.id !== 21 && m.id !== 22) || null;
  }

  if (!modeObj) {
    return { valid: false, reason: 'unknown_mode', modeCode, customFlag, payload };
  }

  const slotIdx = modeCode >= 1 && modeCode <= 29 ? modeCode - 1 : 0;
  const slotOffset = 37 + slotIdx * 2;
  let col = payload[37];
  let appearance = payload[38];

  if (slotOffset + 1 < payload.length) {
    const slotCol = payload[slotOffset];
    const slotApp = payload[slotOffset + 1];
    if (slotCol !== 0 || slotApp !== 0 || (col === 0 && appearance === 0)) {
      col = slotCol;
      appearance = slotApp;
    }
  }

  const rawSpeed = (appearance >> 4) & 0x0f;
  const rawBrightness = appearance & 0x0f;
  const speed = rawSpeed >= 0 && rawSpeed <= 4 ? rawSpeed : null;
  const brightness = rawBrightness >= 0 && rawBrightness <= 4 ? rawBrightness : null;
  const matchedColorIdx = PRESET_COLORS.findIndex((c) => c.hwCode === col);
  const colorIndex = matchedColorIdx >= 0 ? matchedColorIdx : null;

  return {
    valid: true,
    modeId: modeObj.id,
    modeCode,
    customFlag,
    brightness,
    speed,
    colorIndex,
    hwColor: col,
    payload
  };
}

/**
 * 读取当前键盘配置参数 (发送 Report 0x05 [0x83, 0xb6, ...] 后读取 Report 0x06)
 */
export async function readKeyboardParamsProtocol({ device, queue, onLog } = {}) {
  if (!device) return { ok: false, error: '未连接设备' };

  const runTask = async () => {
    try {
      const reqLength = getFeatureReportLength(device, REPORT_ID_CMD, 7);
      const req = new Uint8Array(Math.max(2, reqLength));
      req[0] = 0x83;
      req[1] = 0xb6;

      onLog?.('TX', `发送查询参数指令: Report 0x05 (${req.length}B) [${formatHex(req, 7)}]`, 'tx');
      await device.sendFeatureReport(REPORT_ID_CMD, req);
      await delay(25);

      const resp = await device.receiveFeatureReport(REPORT_ID_DATA);
      const rawPayload = stripLeadingReportId(resp, REPORT_ID_DATA, true);
      onLog?.(
        'RX',
        `收到键盘状态包 (${rawPayload.length} 字节): ${formatHex(rawPayload, 16)}`,
        'info'
      );

      const parsed = parseConfigPayload(resp);
      return { ok: parsed.valid, rawPayload, parsed };
    } catch (err) {
      onLog?.(
        'WebHID',
        `读取状态: ${err.message} (部分固件采用单向推送，不影响配置下发)`,
        'info'
      );
      return { ok: false, error: err.message };
    }
  };

  return queue ? queue.enqueue(runTask) : runTask();
}
