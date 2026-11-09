// Development only, never deployed. A tiny stand in for the Supabase REST API serving 3 sample jobs, so public pages can be viewed and tested without a real database.
// Run: node scripts/dev/fake-postgrest.js   then build with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399
// A tiny stand-in for the database, serving two sample jobs, so the public pages can be viewed here.
const http = require('http');
const emp = { claimed: false, clinic_name: 'Harbourside Optical', practice_type: 'independent', website: 'https://example.ca', city: 'Victoria', province: 'British Columbia', about: 'A family owned clinic in the heart of Victoria, with 3 optometrists and a team of 9.' };
const base = { work_arrangement: 'on_site', territory: null, pay_extras: null, employer_id: 'e1', employment_type: 'Full time', is_existing_vacancy: true, uses_ai_screening: false, apply_method: 'kestrel', apply_url: null, is_seeded: false, posted_at: '2026-10-20T12:00:00Z', expires_at: '2099-01-01T00:00:00Z' };
const jobs = [
  { ...base, id: '44444444-4444-4444-8444-444444444444', title: 'Associate optometrist, daily rate', role_category: 'Optometrist', province: 'Ontario', city: 'Toronto', pay_period: 'day', pay_min: 900, pay_max: 1100, tags_software: ['RevolutionEHR'], tags_equipment: ['Optos', 'OCT'], tags_specialties: ['Dry eye and IPL'], description: 'A busy independent practice needs an associate optometrist 4 days a week, paid a daily rate.', employers: emp },
  { ...base, id: '55555555-5555-4555-8555-555555555555', title: 'Optometrist, percentage of production', role_category: 'Optometrist', employment_type: 'Part time', province: 'Ontario', city: 'Ottawa', pay_period: null, pay_min: null, pay_max: null, pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: 'production', tags_software: ['Wink'], tags_equipment: ['Humphrey visual field', 'Topographer'], tags_specialties: ['Myopia control and ortho-k', 'Vision therapy'], description: 'Two to three days a week in a friendly clinic, paid a percentage of production.', employers: emp },
  { ...base, id: '66666666-6666-4666-8666-666666666666', title: 'Optometrist, daily minimum with a percentage', role_category: 'Optometrist', province: 'British Columbia', city: 'Kelowna', pay_period: 'day', pay_min: 600, pay_max: 800, pay_is_minimum: true, pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: 'collections', tags_software: ['Visual Eyes', 'Acuitas'], tags_equipment: ['Optos'], tags_specialties: [], pay_extras: 'Continuing education allowance', description: 'A guaranteed daily minimum, or a percentage of collections when that comes to more.', employers: emp },
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
  for (const col of ['tags_software', 'tags_equipment', 'tags_specialties']) { const ov = url.searchParams.get(col); if (ov && ov.startsWith('ov.')) { const want = ov.slice(4, -1).split(',').map((x) => x.replace(/"/g, '')); rows = rows.filter((j) => (j[col] || []).some((x) => want.includes(x))); } }
  const practice = url.searchParams.get('employers.practice_type');
  if (practice && practice.startsWith('eq.')) rows = rows.filter((j) => j.employers.practice_type === practice.slice(3));
  console.log('REQ', req.method, decodeURIComponent(req.url).slice(0, 220));
  if (wantsObject) { if (!rows.length) { res.writeHead(406, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ code: 'PGRST116', message: 'no rows', details: '', hint: '' })); } res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(rows[0])); }
  res.writeHead(200, { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
  res.end(JSON.stringify(rows));
}).listen(54399, () => console.log('fake database on 54399'));
