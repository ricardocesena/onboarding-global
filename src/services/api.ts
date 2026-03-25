/**
 * API Service Layer - Connects frontend screens to backend onboarding APIs.
 * Each function generates a fresh JWT token via the backend proxy before
 * forwarding the request to the upstream Santander APIC.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/* ─── Debug API Call Tracking ─── */

export interface ApiCallRecord {
  id: string;
  timestamp: string;
  screen: string;
  method: string;
  endpoint: string;
  requestData: unknown;
  responseData: unknown;
  status: number;
  duration: number;
  error?: string;
}

type ApiCallListener = (calls: ApiCallRecord[]) => void;

let _apiCalls: ApiCallRecord[] = [];
let _listeners: ApiCallListener[] = [];
let _currentScreen = '';

export function setCurrentScreen(screen: string) {
  _currentScreen = screen;
}

export function getApiCalls(): ApiCallRecord[] {
  return _apiCalls;
}

export function subscribeToApiCalls(listener: ApiCallListener): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(l => l !== listener);
  };
}

export function clearApiCalls() {
  _apiCalls = [];
  _listeners.forEach(l => l([..._apiCalls]));
}

function notifyListeners() {
  _listeners.forEach(l => l([..._apiCalls]));
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log(`[API] ${method} ${url}`);

  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    opts.body = JSON.stringify(body);
  }

  const startTime = Date.now();
  let status = 0;
  let responseData: unknown = null;
  let errorMsg: string | undefined;

  try {
    const res = await fetch(url, opts);
    status = res.status;
    responseData = await res.json();
  } catch (err) {
    errorMsg = String(err);
    responseData = { error: errorMsg };
  }

  const duration = Date.now() - startTime;

  const record: ApiCallRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    screen: _currentScreen,
    method,
    endpoint: path,
    requestData: body ?? null,
    responseData,
    status,
    duration,
    error: errorMsg,
  };

  _apiCalls.push(record);
  notifyListeners();

  if (errorMsg) {
    throw new Error(errorMsg);
  }

  return responseData as T;
}

/* ─── Watchlist Screening ─── */

export interface WatchlistScreeningRequest {
  operationTypeCode: string;
  operationSubtypeCode: string;
  idempotentReference: string;
  person: {
    personName: { givenName: string; lastName: string; secondLastName: string; fullName: string };
    documents: { documentTypeCode: string; documentNumber: string }[];
    birthDate: string;
    placeOfBirth: { country: { code: string } };
    nationality: { code: string };
    employment: { economicActivity: { code: string; description: string } };
  };
  organization: {
    documents: { documentTypeCode: string; documentNumber: string }[];
    typeCode: string;
    organizationName: { legalName: string };
    economicActivity: { code: string; description: string };
  };
  contactPoints: {
    postalAddress: {
      streetName: string;
      streetBuildingIdentification: string;
      postCodeIdentification: string;
      townName: string;
      state: { code: string };
      country: { code: string };
    };
    phoneAddress: { phoneNumber: string; countryCode: string };
    electronicAddress: { emailAddress: string };
  }[];
}

export function validateWatchlistScreening(data: WatchlistScreeningRequest) {
  return request('POST', '/api/watchlist-screening/validate-status', data);
}

/* ─── Fraud Evaluation ─── */

export interface FraudEvaluateRequest {
  party: {
    contactPoint: {
      electronicAddress: { emailAddress: string };
      phoneAddress?: { phoneNumber: string; countryCode: string };
    };
  };
}

export function evaluateFraud(data: FraudEvaluateRequest) {
  return request('POST', '/api/fraud/evaluate', data);
}

/* ─── Economic Activities ─── */

export interface EconomicActivitiesRequest {
  hierarchyEconomicActivity: {
    economicActivityDescription: string;
  };
}

export function retrieveEconomicActivities(data: EconomicActivitiesRequest) {
  return request('POST', '/api/economic-activities/retrieve', data);
}

/* ─── Document Management ─── */

export interface DocumentUploadRequest {
  document: {
    mimeType: string;
    name: string;
    typeCode: string;
    folderReference: string;
    aclReference?: string;
    owners: { ownerId: string }[];
    documentProperties: { key: string; value: string }[];
    customMetadata?: Record<string, string>;
  };
  caller_information: { appId: string; name: string };
}

export function uploadDocument(data: DocumentUploadRequest) {
  return request('POST', '/api/document-management/upload', data);
}

/* ─── Administrative Geographies ─── */

export function getDistricts(countryCode: string, postCode: string) {
  return request('GET', `/api/administrative-geographies/districts?country_code=${countryCode}&post_code=${postCode}`);
}

/* ─── Service Point Locator ─── */

export interface ServicePointSearchRequest {
  startCoordinates: { latitude: number; longitude: number };
  endCoordinates: { latitude: number; longitude: number };
  radius: { unitCode: string; value: number };
  postalAddress?: { postCodeIdentification: string; townName: string };
  languages?: string[];
  servicePointTypes?: { servicePointTypeCode: string }[];
  servicePointSubtypes?: { servicePointSubtypeCode: string }[];
  availableServices?: { serviceCode: string }[];
  hasClosedDate?: boolean;
}

export function searchServicePoints(data: ServicePointSearchRequest) {
  return request('POST', '/api/service-points/search-by-geolocation', data);
}

/* ─── Document Composer ─── */

export interface DocumentComposeRequest {
  document: {
    name: string;
    typeCode: string;
    mimeType: string;
    template: { templateId: string };
    metadata: Record<string, string>;
    documentProperties: { key: string; value: string }[];
  };
}

export function composeDocument(data: DocumentComposeRequest) {
  return request('POST', '/api/document-composer/compose', data);
}

/* ─── Customers ─── */

export interface CreateCustomerRequest {
  person: {
    personName: { givenName: string; lastName: string; secondLastName: string };
    genderCode: string;
    birthDate: string;
    placeOfBirth: { country: { code: string } };
    countryOfResidence: { code: string };
    firstNationality: { code: string };
    civilStatusCode: string;
    employmentInformation: {
      economicActivity: { code: string; description: string };
    };
    documents: {
      documentTypeCode: string;
      documentNumber: string;
      issueDate?: string;
      expirationDate?: string;
      issuerEntity?: { code: string };
    }[];
  };
  structuralSegmentCode: string;
  bank: { bankId: string };
  contactPoints: {
    postalAddress: {
      streetTypeCode: string;
      streetName: string;
      streetBuildingIdentification: string;
      unitType?: string;
      unitNumber?: string;
      postCodeIdentification: string;
      state: { code: string };
      country: { code: string };
      townName: string;
      districtName: string;
    };
    phoneAddress: { phoneNumber: string; countryCode: string };
    electronicAddress?: { emailAddress: string };
  }[];
}

export function createCustomer(data: CreateCustomerRequest) {
  return request('POST', '/api/customers', data);
}

/* ─── Accounts ─── */

export interface CreateAccountRequest {
  baseCurrency: { code: string };
  center: { centerId: string };
  product: {
    productCode: string;
    subproduct: { subproductId: string };
  };
  contract: {
    participants: { participantId: string; participantTypeCode?: string }[];
  };
  profileTypeCode: string;
  profileSubtypeCode: string;
}

export function createAccount(data: CreateAccountRequest) {
  return request('POST', '/api/accounts', data);
}

/* ─── Card Information ─── */

export interface CreateCardRequest {
  product: { productCode: string };
  cardholder: {
    cardholderId: string;
    contactPoints: { contactPointId: string }[];
  };
  associatedAccounts: {
    account: {
      accountId: string;
      baseCurrency: { code: string };
    };
  }[];
  contract: {
    center: { centerId: string };
  };
}

export function createCard(data: CreateCardRequest) {
  return request('POST', '/api/cards', data);
}

/* ─── Customer Contact Points ─── */

export interface CreateContactPointRequest {
  useTypes: { code: string }[];
  postalAddress: {
    streetTypeCode: string;
    streetName: string;
    streetBuildingIdentification: string;
    unitType?: string;
    unitNumber?: string;
    postCodeIdentification: string;
    state: { code: string };
    country: { code: string };
    townName: string;
    districtName: string;
  };
}

export function createContactPoint(customerId: string, data: CreateContactPointRequest) {
  return request('POST', `/api/customer-contact-points/${customerId}/contact-points`, data);
}

/* ─── KYC Risk Score ─── */

export interface KycRiskScoreRequest {
  currency: { code: string };
  Verification: { isVerificationSuccessful: boolean };
  knowYourCustomerResolution: {
    party: {
      bank: { bankId: string };
      person: {
        personName: { givenName: string; lastName: string; secondLastName: string };
        birthDate: string;
        firstNationality: { code: string };
      };
      partyId: string;
      contactPoint: {
        postalAddress: {
          postCodeIdentification: string;
          state: { code: string };
          country: { code: string };
        };
      };
      organization?: {
        economicActivity: { code: string; description: string };
      };
    };
    products: { productCode: string; subproductCode: string }[];
    knowYourCustomerQuestionnaire: {
      questionnaireId: string;
      questions: { questionId: string; answerId: string }[];
    };
  };
}

export function calculateKycRiskScore(data: KycRiskScoreRequest) {
  return request('POST', '/api/kyc/risk-score', data);
}

/* ─── Channel Access Agreement ─── */

export interface UnblockChannelRequest {
  channel: { code: string };
  block: { typeCode: string };
}

export function unblockChannel(agreementId: string, data: UnblockChannelRequest) {
  return request('POST', `/api/channel-access/${agreementId}/unblock`, data);
}

/* ─── Account Warning Blocks ─── */

export interface AccountWarningBlockRequest {
  reasonTypeCode: string;
  additionalInformation?: string;
  actionTypeCode: string;
  actionTypeDescription: string;
  validityPeriod: { startDate: string; endDate: string };
  center: { centerId: string };
  availableBalance?: { from: { amount: number; currency: string }; to: { amount: number; currency: string } };
  principalBalance?: { from: { amount: number; currency: string }; to: { amount: number; currency: string } };
  operationAmount?: { from: { amount: number; currency: string }; to: { amount: number; currency: string } };
}

export function createAccountWarningBlock(accountId: string, data: AccountWarningBlockRequest) {
  return request('POST', `/api/account-warning-blocks/${accountId}/warning-blocks`, data);
}

/* ─── Beneficiaries ─── */

export function getBeneficiaries(accountId: string) {
  return request('GET', `/api/beneficiaries/${accountId}`);
}

/* ─── Countries ─── */

export function getCountries(params?: { code?: string; iso_alpha2?: string; iso_alpha3?: string }) {
  const qs = new URLSearchParams();
  if (params?.code) qs.set('code', params.code);
  if (params?.iso_alpha2) qs.set('iso_alpha2', params.iso_alpha2);
  if (params?.iso_alpha3) qs.set('iso_alpha3', params.iso_alpha3);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return request('GET', `/api/countries${query}`);
}

/* ─── Party Parameters ─── */

export function getPartyParameters(parameterId: string) {
  return request('GET', `/api/party-parameters/${parameterId}`);
}
