import { K980_KEYS } from '../keys.js';
import {
  VENDOR_ID,
  PRODUCT_ID,
  REPORT_ID_CMD,
  REPORT_ID_DATA,
  REPORT_ID_INPUT_KEY,
  LIGHTING_PAYLOAD_SIZE,
  MIN_LIGHTING_PAYLOAD_SIZE,
  LIGHT_MODES,
  PRESET_COLORS,
  MEDIA_KEYS,
  SYSTEM_KEYS,
  MOUSE_KEYS,
  toUint8Array,
  formatHex,
  inspectDeviceCollections,
  formatDescriptorSummary,
  findBestConfigDevice,
  getFeatureReportLength,
  createHidQueue,
  buildLightingPayload,
  readKeyboardParamsProtocol
} from './protocol/byk916.js';
import { getStorage, setStorage, getJsonStorage, setJsonStorage } from './utils/storage.js';
import { createKeyAudioFeedback } from './utils/audio.js';

function renderVueLoadError() {
  const appEl = document.getElementById('app');
  if (!appEl) return;
  appEl.removeAttribute('v-cloak');
  appEl.innerHTML = `
    <div style="max-width:640px;margin:48px auto;padding:24px;border-radius:16px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;font-family:system-ui,sans-serif;line-height:1.6;">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;">前端依赖资源加载失败</h2>
      <p style="margin:0 0 12px;font-size:14px;">未能从 CDN 加载 Vue 3 运行时脚本（可能是当前处于完全离线环境，或网络无法访问 unpkg.com）。</p>
      <p style="margin:0;font-size:13px;color:#7f1d1d;">请检查网络连接后刷新页面重试；首次打开需要联网加载页面资源。</p>
    </div>
  `;
}

if (typeof window.Vue === 'undefined') {
  renderVueLoadError();
} else {
  const { createApp, ref, computed, watch, onMounted, onUnmounted } = window.Vue;

  createApp({
    setup() {
      const connected = ref(false);
      const isConnecting = ref(false);
      const deviceName = ref('');
      const deviceInfo = ref(null);
      const availableInterfaces = ref([]);
      const activeInterfaceIndex = ref(0);
      const activeTab = ref('light');

      const audioFeedback = ref(getJsonStorage('k980_audio_feedback', true));
      const autoSync = ref(getJsonStorage('k980_auto_sync', true));
      const interceptShortcuts = ref(getJsonStorage('k980_intercept_shortcuts', false));
      const keycapTheme = ref(getStorage('k980_keycap_theme', 'retro'));
      const themeMode = ref(getStorage('k980_theme_mode', 'system'));

      watch(audioFeedback, (v) => setJsonStorage('k980_audio_feedback', v));
      watch(autoSync, (v) => setJsonStorage('k980_auto_sync', v));
      watch(interceptShortcuts, (v) => setJsonStorage('k980_intercept_shortcuts', v));
      watch(keycapTheme, (v) => setStorage('k980_keycap_theme', v));

      // Toast 通知系统
      const toasts = ref([]);
      let toastSeq = 0;
      const toastTimers = new Map();

      function dismissToast(id) {
        const timer = toastTimers.get(id);
        if (timer) {
          clearTimeout(timer);
          toastTimers.delete(id);
        }
        toasts.value = toasts.value.filter((t) => t.id !== id);
      }

      function showToast(message, type = 'info', duration = 3500) {
        const id = ++toastSeq;
        toasts.value.push({ id, message, type });
        if (toasts.value.length > 4) {
          const oldest = toasts.value[0];
          dismissToast(oldest.id);
        }
        if (duration > 0) {
          const timer = setTimeout(() => dismissToast(id), duration);
          toastTimers.set(id, timer);
        }
      }

      // 主题模式应用
      function applyTheme() {
        const prefersDark =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark =
          themeMode.value === 'dark' || (themeMode.value === 'system' && prefersDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      function setTheme(mode) {
        themeMode.value = mode;
        setStorage('k980_theme_mode', mode);
        applyTheme();
      }

      const mediaQuery =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-color-scheme: dark)')
          : null;
      const handleSystemThemeChange = () => {
        if (themeMode.value === 'system') {
          applyTheme();
        }
      };

      // 键盘指示灯状态
      const capsLockActive = ref(false);
      const numLockActive = ref(true);

      // 固件静态参考与 HID 上报监控
      const firmwareVer = ref('v22 (Cfg.ini 静态基准)');
      const inputReportCount = ref(0);
      const inputReportsList = ref([]);

      function addInputReport(reportId, u8Data, desc = '') {
        inputReportCount.value++;
        const now = new Date();
        const time =
          now.toTimeString().split(' ')[0] +
          '.' +
          String(now.getMilliseconds()).padStart(3, '0');
        const hex = formatHex(u8Data);
        inputReportsList.value.unshift({ time, reportId, bytes: u8Data, hex, desc });
        if (inputReportsList.value.length > 50) inputReportsList.value.pop();
      }

      function clearInputReports() {
        inputReportsList.value = [];
      }

      // 键位与选择状态
      const keys = ref(Array.isArray(K980_KEYS) ? K980_KEYS : []);
      const selectedKeyIds = ref(new Set());
      const isMultiSelectMode = ref(false);
      const previewBindings = ref({});

      function getKeyDisplayName(k) {
        if (!k) return '';
        if (k.id === 'K96') return 'Num Enter';
        if (k.label === 'Rcrtl') return 'RCtrl';
        return k.label;
      }

      const selectedCount = computed(() => selectedKeyIds.value.size);
      const selectedKeysList = computed(() =>
        keys.value.filter((k) => selectedKeyIds.value.has(k.id))
      );
      const selectedLabelsText = computed(() =>
        selectedKeysList.value.map((k) => getKeyDisplayName(k)).join(', ')
      );
      const firstSelectedKey = computed(() =>
        selectedKeysList.value.length > 0 ? selectedKeysList.value[0] : null
      );

      function isKeySelected(k) {
        return selectedKeyIds.value.has(k.id);
      }

      const pressedKeys = ref({});
      const testedKeys = ref({});
      const keystrokeCount = ref(0);

      let hidDevice = null;
      let authorizedHidDevices = [];
      let lastConfigPayload = null;
      let paramDebounceTimer = null;
      const hidQueue = createHidQueue();
      const logs = ref([]);

      function addLog(tag, msg, type = 'info') {
        const now = new Date();
        const time =
          now.toTimeString().split(' ')[0] +
          '.' +
          String(now.getMilliseconds()).padStart(3, '0');
        logs.value.push({ time, tag, msg, type });
        if (logs.value.length > 150) logs.value.shift();
      }

      function clearLogs() {
        logs.value = [];
      }

      // 灯效与本地预设
      const lightModes = ref(LIGHT_MODES);
      const presetColors = PRESET_COLORS;
      const selectedModeId = ref(1);
      const brightness = ref(4);
      const speed = ref(2);
      const selectedColorIndex = ref(7);
      const newPresetName = ref('');
      const lightPresets = ref(getJsonStorage('k980_light_presets', []));

      watch(
        lightPresets,
        (v) => setJsonStorage('k980_light_presets', v),
        { deep: true }
      );

      const currentModeObj = computed(() =>
        lightModes.value.find((m) => m.id === selectedModeId.value)
      );

      const mediaKeys = MEDIA_KEYS;
      const systemKeys = SYSTEM_KEYS;
      const mouseKeys = MOUSE_KEYS;

      const keyAudio = createKeyAudioFeedback();
      function playKeySound() {
        if (!audioFeedback.value) return;
        keyAudio.play();
      }

      function handleInputReport(event) {
        const { reportId, data } = event;
        const u8 = toUint8Array(data);

        let desc = '';
        if (reportId === REPORT_ID_CMD) {
          desc = '状态/指令帧';
        } else if (reportId === REPORT_ID_INPUT_KEY) {
          desc = '按键/状态变化帧';
        }

        addInputReport(reportId, u8, desc);
      }

      async function readKeyboardParams() {
        if (!hidDevice || !connected.value) return;
        const res = await readKeyboardParamsProtocol({
          device: hidDevice,
          queue: hidQueue,
          onLog: addLog
        });

        if (res.ok && res.parsed?.valid) {
          if (res.rawPayload?.length >= MIN_LIGHTING_PAYLOAD_SIZE) {
            lastConfigPayload = res.rawPayload;
            if (deviceInfo.value && !deviceInfo.value.report06Length) {
              deviceInfo.value = {
                ...deviceInfo.value,
                report06Length: res.rawPayload.length
              };
            }
          }
          selectedModeId.value = res.parsed.modeId;
          if (res.parsed.brightness !== null) {
            brightness.value = res.parsed.brightness;
          }
          if (res.parsed.speed !== null) {
            speed.value = res.parsed.speed;
          }
          if (res.parsed.colorIndex !== null) {
            selectedColorIndex.value = res.parsed.colorIndex;
          }
          addLog('WebHID', '已从键盘回读并同步当前灯效参数', 'info');
        }
      }

      function syncAvailableInterfaces(devices, selectedDevice) {
        const list = Array.isArray(devices) ? devices.filter(Boolean) : [];
        authorizedHidDevices = list;
        availableInterfaces.value = list.map((dev, idx) => {
          const summary = inspectDeviceCollections(dev);
          const descriptorSummary = formatDescriptorSummary(summary);
          const r06Len = getFeatureReportLength(dev, REPORT_ID_DATA, null);
          const firstUp = summary.collections[0]
            ? `0x${summary.collections[0].usagePage.toString(16).padStart(4, '0')}`
            : '未知';
          return {
            index: idx,
            productName: dev.productName || 'K980',
            vendorIdHex: `0x${(dev.vendorId || 0).toString(16).padStart(4, '0').toUpperCase()}`,
            productIdHex: `0x${(dev.productId || 0).toString(16).padStart(4, '0').toUpperCase()}`,
            hasConfigReports: summary.hasConfigReports,
            report06Length: r06Len,
            descriptorSummary,
            label: `#${idx} UP=${firstUp}${summary.hasConfigReports ? ' [配置05/06]' : ''}${r06Len ? ` (${r06Len}B)` : ''}`
          };
        });
        const matchedIdx = list.indexOf(selectedDevice);
        activeInterfaceIndex.value = matchedIdx >= 0 ? matchedIdx : 0;
      }

      async function openAndAttachDevice(device, { silent = false, allDevices = null } = {}) {
        if (!device) return false;
        const prevDevice = hidDevice;
        if (hidDevice && hidDevice !== device) {
          await disconnectDevice({ silent: true, preserveInterfaces: true });
        }

        try {
          if (!device.opened) {
            await device.open();
          }
        } catch (err) {
          hidDevice = null;
          addLog('WebHID', `打开设备接口失败: ${err.message}`, 'error');
          if (!silent) {
            showToast(`打开设备失败: ${err.message}`, 'error');
          }
          if (prevDevice && authorizedHidDevices.includes(prevDevice)) {
            activeInterfaceIndex.value = authorizedHidDevices.indexOf(prevDevice);
          }
          return false;
        }

        hidDevice = device;
        hidDevice.addEventListener('inputreport', handleInputReport);

        if (Array.isArray(allDevices) && allDevices.length > 0) {
          syncAvailableInterfaces(allDevices, hidDevice);
        } else {
          const existingIdx = authorizedHidDevices.indexOf(hidDevice);
          if (existingIdx >= 0) {
            activeInterfaceIndex.value = existingIdx;
          } else {
            syncAvailableInterfaces([hidDevice], hidDevice);
          }
        }

        const summary = inspectDeviceCollections(hidDevice);
        const descriptorSummary = formatDescriptorSummary(summary);
        const report06Length = getFeatureReportLength(hidDevice, REPORT_ID_DATA, null);
        const vidHex = `0x${(hidDevice.vendorId || 0).toString(16).padStart(4, '0').toUpperCase()}`;
        const pidHex = `0x${(hidDevice.productId || 0).toString(16).padStart(4, '0').toUpperCase()}`;

        connected.value = true;
        deviceName.value = hidDevice.productName || 'MCHOSE K980';
        deviceInfo.value = {
          productName: deviceName.value,
          vendorIdHex: vidHex,
          productIdHex: pidHex,
          hasConfigReports: summary.hasConfigReports,
          hasVendorUsagePage: summary.hasVendorUsagePage,
          report06Length,
          descriptorSummary,
          collections: summary.collections
        };

        addLog('WebHID', `设备连接成功: ${deviceName.value} (${vidHex}:${pidHex})`, 'info');
        addLog('WebHID', `当前接口描述符: ${descriptorSummary}`, 'info');

        if (!summary.hasConfigReports) {
          addLog(
            'WebHID',
            '提示: 当前接口未显式声明 Feature Report 0x05 & 0x06，若控制失败可在诊断面板切换接口或重选。',
            'info'
          );
        }

        await readKeyboardParams();

        if (!silent) {
          showToast(`已连接 ${deviceName.value}`, 'success');
        }
        return true;
      }

      async function switchInterface(idx) {
        const target = authorizedHidDevices[idx];
        if (!target || target === hidDevice) return;
        addLog('WebHID', `正在切换至 HID 接口 #${idx}...`, 'info');
        const ok = await openAndAttachDevice(target, { silent: false, allDevices: authorizedHidDevices });
        if (!ok) {
          showToast(`切换接口 #${idx} 失败`, 'error');
        }
      }

      async function connectDevice() {
        if (!navigator.hid) {
          showToast('您的浏览器不支持 WebHID API，请使用 Chrome 或 Edge 浏览器！', 'error', 5000);
          return;
        }
        isConnecting.value = true;
        try {
          addLog('WebHID', '正在请求用户授权连接 USB HID 设备...');
          const devices = await navigator.hid.requestDevice({
            filters: [
              { vendorId: VENDOR_ID, productId: PRODUCT_ID },
              { vendorId: VENDOR_ID }
            ]
          });

          if (!devices || devices.length === 0) {
            addLog('WebHID', '未选择任何设备', 'info');
            return;
          }

          let candidateDevices = devices;
          if (typeof navigator.hid.getDevices === 'function') {
            try {
              const allAuthorized = await navigator.hid.getDevices();
              const sameVendor = allAuthorized.filter((d) => d.vendorId === VENDOR_ID);
              const merged = [...devices];
              for (const dev of sameVendor) {
                if (!merged.includes(dev)) merged.push(dev);
              }
              candidateDevices = merged;
            } catch {
              candidateDevices = devices;
            }
          }

          candidateDevices.forEach((dev, idx) => {
            addLog(
              'WebHID',
              `接口 #${idx} (${dev.productName || 'K980'}): ${formatDescriptorSummary(inspectDeviceCollections(dev))}`,
              'info'
            );
          });

          const selected = findBestConfigDevice(candidateDevices);
          addLog(
            'WebHID',
            `共发现 ${candidateDevices.length} 个已授权 HID 接口，优先连接接口 #${candidateDevices.indexOf(selected)}`,
            'info'
          );

          await openAndAttachDevice(selected, { silent: false, allDevices: candidateDevices });
        } catch (err) {
          console.error(err);
          addLog('WebHID', `连接异常: ${err.message}`, 'error');
          showToast(`连接失败: ${err.message}`, 'error');
        } finally {
          isConnecting.value = false;
        }
      }

      async function disconnectDevice({
        silent = false,
        reason = '设备已断开连接',
        preserveInterfaces = false
      } = {}) {
        if (paramDebounceTimer) {
          clearTimeout(paramDebounceTimer);
          paramDebounceTimer = null;
        }
        if (hidDevice) {
          try {
            hidDevice.removeEventListener('inputreport', handleInputReport);
            await hidDevice.close();
          } catch {
            // ignore close error on already detached devices
          }
          hidDevice = null;
        }
        lastConfigPayload = null;
        connected.value = false;
        deviceName.value = '';
        deviceInfo.value = null;
        if (!preserveInterfaces) {
          authorizedHidDevices = [];
          availableInterfaces.value = [];
          activeInterfaceIndex.value = 0;
        }
        addLog('WebHID', reason);
        if (!silent) {
          showToast(reason, 'info');
        }
      }

      function handleHidDisconnect(event) {
        if (hidDevice && event.device === hidDevice) {
          disconnectDevice({
            silent: true,
            reason: '检测到键盘已断开连接'
          });
          showToast('键盘已断开连接（如需配置请确保处于 FN + T 有线模式）', 'warning', 4500);
        }
      }

      async function applyLighting() {
        if (!hidDevice || !connected.value) {
          showToast('请先连接键盘！', 'warning');
          return;
        }

        const mode = currentModeObj.value;
        const modeCode = mode ? mode.code : 1;
        const spd = speed.value;
        const brt = brightness.value;
        const colorObj = presetColors[selectedColorIndex.value];
        const col = colorObj ? colorObj.hwCode : selectedColorIndex.value;
        const modeId = selectedModeId.value;

        try {
          await hidQueue.enqueue(async () => {
            if (!hidDevice || !connected.value) return;

            addLog(
              'TX',
              `配置灯光: 模式 [${mode?.name || modeCode}], 亮度 ${brt}, 速度 ${spd}, 颜色 [${colorObj?.name || col}] (硬件码 0x${col.toString(16).padStart(2, '0')})`,
              'tx'
            );

            const targetSize = getFeatureReportLength(
              hidDevice,
              REPORT_ID_DATA,
              LIGHTING_PAYLOAD_SIZE
            );

            const payload = buildLightingPayload({
              selectedModeId: modeId,
              modeCode,
              brightness: brt,
              speed: spd,
              hwColor: col,
              basePayload: lastConfigPayload,
              payloadSize: targetSize
            });

            await hidDevice.sendFeatureReport(REPORT_ID_DATA, payload);
            lastConfigPayload = payload;
            addLog('TX', `灯效数据下发完成 (Report 0x06: ${payload.length} bytes) ✓`, 'info');
          });
        } catch (err) {
          console.error(err);
          addLog('TX', `灯光配置失败: ${err.message}`, 'error');
          showToast(`灯光配置失败: ${err.message}`, 'error');
        }
      }

      function onParamChange() {
        if (!autoSync.value || !connected.value) return;
        if (paramDebounceTimer) clearTimeout(paramDebounceTimer);
        paramDebounceTimer = setTimeout(() => {
          paramDebounceTimer = null;
          applyLighting();
        }, 100);
      }

      function selectLightMode(m) {
        selectedModeId.value = m.id;
        if (autoSync.value && connected.value) {
          applyLighting();
        }
      }

      function selectPresetColor(idx) {
        selectedColorIndex.value = idx;
        if (autoSync.value && connected.value) {
          applyLighting();
        }
      }

      function saveLightPreset() {
        const modeName = currentModeObj.value?.name || '灯效';
        const colorName = presetColors[selectedColorIndex.value]?.name || '';
        const name = newPresetName.value.trim() || `${modeName}${colorName ? ' · ' + colorName : ''}`;
        lightPresets.value.unshift({
          id: Date.now(),
          name,
          modeId: selectedModeId.value,
          brightness: brightness.value,
          speed: speed.value,
          colorIndex: selectedColorIndex.value
        });
        if (lightPresets.value.length > 12) {
          lightPresets.value.pop();
        }
        newPresetName.value = '';
        showToast(`已保存灯效预设「${name}」`, 'success');
      }

      function applyLightPreset(preset) {
        selectedModeId.value = preset.modeId;
        brightness.value = preset.brightness;
        speed.value = preset.speed;
        selectedColorIndex.value = preset.colorIndex;
        if (connected.value && autoSync.value) {
          applyLighting();
        }
        showToast(`已切换至预设「${preset.name}」`, 'info');
      }

      function deleteLightPreset(id) {
        lightPresets.value = lightPresets.value.filter((p) => p.id !== id);
      }

      function selectKey(k, event) {
        playKeySound();
        const id = k.id;
        const isMulti =
          isMultiSelectMode.value || event?.ctrlKey || event?.metaKey || event?.shiftKey;

        if (isMulti) {
          if (selectedKeyIds.value.has(id)) {
            selectedKeyIds.value.delete(id);
          } else {
            selectedKeyIds.value.add(id);
          }
        } else if (selectedKeyIds.value.size === 1 && selectedKeyIds.value.has(id)) {
          selectedKeyIds.value.clear();
        } else {
          selectedKeyIds.value.clear();
          selectedKeyIds.value.add(id);
        }
      }

      function clearSelection() {
        selectedKeyIds.value.clear();
      }

      function assignFunction(fn) {
        const count = selectedCount.value;
        if (count === 0) {
          showToast('请先在上方键盘模型中点击选择一个或多个按键！', 'warning');
          return;
        }
        const names = selectedLabelsText.value;
        selectedKeysList.value.forEach((k) => {
          previewBindings.value[k.id] = fn.name;
        });
        addLog(
          'Remap',
          `[本地预览方案] 为 ${count} 个按键 (${names}) 标记映射: [${fn.name}] (Code: 0x${fn.code.toString(16)}) — 尚未写入硬件`
        );
        showToast(
          `已记录本地预览方案：${count} 个按键 →「${fn.name}」（BYK916 硬件改键协议尚在逆向适配，暂未写入键盘）`,
          'info',
          4500
        );
      }

      function clearPreviewBindings() {
        previewBindings.value = {};
        showToast('已清空本地预览映射方案', 'info');
      }

      const previewBindingsCount = computed(() => Object.keys(previewBindings.value).length);

      async function copyDiagnostics() {
        const report = {
          generatedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          connected: connected.value,
          deviceInfo: deviceInfo.value,
          allAuthorizedInterfaces: availableInterfaces.value,
          lastConfigPayload: lastConfigPayload
            ? {
                length: lastConfigPayload.length,
                hex: formatHex(lastConfigPayload)
              }
            : null,
          recentLogs: logs.value.slice(-25),
          recentInputReports: inputReportsList.value.slice(0, 15).map((r) => ({
            time: r.time,
            reportId: `0x${r.reportId.toString(16).padStart(2, '0')}`,
            length: r.bytes.length,
            hex: r.hex,
            desc: r.desc
          }))
        };
        const text = JSON.stringify(report, null, 2);

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          showToast('已复制 HID 诊断信息到剪贴板', 'success');
        } catch (err) {
          showToast(`复制失败: ${err.message}`, 'error');
        }
      }

      // 3D 键盘按键分类与实机原装配色映射
      function getKeyColorType(k) {
        const lbl = k.label;
        const ec = k.eventCode || '';
        const kid = k.id;
        if (lbl === 'Esc' || ec === 'Escape') return 'yellow';
        if (
          kid === 'K65' ||
          kid === 'K96' ||
          lbl === 'Enter' ||
          ec === 'Enter' ||
          ec === 'NumpadEnter'
        ) {
          return 'yellow';
        }
        if (lbl === 'Space' || ec === 'Space') return 'yellow';
        if (
          ['Up', 'Down', 'Left', 'Right'].includes(lbl) ||
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ec)
        ) {
          return 'yellow';
        }
        if (
          [
            'F5', 'F6', 'F7', 'F8',
            'Delete', 'Home', 'End', 'PgUp', 'PgDn',
            'Backspace', '\\', 'Tab', 'CapsLock',
            'LShift', 'RShift', 'LCtrl', 'Rcrtl', 'LWin', 'LAlt', 'RAlt', 'Fn',
            'NumLock', 'Num /', 'Num*', 'Num-', 'Num+'
          ].includes(lbl)
        ) {
          return 'blue';
        }
        return 'white';
      }

      function getKeyBaseColor(k) {
        if (pressedKeys.value[k.eventCode]) return '#0284c7';
        if (isKeySelected(k)) return '#0369a1';

        if (keycapTheme.value === 'retro') {
          const type = getKeyColorType(k);
          if (type === 'yellow') return '#b45309';
          if (type === 'blue') return '#0f172a';
          return '#94a3b8';
        }
        if (testedKeys.value[k.eventCode]) return '#1e293b';
        return '#090d16';
      }

      function getKeyTopFill(k) {
        if (pressedKeys.value[k.eventCode]) return 'url(#cap-pressed)';
        if (isKeySelected(k)) return 'url(#cap-selected)';

        if (keycapTheme.value === 'retro') {
          const type = getKeyColorType(k);
          if (type === 'yellow') return 'url(#cap-yellow)';
          if (type === 'blue') return 'url(#cap-blue)';
          return 'url(#cap-white)';
        }
        if (testedKeys.value[k.eventCode]) return '#334155';
        return 'url(#cap-dark)';
      }

      function getKeyTopStroke(k) {
        if (pressedKeys.value[k.eventCode]) return '#7dd3fc';
        if (isKeySelected(k)) return '#38bdf8';

        if (keycapTheme.value === 'retro') {
          if (testedKeys.value[k.eventCode]) return '#10b981';
          const type = getKeyColorType(k);
          if (type === 'yellow') return '#f59e0b';
          if (type === 'blue') return '#475569';
          return '#cbd5e1';
        }
        if (testedKeys.value[k.eventCode]) return '#475569';
        return '#1e293b';
      }

      function getKeyTextColor(k) {
        if (pressedKeys.value[k.eventCode] || isKeySelected(k)) return '#ffffff';

        if (keycapTheme.value === 'retro') {
          const type = getKeyColorType(k);
          if (type === 'yellow') return '#78350f';
          if (type === 'blue') return '#f8fafc';
          return '#1e293b';
        }
        if (testedKeys.value[k.eventCode]) return '#38bdf8';
        return '#94a3b8';
      }

      function getKeyFontSize(k) {
        const txt = formatLabel(k.label);
        if (txt.length >= 7) return 7;
        if (txt.length >= 5) return 8;
        if (txt.length >= 3) return 9.5;
        if (txt.length === 1 && !isNaN(txt)) return 11.5;
        return 10.5;
      }

      function formatLabel(lbl) {
        if (lbl === 'Backspace') return '⌫';
        if (lbl === 'CapsLock') return 'Caps';
        if (lbl === 'LShift' || lbl === 'RShift') return 'Shift';
        if (lbl === 'LCtrl' || lbl === 'Rcrtl') return 'Ctrl';
        if (lbl === 'LAlt' || lbl === 'RAlt') return 'Alt';
        if (lbl === 'LWin') return 'Win';
        if (lbl === 'Enter') return '↵';
        if (lbl === 'Up') return '▲';
        if (lbl === 'Down') return '▼';
        if (lbl === 'Left') return '◀';
        if (lbl === 'Right') return '▶';
        if (lbl === 'Space') return '——';
        if (lbl === 'NumLock') return 'Num';
        if (lbl === 'Num /') return '/';
        if (lbl === 'Num*') return '*';
        if (lbl === 'Num-') return '-';
        if (lbl === 'Num+') return '+';
        if (lbl === 'Num .') return '.';
        if (lbl.startsWith('Num')) return lbl.replace('Num', '');
        return lbl;
      }

      function resetTestState() {
        testedKeys.value = {};
        pressedKeys.value = {};
        keystrokeCount.value = 0;
      }

      function isEditableElementFocused() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return true;
        if (tag === 'INPUT') {
          const inputType = (el.getAttribute('type') || 'text').toLowerCase();
          return !['checkbox', 'radio', 'range', 'button', 'submit', 'reset'].includes(inputType);
        }
        return false;
      }

      function handleKeyDown(e) {
        if (isEditableElementFocused()) return;

        if (interceptShortcuts.value) {
          e.preventDefault();
        }

        const code = e.code;
        if (!pressedKeys.value[code]) {
          keystrokeCount.value++;
          playKeySound();
        }
        pressedKeys.value[code] = true;
        testedKeys.value[code] = true;

        if (typeof e.getModifierState === 'function') {
          capsLockActive.value = e.getModifierState('CapsLock');
          numLockActive.value = e.getModifierState('NumLock');
        }
      }

      function handleKeyUp(e) {
        const code = e.code;
        delete pressedKeys.value[code];
        if (typeof e.getModifierState === 'function') {
          capsLockActive.value = e.getModifierState('CapsLock');
          numLockActive.value = e.getModifierState('NumLock');
        }
      }

      function handleWindowBlur() {
        pressedKeys.value = {};
      }

      onMounted(async () => {
        applyTheme();
        if (mediaQuery) {
          try {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
          } catch {
            mediaQuery.addListener(handleSystemThemeChange);
          }
        }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);

        if (navigator.hid) {
          navigator.hid.addEventListener('disconnect', handleHidDisconnect);
          try {
            const authorized = await navigator.hid.getDevices();
            const k980Devices = authorized.filter((d) => d.vendorId === VENDOR_ID);
            if (k980Devices.length > 0) {
              k980Devices.forEach((dev, idx) => {
                addLog(
                  'WebHID',
                  `已授权接口 #${idx} (${dev.productName || 'K980'}): ${formatDescriptorSummary(inspectDeviceCollections(dev))}`,
                  'info'
                );
              });
              const best = findBestConfigDevice(k980Devices);
              addLog('WebHID', '检测到已授权的 K980 设备，尝试自动重连...', 'info');
              await openAndAttachDevice(best, { silent: true, allDevices: k980Devices });
            }
          } catch (err) {
            addLog('WebHID', `自动重连检查跳过: ${err.message}`, 'info');
          }
        }

        addLog('System', '迈从 K980 WebHID 控制中心已就绪');
      });

      onUnmounted(() => {
        if (mediaQuery) {
          try {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
          } catch {
            mediaQuery.removeListener(handleSystemThemeChange);
          }
        }
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
        if (navigator.hid) {
          navigator.hid.removeEventListener('disconnect', handleHidDisconnect);
        }
        toastTimers.forEach((timer) => clearTimeout(timer));
        toastTimers.clear();
        keyAudio.dispose();
        if (hidDevice) {
          disconnectDevice({ silent: true });
        }
      });

      return {
        connected,
        isConnecting,
        deviceName,
        deviceInfo,
        availableInterfaces,
        activeInterfaceIndex,
        switchInterface,
        activeTab,
        audioFeedback,
        autoSync,
        interceptShortcuts,
        themeMode,
        setTheme,
        keycapTheme,
        capsLockActive,
        numLockActive,
        keys,
        isMultiSelectMode,
        selectedKeyIds,
        selectedCount,
        selectedKeysList,
        selectedLabelsText,
        firstSelectedKey,
        previewBindings,
        previewBindingsCount,
        getKeyDisplayName,
        isKeySelected,
        clearSelection,
        pressedKeys,
        testedKeys,
        keystrokeCount,
        lightModes,
        selectedModeId,
        brightness,
        speed,
        presetColors,
        selectedColorIndex,
        currentModeObj,
        newPresetName,
        lightPresets,
        saveLightPreset,
        applyLightPreset,
        deleteLightPreset,
        mediaKeys,
        systemKeys,
        mouseKeys,
        firmwareVer,
        inputReportCount,
        inputReportsList,
        clearInputReports,
        copyDiagnostics,
        logs,
        toasts,
        dismissToast,
        connectDevice,
        disconnectDevice,
        applyLighting,
        onParamChange,
        selectLightMode,
        selectPresetColor,
        selectKey,
        assignFunction,
        clearPreviewBindings,
        getKeyBaseColor,
        getKeyTopFill,
        getKeyTopStroke,
        getKeyTextColor,
        getKeyFontSize,
        formatLabel,
        resetTestState,
        clearLogs
      };
    }
  }).mount('#app');
}
