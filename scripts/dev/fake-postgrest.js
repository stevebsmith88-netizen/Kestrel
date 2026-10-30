// Development only, never deployed. A tiny stand in for the Supabase REST API serving 3 sample jobs, so public pages can be viewed and tested without a real database.
// Run: node scripts/dev/fake-postgrest.js   then build with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399
// A tiny stand-in for the database, serving two sample jobs, so the public pages can be viewed here.
const http = require('http');
const emp = { claimed: false, clinic_name: 'Harbourside Optical', practice_type: 'independent', website: 'https://example.ca', city: 'Victoria', province: 'British Columbia', about: 'A family owned clinic in the heart of Victoria, with 3 optometrists and a team of 9.' };
const base = { work_arrangement: 'on_site', territory: null, pay_extras: null, employer_id: 'e1', employment_type: 'Full time', is_existing_vacancy: true, uses_ai_screening: false, apply_method: 'kestrel', apply_url: null, is_seeded: false, posted_at: '2026-10-20T12:00:00Z', expires_at: '2099-01-01T00:00:00Z' };
const jobs = [
  { ...base, id: '11111111-1111-4111-8111-111111111111', title: 'Optician', role_category: 'Optician', province: 'British Columbia', city: 'Victoria', pay_period: 'year', pay_min: 62000, pay_max: 74000, description: 'Join a friendly, busy independent clinic in Victoria as our full time optician.\n\nWhat we offer\nA 4 day week, mentoring and extended health benefits.', employers: emp },
  { ...base, id: '22222222-2222-4222-8222-222222222222', title: 'Optometric assistant', role_category: 'Optometric assistant or technician', employment_type: 'Part time', province: 'Ontario', city: 'Toronto', pay_period: 'hour', pay_min: 24, pay_max: 28.5, is_seeded: true, apply_method: 'external', apply_url: 'https://example.ca/careers', description: 'Help our team with pre testing and patient flow.', employers: { ...emp, clinic_name: 'Maple Grove Eye Care', practice_type: 'corporate', city: 'Toronto', province: 'Ontario', website: null } },
  { ...base, id: '33333333-3333-4333-8333-333333333333', title: 'Territory representative', role_category: 'Sales or territory representative', work_arrangement: 'field', territory: 'Southern Ontario and Ottawa', pay_extras: 'Plus commission and a company vehicle', province: 'Ontario', city: 'Toronto', pay_period: 'year', pay_min: 62000, pay_max: 78000, description: 'Visit optical practices across Southern Ontario, show our lens range and look after your accounts.', employers: { ...emp, claimed: true, clinic_name: 'Clearview Lens Co', practice_type: 'supplier', city: 'Toronto', province: 'Ontario', website: null } },
];
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const wantsObject = (req.headers.accept || '').includes('pgrst.object');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!url.pathname.startsWith('/rest/v1/jobs')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('[]'); }
  let rows = jobs;
  const idEq = url.searchParams.get('id');
  if (idEq && idEq.startsWith('eq.')) rows = jobs.filter((j) => j.id === idEq.slice(3));
  const q = url.searchParams.get('or'); const prov = url.searchParams.get('province');
  if (prov && prov.startsWith('eq.')) rows = rows.filter((j) => j.province === prov.slice(3));
  const practice = url.searchParams.get('employers.practice_type');
  if (practice && practice.startsWith('eq.')) rows = rows.filter((j) => j.employers.practice_type === practice.slice(3));
  console.log('REQ', req.method, decodeURIComponent(req.url).slice(0, 220));
  if (wantsObject) { if (!rows.length) { res.writeHead(406, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ code: 'PGRST116', message: 'no rows', details: '', hint: '' })); } res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(rows[0])); }
  res.writeHead(200, { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
  res.end(JSON.stringify(rows));
}).listen(54399, () => console.log('fake database on 54399'));
