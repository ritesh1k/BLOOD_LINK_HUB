// Minimal API helper for frontend to talk to backend
function normalizeBase(base) {
  return String(base || '').trim().replace(/\/+$/, '');
}

function getCandidateApiBases() {
  const saved = normalizeBase(localStorage.getItem('api_base'));
  const candidates = [];

  if (saved) candidates.push(saved);

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    if (protocol === 'http:' || protocol === 'https:') {
      candidates.push(`${protocol}//${hostname}:3000`);
    }
  }

  candidates.push('http://localhost:3000');
  candidates.push('http://127.0.0.1:3000');

  return [...new Set(candidates.filter(Boolean).map(normalizeBase))];
}

let API_BASE = getCandidateApiBases()[0] || 'http://localhost:3000';
function setToken(t){ localStorage.setItem('token', t); }
function getToken(){ return localStorage.getItem('token'); }

function setApiBase(base) {
  API_BASE = normalizeBase(base);
  localStorage.setItem('api_base', API_BASE);
}

async function api(path, { method='GET', data=null, auth=false } = {}) {
  function extractErrorMessage(errBody, fallback = 'Request failed') {
    if (!errBody) return fallback;
    if (typeof errBody === 'string') return errBody;
    if (errBody.error && typeof errBody.error === 'string') return errBody.error;
    if (errBody.message && typeof errBody.message === 'string') return errBody.message;
    if (Array.isArray(errBody.errors) && errBody.errors.length) {
      const first = errBody.errors[0];
      if (typeof first === 'string') return first;
      if (first && typeof first.msg === 'string') return first.msg;
      return 'Validation failed';
    }
    return fallback;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  const bases = [API_BASE, ...getCandidateApiBases()].filter((base, idx, arr) => arr.indexOf(base) === idx);
  let lastNetworkError = null;
  let lastHttpError = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/api${path}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null
      });

      if (base !== API_BASE) setApiBase(base);

      if (!res.ok) {
        const err = await res.json().catch(()=>null);
        const message = extractErrorMessage(err, `Request failed (${res.status})`);

        // If a candidate base returns not found/method errors, try next base.
        if ((res.status === 404 || res.status === 405) && base !== bases[bases.length - 1]) {
          lastHttpError = new Error(message);
          continue;
        }

        throw new Error(message);
      }
      return res.json().catch(()=>({ ok:true }));
    } catch (error) {
      // Network errors usually surface as TypeError in fetch.
      if (error instanceof TypeError) {
        lastNetworkError = error;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    (lastHttpError ? lastHttpError.message : 'Cannot reach backend API. Start backend server and ensure API is available on port 3000, or set localStorage.api_base to your API URL.') +
    (lastNetworkError && !lastHttpError ? ` (${lastNetworkError.message})` : '')
  );
}

// Example bindings (you can call these from your existing forms)
async function registerUser({name, email, password, blood_group, role, phone}) {
  const payload = { name, email, password, blood_group };
  if (role === 'donor' || role === 'receiver') {
    payload.role = role;
  }
  if (phone) {
    payload.phone = String(phone).trim();
  }
  return api('/auth/register', { method:'POST', data: payload });
}
async function loginUser({email, password, role}) {
  const res = await api('/auth/login', { method:'POST', data:{email, password, role} });
  if (res.token) setToken(res.token);
  return res;
}

async function forgotPassword({ email, role }) {
  return api('/auth/forgot-password', {
    method: 'POST',
    data: { email, role }
  });
}

async function resetPassword({ token, new_password }) {
  return api('/auth/reset-password', {
    method: 'POST',
    data: { token, new_password }
  });
}

async function adminLogin({ admin_id, password }) {
  const res = await api('/auth/admin-login', { method:'POST', data:{ admin_id, password } });
  if (res.token) {
    setToken(res.token);
    localStorage.setItem('admin_session', JSON.stringify({ admin_id: res.admin?.admin_id || admin_id, role: 'admin' }));
  }
  return res;
}
async function listDonors(filter = {}) {
  const qs = new URLSearchParams(filter).toString();
  return api('/donors' + (qs ? `?${qs}` : ''));
}

async function listAvailableDonorsForReceiver(filter = {}) {
  const qs = new URLSearchParams(filter).toString();
  return api('/donors/available' + (qs ? `?${qs}` : ''), { auth: true });
}

async function connectWithDonor(donorId, payload = {}) {
  return api(`/donors/${donorId}/connect`, { method: 'POST', data: payload, auth: true });
}

async function listAdminDonors(filter = {}) {
  const qs = new URLSearchParams(filter).toString();
  return api('/donors/admin/list' + (qs ? `?${qs}` : ''), { auth: true });
}

async function listAdminReceivers(filter = {}) {
  const qs = new URLSearchParams(filter).toString();
  return api('/donors/admin/receivers' + (qs ? `?${qs}` : ''), { auth: true });
}

async function getAdminDashboardSummary() {
  return api('/donors/admin/summary', { auth: true });
}

async function createAdminDonorRecord(payload) {
  return api('/donors/admin', { method: 'POST', data: payload, auth: true });
}

async function updateAdminDonorRecord(id, payload) {
  return api(`/donors/admin/${id}`, { method: 'PUT', data: payload, auth: true });
}

async function deleteAdminDonorRecord(id) {
  return api(`/donors/admin/${id}`, { method: 'DELETE', auth: true });
}
async function markAvailability({city, contact}) {
  return api('/donors/availability', { method:'POST', data:{city, contact}, auth:true });
}
async function createRequest({blood_group, quantity}) {
  return api('/requests', { method:'POST', data:{blood_group, quantity}, auth:true });
}

async function createDetailedRequest(payload) {
  return api('/requests', { method: 'POST', data: payload, auth: true });
}

async function myRequests() {
  return api('/requests/my', { auth:true });
}

async function listDonorRequests() {
  return api('/requests/donor/list', { auth: true });
}

async function acceptDonorRequest(id) {
  return api(`/requests/${id}/accept`, { method: 'PUT', auth: true });
}

async function listAdminRequests(filter = {}) {
  const qs = new URLSearchParams(filter).toString();
  return api('/requests/admin/list' + (qs ? `?${qs}` : ''), { auth: true });
}

async function updateAdminRequestStatus(id, status) {
  return api(`/requests/admin/${id}/status`, {
    method: 'PUT',
    data: { status },
    auth: true
  });
}

async function deleteAdminRequest(id) {
  return api(`/requests/admin/${id}`, { method: 'DELETE', auth: true });
}

async function createAppointment({ user_id=null, full_name, email, phone, appointment_date, appointment_time, purpose='donation' }) {
  return api('/interactions/appointments', {
    method:'POST',
    data:{ user_id, full_name, email, phone, appointment_date, appointment_time, purpose }
  });
}

async function submitContactMessage({ user_id=null, name, email, subject, message }) {
  return api('/interactions/contact', {
    method:'POST',
    data:{ user_id, name, email, subject, message }
  });
}

async function subscribeNewsletter({ email, full_name=null, source_page='index.html' }) {
  return api('/interactions/newsletter', {
    method:'POST',
    data:{ email, full_name, source_page }
  });
}

async function listAdminAppointments({ status, from_date, to_date, limit=100 } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (from_date) qs.set('from_date', from_date);
  if (to_date) qs.set('to_date', to_date);
  qs.set('limit', String(limit));
  return api('/interactions/admin/appointments' + (qs.toString() ? `?${qs.toString()}` : ''), { auth:true });
}

async function updateAdminAppointmentStatus(id, status) {
  return api(`/interactions/admin/appointments/${id}/status`, {
    method: 'PUT',
    data: { status },
    auth: true
  });
}

async function listAdminContactMessages({ status, limit=100 } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  qs.set('limit', String(limit));
  return api('/interactions/admin/contact-messages' + (qs.toString() ? `?${qs.toString()}` : ''), { auth:true });
}

async function updateAdminContactMessageStatus(id, status) {
  return api(`/interactions/admin/contact-messages/${id}/status`, {
    method: 'PUT',
    data: { status },
    auth: true
  });
}

async function listAdminNewsletterSubscriptions({ is_active, limit=200 } = {}) {
  const qs = new URLSearchParams();
  if (typeof is_active !== 'undefined') qs.set('is_active', String(is_active ? 1 : 0));
  qs.set('limit', String(limit));
  return api('/interactions/admin/newsletter-subscriptions' + (qs.toString() ? `?${qs.toString()}` : ''), { auth:true });
}

async function listAdminNotificationLogs({ channel, delivery_status, related_entity_type, limit=100 } = {}) {
  const qs = new URLSearchParams();
  if (channel) qs.set('channel', channel);
  if (delivery_status) qs.set('delivery_status', delivery_status);
  if (related_entity_type) qs.set('related_entity_type', related_entity_type);
  qs.set('limit', String(limit));

  return api('/interactions/admin/notification-logs' + (qs.toString() ? `?${qs.toString()}` : ''), { auth: true });
}
