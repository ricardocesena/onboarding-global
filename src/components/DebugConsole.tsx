import { useState, useEffect, useMemo } from 'react'
import {
  type ApiCallRecord,
  getApiCalls,
  subscribeToApiCalls,
} from '../services/api'

/* ─── Screen-to-API mapping ─── */
const SCREEN_API_MAP: Record<string, { apis: string[]; description: string } | null> = {
  'cookies': null,
  'geolocation': null,
  'geolocation-denied': null,
  'location-not-mexico': null,
  'eligibility-check': null,
  'eligibility-info': null,
  'persona-moral-block': null,
  'curp-input': null,
  'curp-data': {
    apis: ['POST /api/watchlist-screening/validate-status'],
    description: 'Valida contra listas AML con datos del CURP (nombre, documento, fecha nacimiento)',
  },
  'curp-error': null,
  'curp-minor-block': null,
  'curp-max-block': null,
  'terms': null,
  'phone-input': {
    apis: ['POST /api/fraud/evaluate'],
    description: 'Evalua el numero de telefono contra fraude',
  },
  'otp-input': null,
  'product-selection': null,
  'personal-about': null,
  'pep-block': null,
  'pep-detail': null,
  'business-info': {
    apis: ['POST /api/economic-activities/retrieve'],
    description: 'Busca actividades economicas por descripcion',
  },
  'restricted-block': null,
  'idv-guide': null,
  'idv-selfie': null,
  'idv-success': null,
  'idv-fail': null,
  'doc-upload': {
    apis: ['POST /api/document-management/upload'],
    description: 'Sube documentos (Constancia Fiscal, Comprobante Domicilio) al gestor documental',
  },
  'doc-extracting': null,
  'doc-confirm': {
    apis: ['GET /api/administrative-geographies/districts'],
    description: 'Obtiene colonias/distritos por codigo postal para validar direccion',
  },
  'doc-error': null,
  'doc-max-block': null,
  'doc-permission': null,
  'branch-search': {
    apis: ['POST /api/service-points/search-by-geolocation'],
    description: 'Busca sucursales cercanas por geolocalizacion y radio',
  },
  'card-address': null,
  'beneficiaries': null,
  'beneficiary-add': null,
  'contract-docs': {
    apis: ['POST /api/document-composer/compose'],
    description: 'Genera documentos contractuales a partir de templates',
  },
  'contract-efirma': null,
  'contract-manual': null,
  'contract-timeout': null,
  'contract-success': {
    apis: [
      'POST /api/customers',
      'POST /api/accounts',
      'POST /api/cards',
      'POST /api/kyc/risk-score',
      'POST /api/channel-access/:agreementId/unblock',
      'POST /api/customer-contact-points/:customerId/contact-points',
    ],
    description: 'Alta completa: crea cliente, cuenta, tarjeta, evalua KYC, desbloquea canales y registra contacto',
  },
  'app-submitted': null,
  'recovery': null,
  'recovery-not-found': null,
  'error-generic': null,
  'exit-modal': null,
}

/* Also track catalog APIs loaded on mount */
const MOUNT_APIS = {
  apis: ['GET /api/countries', 'GET /api/party-parameters/civil_status'],
  description: 'Catalogos cargados al iniciar la app (paises, estado civil)',
}

function StatusBadge({ status }: { status: number }) {
  const color = status >= 200 && status < 300
    ? 'bg-green-100 text-green-800'
    : status >= 400 && status < 500
      ? 'bg-yellow-100 text-yellow-800'
      : status >= 500
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${color}`}>
      {status || 'ERR'}
    </span>
  )
}

function JsonBlock({ data, label }: { data: unknown; label: string }) {
  const [expanded, setExpanded] = useState(false)
  const jsonStr = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }, [data])

  const preview = jsonStr.length > 80 ? jsonStr.slice(0, 80) + '...' : jsonStr

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <span className="font-mono">{expanded ? '\u25BC' : '\u25B6'}</span>
        {label}
      </button>
      {expanded ? (
        <pre className="mt-1 p-2 bg-gray-900 text-green-400 rounded text-[10px] leading-tight overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all font-mono">
          {jsonStr}
        </pre>
      ) : (
        <pre className="mt-0.5 text-[10px] text-gray-500 font-mono truncate">
          {preview}
        </pre>
      )}
    </div>
  )
}

function ApiCallEntry({ call }: { call: ApiCallRecord }) {
  const time = new Date(call.timestamp).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className="border border-gray-200 rounded-lg p-2.5 space-y-1 bg-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            call.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {call.method}
          </span>
          <span className="text-[11px] font-mono text-gray-700 truncate">{call.endpoint}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={call.status} />
          <span className="text-[10px] text-gray-400">{call.duration}ms</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <span>{time}</span>
        <span className="bg-gray-100 px-1 py-0.5 rounded">{call.screen}</span>
      </div>
      {call.requestData ? <JsonBlock data={call.requestData} label="Request Body" /> : null}
      {call.responseData ? <JsonBlock data={call.responseData} label="Response" /> : null}
      {call.error && (
        <p className="text-[10px] text-red-600 mt-1">Error: {call.error}</p>
      )}
    </div>
  )
}

interface DebugConsoleProps {
  currentScreen: string;
}

export default function DebugConsole({ currentScreen }: DebugConsoleProps) {
  const [apiCalls, setApiCalls] = useState<ApiCallRecord[]>(getApiCalls())
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [collapsed, setCollapsed] = useState(false)
  const [selectedScreen, setSelectedScreen] = useState<string>('')

  useEffect(() => {
    const unsub = subscribeToApiCalls(setApiCalls)
    return unsub
  }, [])

  // Get API info for current screen
  const screenApiInfo = SCREEN_API_MAP[currentScreen] ?? null
  const hasApi = screenApiInfo !== null

  // Filter calls for current screen
  const currentScreenCalls = useMemo(
    () => apiCalls.filter(c => c.screen === currentScreen),
    [apiCalls, currentScreen]
  )

  // Get all unique screens that have API calls (for history tab)
  const screensWithCalls = useMemo(() => {
    const screens = new Map<string, number>()
    for (const call of apiCalls) {
      screens.set(call.screen, (screens.get(call.screen) || 0) + 1)
    }
    return Array.from(screens.entries())
  }, [apiCalls])

  // Filter calls for selected history screen
  const historyCalls = useMemo(
    () => selectedScreen ? apiCalls.filter(c => c.screen === selectedScreen) : apiCalls,
    [apiCalls, selectedScreen]
  )

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-2 left-2 z-50 bg-gray-900 text-green-400 text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-gray-800 font-mono flex items-center gap-1.5"
      >
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Debug Console
        {apiCalls.length > 0 && (
          <span className="bg-green-900 text-green-300 px-1.5 py-0.5 rounded-full text-[10px]">
            {apiCalls.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="w-[420px] flex-shrink-0 bg-gray-50 border-l border-gray-300 flex flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="font-mono text-sm font-bold">Debug Console</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-mono">
            {apiCalls.length} calls
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-white text-xs px-1"
            title="Minimizar"
          >
            _
          </button>
        </div>
      </div>

      {/* Current screen info */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pantalla actual</span>
          <span className="font-mono text-xs bg-gray-800 text-green-400 px-2 py-0.5 rounded">{currentScreen}</span>
        </div>
        {hasApi ? (
          <div className="mt-1.5">
            <p className="text-[11px] text-gray-600">{screenApiInfo.description}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {screenApiInfo.apis.map(api => (
                <span key={api} className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                  {api}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-[11px] text-gray-500 italic">
              Esta pantalla no esta integrada con ninguna API
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 flex-shrink-0">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 text-xs font-semibold py-2 transition ${
            activeTab === 'current'
              ? 'text-red-600 border-b-2 border-red-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pantalla actual ({currentScreenCalls.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 text-xs font-semibold py-2 transition ${
            activeTab === 'history'
              ? 'text-red-600 border-b-2 border-red-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Historial ({apiCalls.length})
        </button>
      </div>

      {/* Mount catalogs banner */}
      {activeTab === 'current' && (
        <div className="bg-blue-50 border-b border-blue-200 px-3 py-1.5 flex-shrink-0">
          <p className="text-[10px] text-blue-700 font-semibold">
            Catalogos al inicio: {MOUNT_APIS.apis.join(', ')}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {activeTab === 'current' ? (
          currentScreenCalls.length > 0 ? (
            currentScreenCalls.map(call => (
              <ApiCallEntry key={call.id} call={call} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400">
                {hasApi
                  ? 'Esperando llamada a API...'
                  : 'Sin integracion API en esta pantalla'
                }
              </p>
            </div>
          )
        ) : (
          <>
            {/* Screen filter for history */}
            <div className="sticky top-0 bg-gray-50 pb-2 z-10">
              <select
                value={selectedScreen}
                onChange={e => setSelectedScreen(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:border-red-600 focus:outline-none"
              >
                <option value="">Todas las pantallas</option>
                {screensWithCalls.map(([scr, count]) => (
                  <option key={scr} value={scr}>
                    {scr} ({count} {count === 1 ? 'llamada' : 'llamadas'})
                  </option>
                ))}
              </select>
            </div>
            {historyCalls.length > 0 ? (
              historyCalls.map(call => (
                <ApiCallEntry key={call.id} call={call} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400">
                  No hay llamadas a API registradas aun
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
