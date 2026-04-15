function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDonorQueryFromSearchParams(searchParams, limit = 50) {
  const query = { limit };

  if (!searchParams || typeof searchParams !== 'object') {
    return query;
  }

  if (searchParams.bloodType) query.blood_group = searchParams.bloodType;
  if (searchParams.state) query.state = searchParams.state;
  if (searchParams.district) query.district = searchParams.district;
  if (searchParams.gender) query.gender = String(searchParams.gender).toLowerCase();

  const age = Number(searchParams.age);
  if (Number.isFinite(age) && age >= 18) {
    query.age = age;
  }

  return query;
}

function formatDonorGender(gender) {
  if (!gender) return '-';
  const normalized = String(gender).trim();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '-';
}

function renderDonorRows(donors, { includePhone = false } = {}) {
  return donors.map((donor) => {
    const cells = [
      donor.name || '-',
      donor.blood_group || '-',
      donor.age != null ? donor.age : '-',
      formatDonorGender(donor.gender),
      donor.state || '-',
      donor.district || '-'
    ];

    if (includePhone) {
      cells.push(donor.phone || '-');
    }

    return `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
  }).join('');
}

async function loadDonorResultsFromStorage({
  resultsSelector,
  searchParamsKey = 'searchParams',
  includePhone = false,
  emptyMessage,
  loadingMessage,
  noSearchMessage,
  errorMessage
}) {
  const resultsBody = document.querySelector(resultsSelector);
  const searchParamsRaw = localStorage.getItem(searchParamsKey);
  const searchParams = searchParamsRaw ? JSON.parse(searchParamsRaw) : null;

  if (!resultsBody) return;

  if (!searchParams) {
    resultsBody.innerHTML = `<tr><td colspan='${includePhone ? 7 : 6}'>${escapeHtml(noSearchMessage || 'No search parameters found.')}</td></tr>`;
    return;
  }

  resultsBody.innerHTML = `<tr><td colspan='${includePhone ? 7 : 6}'>${escapeHtml(loadingMessage || 'Loading donors...')}</td></tr>`;

  try {
    const donors = await listDonors(buildDonorQueryFromSearchParams(searchParams, 50));

    if (!Array.isArray(donors) || !donors.length) {
      resultsBody.innerHTML = `<tr><td colspan='${includePhone ? 7 : 6}'>${escapeHtml(emptyMessage || 'No donors found.')}</td></tr>`;
      return;
    }

    resultsBody.innerHTML = renderDonorRows(donors, { includePhone });
  } catch (error) {
    resultsBody.innerHTML = `<tr><td colspan='${includePhone ? 7 : 6}'>${escapeHtml(errorMessage || error?.message || 'Failed to load donors.')}</td></tr>`;
  }
}