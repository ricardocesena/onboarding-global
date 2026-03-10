import { useState, useEffect, useCallback } from 'react'
import './App.css'
import {
  CheckCircle2, AlertCircle, MapPin, Upload, User,
  Building2, CreditCard, FileCheck, ChevronLeft, X, Search,
  Eye, Shield, Clock, Loader2
} from 'lucide-react'

/* ─── Types ─── */
type Screen =
  | 'cookies'
  | 'geolocation' | 'geolocation-denied' | 'location-not-mexico'
  | 'eligibility-check' | 'eligibility-info' | 'persona-moral-block'
  | 'curp-input' | 'curp-data' | 'curp-error' | 'curp-minor-block' | 'curp-max-block'
  | 'terms'
  | 'phone-input' | 'otp-input'
  | 'product-selection'
  | 'personal-about' | 'pep-block' | 'pep-detail'
  | 'business-info' | 'restricted-block'
  | 'idv-guide' | 'idv-selfie' | 'idv-success' | 'idv-fail'
  | 'doc-upload' | 'doc-extracting' | 'doc-confirm' | 'doc-error' | 'doc-max-block' | 'doc-permission'
  | 'branch-search' | 'card-address'
  | 'beneficiaries' | 'beneficiary-add'
  | 'contract-docs' | 'contract-efirma' | 'contract-manual' | 'contract-success' | 'contract-timeout'
  | 'app-submitted'
  | 'recovery' | 'recovery-not-found'
  | 'exit-modal'
  | 'error-generic'

interface Beneficiary {
  name: string; paternalSurname: string; maternalSurname: string;
  dob: string; rfc: string; percentage: number;
}

interface AppState {
  cookiesAccepted: boolean | null;
  locationGranted: boolean | null;
  isClient: boolean | null;
  curp: string;
  extractedName: string; extractedGender: string; extractedDob: string;
  extractedNationality: string;
  termsAccepted: boolean; privacyAccepted: boolean; contractAccepted: boolean;
  phone: string; otp: string;
  selectedProduct: string;
  isPEP: boolean | null;
  sourceOfFunds: string; accountUsage: string;
  isRestrictedActivity: boolean | null;
  hasForeignTax: boolean | null;
  fiscalUploaded: boolean; domicilioUploaded: boolean;
  extractedRegimen: string; extractedActivity: string; extractedAddress: string;
  selectedBranch: string;
  cardAddress: string;
  beneficiaries: Beneficiary[];
  efirmaUploaded: boolean; manualSigned: boolean;
  eligible: boolean;
}

const initialState: AppState = {
  cookiesAccepted: null,
  locationGranted: null,
  isClient: null,
  curp: '',
  extractedName: '', extractedGender: '', extractedDob: '',
  extractedNationality: '',
  termsAccepted: false, privacyAccepted: false, contractAccepted: false,
  phone: '', otp: '',
  selectedProduct: '',
  isPEP: null,
  sourceOfFunds: '', accountUsage: '',
  isRestrictedActivity: null,
  hasForeignTax: null,
  fiscalUploaded: false, domicilioUploaded: false,
  extractedRegimen: '', extractedActivity: '', extractedAddress: '',
  selectedBranch: '',
  cardAddress: '',
  beneficiaries: [],
  efirmaUploaded: false, manualSigned: false,
  eligible: false,
}

/* ─── Simulated scenarios toggle panel ─── */
interface ScenarioConfig {
  locationInMexico: boolean;
  curpValid: boolean;
  curpIsMinor: boolean;
  curpBirthMexico: boolean;
  idvSuccess: boolean;
  docUploadSuccess: boolean;
  docDataCorrect: boolean;
  signatureTimeout: boolean;
  riskLevel: string;
  transmitOk: boolean;
  existingProcess: boolean;
}

const defaultScenarios: ScenarioConfig = {
  locationInMexico: true,
  curpValid: true,
  curpIsMinor: false,
  curpBirthMexico: true,
  idvSuccess: true,
  docUploadSuccess: true,
  docDataCorrect: true,
  signatureTimeout: false,
  riskLevel: 'A1',
  transmitOk: true,
  existingProcess: false,
}

/* ─── Progress steps ─── */
const STEPS = [
  'Información básica',
  'Producto',
  'Registro personal',
  'Documentos',
  'Personalización',
  'Contrato y firmas',
]

function getStepIndex(screen: Screen): number {
  if (['cookies','geolocation','geolocation-denied','location-not-mexico',
       'eligibility-check','eligibility-info','persona-moral-block',
       'curp-input','curp-data','curp-error','curp-minor-block','curp-max-block',
       'terms','phone-input','otp-input'].includes(screen)) return 0
  if (['product-selection'].includes(screen)) return 1
  if (['personal-about','pep-block','pep-detail','business-info','restricted-block',
       'idv-guide','idv-selfie','idv-success','idv-fail'].includes(screen)) return 2
  if (['doc-upload','doc-extracting','doc-confirm','doc-error','doc-max-block','doc-permission'].includes(screen)) return 3
  if (['branch-search','card-address','beneficiaries','beneficiary-add'].includes(screen)) return 4
  if (['contract-docs','contract-efirma','contract-manual','contract-success','contract-timeout'].includes(screen)) return 5
  return 0
}

function App() {
  const [screen, setScreen] = useState<Screen>('cookies')
  const [state, setState] = useState<AppState>(initialState)
  const [scenarios, setScenarios] = useState<ScenarioConfig>(defaultScenarios)
  const [showScenarios, setShowScenarios] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [curpAttempts, setCurpAttempts] = useState(0)
  const [idvAttempts, setIdvAttempts] = useState(0)
  const [docAttempts, setDocAttempts] = useState(0)
  const [_signTimer] = useState(30)
  void _signTimer
  const [history, setHistory] = useState<Screen[]>([])

  // Temp form fields
  const [tempCurp, setTempCurp] = useState('')
  const [tempPhone, setTempPhone] = useState('')
  const [tempOtp, setTempOtp] = useState('')
  const [tempBen, setTempBen] = useState<Beneficiary>({
    name: '', paternalSurname: '', maternalSurname: '', dob: '', rfc: '', percentage: 0
  })
  const [tempSearch, setTempSearch] = useState('')

  const navigate = useCallback((next: Screen) => {
    setHistory(h => [...h, screen])
    setScreen(next)
  }, [screen])

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setHistory(h => h.slice(0, -1))
      setScreen(prev)
    }
  }, [history])

  const resetAll = useCallback(() => {
    setState(initialState)
    setScreen('cookies')
    setHistory([])
    setCurpAttempts(0)
    setIdvAttempts(0)
    setDocAttempts(0)
    setShowExitModal(false)
  }, [])

  const currentStep = getStepIndex(screen)

  // Auto-advance from doc-extracting after 2s (must be top-level hook)
  useEffect(() => {
    if (screen !== 'doc-extracting') return
    const t = setTimeout(() => navigate('doc-confirm'), 2000)
    return () => clearTimeout(t)
  }, [screen, navigate])

  /* ─── Phone wrapper ─── */
  const Shell = ({ children, title, showBack, showProgress }: {
    children: React.ReactNode; title?: string; showBack?: boolean; showProgress?: boolean;
  }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-2 sm:p-4">
      {/* Scenario toggle */}
      <button
        onClick={() => setShowScenarios(!showScenarios)}
        className="fixed top-2 right-2 z-50 bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-lg hover:bg-gray-700"
      >
        {showScenarios ? 'Cerrar Escenarios' : 'Escenarios'}
      </button>

      {showScenarios && (
        <div className="fixed top-10 right-2 z-50 bg-white rounded-lg shadow-2xl p-4 w-72 max-h-96 overflow-y-auto border">
          <h3 className="font-bold text-sm mb-3">Configuración de Escenarios</h3>
          <div className="space-y-2 text-xs">
            {Object.entries(scenarios).map(([key, val]) => (
              <label key={key} className="flex items-center justify-between gap-2">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                {typeof val === 'boolean' ? (
                  <input type="checkbox" checked={val}
                    onChange={(e) => setScenarios({...scenarios, [key]: e.target.checked})} />
                ) : (
                  <input type="text" value={val as string} className="w-16 border rounded px-1"
                    onChange={(e) => setScenarios({...scenarios, [key]: e.target.value})} />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative" style={{ minHeight: '700px', maxHeight: '90vh' }}>
        {/* Status bar */}
        <div className="bg-white px-5 pt-2 pb-1 flex justify-between items-center text-xs font-semibold text-gray-800">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-gray-800 rounded-full" />
            <div className="w-1 h-1 bg-gray-800 rounded-full" />
            <div className="w-1 h-1 bg-gray-800 rounded-full" />
          </div>
        </div>

        {/* Header */}
        <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
          {showBack && (
            <button onClick={goBack} className="hover:bg-red-700 rounded-full p-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <span className="font-bold text-sm tracking-wider">SANTANDER</span>
          {title && <span className="text-xs opacity-80 ml-auto">{title}</span>}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? 'bg-red-600' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{STEPS[currentStep]}</p>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-1" style={{ maxHeight: showProgress ? 'calc(90vh - 130px)' : 'calc(90vh - 95px)' }}>
          {children}
        </div>
      </div>

      {/* Exit modal overlay */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 space-y-4 max-w-xs w-full">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Salir del proceso de registro</h3>
              <button onClick={() => setShowExitModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-700">¿Estás seguro? Tu progreso se perderá.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={resetAll}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold text-sm">
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const RedButton = ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}
      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm">
      {children}
    </button>
  )

  const OutlineButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}
      className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-red-600 hover:text-red-600 transition text-sm">
      {children}
    </button>
  )

  const LinkButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} className="w-full text-red-600 py-2 font-semibold hover:underline text-sm">
      {children}
    </button>
  )

  const BlockScreen = ({ title, message, onExit }: { title: string; message: string; onExit?: () => void }) => (
    <Shell showBack>
      <div className="p-5 space-y-6 flex flex-col items-center text-center pt-10">
        <AlertCircle className="w-16 h-16 text-red-600" />
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-700">{message}</p>
        <p className="text-xs text-gray-500">Sentimos las molestias ocasionadas.</p>
        <RedButton onClick={onExit || (() => setShowExitModal(true))}>
          Salir del proceso de registro
        </RedButton>
      </div>
    </Shell>
  )

  /* ═══════════════════════════════════
       SCREENS
  ═══════════════════════════════════ */

  // ── COOKIES ──
  if (screen === 'cookies') {
    return (
      <Shell>
        <div className="p-5 space-y-5">
          <div className="text-center pt-6 pb-4">
            <h1 className="text-2xl font-bold text-red-600 tracking-wider">SANTANDER</h1>
            <p className="text-xs text-gray-500 mt-1">Mexico Account Onboarding · PFAE</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <h2 className="font-bold text-sm">Cookies</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              En Santander utilizamos cookies propias y de terceros para permitir el correcto
              funcionamiento de nuestra aplicación, recordar sus preferencias y realizar un
              análisis de sus hábitos de navegación para publicidad personalizada y desarrollo
              de productos.
            </p>
            <button className="text-xs text-red-600 underline">Política de cookies</button>
          </div>
          <div className="space-y-2">
            <RedButton onClick={() => { setState({...state, cookiesAccepted: true}); navigate('geolocation') }}>
              Aceptar todas las cookies
            </RedButton>
            <OutlineButton onClick={() => { setState({...state, cookiesAccepted: false}); navigate('geolocation') }}>
              Rechazar todas
            </OutlineButton>
          </div>
        </div>
      </Shell>
    )
  }

  // ── GEOLOCATION ──
  if (screen === 'geolocation') {
    return (
      <Shell title="Permisos" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-lg font-bold">Permisos de geolocalización</h2>
          <p className="text-sm text-gray-700">
            Para poder continuar con la apertura de tu cuenta, es necesario que nos permitas
            acceder a la geolocalización de tu dispositivo.
          </p>
          <div className="w-full space-y-2">
            <RedButton onClick={() => {
              if (scenarios.locationInMexico) {
                setState({...state, locationGranted: true})
                navigate('eligibility-check')
              } else {
                navigate('location-not-mexico')
              }
            }}>Permitir</RedButton>
            <OutlineButton onClick={() => navigate('geolocation-denied')}>No permitir</OutlineButton>
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'geolocation-denied') {
    return (
      <Shell title="Permisos" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold">Permisos de geolocalización necesarios</h2>
          <p className="text-sm text-gray-700">
            Para poder continuar con la apertura de tu cuenta, necesitamos que nos des permiso
            para acceder a la geolocalización de tu dispositivo.
          </p>
          <div className="w-full space-y-2">
            <RedButton onClick={() => navigate('geolocation')}>Reintentar</RedButton>
            <LinkButton onClick={() => setShowExitModal(true)}>Salir del proceso de registro</LinkButton>
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'location-not-mexico') {
    return <BlockScreen
      title="Lo sentimos, no es posible continuar con el proceso"
      message="Hemos detectado que tu ubicación está fuera de México. Para continuar es necesario que te encuentres dentro del país."
    />
  }

  // ── ELIGIBILITY ──
  if (screen === 'eligibility-check') {
    return (
      <Shell title="Información básica" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Vamos a empezar, cuéntanos sobre tu empresa</h2>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">¿Eres cliente de Santander?</p>
            <OutlineButton onClick={() => { setState({...state, isClient: true}); navigate('eligibility-info') }}>
              Sí
            </OutlineButton>
            <OutlineButton onClick={() => { setState({...state, isClient: false}); navigate('eligibility-info') }}>
              No
            </OutlineButton>
          </div>
          <div className="pt-2 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Tipo de empresa</p>
            <OutlineButton onClick={() => navigate('eligibility-info')}>
              Persona física con actividad económica
            </OutlineButton>
            <OutlineButton onClick={() => navigate('persona-moral-block')}>
              Persona Moral
            </OutlineButton>
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'persona-moral-block') {
    return <BlockScreen
      title="Lo lamentamos, pero todavía no podemos abrir una cuenta de negocio para Personas Morales"
      message="Para abrir una cuenta dirígete a tu sucursal de Banco Santander."
    />
  }

  if (screen === 'eligibility-info') {
    return (
      <Shell title="Información básica" showBack showProgress>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold">Lo que necesitas para abrir tu cuenta</h2>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Requisitos</p>
            {[
              'Ser mayor de 18 años',
              'Ser residente en México',
              'Haber nacido en México',
              'Disponer de una identificación oficial mexicana vigente (INE)',
              'No haber desempeñado funciones públicas en los últimos doce meses, usted ni sus beneficiarios, intervinientes, familiares, cónyuge o concubina(o)',
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              Deberás completar una verificación de identidad y tomarte una selfie, así que
              asegúrate de tener un documento de identidad oficial a mano. Si no tienes estos
              documentos, puedes presentar la solicitud en la oficina.
            </p>
          </div>
          <p className="text-xs text-gray-600">Completar una visita remota con un gestor al final del proceso</p>

          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-0.5 accent-red-600"
              checked={state.eligible}
              onChange={(e) => setState({...state, eligible: e.target.checked})} />
            <span className="text-sm">Confirmo que soy elegible</span>
          </label>

          <RedButton disabled={!state.eligible} onClick={() => navigate('curp-input')}>Continuar</RedButton>
          <LinkButton onClick={() => {
            if (scenarios.existingProcess) navigate('recovery')
            else navigate('recovery-not-found')
          }}>Recuperar mi proceso</LinkButton>
        </div>
      </Shell>
    )
  }

  // ── CURP ──
  if (screen === 'curp-input') {
    return (
      <Shell title="Información básica" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Obtener mis datos con el CURP</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Escribe tu nº de CURP</label>
            <input type="text" maxLength={18}
              value={tempCurp}
              onChange={(e) => setTempCurp(e.target.value.toUpperCase())}
              placeholder="18 caracteres sin espacios"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{tempCurp.length} / 18</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              El CURP o Clave Única de Registro de Población es un código alfanumérico de 18 caracteres 
              utilizado por el gobierno para identificar a las personas físicas y morales que llevan a cabo 
              actividades económicas en México.
            </p>
          </div>
          <RedButton disabled={tempCurp.length !== 18} onClick={() => {
            if (curpAttempts >= 2 && !scenarios.curpValid) {
              navigate('curp-max-block')
              return
            }
            if (!scenarios.curpValid) {
              setCurpAttempts(a => a + 1)
              navigate('curp-error')
              return
            }
            if (scenarios.curpIsMinor) {
              navigate('curp-minor-block')
              return
            }
            if (!scenarios.curpBirthMexico) {
              return navigate('curp-minor-block')
            }
            setState({
              ...state,
              curp: tempCurp,
              extractedName: 'Marco Gómez Garate',
              extractedGender: 'Hombre',
              extractedDob: '05/07/1980',
              extractedNationality: 'Mexicana',
            })
            navigate('curp-data')
          }}>Continuar</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'curp-error') {
    return (
      <Shell title="Información básica" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <AlertCircle className="w-16 h-16 text-orange-500" />
          <h2 className="text-lg font-bold">No hemos encontrado coincidencias para tu CURP.</h2>
          <p className="text-sm text-gray-700">Revísalo e inténtalo de nuevo.</p>
          <p className="text-xs text-gray-500">Intento {curpAttempts} de 3</p>
          <RedButton onClick={() => navigate('curp-input')}>Reintentar</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'curp-minor-block') {
    return <BlockScreen
      title="Lo sentimos, no es posible continuar con el proceso"
      message="La fecha de nacimiento de tu CURP nos indica que eres menor de edad. Para abrir una cuenta dirígete a tu oficina de Banco Santander."
    />
  }

  if (screen === 'curp-max-block') {
    return <BlockScreen
      title="Lo sentimos, no es posible continuar con el proceso"
      message="Has alcanzado el número máximo de consultas del CURP, debes salir del proceso e iniciar sesión de nuevo para poder continuar."
    />
  }

  if (screen === 'curp-data') {
    return (
      <Shell title="Información básica" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Confirma tus datos</h2>
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            {([
              ['Nombre completo', state.extractedName],
              ['Género', state.extractedGender],
              ['Fecha de nacimiento', state.extractedDob],
              ['País de Nacimiento', 'México'],
              ['Nacionalidad', state.extractedNationality],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
          <RedButton onClick={() => navigate('terms')}>Confirmar</RedButton>
        </div>
      </Shell>
    )
  }

  // ── TERMS ──
  if (screen === 'terms') {
    return (
      <Shell title="Términos y Condiciones" showBack showProgress>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold">Términos y Condiciones</h2>
          <p className="text-xs text-gray-700">
            Por favor, revisa y acepta las cláusulas contenidas en los siguientes documentos:
          </p>

          {[
            ['Términos y condiciones', 'PDF - 1.5 MB'],
            ['Aviso de privacidad', 'PDF - 1.2 MB'],
          ].map(([name, size]) => (
            <div key={name} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-gray-500">{size}</p>
              </div>
              <button className="text-red-600 text-xs font-semibold flex items-center gap-1">
                <Eye className="w-3 h-3" /> Leer
              </button>
            </div>
          ))}

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 accent-red-600"
                checked={state.termsAccepted}
                onChange={e => setState({...state, termsAccepted: e.target.checked})} />
              <span className="text-xs">Confirmo que he leído y acepto las cláusulas contenidas en el documento de Términos y Condiciones.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 accent-red-600"
                checked={state.privacyAccepted}
                onChange={e => setState({...state, privacyAccepted: e.target.checked})} />
              <span className="text-xs">Confirmo que he leído y acepto las cláusulas contenidas en el documento de Aviso de privacidad.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 accent-red-600"
                checked={state.contractAccepted}
                onChange={e => setState({...state, contractAccepted: e.target.checked})} />
              <span className="text-xs">Acepto contratar la cuenta Santander PyME por medios electrónicos.</span>
            </label>
          </div>

          <RedButton
            disabled={!state.termsAccepted || !state.privacyAccepted || !state.contractAccepted}
            onClick={() => navigate('phone-input')}>
            Continuar
          </RedButton>
        </div>
      </Shell>
    )
  }

  // ── PHONE / OTP ──
  if (screen === 'phone-input') {
    return (
      <Shell title="Información básica" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Ahora vamos a confirmar tu celular</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Número de celular</label>
            <div className="flex gap-2">
              <div className="border-2 border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 text-sm w-16 text-center">+52</div>
              <input type="tel"
                value={tempPhone}
                onChange={e => setTempPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="(55) 1234 5678"
                className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none"
              />
            </div>
            {tempPhone.length > 0 && tempPhone.length < 10 && (
              <p className="text-xs text-red-600 mt-1">El formato del número no es correcto</p>
            )}
          </div>
          <RedButton disabled={tempPhone.length < 10} onClick={() => {
            setState({...state, phone: tempPhone})
            navigate('otp-input')
          }}>Enviar código de verificación</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'otp-input') {
    return (
      <Shell title="Verificación" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Código de verificación</h2>
          <p className="text-sm text-gray-700">
            Hemos enviado un código al número +52 {state.phone}
          </p>
          <input type="text" maxLength={6}
            value={tempOtp}
            onChange={e => setTempOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-center text-2xl font-bold tracking-widest focus:border-red-600 focus:outline-none"
          />
          <RedButton disabled={tempOtp.length !== 6} onClick={() => {
            setState({...state, otp: tempOtp})
            navigate('product-selection')
          }}>Continuar</RedButton>
          <LinkButton onClick={() => alert('Código reenviado')}>Reenviar código</LinkButton>
        </div>
      </Shell>
    )
  }

  // ── PRODUCT SELECTION ──
  if (screen === 'product-selection') {
    const products = [
      {
        id: 'empresarial', name: 'Paquete Empresarial',
        desc: 'Accede a una oferta de calidad premium con beneficios opcionales por un solo pago mensual.',
        price: '$750 MXP',
        features: ['Banca electrónica ilimitada', 'App móvil', 'Nómina ilimitada',
          '250 Operaciones básicas', 'Operaciones adicionales $2.00 c/u',
          'Cuota de afiliación TPV', '20 Cheques', 'Reembolso 800K'],
        savings: 'Ahorro sobre tarifa regular $5,400 MXP',
      },
      {
        id: 'basico', name: 'Paquete Básico',
        desc: 'Accede a servicios esenciales para tu negocio.',
        price: '$3,600 MXP',
        features: ['Banca electrónica ilimitada', 'App móvil',
          '100 Operaciones básicas', 'Operaciones adicionales $3.00 c/u'],
        savings: '',
      },
    ]
    return (
      <Shell title="Selecciona el producto" showBack showProgress>
        <div className="p-5 space-y-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-green-800">
              ¡Excelente! Has completado 3 de 6 pasos. ¡Sigamos así!
            </p>
          </div>
          <h2 className="text-lg font-bold">Selecciona el producto</h2>
          {products.map(p => (
            <div key={p.id} className="border-2 border-gray-200 rounded-xl p-4 space-y-3 hover:border-red-300 transition">
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-xs text-gray-600">{p.desc}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Precio mensual</span>
                <span className="font-bold text-red-600">{p.price}</span>
              </div>
              <ul className="space-y-1">
                {p.features.map(f => (
                  <li key={f} className="text-xs text-gray-700 flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.savings && (
                <p className="text-xs font-semibold text-green-700 bg-green-50 p-2 rounded">{p.savings}</p>
              )}
              <RedButton onClick={() => { setState({...state, selectedProduct: p.id}); navigate('personal-about') }}>
                Contratar
              </RedButton>
              <LinkButton>Conoce más</LinkButton>
            </div>
          ))}
        </div>
      </Shell>
    )
  }

  // ── PERSONAL REGISTRATION: ABOUT YOU ──
  if (screen === 'personal-about') {
    return (
      <Shell title="Sobre ti" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Sobre ti</h2>
          <div className="space-y-3">
            <p className="text-sm">
              ¿Usted, alguno de los intervinientes, beneficiarios, familiar, cónyuge o concubina(o)
              desempeña o ha desempeñado funciones públicas en los últimos doce meses en México
              o en el extranjero?
            </p>
            <OutlineButton onClick={() => navigate('pep-block')}>Sí</OutlineButton>
            <OutlineButton onClick={() => navigate('business-info')}>No</OutlineButton>
            <button onClick={() => navigate('pep-detail')} className="text-xs text-red-600 underline">
              ¿Qué entendemos por función pública?
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'pep-detail') {
    return (
      <Shell title="Funciones públicas" showBack>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold">¿Qué entendemos por función pública?</h2>
          <div className="space-y-2 text-xs text-gray-700">
            <p className="font-semibold">Cargos</p>
            {[
              'Jefe de estado, jefe de gobierno, ministro, subsecretario o secretario de estado.',
              'Diputado al parlamento u órganos legislativos similares.',
              'Funcionario o miembro de órganos directivos de partidos políticos.',
              'Magistrado de tribunales supremos, tribunales constitucionales y otras altas instancias judiciales.',
              'Embajador, cónsul, nuncio, jefe de misión diplomática, encargado de negocios de una embajada.',
              'Miembro de tribunales de cuentas o de los consejos de banco centrales.',
            ].map(c => <p key={c}>• {c}</p>)}
          </div>
          <LinkButton onClick={() => navigate('personal-about')}>Más información</LinkButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'pep-block') {
    return <BlockScreen
      title="Lo sentimos, no es posible continuar con el proceso"
      message="Para abrir una cuenta dirígete a tu oficina de Banco Santander."
    />
  }

  // ── BUSINESS INFO ──
  if (screen === 'business-info') {
    return (
      <Shell title="Sobre tu negocio" showBack showProgress>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-blue-800">
              A continuación, te vamos a preguntar sobre las finanzas de tu negocio: ¡te estás acercando a la meta!
            </p>
          </div>
          <h2 className="text-lg font-bold">Sobre tu negocio</h2>

          <div>
            <label className="text-sm font-medium mb-1 block">¿Podrías indicarnos la procedencia de los recursos?</label>
            <select value={state.sourceOfFunds}
              onChange={e => setState({...state, sourceOfFunds: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none">
              <option value="">Selecciona</option>
              {['Ahorros propios / inversiones','Aportaciones o cuotas sindicales','Apoyos sociales / beca',
                'Arrendamiento de inmuebles (rentas)','Créditos','Partida presupuestaria','Venta de bienes muebles e inmuebles'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">¿Podrías indicarnos qué uso planeas darle a la cuenta?</label>
            <select value={state.accountUsage}
              onChange={e => setState({...state, accountUsage: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none">
              <option value="">Selecciona</option>
              {['Gastos personales','Impuestos / pago de servicios','Pago a comisionistas','Pago a proveedores',
                'Pago a terceros','Pago de créditos','Pago de nómina / primas de seguro',
                'Pago de renta / compra de bienes inmuebles','Desarrollo del giro del negocio'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              ¿La actividad de tu empresa se dedica a alguna actividad prohibida o restringida?
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Ej: Negocios de Cannabis (Marihuana), Producción o distribución de criptomonedas o activos virtuales
            </p>
            <div className="flex gap-2">
              <button onClick={() => navigate('restricted-block')}
                className="flex-1 border-2 border-gray-300 py-2 rounded-lg text-sm font-semibold hover:border-red-600">Sí</button>
              <button onClick={() => navigate('idv-guide')}
                className="flex-1 border-2 border-gray-300 py-2 rounded-lg text-sm font-semibold hover:border-red-600">No</button>
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded text-xs text-gray-500">
            Guardaremos tu información durante 48 horas desde que se inició la aplicación.
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'restricted-block') {
    return <BlockScreen
      title="Lo sentimos, no es posible continuar con el proceso"
      message="Para abrir una cuenta dirígete a tu sucursal de Banco Santander."
    />
  }

  // ── ID&V ──
  if (screen === 'idv-guide') {
    return (
      <Shell title="Verificación de identidad" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-lg font-bold">Ahora te vamos a guiar, paso por paso, por el proceso de verificación de tu identidad</h2>
          <p className="text-xs text-gray-600">
            Asegúrate de estar en un lugar bien iluminado, y que la captura es clara y la información legible.
          </p>
          <div className="w-full space-y-2">
            {['Tómate un Selfie', 'Graba un video mostrando tu ID'].map((s, i) => (
              <div key={s} className="flex items-center gap-3 border rounded-lg p-3">
                <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xs">{i+1}</div>
                <span className="text-sm font-semibold">{s}</span>
              </div>
            ))}
          </div>
          <RedButton onClick={() => navigate('idv-selfie')}>Estoy listo</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'idv-selfie') {
    return (
      <Shell title="Verificación de identidad" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-6">
          <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300">
            <User className="w-20 h-20 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold">Tómate un Selfie</h2>
          <p className="text-xs text-gray-600">Centra tu rostro en el círculo</p>
          <RedButton onClick={() => {
            if (scenarios.idvSuccess) {
              navigate('idv-success')
            } else {
              setIdvAttempts(a => a + 1)
              if (idvAttempts >= 2) navigate('idv-fail')
              else navigate('idv-fail')
            }
          }}>Continuar</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'idv-success') {
    return (
      <Shell title="Verificación de identidad" showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-10">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
          <h2 className="text-lg font-bold">¡Listo! Hemos comprobado tu identidad correctamente</h2>
          <RedButton onClick={() => navigate('doc-upload')}>Continuar</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'idv-fail') {
    return (
      <Shell title="Verificación de identidad" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <AlertCircle className="w-16 h-16 text-orange-500" />
          <h2 className="text-lg font-bold">Lo sentimos, no hemos podido comprobar tu identidad correctamente</h2>
          {idvAttempts >= 3 ? (
            <>
              <p className="text-sm text-gray-700">Para abrir una cuenta dirígete a tu sucursal de Banco Santander.</p>
              <RedButton onClick={() => setShowExitModal(true)}>Salir del proceso de registro</RedButton>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">Intento {idvAttempts} de 3</p>
              <RedButton onClick={() => navigate('idv-selfie')}>Reintentar</RedButton>
            </>
          )}
        </div>
      </Shell>
    )
  }

  // ── DOCUMENT UPLOAD ──
  if (screen === 'doc-upload') {
    return (
      <Shell title="Subida de documentación" showBack showProgress>
        <div className="p-5 space-y-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-green-800">
              ¡Ya casi lo tienes! Has completado 4 de 6 pasos. ¡Vamos a terminar!
            </p>
          </div>
          <h2 className="text-lg font-bold">Por favor, sube los siguientes documentos</h2>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <p className="text-xs font-semibold">Consejos para la subida de documentación</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Revisa que no haya datos tapados o borrosos.</li>
              <li>• Una vez se complete la carga, extraeremos automáticamente los datos del documento.</li>
              <li>• Asegúrate que el documento haya sido emitido en los últimos 3 meses.</li>
            </ul>
          </div>

          {/* Constancia fiscal */}
          <div className={`border-2 border-dashed rounded-xl p-4 text-center space-y-2 ${state.fiscalUploaded ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
            {state.fiscalUploaded ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Constancia de Situación Fiscal</span>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="font-semibold text-sm">Constancia de Situación Fiscal</p>
                <p className="text-xs text-gray-500">Max: 10MB | Formato: .pdf, .jpg o .png</p>
                <button onClick={() => {
                  if (docAttempts >= 2 && !scenarios.docUploadSuccess) {
                    navigate('doc-max-block')
                  } else if (!scenarios.docUploadSuccess) {
                    setDocAttempts(a => a + 1)
                    navigate('doc-error')
                  } else {
                    navigate('doc-extracting')
                  }
                }} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
                  Subir documento
                </button>
              </>
            )}
          </div>

          {/* Comprobante domicilio */}
          <div className={`border-2 border-dashed rounded-xl p-4 text-center space-y-2 ${state.domicilioUploaded ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
            {state.domicilioUploaded ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Comprobante de domicilio operativo</span>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="font-semibold text-sm">Comprobante de domicilio operativo</p>
                <p className="text-xs text-gray-500">Max: 10MB | Formato: .pdf, .jpg o .png</p>
                <button disabled={!state.fiscalUploaded} onClick={() => {
                  setState({...state, domicilioUploaded: true})
                }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  Subir documento
                </button>
              </>
            )}
          </div>

          {state.fiscalUploaded && state.domicilioUploaded && (
            <RedButton onClick={() => navigate('branch-search')}>Continuar</RedButton>
          )}
        </div>
      </Shell>
    )
  }

  if (screen === 'doc-extracting') {
    return (
      <Shell title="Subida de documentación" showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-16">
          <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
          <h2 className="text-lg font-bold">Extrayendo datos</h2>
          <p className="text-sm text-gray-600">Por favor espera mientras procesamos tu documento...</p>
        </div>
      </Shell>
    )
  }

  if (screen === 'doc-confirm') {
    return (
      <Shell title="Subida de documentación" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Esta es la información que hemos extraído:</h2>
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            {([
              ['Régimen fiscal', 'Persona Física con Actividad Empresarial'],
              ['Actividad Económica', 'Comercio al por menor'],
              ['Dirección Comercial', 'Calle Reforma #123, Interior 4B, Colonia Juárez, 06600, Ciudad de México, CDMX'],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
          <RedButton onClick={() => {
            setState({...state, fiscalUploaded: true})
            navigate('doc-upload')
          }}>Confirmar</RedButton>
          <LinkButton onClick={() => navigate('doc-upload')}>Estos datos son incorrectos</LinkButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'doc-error') {
    return (
      <Shell title="Subida de documentación" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <AlertCircle className="w-16 h-16 text-orange-500" />
          <h2 className="text-lg font-bold">¡Ups! Algo salió mal</h2>
          <p className="text-sm text-gray-700">Ha habido un problema al cargar la información. Por favor, inténtalo de nuevo.</p>
          <p className="text-xs text-gray-500">Intento {docAttempts} de 3</p>
          <RedButton onClick={() => navigate('doc-upload')}>Reintentar</RedButton>
          <LinkButton onClick={() => setShowExitModal(true)}>Salir del proceso de registro</LinkButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'doc-max-block') {
    return <BlockScreen
      title="Lo sentimos, no es posible continuar con el proceso"
      message="Has alcanzado el número máximo de intentos consecutivos. Para abrir una cuenta dirígete a tu sucursal de Banco Santander."
    />
  }

  if (screen === 'doc-permission') {
    return (
      <Shell title="Permisos" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <AlertCircle className="w-16 h-16 text-orange-500" />
          <h2 className="text-lg font-bold">Permisos de acceso a tus archivos necesarios</h2>
          <p className="text-sm text-gray-700">
            Para abrir tu cuenta, necesitamos permiso para acceder a los archivos de tu dispositivo y subir la documentación.
          </p>
          <RedButton onClick={() => navigate('doc-upload')}>Reintentar</RedButton>
          <LinkButton onClick={() => setShowExitModal(true)}>Salir</LinkButton>
        </div>
      </Shell>
    )
  }

  // ── PERSONALIZATION ──
  if (screen === 'branch-search') {
    const branches = [
      { name: 'Banco Santander', addr: 'Plaza Santa Bárbara, 16', dist: '10 m' },
      { name: 'Santander Private Banking', addr: 'Gran Vía, 899', dist: '300 m' },
      { name: 'Banco Santander', addr: 'Avenida Reforma, 74', dist: '873 m' },
      { name: 'Banco Santander', addr: 'Paseo de la Reforma, 578', dist: '1.4 km' },
      { name: 'Banco Santander', addr: 'Calle Monterrey, 43', dist: '873 m' },
    ]
    return (
      <Shell title="Personalización" showBack showProgress>
        <div className="p-5 space-y-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-green-800">
              ¡Ya casi lo tienes! Has completado 5 de 6 pasos. ¡Vamos a terminar!
            </p>
          </div>
          <h2 className="text-lg font-bold">Encuentra tu sucursal</h2>
          <p className="text-xs text-gray-600">
            Será la sucursal base de tu cuenta, búscala por dirección, ciudad o código postal para llevar a cabo tus gestiones.
          </p>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input type="text" value={tempSearch} onChange={e => setTempSearch(e.target.value)}
              placeholder="Busca por dirección, ciudad o código postal"
              className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-red-600 focus:outline-none"
            />
          </div>
          {/* Map placeholder */}
          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
            <MapPin className="w-8 h-8 text-red-600" />
            <span className="text-xs text-gray-500 ml-2">México</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Listado de sucursales</p>
          <div className="space-y-2">
            {branches.map((b, i) => (
              <button key={i} onClick={() => {
                setState({...state, selectedBranch: b.addr})
                navigate('card-address')
              }} className="w-full border rounded-lg p-3 text-left hover:border-red-600 transition">
                <p className="font-semibold text-sm">{b.name}</p>
                <p className="text-xs text-gray-600">{b.addr}</p>
                <p className="text-xs text-gray-400">{b.dist}</p>
              </button>
            ))}
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'card-address') {
    return (
      <Shell title="Personalización" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">¿Dónde quieres que enviemos tu tarjeta?</h2>
          <button onClick={() => {
            setState({...state, cardAddress: 'branch'})
            navigate('beneficiaries')
          }}
            className="w-full border-2 border-gray-300 rounded-xl p-4 text-left hover:border-red-600 transition">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Mi sucursal Santander</p>
                <p className="text-xs text-gray-600">{state.selectedBranch}</p>
              </div>
            </div>
          </button>
          <button onClick={() => {
            setState({...state, cardAddress: 'home'})
            navigate('beneficiaries')
          }}
            className="w-full border-2 border-gray-300 rounded-xl p-4 text-left hover:border-red-600 transition">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Otra dirección</p>
                <p className="text-xs text-gray-600">Enviar a una dirección diferente</p>
              </div>
            </div>
          </button>
        </div>
      </Shell>
    )
  }

  // ── BENEFICIARIES ──
  if (screen === 'beneficiaries') {
    const totalPct = state.beneficiaries.reduce((s, b) => s + b.percentage, 0)
    return (
      <Shell title="Beneficiarios" showBack showProgress>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold">Añadir beneficiarios</h2>
          <p className="text-xs text-gray-600">
            Incluye hasta 3 beneficiarios y el porcentaje que asignas a cada uno hasta completar el 100%
          </p>

          {state.beneficiaries.length > 0 && (
            <div className="space-y-2">
              {state.beneficiaries.map((b, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-sm">Beneficiario {i+1}</p>
                      <p className="text-xs text-gray-600">{b.name} {b.paternalSurname} {b.maternalSurname}</p>
                    </div>
                    <span className="font-bold text-red-600">{b.percentage}%</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-semibold">Porcentaje total asignado</span>
                <span className={`font-bold ${totalPct === 100 ? 'text-green-600' : 'text-orange-600'}`}>{totalPct}%</span>
              </div>
            </div>
          )}

          {state.beneficiaries.length < 3 && (
            <OutlineButton onClick={() => navigate('beneficiary-add')}>
              Añadir beneficiario
            </OutlineButton>
          )}

          <RedButton disabled={totalPct !== 100} onClick={() => navigate('contract-docs')}>
            Continuar
          </RedButton>

          <div className="bg-gray-50 p-2 rounded text-xs text-gray-500">
            Guardaremos tu información durante 48 horas desde que se inició la aplicación.
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'beneficiary-add') {
    return (
      <Shell title="Beneficiarios" showBack showProgress>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold">Detalles del nuevo beneficiario</h2>
          {[
            ['Nombre', 'name'],
            ['Apellido paterno', 'paternalSurname'],
            ['Apellido materno', 'maternalSurname'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-medium mb-1 block">{label}</label>
              <input type="text"
                value={(tempBen as any)[key] || ''}
                onChange={e => setTempBen({...tempBen, [key]: e.target.value})}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium mb-1 block">Fecha de nacimiento</label>
            <input type="text" placeholder="dd/mm/aaaa"
              value={tempBen.dob}
              onChange={e => setTempBen({...tempBen, dob: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">RFC</label>
            <input type="text" maxLength={13} placeholder="Clave de 13 caracteres alfanuméricos"
              value={tempBen.rfc}
              onChange={e => setTempBen({...tempBen, rfc: e.target.value.toUpperCase()})}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none" />
            <p className="text-xs text-gray-500 mt-0.5 text-right">{tempBen.rfc.length} / 13</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Porcentaje</label>
            <input type="number" min={1} max={100}
              value={tempBen.percentage || ''}
              onChange={e => setTempBen({...tempBen, percentage: parseInt(e.target.value) || 0})}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none" />
            {tempBen.percentage > 100 && <p className="text-xs text-red-600 mt-1">El valor no puede ser superior a 100</p>}
            {String(tempBen.percentage).includes('.') && <p className="text-xs text-red-600 mt-1">No incluyas decimales</p>}
          </div>

          <RedButton
            disabled={!tempBen.name || !tempBen.paternalSurname || tempBen.percentage <= 0 || tempBen.percentage > 100}
            onClick={() => {
              setState({...state, beneficiaries: [...state.beneficiaries, {...tempBen}]})
              setTempBen({name:'', paternalSurname:'', maternalSurname:'', dob:'', rfc:'', percentage: 0})
              navigate('beneficiaries')
            }}>
            Continuar
          </RedButton>
        </div>
      </Shell>
    )
  }

  // ── CONTRACT & SIGNATURES ──
  if (screen === 'contract-docs') {
    return (
      <Shell title="Firma del contrato" showBack showProgress>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold">Estamos cerca de terminar.</h2>
          <p className="text-xs text-gray-700">
            El último paso: firmar el contrato. Una vez hecho esto, tu cuenta estará lista para ser utilizada.
          </p>
          <p className="text-xs text-gray-700">
            Deberás ingresar tu e.firma. Te pediremos que subas tu certificado y llave privada.
          </p>

          <p className="text-xs font-semibold text-gray-500 uppercase mt-4">Por favor, lee los siguientes documentos</p>
          {[
            ['Contrato apertura de cuenta', '23 páginas'],
            ['Apertura de banca', '5 páginas'],
            ['Contratación de paquetes', '100 páginas'],
            ['Cuestionario FATCA', '-'],
            ['BCOM 056', '-'],
            ['Consulta Buró de Crédito', '-'],
            ['Autorización fines promocionales', '-'],
          ].map(([name, pages]) => (
            <div key={name} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{name}</p>
                {pages !== '-' && <p className="text-xs text-gray-500">{pages}</p>}
              </div>
              <button className="text-red-600 text-xs font-semibold flex items-center gap-1">
                <Eye className="w-3 h-3" /> Leer
              </button>
            </div>
          ))}

          <RedButton onClick={() => navigate('contract-efirma')}>Continuar</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'contract-efirma') {
    return (
      <Shell title="Firma del contrato" showBack showProgress>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold">Ingresa tu e.firma para firmar los documentos</h2>
          <p className="text-xs text-gray-700">
            Deberás ingresar tu e.firma. Te pediremos que subas tu certificado y llave privada.
          </p>

          {/* CER */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center space-y-2">
            <FileCheck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="font-semibold text-sm">Certificado .CER</p>
            <p className="text-xs text-gray-500">Documento #1</p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-700">
              Sube el archivo .CER
            </button>
          </div>

          {/* KEY */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center space-y-2">
            <FileCheck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="font-semibold text-sm">Llave privada .KEY</p>
            <p className="text-xs text-gray-500">Documento #2</p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-700">
              Sube el archivo .KEY
            </button>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Contraseña de tu e.firma</label>
            <input type="password" placeholder="Ingresa la contraseña de tu e.firma"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none" />
          </div>

          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-0.5 accent-red-600" />
            <span className="text-xs">Valido que he leído y acepto firmar los documentos</span>
          </label>

          <RedButton onClick={() => navigate('contract-manual')}>Agregar e.firma</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'contract-manual') {
    return (
      <Shell title="Firma del contrato" showBack showProgress>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Ingresa tu firma en el recuadro</h2>
          <p className="text-xs text-gray-700">
            Deberás firmar con tu rúbrica manual, tal como aparece en tu INE.
          </p>
          <p className="text-xs text-gray-500">Toca aquí para firmar. Tendrás 30 segundos</p>

          <div className="border-4 border-red-600 rounded-xl bg-white h-44 flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <p className="text-gray-300 text-sm italic">Firma aquí</p>
          </div>

          <div className="flex justify-center">
            <div className="bg-gray-100 px-5 py-1.5 rounded-full flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-bold">00:30</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm">Borrar</button>
            <button onClick={() => {
              if (scenarios.signatureTimeout) navigate('contract-timeout')
              else navigate('contract-success')
            }} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700">
              Firmar
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  if (screen === 'contract-timeout') {
    return (
      <Shell title="Firma del contrato" showBack showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <Clock className="w-16 h-16 text-orange-500" />
          <h2 className="text-lg font-bold">Tiempo excedido</h2>
          <p className="text-sm text-gray-700">
            Has excedido el tiempo máximo para realizar el proceso, vuelve a comenzar
          </p>
          <RedButton onClick={() => navigate('contract-manual')}>Volver a empezar</RedButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'contract-success') {
    return (
      <Shell title="Firma del contrato" showProgress>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-10">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
          <h2 className="text-lg font-bold">Documentos firmados correctamente</h2>
          <RedButton onClick={() => {
            if (!scenarios.transmitOk) navigate('error-generic')
            else if (scenarios.riskLevel === 'A2' || scenarios.riskLevel === 'A3') {
              navigate('error-generic')
            } else navigate('app-submitted')
          }}>Continuar</RedButton>
        </div>
      </Shell>
    )
  }

  // ── APPLICATION SUBMITTED ──
  if (screen === 'app-submitted') {
    const firstName = state.extractedName.split(' ')[0] || 'Cliente'
    return (
      <Shell>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-700">¡Gracias {firstName}!</h2>
          <p className="text-sm text-gray-700">
            En breve recibirás un correo electrónico en el que podrás agendar una visita ocular en remoto.
          </p>
          <p className="text-sm font-semibold text-gray-800">
            Después de esto ya podrás empezar a disfrutar de tu cuenta.
          </p>
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl w-full">
            <p className="text-sm text-green-800 font-semibold">Solicitud enviada exitosamente</p>
            <p className="text-xs text-green-700 mt-1">
              Producto seleccionado: {state.selectedProduct === 'empresarial' ? 'Paquete Empresarial' : 'Paquete Básico'}
            </p>
          </div>
        </div>
      </Shell>
    )
  }

  // ── RECOVERY ──
  if (screen === 'recovery') {
    return (
      <Shell title="Recuperar proceso" showBack>
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-bold">Parece que ya habías iniciado un proceso de contratación con estos datos</h2>
          <p className="text-sm text-gray-700">Hemos encontrado una contratación en curso.</p>
          <RedButton onClick={() => navigate('product-selection')}>Continuar con la contratación</RedButton>
          <OutlineButton onClick={resetAll}>Iniciar nueva contratación</OutlineButton>
        </div>
      </Shell>
    )
  }

  if (screen === 'recovery-not-found') {
    return (
      <Shell title="Recuperar proceso" showBack>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <AlertCircle className="w-16 h-16 text-orange-500" />
          <h2 className="text-lg font-bold">Lo sentimos, no hemos encontrado ningún proceso de contratación iniciado con estos datos</h2>
          <RedButton onClick={() => navigate('eligibility-info')}>Continuar</RedButton>
          <OutlineButton onClick={resetAll}>Iniciar nueva contratación</OutlineButton>
        </div>
      </Shell>
    )
  }

  // ── ERROR GENERIC ──
  if (screen === 'error-generic') {
    return (
      <Shell>
        <div className="p-5 space-y-6 flex flex-col items-center text-center pt-8">
          <AlertCircle className="w-16 h-16 text-red-600" />
          <h2 className="text-lg font-bold">¡Ups! Algo salió mal</h2>
          <p className="text-sm text-gray-700">Ha habido un problema. Por favor, inténtalo de nuevo.</p>
          <RedButton onClick={() => navigate('contract-docs')}>Reintentar</RedButton>
          <LinkButton onClick={() => setShowExitModal(true)}>Salir del proceso de registro</LinkButton>
        </div>
      </Shell>
    )
  }

  // Fallback
  return (
    <Shell>
      <div className="p-5">
        <h1 className="text-xl font-bold">Onboarding Global - PFAE</h1>
        <p className="text-sm text-gray-600">Pantalla: {screen}</p>
        <RedButton onClick={resetAll}>Reiniciar</RedButton>
      </div>
    </Shell>
  )
}

export default App
