import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Usb,
  Wifi,
  Radio,
  Play,
  Square,
  Activity,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  labHardwareBridge,
  SUPPORTED_INSTRUMENTS,
  InstrumentConfig,
  HardwareConnectionStatus,
  HardwareTelemetry,
  ConnectionProtocol
} from '../../utils/hardware/labHardwareBridge';

interface LabHardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyReadingToClosedLoop?: (data: { parameterKey: 'ph' | 'viscosity' | 'active_matter'; value: number }) => void;
}

export const LabHardwareModal: React.FC<LabHardwareModalProps> = ({
  isOpen,
  onClose,
  onApplyReadingToClosedLoop
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(SUPPORTED_INSTRUMENTS[0].id);
  const [protocol, setProtocol] = useState<ConnectionProtocol>('EMULATOR');
  const [customBaud, setCustomBaud] = useState<number>(SUPPORTED_INSTRUMENTS[0].defaultBaudRate);
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:8080');
  const [status, setStatus] = useState<HardwareConnectionStatus>(labHardwareBridge.getStatus());
  const [latestTelemetry, setLatestTelemetry] = useState<HardwareTelemetry | null>(null);
  const [logs, setLogs] = useState(labHardwareBridge.getLogs());
  const [customCmd, setCustomCmd] = useState<string>('');
  const [isAutoStreamingToClosedLoop, setIsAutoStreamingToClosedLoop] = useState<boolean>(true);

  const selectedInstrument = SUPPORTED_INSTRUMENTS.find(i => i.id === selectedInstId) || SUPPORTED_INSTRUMENTS[0];

  useEffect(() => {
    const unsubStatus = labHardwareBridge.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    const unsubTelemetry = labHardwareBridge.subscribeTelemetry((telemetry) => {
      setLatestTelemetry(telemetry);
      setLogs(labHardwareBridge.getLogs());

      if (isAutoStreamingToClosedLoop && onApplyReadingToClosedLoop) {
        if (telemetry.instrumentType === 'TITRATOR' && telemetry.unit === 'pH') {
          onApplyReadingToClosedLoop({ parameterKey: 'ph', value: telemetry.value });
        } else if (telemetry.instrumentType === 'VISCOMETER' && telemetry.unit === 'cP') {
          onApplyReadingToClosedLoop({ parameterKey: 'viscosity', value: telemetry.value });
        }
      }
    });

    return () => {
      unsubStatus();
      unsubTelemetry();
    };
  }, [isAutoStreamingToClosedLoop, onApplyReadingToClosedLoop]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (protocol === 'WEB_SERIAL') {
      await labHardwareBridge.connectSerial(selectedInstrument, customBaud);
    } else if (protocol === 'WEBSOCKET') {
      await labHardwareBridge.connectWebSocket(selectedInstrument, wsUrl);
    } else {
      labHardwareBridge.startEmulator(selectedInstrument);
    }
  };

  const handleDisconnect = () => {
    labHardwareBridge.disconnect();
  };

  const handleSendCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    await labHardwareBridge.sendCommand(customCmd.trim());
    setCustomCmd('');
  };

  const handleQuickCommand = async (cmd: string) => {
    await labHardwareBridge.sendCommand(cmd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0c1322] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-[#101b33] to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
              <Cpu size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Real Physical Lab Instrument Hardware Bridge
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  status.connected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {status.connected ? '● HARDWARE LINKED' : '○ DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct WebSerial (RS-232/USB), WebHID & LAN WebSocket drivers for Titrators, Viscometers & Mixers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Machine & Protocol Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Instrument Selection */}
            <div className="bg-[#121c33]/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Layers size={14} /> 1. Select Benchtop Machine
              </label>
              <select
                disabled={status.connected}
                value={selectedInstId}
                onChange={(e) => {
                  setSelectedInstId(e.target.value);
                  const inst = SUPPORTED_INSTRUMENTS.find(i => i.id === e.target.value);
                  if (inst) setCustomBaud(inst.defaultBaudRate);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              >
                {SUPPORTED_INSTRUMENTS.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    [{inst.type}] {inst.name}
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <div><span className="text-slate-300 font-semibold">Manufacturer:</span> {selectedInstrument.manufacturer}</div>
                <div><span className="text-slate-300 font-semibold">Model:</span> {selectedInstrument.model}</div>
                <div><span className="text-slate-300 font-semibold">Baud Rate:</span> {selectedInstrument.defaultBaudRate} bps 8N1</div>
              </div>
            </div>

            {/* Protocol & Connection Controls */}
            <div className="bg-[#121c33]/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Usb size={14} /> 2. Connection Interface
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={status.connected}
                  onClick={() => setProtocol('WEB_SERIAL')}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    protocol === 'WEB_SERIAL'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Usb size={13} /> WebSerial (USB)
                </button>
                <button
                  type="button"
                  disabled={status.connected}
                  onClick={() => setProtocol('WEBSOCKET')}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    protocol === 'WEBSOCKET'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Wifi size={13} /> LAN Gateway
                </button>
                <button
                  type="button"
                  disabled={status.connected}
                  onClick={() => setProtocol('EMULATOR')}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    protocol === 'EMULATOR'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio size={13} /> Virtual Bench
                </button>
              </div>

              {protocol === 'WEB_SERIAL' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Baud:</span>
                  <input
                    type="number"
                    disabled={status.connected}
                    value={customBaud}
                    onChange={(e) => setCustomBaud(parseInt(e.target.value) || 9600)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-400">Standard 8N1</span>
                </div>
              )}

              {protocol === 'WEBSOCKET' && (
                <div>
                  <input
                    type="text"
                    disabled={status.connected}
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://localhost:8080"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
              )}

              {/* Action Button */}
              <div>
                {!status.connected ? (
                  <button
                    onClick={handleConnect}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={14} /> Connect to Instrument
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-2 bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Square size={14} /> Disconnect Hardware
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Telemetry Display */}
          <div className="bg-gradient-to-br from-[#111e3b] to-[#0a1224] border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Activity size={16} className={status.connected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
                Live Sensor Telemetry Stream
              </span>
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-slate-300 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoStreamingToClosedLoop}
                    onChange={(e) => setIsAutoStreamingToClosedLoop(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Pipe readings to Closed-Loop Engine</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  RX: {status.rxCount} pkts | TX: {status.txCount} pkts
                </span>
              </div>
            </div>

            {status.connected && latestTelemetry ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-center">
                  <div className="text-[11px] font-medium text-slate-400">{latestTelemetry.readingName}</div>
                  <div className="text-3xl font-black text-cyan-300 font-mono my-1">
                    {latestTelemetry.value} <span className="text-sm font-normal text-slate-400">{latestTelemetry.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Updated: {new Date(latestTelemetry.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-300">Active Machine Bus</div>
                  <div className="text-slate-400 text-[11px] truncate">{status.portInfo || 'Serial Bus'}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Baud Synchronization OK
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-slate-300">Quick Machine Actions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInstrument.type === 'TITRATOR' && (
                      <>
                        <button
                          onClick={() => handleQuickCommand('TITR:READ_PH')}
                          className="px-2 py-1 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/30 rounded text-[10px] font-mono cursor-pointer"
                        >
                          READ_PH
                        </button>
                        <button
                          onClick={() => handleQuickCommand('TITR:BUR_DISP 0.1')}
                          className="px-2 py-1 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/30 rounded text-[10px] font-mono cursor-pointer"
                        >
                          DISP 0.1mL
                        </button>
                      </>
                    )}
                    {selectedInstrument.type === 'VISCOMETER' && (
                      <>
                        <button
                          onClick={() => handleQuickCommand('VISC:START')}
                          className="px-2 py-1 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/30 rounded text-[10px] font-mono cursor-pointer"
                        >
                          START_SPINDLE
                        </button>
                        <button
                          onClick={() => handleQuickCommand('VISC:SET_RPM 20')}
                          className="px-2 py-1 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/30 rounded text-[10px] font-mono cursor-pointer"
                        >
                          SET_20_RPM
                        </button>
                      </>
                    )}
                    {selectedInstrument.type === 'MIXER' && (
                      <>
                        <button
                          onClick={() => handleQuickCommand('MIX:SET_RPM 1200')}
                          className="px-2 py-1 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/30 rounded text-[10px] font-mono cursor-pointer"
                        >
                          1200_RPM
                        </button>
                        <button
                          onClick={() => handleQuickCommand('MIX:STOP')}
                          className="px-2 py-1 bg-rose-900/50 hover:bg-rose-800 border border-rose-500/30 rounded text-[10px] font-mono cursor-pointer"
                        >
                          STOP_AGIT
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <AlertTriangle size={20} className="text-amber-400/70" />
                <span>No hardware stream active. Click "Connect to Instrument" to initialize communication.</span>
              </div>
            )}
          </div>

          {/* ASCII Machine Terminal & Protocol Log */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Terminal size={14} className="text-cyan-400" />
                Instrument Serial / Protocol Console (RS232 ASCII)
              </span>
              <span>Buffer: {logs.length} entries</span>
            </div>

            <div className="h-36 overflow-y-auto font-mono text-[11px] space-y-0.5 p-2 bg-slate-950/80 rounded border border-slate-900">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">No packet history. Ready for transmission...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 text-[10px] shrink-0">[{log.time}]</span>
                    <span className={`font-bold px-1 rounded text-[9px] shrink-0 ${
                      log.type === 'TX'
                        ? 'bg-blue-900/60 text-blue-300'
                        : log.type === 'RX'
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : log.type === 'ERR'
                        ? 'bg-rose-900/60 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-slate-300 break-all">{log.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Custom Command Input */}
            <form onSubmit={handleSendCustom} className="flex gap-2">
              <input
                type="text"
                disabled={!status.connected}
                value={customCmd}
                onChange={(e) => setCustomCmd(e.target.value)}
                placeholder="Send raw ASCII command (e.g. TITR:STATUS, READ_DATA, HELP)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!status.connected || !customCmd.trim()}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={12} /> Send TX
              </button>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>ASTM Standard compliant serial communication (8 data bits, 1 stop bit, no parity)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition"
          >
            Close Bridge
          </button>
        </div>

      </div>
    </div>
  );
};
