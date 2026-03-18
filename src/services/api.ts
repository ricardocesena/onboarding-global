/**
 * API Service Layer - Connects frontend screens to backend onboarding APIs.
 * Each function generates a fresh JWT token via the backend proxy before
 * forwarding the request to the upstream Santander APIC.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  return request('/api/watchlist-screening/validate-status', 'POST', data);
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
  return request('/api/fraud/evaluate', 'POST', data);
}

/* ─── Economic Activities ─── */

export interface EconomicActivitiesRequest {
  hierarchyEconomicActivity: {
    economicActivityDescription: string;
  };
}

export function retrieveEconomicActivities(data: EconomicActivitiesRequest) {
  return request('/api/economic-activities/retrieve', 'POST', data);
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
  return request('/api/document-management/upload', 'POST', data);
}

/* ─── Administrative Geographies ─── */

export function getDistricts(countryCode: string, postCode: string) {
  return request(`/api/administrative-geographies/districts?country_code=${countryCode}&post_code=${postCode}`, 'GET');
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
  return request('/api/service-points/search-by-geolocation', 'POST', data);
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
  return request('/api/document-composer/compose', 'POST', data);
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
  return request('/api/customers', 'POST', data);
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
  return request('/api/accounts', 'POST', data);
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
  return request('/api/cards', 'POST', data);
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
  return request(`/api/customer-contact-points/${customerId}/contact-points`, 'POST', data);
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
  return request('/api/kyc/risk-score', 'POST', data);
}

/* ─── Channel Access Agreement ─── */

export interface UnblockChannelRequest {
  channel: { code: string };
  block: { typeCode: string };
}

export function unblockChannel(agreementId: string, data: UnblockChannelRequest) {
  return request(`/api/channel-access/${agreementId}/unblock`, 'POST', data);
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
  return request(`/api/account-warning-blocks/${accountId}/warning-blocks`, 'POST', data);
}

/* ─── Beneficiaries ─── */

export function getBeneficiaries(accountId: string) {
  return request(`/api/beneficiaries/${accountId}`, 'GET');
}

/* ─── Countries ─── */

export function getCountries(params?: { code?: string; iso_alpha2?: string; iso_alpha3?: string }) {
  const qs = new URLSearchParams();
  if (params?.code) qs.set('code', params.code);
  if (params?.iso_alpha2) qs.set('iso_alpha2', params.iso_alpha2);
  if (params?.iso_alpha3) qs.set('iso_alpha3', params.iso_alpha3);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return request(`/api/countries${query}`, 'GET');
}

/* ─── Party Parameters ─── */

export function getPartyParameters(parameterId: string) {
  return request(`/api/party-parameters/${parameterId}`, 'GET');
}
