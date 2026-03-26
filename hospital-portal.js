// ===== DATA STORE =====
const DB = {
  beds: generateBeds(),
  blood: {
    'A+': {units:245,capacity:300}, 'A-': {units:45,capacity:150}, 'B+': {units:180,capacity:250},
    'B-': {units:30,capacity:100}, 'AB+': {units:95,capacity:150}, 'AB-': {units:18,capacity:80},
    'O+': {units:310,capacity:400}, 'O-': {units:55,capacity:200}
  },
  oxygen: [
    {id:'OT-01',name:'Cylinder Bank A',pct:78,location:'ICU',type:'Medical O2',kpa:1820,rate:'8 L/min'},
    {id:'OT-02',name:'Cylinder Bank B',pct:55,location:'Ward 3',type:'Medical O2',kpa:1320,rate:'6 L/min'},
    {id:'OT-03',name:'Liquid Tank',pct:92,location:'Central',type:'LOX',kpa:null,rate:'Central'},
    {id:'OT-04',name:'Cylinder Bank C',pct:22,location:'Emergency',type:'Medical O2',kpa:520,rate:'12 L/min'},
    {id:'OT-05',name:'Cylinder Bank D',pct:68,location:'OT',type:'Medical O2',kpa:1600,rate:'4 L/min'},
    {id:'OT-06',name:'Portable Unit 1',pct:41,location:'Ambulance',type:'Portable',kpa:980,rate:'4 L/min'}
  ],
  ambulances: [
    {id:'AMB-01',reg:'DL-01-EA-1234',driver:'Rajesh Kumar',contact:'9810000001',status:'active',location:'Connaught Place',eta:'8 min',patient:'Mrs. Sharma',lastService:'2026-01-15',fuel:82,type:'ALS'},
    {id:'AMB-02',reg:'DL-02-EA-5678',driver:'Sunil Yadav',contact:'9810000002',status:'available',location:'Hospital Base',eta:'-',patient:'-',lastService:'2026-02-10',fuel:97,type:'BLS'},
    {id:'AMB-03',reg:'DL-03-EA-9012',driver:'Mohit Singh',contact:'9810000003',status:'maintenance',location:'Garage',eta:'-',patient:'-',lastService:'2026-03-01',fuel:35,type:'ALS'},
    {id:'AMB-04',reg:'DL-04-EA-3456',driver:'Pankaj Gupta',contact:'9810000004',status:'active',location:'Dwarka Sector 9',eta:'14 min',patient:'Mr. Verma',lastService:'2026-01-28',fuel:65,type:'ALS'},
    {id:'AMB-05',reg:'DL-05-EA-7890',driver:'Amit Chauhan',contact:'9810000005',status:'available',location:'Hospital Base',eta:'-',patient:'-',lastService:'2026-03-10',fuel:100,type:'NICU'},
  ],
  staff: [
    {id:'S001',name:'Dr. Arjun Mehta',role:'Chief Surgeon',dept:'Surgery',shift:'Morning',status:'on-duty',phone:'9810001001',email:'arjun.mehta@hosp.com',join:'2018-03-12'},
    {id:'S002',name:'Dr. Priya Sharma',role:'Cardiologist',dept:'Cardiology',shift:'Morning',status:'on-duty',phone:'9810001002',email:'priya.sharma@hosp.com',join:'2019-07-22'},
    {id:'S003',name:'Dr. Vikram Nair',role:'Neurologist',dept:'Neurology',shift:'Evening',status:'off-duty',phone:'9810001003',email:'vikram.nair@hosp.com',join:'2017-01-05'},
    {id:'S004',name:'Nurse Sunita Patel',role:'Head Nurse',dept:'ICU',shift:'Night',status:'on-duty',phone:'9810001004',email:'sunita.patel@hosp.com',join:'2020-11-30'},
    {id:'S005',name:'Dr. Kavitha Rao',role:'Pediatrician',dept:'Pediatrics',shift:'Morning',status:'on-leave',phone:'9810001005',email:'kavitha.rao@hosp.com',join:'2021-04-15'},
    {id:'S006',name:'Nurse Rohit Das',role:'Staff Nurse',dept:'Ward 2',shift:'Morning',status:'on-duty',phone:'9810001006',email:'rohit.das@hosp.com',join:'2022-08-01'},
    {id:'S007',name:'Dr. Fatima Khan',role:'Radiologist',dept:'Radiology',shift:'Evening',status:'on-duty',phone:'9810001007',email:'fatima.khan@hosp.com',join:'2020-06-18'},
    {id:'S008',name:'Mr. Suresh Nanda',role:'Lab Technician',dept:'Pathology',shift:'Morning',status:'on-duty',phone:'9810001008',email:'suresh.nanda@hosp.com',join:'2019-09-25'},
  ],
  emergencies: [
    {id:'EMR-2401',type:'Cardiac Arrest',patient:'Unknown Male, ~45yrs',location:'Rajiv Chowk Metro',priority:'critical',time:'16:32',status:'pending',caller:'Police PCR',details:'Collapsed near gate no. 5. CPR in progress by bystander.',requestedBy:'Delhi Police'},
    {id:'EMR-2402',type:'Road Accident - Multiple Casualties',patient:'3 victims',location:'NH-8 near Mahipalpur',priority:'critical',time:'16:28',status:'pending',caller:'Highway Patrol',details:'Truck-bus collision. 3 critical, 7 injured. Need trauma team.',requestedBy:'Highway Patrol'},
    {id:'EMR-2403',type:'Severe Burns',patient:'Child, ~8yrs',location:'Dwarka Sector 7',priority:'high',time:'16:20',status:'approved',caller:'Parent',details:'Burns covering 40% body from kitchen fire. Stable vitals.',requestedBy:'Parent'},
    {id:'EMR-2404',type:'Poisoning',patient:'Ms. Neha Singh, 28',location:'Rohini Block C',priority:'high',time:'16:10',status:'pending',caller:'Family',details:'Suspected drug overdose. Unconscious, breathing shallow.',requestedBy:'Family Member'},
    {id:'EMR-2405',type:'Stroke Symptoms',patient:'Mr. Ram Prasad, 67',location:'Karol Bagh',priority:'medium',time:'15:55',status:'declined',caller:'Neighbor',details:'Sudden weakness left side, slurred speech.',requestedBy:'Neighbor'},
    {id:'EMR-2406',type:'Premature Labour',patient:'Mrs. Anjali Gupta, 32',location:'Lajpat Nagar',priority:'high',time:'15:40',status:'pending',caller:'Husband',details:'28 weeks pregnant. Active labour. Need OB team.',requestedBy:'Husband'},
  ],
  notifications: [],
  activityLog: [
    {msg:'Bed ICU-04 marked as occupied - Patient Sharma', time:'16:41', color:'var(--danger)'},
    {msg:'Blood B+ restocked: +50 units', time:'16:35', color:'var(--accent3)'},
    {msg:'Emergency EMR-2403 approved by Admin', time:'16:30', color:'var(--accent)'},
    {msg:'Ambulance AMB-01 dispatched to Rajiv Chowk', time:'16:28', color:'var(--warn)'},
    {msg:'Dr. Kavitha Rao marked on leave', time:'16:15', color:'var(--muted)'},
    {msg:'Oxygen Bank C - LOW ALERT: 22%', time:'16:01', color:'var(--danger)'},
  ]
};

function generateBeds() {
  const wards = ['ICU','General','Emergency','Pediatric','Maternity','Ortho','Cardiac'];
  const beds = [];
  wards.forEach(w => {
    const count = w === 'ICU' ? 12 : w === 'Emergency' ? 16 : 20;
    for (let i = 1; i <= count; i++) {
      const r = Math.random();
      beds.push({
        id: `${w.substring(0,3).toUpperCase()}-${String(i).padStart(2,'0')}`,
        ward: w, num: i,
        status: r < 0.55 ? 'occupied' : r < 0.8 ? 'available' : r < 0.92 ? 'reserved' : 'maintenance',
        patient: r < 0.55 ? randomPatient() : null,
        doctor: r < 0.55 ? randomDoc() : null,
      });
    }
  });
  return beds;
}
function randomPatient() {
  const names = ['Ramesh Gupta','Sita Devi','Arun Kumar','Priya Verma','Mohan Sharma','Lakshmi Patel','Vijay Singh','Rekha Joshi'];
  return names[Math.floor(Math.random()*names.length)];
}
function randomDoc() {
  const docs = ['Dr. Mehta','Dr. Sharma','Dr. Nair','Dr. Rao','Dr. Khan'];
  return docs[Math.floor(Math.random()*docs.length)];
}

// ===== NAV =====
const navTabs = document.querySelectorAll('.nav-tab');
const sections = document.querySelectorAll('.section');
function showSection(id) {
  sections.forEach(s => s.classList.remove('active'));
  navTabs.forEach(t => t.classList.remove('active'));
  document.getElementById(id) && document.getElementById(id).classList.add('active');
  document.querySelector(`[data-section="${id}"]`) && document.querySelector(`[data-section="${id}"]`).classList.add('active');
}
navTabs.forEach(tab => {
  tab.addEventListener('click', () => showSection(tab.dataset.section));
});

// ===== CLOCK =====
function updateClock() {
  const el = document.getElementById('navClock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
setInterval(updateClock, 1000); updateClock();

// ===== TOAST =====
function showToast(msg, type='info') {
  const icons = {success:'✅', error:'❌', info:'ℹ️', warn:'⚠️'};
  const el = document.createElement('div');
  el.className = `toast ${type === 'warn' ? 'info' : type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toaster').appendChild(el);
  setTimeout(() => el.remove(), 3500);
  DB.activityLog.unshift({msg, time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}), color: type==='error'?'var(--danger)':type==='success'?'var(--accent3)':'var(--accent)'});
  renderActivity();
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if(e.target === m) m.classList.remove('open'); }));
document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => b.closest('.modal-overlay').classList.remove('open')));

// ===== DASHBOARD =====
function renderDashboard() {
  const total = DB.beds.length;
  const occ = DB.beds.filter(b=>b.status==='occupied').length;
  const avail = DB.beds.filter(b=>b.status==='available').length;
  const pending = DB.emergencies.filter(e=>e.status==='pending').length;
  setValue('dashBeds', occ);
  setValue('dashAvail', avail);
  setValue('dashEmerg', pending);
  setValue('dashStaff', DB.staff.filter(s=>s.status==='on-duty').length);
  renderActivity();
  // mini charts
  renderMiniChart('miniChart1',[40,60,55,75,80,72,90]);
  renderMiniChart('miniChart2',[30,45,60,50,70,65,80]);
}
function setValue(id, val) { const el = document.getElementById(id); if(el) el.textContent = val; }
function renderActivity() {
  const el = document.getElementById('activityFeed');
  if (!el) return;
  el.innerHTML = DB.activityLog.slice(0,8).map(a=>`
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color}"></div>
      <div class="activity-content">${a.msg}</div>
      <div class="activity-time">${a.time}</div>
    </div>`).join('');
}
function renderMiniChart(id, data) {
  const el = document.getElementById(id);
  if (!el) return;
  const max = Math.max(...data);
  el.innerHTML = data.map(v=>`<div class="mini-bar" style="height:${(v/max)*36}px"></div>`).join('');
}

// ===== BEDS =====
let currentWard = 'All';
function renderBeds() {
  const filter = document.getElementById('bedStatusFilter')?.value || 'all';
  const ward = currentWard;
  const filtered = DB.beds.filter(b => (ward==='All'||b.ward===ward) && (filter==='all'||b.status===filter));
  const el = document.getElementById('bedGrid');
  if (!el) return;
  el.innerHTML = filtered.map(b=>`
    <div class="bed-item ${b.status}" onclick="showBedDetail('${b.id}')">
      <div class="bed-icon">${b.status==='occupied'?'🛏️':b.status==='available'?'✅':b.status==='reserved'?'🔖':'🔧'}</div>
      <div class="bed-num">${b.id}</div>
      <div class="bed-status">${b.status}</div>
    </div>`).join('');
  // stats
  const w = ward === 'All' ? DB.beds : DB.beds.filter(b=>b.ward===ward);
  setValue('bedTotal', w.length);
  setValue('bedOcc', w.filter(b=>b.status==='occupied').length);
  setValue('bedAvail', w.filter(b=>b.status==='available').length);
  setValue('bedMaint', w.filter(b=>b.status==='maintenance').length);
}
function showBedDetail(id) {
  const bed = DB.beds.find(b=>b.id===id);
  if (!bed) return;
  const content = document.getElementById('bedModalContent');
  content.innerHTML = `
    <div class="form-group"><label class="form-label">Bed ID</label><div style="font-family:'Orbitron',monospace;font-size:18px;color:var(--accent)">${bed.id}</div></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Ward</label><div>${bed.ward}</div></div>
      <div class="form-group"><label class="form-label">Status</label><div><span class="badge ${bed.status==='occupied'?'badge-red':bed.status==='available'?'badge-green':bed.status==='reserved'?'badge-yellow':'badge-blue'}">${bed.status}</span></div></div>
    </div>
    ${bed.patient?`<div class="form-row"><div class="form-group"><label class="form-label">Patient</label><div>${bed.patient}</div></div><div class="form-group"><label class="form-label">Doctor</label><div>${bed.doctor}</div></div></div>`:''}
    <div class="form-group mt-16"><label class="form-label">Change Status</label>
      <div class="flex-gap"><select class="form-control" id="bedStatusChange"><option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option><option value="maintenance">Maintenance</option></select>
      <button class="btn btn-primary btn-sm" onclick="changeBedStatus('${bed.id}')">Update</button></div>
    </div>`;
  document.getElementById('bedModalId').textContent = bed.id;
  openModal('bedModal');
}
function changeBedStatus(id) {
  const bed = DB.beds.find(b=>b.id===id);
  const newStatus = document.getElementById('bedStatusChange').value;
  if (newStatus==='occupied' && !bed.patient) bed.patient = 'New Patient';
  if (newStatus!=='occupied') bed.patient = null;
  bed.status = newStatus;
  closeModal('bedModal');
  renderBeds();
  showToast(`Bed ${id} updated to ${newStatus}`, 'success');
}
document.querySelectorAll('.ward-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.ward-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); currentWard = b.dataset.ward; renderBeds();
}));
document.getElementById('bedStatusFilter')?.addEventListener('change', renderBeds);

// ===== BLOOD =====
function renderBlood() {
  const el = document.getElementById('bloodGrid');
  if (!el) return;
  el.innerHTML = Object.entries(DB.blood).map(([type,d])=>{
    const pct = Math.round((d.units/d.capacity)*100);
    const cls = pct<30?'low':pct<60?'med':'ok';
    return `<div class="blood-card">
      <div class="blood-type">${type}</div>
      <div class="blood-units">${d.units}</div>
      <div class="blood-label">units / ${d.capacity}</div>
      <div class="blood-bar"><div class="blood-fill ${cls}" style="width:${pct}%"></div></div>
      <div class="flex-between mt-8">
        <span class="badge ${pct<30?'badge-red':pct<60?'badge-yellow':'badge-green'}" style="font-size:10px">${pct}%</span>
        <button class="btn btn-xs btn-ghost" onclick="requestBlood('${type}')">Request</button>
      </div>
    </div>`;
  }).join('');
  // alerts
  const alerts = Object.entries(DB.blood).filter(([,d])=>(d.units/d.capacity)<0.3);
  const alertEl = document.getElementById('bloodAlerts');
  if (alertEl) alertEl.innerHTML = alerts.length ? alerts.map(([t,d])=>`<div class="alert alert-danger"><span>🚨</span><span>Blood type <strong>${t}</strong> critically low: ${d.units} units remaining (${Math.round((d.units/d.capacity)*100)}%)</span></div>`).join('') : '<div class="alert alert-success"><span>✅</span><span>All blood types at acceptable levels.</span></div>';
}
function requestBlood(type) { showToast(`Blood request sent for type ${type}`, 'info'); }
function addBloodUnits() {
  const type = document.getElementById('bloodTypeSelect').value;
  const units = parseInt(document.getElementById('bloodUnitsInput').value)||0;
  if (!DB.blood[type] || units<=0) { showToast('Invalid input','error'); return; }
  DB.blood[type].units = Math.min(DB.blood[type].capacity, DB.blood[type].units + units);
  closeModal('bloodModal'); renderBlood(); showToast(`Added ${units} units of ${type}`, 'success');
}
function deductBloodUnits() {
  const type = document.getElementById('bloodTypeSelect').value;
  const units = parseInt(document.getElementById('bloodUnitsInput').value)||0;
  if (!DB.blood[type] || units<=0) { showToast('Invalid input','error'); return; }
  if (DB.blood[type].units < units) { showToast('Insufficient units', 'error'); return; }
  DB.blood[type].units -= units;
  closeModal('bloodModal'); renderBlood(); showToast(`Used ${units} units of ${type}`, 'warn');
}

// ===== OXYGEN =====
function renderOxygen() {
  const el = document.getElementById('oxygenGrid');
  if (!el) return;
  el.innerHTML = DB.oxygen.map(o=>{
    const cls = o.pct > 60 ? 'full' : o.pct > 35 ? 'med' : 'low';
    const statusBadge = o.pct > 60 ? 'badge-green' : o.pct > 35 ? 'badge-yellow' : 'badge-red';
    return `<div class="card">
      <div class="card-header"><span class="fw-600 text-accent" style="font-family:'Orbitron',monospace">${o.id}</span>
        <span class="badge ${statusBadge}">${o.pct > 60 ? 'OK' : o.pct > 35 ? 'LOW' : 'CRITICAL'}</span></div>
      <div class="oxy-gauge">
        <div class="oxy-ring ${cls}">
          <div class="oxy-inner"><div class="oxy-pct" style="color:${o.pct>60?'var(--accent3)':o.pct>35?'var(--warn)':'var(--danger)'}">${o.pct}%</div><div class="oxy-lbl">O₂</div></div>
        </div>
      </div>
      <div style="margin-top:14px">
        <div class="flex-between text-sm mb-8"><span class="text-muted">${o.name}</span></div>
        <div class="flex-between text-xs"><span class="text-muted">📍 ${o.location}</span><span class="text-muted">🔵 ${o.type}</span></div>
        ${o.kpa?`<div class="text-xs text-muted mt-8">Pressure: ${o.kpa} kPa | Flow: ${o.rate}</div>`:`<div class="text-xs text-muted mt-8">Central Supply | ${o.rate}</div>`}
      </div>
      <div class="flex-gap mt-12">
        <button class="btn btn-xs btn-ghost" style="flex:1" onclick="refillOxygen('${o.id}')">🔄 Refill</button>
        <button class="btn btn-xs btn-ghost" style="flex:1" onclick="replaceOxygen('${o.id}')">🔃 Replace</button>
      </div>
    </div>`;
  }).join('');
}
function refillOxygen(id) { const o=DB.oxygen.find(x=>x.id===id); if(o){o.pct=Math.min(100,o.pct+30); renderOxygen(); showToast(`${id} refilled to ${o.pct}%`,'success');} }
function replaceOxygen(id) { const o=DB.oxygen.find(x=>x.id===id); if(o){o.pct=100; if(o.kpa)o.kpa=2400; renderOxygen(); showToast(`${id} replaced - 100% capacity`,'success');} }

// ===== AMBULANCES =====
function renderAmbulances() {
  const filter = document.getElementById('ambFilter')?.value || 'all';
  const el = document.getElementById('ambulanceGrid');
  if (!el) return;
  const list = filter==='all' ? DB.ambulances : DB.ambulances.filter(a=>a.status===filter);
  el.innerHTML = list.map(a=>{
    const sc = {active:'badge-red',available:'badge-green',maintenance:'badge-yellow'};
    const icons = {ALS:'🚑', BLS:'🚐', NICU:'👶'};
    return `<div class="amb-card">
      <div class="amb-header">
        <div><div class="amb-id">${a.id} ${icons[a.type]||'🚑'}</div><div class="text-xs text-muted">${a.reg} · ${a.type}</div></div>
        <span class="badge ${sc[a.status]}">${a.status}</span>
      </div>
      <div class="amb-info">
        <div class="amb-info-item"><span class="amb-info-label">Driver</span><span class="amb-info-val">${a.driver}</span></div>
        <div class="amb-info-item"><span class="amb-info-label">Contact</span><span class="amb-info-val">${a.contact}</span></div>
        <div class="amb-info-item"><span class="amb-info-label">Location</span><span class="amb-info-val">📍 ${a.location}</span></div>
        <div class="amb-info-item"><span class="amb-info-label">ETA</span><span class="amb-info-val">⏱ ${a.eta}</span></div>
        ${a.patient!=='-'?`<div class="amb-info-item" style="grid-column:1/-1"><span class="amb-info-label">Patient</span><span class="amb-info-val">${a.patient}</span></div>`:''}
      </div>
      <div class="flex-between mt-12 text-xs text-muted">
        <span>⛽ Fuel: ${a.fuel}%</span>
        <span>🔧 Last Service: ${a.lastService}</span>
      </div>
      <div class="progress-bar mt-8"><div class="progress-fill ${a.fuel>60?'green':a.fuel>30?'yellow':'red'}" style="width:${a.fuel}%"></div></div>
      <div class="flex-gap mt-12">
        ${a.status==='available'?`<button class="btn btn-sm btn-primary" style="flex:1" onclick="dispatchAmb('${a.id}')">🚑 Dispatch</button>`:''}
        ${a.status==='active'?`<button class="btn btn-sm btn-warn" style="flex:1" onclick="recallAmb('${a.id}')">📡 Recall</button>`:''}
        ${a.status==='maintenance'?`<button class="btn btn-sm btn-success" style="flex:1" onclick="clearAmb('${a.id}')">✅ Clear</button>`:''}
        <button class="btn btn-sm btn-ghost" onclick="editAmb('${a.id}')">✏️</button>
      </div>
      ${a.status==='active'?'<div class="amb-track mt-8"><div class="amb-progress" style="width:60%"></div></div>':''}</div>`;
  }).join('');
  setValue('ambTotal', DB.ambulances.length);
  setValue('ambActive', DB.ambulances.filter(a=>a.status==='active').length);
  setValue('ambAvail', DB.ambulances.filter(a=>a.status==='available').length);
  setValue('ambMaint', DB.ambulances.filter(a=>a.status==='maintenance').length);
}
function dispatchAmb(id) { const a=DB.ambulances.find(x=>x.id===id); if(a){a.status='active';a.eta=Math.floor(Math.random()*20+5)+' min'; renderAmbulances(); showToast(`${id} dispatched`,'success');} }
function recallAmb(id) { const a=DB.ambulances.find(x=>x.id===id); if(a){a.status='available';a.location='Hospital Base';a.eta='-';a.patient='-'; renderAmbulances(); showToast(`${id} recalled to base`,'info');} }
function clearAmb(id) { const a=DB.ambulances.find(x=>x.id===id); if(a){a.status='available'; renderAmbulances(); showToast(`${id} cleared for service`,'success');} }
function editAmb(id) { showToast(`Edit ambulance ${id} - feature in fleet manager`,'info'); }
document.getElementById('ambFilter')?.addEventListener('change', renderAmbulances);

// ===== STAFF =====
let staffFilter = 'all';
function renderStaff() {
  const search = document.getElementById('staffSearch')?.value?.toLowerCase() || '';
  const el = document.getElementById('staffGrid');
  if (!el) return;
  const filtered = DB.staff.filter(s =>
    (staffFilter==='all' || s.status===staffFilter) &&
    (s.name.toLowerCase().includes(search) || s.dept.toLowerCase().includes(search) || s.role.toLowerCase().includes(search))
  );
  const colors = ['#00d4ff','#7c3aed','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6'];
  el.innerHTML = filtered.length ? filtered.map((s,i)=>{
    const sc = {'on-duty':'badge-green','off-duty':'badge-blue','on-leave':'badge-yellow'};
    const bg = colors[i % colors.length];
    const initials = s.name.split(' ').map(w=>w[0]).slice(0,2).join('');
    return `<div class="staff-card">
      <div class="staff-avatar" style="background:${bg}22;color:${bg}">${initials}</div>
      <div class="staff-info">
        <div class="staff-name">${s.name}</div>
        <div class="staff-role">${s.role} · ${s.dept}</div>
        <div class="flex-gap mt-8"><span class="badge ${sc[s.status]}">${s.status}</span><span class="text-xs text-muted">Shift: ${s.shift}</span></div>
      </div>
      <div class="staff-actions">
        <button class="btn btn-xs btn-ghost" onclick="editStaff('${s.id}')" title="Edit">✏️</button>
        <button class="btn btn-xs btn-danger" onclick="deleteStaff('${s.id}')" title="Delete">🗑️</button>
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;color:var(--muted);padding:40px">No staff found</div>';
  setValue('staffTotal', DB.staff.length);
  setValue('staffOnDuty', DB.staff.filter(s=>s.status==='on-duty').length);
  setValue('staffDoctors', DB.staff.filter(s=>s.role.startsWith('Dr.')).length);
  setValue('staffNurses', DB.staff.filter(s=>s.role.includes('Nurse')).length);
}
function deleteStaff(id) {
  if (!confirm('Remove this staff member?')) return;
  DB.staff = DB.staff.filter(s=>s.id!==id);
  renderStaff(); renderDashboard(); showToast('Staff member removed','error');
}
function editStaff(id) { const s=DB.staff.find(x=>x.id===id); if(s) showToast(`Editing ${s.name} - more options in full profile`,'info'); }
function addStaff() {
  const name=document.getElementById('staffName').value.trim();
  const role=document.getElementById('staffRole').value.trim();
  const dept=document.getElementById('staffDept').value;
  const shift=document.getElementById('staffShift').value;
  const phone=document.getElementById('staffPhone').value.trim();
  if (!name||!role||!dept) { showToast('Fill required fields','error'); return; }
  const id='S'+String(DB.staff.length+1).padStart(3,'0');
  DB.staff.push({id,name,role,dept,shift,status:'on-duty',phone,email:name.toLowerCase().replace(/ /g,'.')+`@hosp.com`,join:new Date().toISOString().split('T')[0]});
  closeModal('staffModal'); renderStaff(); renderDashboard(); showToast(`${name} added to staff`,'success');
}
document.getElementById('staffSearch')?.addEventListener('input', renderStaff);
document.querySelectorAll('[data-staff-filter]').forEach(b => b.addEventListener('click', ()=>{
  document.querySelectorAll('[data-staff-filter]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); staffFilter=b.dataset.staffFilter; renderStaff();
}));

// ===== EMERGENCY =====
let emergFilter = 'all';
function renderEmergency() {
  const el = document.getElementById('emergencyList');
  if (!el) return;
  const filtered = emergFilter==='all' ? DB.emergencies : DB.emergencies.filter(e=>e.status===emergFilter);
  el.innerHTML = filtered.map(e=>`
    <div class="emerg-card ${e.priority}">
      <div class="emerg-header">
        <div>
          <div class="emerg-priority blink">${e.priority === 'critical' ? '🔴 CRITICAL' : e.priority === 'high' ? '🟠 HIGH PRIORITY' : '🟡 MEDIUM'}</div>
          <div class="emerg-title">${e.type}</div>
          <div class="emerg-id">${e.id}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <span class="badge ${e.status==='pending'?'badge-yellow':e.status==='approved'?'badge-green':'badge-red'}">${e.status}</span>
          <div class="text-xs text-muted mt-8">⏰ ${e.time}</div>
        </div>
      </div>
      <div class="emerg-meta">
        <span>👤 ${e.patient}</span>
        <span>📍 ${e.location}</span>
        <span>📞 ${e.caller}</span>
        <span>🏥 Req by: ${e.requestedBy}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">${e.details}</div>
      <div class="emerg-actions">
        ${e.status==='pending'?`
          <button class="btn btn-sm btn-success" onclick="approveEmerg('${e.id}')">✅ Approve & Dispatch</button>
          <button class="btn btn-sm btn-danger" onclick="declineEmerg('${e.id}')">❌ Decline</button>
          <button class="btn btn-sm btn-ghost" onclick="escalateEmerg('${e.id}')">⬆️ Escalate</button>`
        : e.status==='approved' ? `<button class="btn btn-sm btn-ghost" onclick="closeEmerg('${e.id}')">✔ Mark Resolved</button><button class="btn btn-sm btn-danger" onclick="declineEmerg('${e.id}')">Cancel</button>`
        : `<button class="btn btn-sm btn-ghost" onclick="reopenEmerg('${e.id}')">🔄 Reopen</button>`}
      </div>
    </div>`).join('');
  setValue('emergPending', DB.emergencies.filter(e=>e.status==='pending').length);
  setValue('emergApproved', DB.emergencies.filter(e=>e.status==='approved').length);
  setValue('emergDeclined', DB.emergencies.filter(e=>e.status==='declined').length);
  setValue('emergTotal', DB.emergencies.length);
  // badge nav
  const nb = document.getElementById('navEmergBadge');
  if(nb) nb.textContent = DB.emergencies.filter(e=>e.status==='pending').length;
}
function approveEmerg(id) { const e=DB.emergencies.find(x=>x.id===id); if(e){e.status='approved'; renderEmergency(); renderDashboard(); showToast(`Emergency ${id} APPROVED - Dispatching resources`,'success');} }
function declineEmerg(id) { const e=DB.emergencies.find(x=>x.id===id); if(e){e.status='declined'; renderEmergency(); renderDashboard(); showToast(`Emergency ${id} declined`,'error');} }
function escalateEmerg(id) { showToast(`Emergency ${id} escalated to medical director`,'warn'); }
function closeEmerg(id) { const e=DB.emergencies.find(x=>x.id===id); if(e){e.status='resolved'; renderEmergency(); showToast(`Emergency ${id} marked resolved`,'success');} }
function reopenEmerg(id) { const e=DB.emergencies.find(x=>x.id===id); if(e){e.status='pending'; renderEmergency(); showToast(`Emergency ${id} reopened`,'info');} }
function addEmergency() {
  const type=document.getElementById('emergType').value.trim();
  const loc=document.getElementById('emergLocation').value.trim();
  const priority=document.getElementById('emergPriority').value;
  const caller=document.getElementById('emergCaller').value.trim();
  const details=document.getElementById('emergDetails').value.trim();
  if (!type||!loc) { showToast('Fill required fields','error'); return; }
  const id='EMR-'+String(2400+DB.emergencies.length+1);
  DB.emergencies.unshift({id,type,patient:'Unknown',location:loc,priority,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),status:'pending',caller:caller||'Hospital',details,requestedBy:'Staff'});
  closeModal('emergModal'); renderEmergency(); showToast(`Emergency ${id} created`,'warn');
}
document.querySelectorAll('[data-emerg-filter]').forEach(b => b.addEventListener('click',()=>{
  document.querySelectorAll('[data-emerg-filter]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); emergFilter=b.dataset.emergFilter; renderEmergency();
}));

// ===== MAP =====
function renderMap() {
  // Map pins are rendered statically in HTML, this just handles interactions
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  showSection('dashboard');
  renderDashboard();
  renderBeds();
  renderBlood();
  renderOxygen();
  renderAmbulances();
  renderStaff();
  renderEmergency();
  // Simulate live updates
  setInterval(() => {
    // Random ambulance fuel drain
    DB.ambulances.forEach(a => { if(a.status==='active') a.fuel = Math.max(10, a.fuel-1); });
    renderAmbulances();
    // Random emergency notification
    const pending = DB.emergencies.filter(e=>e.status==='pending').length;
    const nb = document.getElementById('navEmergBadge');
    if(nb) nb.textContent = pending;
  }, 30000);
});
