/* =========================================================
   DiabetesRisk AI – app.js
   Prediction logic, animations, and interactions
   ========================================================= */

'use strict';

// ── Particle System ──────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.r  = Math.random() * 1.5 + 0.5;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.alpha = Math.random() * 0.5 + 0.1;
    this.color = Math.random() > 0.5 ? '0,212,255' : '123,47,247';
  };
  Particle.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  };
  Particle.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
    ctx.fill();
  };

  function initParticleArray() {
    particles = [];
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  resize();
  initParticleArray();
  loop();
  window.addEventListener('resize', () => { resize(); initParticleArray(); });
})();

// ── Navbar Scroll Effect ─────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 40) {
    nav.style.background = 'rgba(8,11,20,0.97)';
    nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
  } else {
    nav.style.background = 'rgba(8,11,20,0.85)';
    nav.style.boxShadow = 'none';
  }
});

// ── Step Navigation ──────────────────────────────────────
let currentStep = 1;

function nextStep(step) {
  if (step > currentStep && !validateStep(currentStep)) return;

  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));

  document.getElementById(`step-${step}`).classList.add('active');
  const dot = document.getElementById(`dot-${step}`);
  dot.classList.add('active');

  // Mark done
  for (let i = 1; i < step; i++) {
    const d = document.getElementById(`dot-${i}`);
    d.classList.remove('active');
    d.classList.add('done');
  }
  // Reset future dots
  for (let i = step + 1; i <= 3; i++) {
    document.getElementById(`dot-${i}`).classList.remove('active', 'done');
  }

  const progressMap = { 1: '33%', 2: '66%', 3: '100%' };
  document.getElementById('progress-fill').style.width = progressMap[step];
  currentStep = step;
}

function validateStep(step) {
  if (step === 1) {
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const admission = document.getElementById('admission_type').value;
    if (!age || !gender || !admission) {
      showValidationError('Please complete all required fields (Age, Gender, Admission Type).');
      return false;
    }
  }
  return true;
}

function showValidationError(msg) {
  let el = document.getElementById('validation-msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'validation-msg';
    el.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 1000;
      background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4);
      color: #ff6b6b; padding: 12px 20px; border-radius: 12px;
      font-size: 0.88rem; font-weight: 500; max-width: 300px;
      animation: slideUp 0.3s ease;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(el);
  }
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3500);
}

// ── Slider Update ────────────────────────────────────────
function updateSlider(input, labelId) {
  const label = document.getElementById(labelId);
  let val = input.value;
  if (labelId === 'days-val') val = val + ' day' + (val > 1 ? 's' : '');
  label.textContent = val;
}

// ── Toggle Buttons ───────────────────────────────────────
function selectToggle(groupId, btn, hiddenId) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(hiddenId).value = btn.getAttribute('data-val');
}

// ── Prediction Logic ─────────────────────────────────────
document.getElementById('prediction-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const btn = document.getElementById('predict-btn');
  btn.disabled = true;

  // Show loading
  document.getElementById('result-idle').style.display = 'none';
  document.getElementById('result-loading').style.display = 'block';
  document.getElementById('result-output').style.display = 'none';

  // Animate loading steps
  const steps = ['ls1', 'ls2', 'ls3', 'ls4'];
  let si = 0;
  const stepInterval = setInterval(() => {
    if (si > 0) document.getElementById(steps[si - 1]).classList.remove('active');
    if (si < steps.length) {
      document.getElementById(steps[si]).classList.add('active');
      si++;
    } else {
      clearInterval(stepInterval);
    }
  }, 500);

  // Gather inputs
  const data = gatherFormData();

  setTimeout(() => {
    clearInterval(stepInterval);
    steps.forEach(s => document.getElementById(s).classList.remove('active'));

    const result = computeRisk(data);
    renderResult(result);

    document.getElementById('result-loading').style.display = 'none';
    document.getElementById('result-output').style.display = 'block';
    btn.disabled = false;

    // Smooth scroll to result on mobile
    if (window.innerWidth < 1024) {
      document.getElementById('result-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 2400);
});

function gatherFormData() {
  const fd = new FormData(document.getElementById('prediction-form'));
  const data = {};
  fd.forEach((val, key) => { data[key] = val; });
  return data;
}

// ── Risk Computation Engine ──────────────────────────────
// Based on feature importance from the Diabetes 130-US Hospitals dataset research
function computeRisk(d) {
  let score = 0;   // 0–100 risk score

  // --- Prior visits (highest predictive power) ---
  const inpatient   = parseInt(d.number_inpatient  || 0);
  const emergency   = parseInt(d.number_emergency  || 0);
  const outpatient  = parseInt(d.number_outpatient || 0);
  const utilization = inpatient + emergency + outpatient;

  score += Math.min(inpatient * 10, 30);      // up to 30 pts
  score += Math.min(emergency * 5, 15);        // up to 15 pts

  // --- Discharge disposition risk ---
  const disch = parseInt(d.discharge_disposition || 1);
  if ([2, 3, 14, 22, 23, 24].includes(disch)) score += 8;   // transferred
  if ([11, 13, 19, 20, 21].includes(disch)) score -= 10;    // deceased/hospice

  // --- Age ---
  const ageMap = {
    '[0-10)': 5, '[10-20)': 5, '[20-30)': 5, '[30-40)': 3,
    '[40-50)': 4, '[50-60)': 5, '[60-70)': 8, '[70-80)': 10,
    '[80-90)': 11, '[90-100)': 12
  };
  score += (ageMap[d.age] || 5);

  // --- Diagnosis ---
  const diagScores = {
    circulatory: 8, respiratory: 6, neoplasms: 10,
    diabetes: 3, digestive: 4, injury: 5,
    musculoskeletal: 3, genitourinary: 4, other: 2
  };
  score += (diagScores[d.diag_1] || 2);

  // --- HbA1c ---
  if (d.A1Cresult === '>8') score += 8;
  else if (d.A1Cresult === '>7') score += 5;
  else if (d.A1Cresult === 'Norm') score -= 3;

  // --- Glucose serum ---
  if (d.max_glu_serum === '>300') score += 7;
  else if (d.max_glu_serum === '>200') score += 4;

  // --- Medications ---
  const meds = ['metformin', 'insulin', 'glipizide', 'glyburide', 'pioglitazone', 'rosiglitazone'];
  let medChanges = 0;
  meds.forEach(m => {
    if (d[m] === 'Up' || d[m] === 'Down') medChanges++;
  });
  // Medication changes are protective (research finding)
  score -= Math.min(medChanges * 2, 8);

  // Insulin usage
  if (d.insulin === 'Steady') score += 4;
  if (d.insulin === 'Up')     score += 6;

  // --- Hospital length ---
  const days = parseInt(d.time_in_hospital || 4);
  score += Math.min(Math.floor(days / 3), 5);

  // --- Number of diagnoses ---
  const nDiag = parseInt(d.number_diagnoses || 7);
  score += Math.min(Math.floor(nDiag / 3), 5);

  // --- Medications count ---
  const nMeds = parseInt(d.num_medications || 16);
  score += Math.min(Math.floor(nMeds / 10), 4);

  // --- Diabetic med ---
  if (d.diabetesMed !== 'Yes') score += 5;

  // --- Change flag ---
  if (d.change === 'Ch') score -= 3;

  // Clamp 0–100
  score = Math.max(5, Math.min(95, score));

  // Compute factor importances for chart
  const factors = [
    { label: 'Prior Inpatient Visits',  pct: Math.min(inpatient * 15, 100),  color: '#ff6b6b' },
    { label: 'Prior Emergency Visits',  pct: Math.min(emergency * 8, 100),   color: '#feca57' },
    { label: 'HbA1c / Glucose Levels',  pct: d.A1Cresult !== 'None' ? (d.A1Cresult === '>8' ? 80 : d.A1Cresult === '>7' ? 60 : 20) : 10, color: '#00d4ff' },
    { label: 'Primary Diagnosis',       pct: (diagScores[d.diag_1] || 2) * 8, color: '#7b2ff7' },
    { label: 'Medication Management',   pct: Math.max(10, 70 - medChanges * 15), color: '#00ffb3' },
    { label: 'Age Risk Factor',         pct: (ageMap[d.age] || 5) * 7,      color: '#a78bfa' },
  ].sort((a, b) => b.pct - a.pct);

  // Risk level
  let level, emoji, desc, recommendations;
  if (score < 30) {
    level = 'low';
    emoji = '🟢';
    desc  = 'Low Risk';
    recommendations = [
      'Schedule routine 30-day follow-up appointment',
      'Reinforce medication adherence and lifestyle habits',
      'Provide diabetes self-management education (DSME)',
      'Ensure clear discharge instructions are communicated'
    ];
  } else if (score < 60) {
    level = 'medium';
    emoji = '🟡';
    desc  = 'Moderate Risk';
    recommendations = [
      'Schedule 2-week post-discharge follow-up call',
      'Review and optimize glycemic control targets',
      'Assess social determinants and care support at home',
      'Consider care coordination or case management',
      'Reconcile all medications before discharge'
    ];
  } else {
    level = 'high';
    emoji = '🔴';
    desc  = 'High Risk';
    recommendations = [
      '⚠️ Initiate intensive post-discharge monitoring protocol',
      'Schedule in-person follow-up within 7 days of discharge',
      'Assign dedicated care coordinator or transition navigator',
      'Conduct medication review with clinical pharmacist',
      'Assess and address social/financial barriers to care',
      'Consider telehealth check-ins at days 3, 7, and 14'
    ];
  }

  return { score, level, emoji, desc, factors, recommendations };
}

// ── Render Result ────────────────────────────────────────
function renderResult(r) {
  const circumference = 251; // 2π × 40
  const pct = r.score / 100;
  const offset = circumference - pct * circumference * 0.75; // 270° arc

  const gaugeColor = r.level === 'low'
    ? '#00ffb3'
    : r.level === 'medium'
    ? '#feca57'
    : '#ff6b6b';

  const factorBars = r.factors.map(f => `
    <div class="factor-bar">
      <span class="factor-label">${f.label}</span>
      <div class="factor-track">
        <div class="factor-fill" style="width:0%; background:${f.color}" data-w="${f.pct}%"></div>
      </div>
      <span class="factor-score">${Math.round(f.pct)}%</span>
    </div>
  `).join('');

  const recs = r.recommendations.map(rec => `<li>${rec}</li>`).join('');

  document.getElementById('result-output').innerHTML = `
    <div class="risk-gauge">
      <svg class="gauge-svg" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00ffb3"/>
            <stop offset="50%" stop-color="#feca57"/>
            <stop offset="100%" stop-color="#ff6b6b"/>
          </linearGradient>
        </defs>
        <!-- Background arc (270°) -->
        <path class="gauge-bg"
          d="M 25 110 A 75 75 0 1 1 175 110"
          fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="14" stroke-linecap="round"/>
        <!-- Filled arc -->
        <path
          d="M 25 110 A 75 75 0 1 1 175 110"
          fill="none"
          stroke="${gaugeColor}"
          stroke-width="14"
          stroke-linecap="round"
          stroke-dasharray="${circumference * 0.75}"
          stroke-dashoffset="${circumference * 0.75 - pct * circumference * 0.75}"
          style="transition: stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1); filter: drop-shadow(0 0 8px ${gaugeColor}66);"
        />
        <text x="100" y="90" text-anchor="middle" font-family="Outfit,sans-serif"
          font-size="28" font-weight="800" fill="${gaugeColor}">${r.score}%</text>
        <text x="100" y="110" text-anchor="middle" font-family="Inter,sans-serif"
          font-size="10" fill="rgba(255,255,255,0.4)">RISK SCORE</text>
      </svg>
      <div>
        <div class="risk-badge ${r.level}">
          ${r.emoji} ${r.desc} Readmission Risk
        </div>
      </div>
    </div>

    <div class="result-breakdown">
      <h4>📊 Key Risk Factors</h4>
      ${factorBars}
    </div>

    <div class="result-recommendation">
      <h4>💡 Clinical Recommendations</h4>
      <ul>${recs}</ul>
    </div>

    <div class="result-cta">
      <button class="btn-reset" onclick="resetForm()">↺ New Prediction</button>
    </div>
  `;

  // Animate factor bars
  setTimeout(() => {
    document.querySelectorAll('.factor-fill').forEach(bar => {
      bar.style.width = bar.getAttribute('data-w');
    });
  }, 200);
}

// ── Reset ────────────────────────────────────────────────
function resetForm() {
  document.getElementById('prediction-form').reset();

  // Reset toggles
  document.querySelectorAll('.toggle-group').forEach(group => {
    group.querySelectorAll('.toggle-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === 0);
    });
  });
  document.querySelectorAll('.toggle-group').forEach(group => {
    const hiddenId = group.id.replace('tg-', '');
    const hid = document.getElementById(hiddenId);
    if (hid) hid.value = 'No';
  });

  // Reset sliders display
  const sliders = [
    { id: 'time_in_hospital', labelId: 'days-val', suffix: ' days' },
    { id: 'num_lab_procedures', labelId: 'lab-val', suffix: '' },
    { id: 'num_procedures', labelId: 'proc-val', suffix: '' },
    { id: 'num_medications', labelId: 'meds-val', suffix: '' },
    { id: 'number_outpatient', labelId: 'out-val', suffix: '' },
    { id: 'number_emergency', labelId: 'emg-val', suffix: '' },
    { id: 'number_inpatient', labelId: 'inp-val', suffix: '' },
    { id: 'number_diagnoses', labelId: 'diag-val', suffix: '' },
  ];
  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) document.getElementById(s.labelId).textContent = el.value + s.suffix;
  });

  // Back to step 1
  nextStep(1);
  // Reset to dots
  for (let i = 2; i <= 3; i++) {
    document.getElementById(`dot-${i}`).classList.remove('done');
  }

  // Show idle
  document.getElementById('result-output').style.display = 'none';
  document.getElementById('result-loading').style.display = 'none';
  document.getElementById('result-idle').style.display = 'block';
}

// ── Scroll-triggered Animations ──────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.about-card, .metric-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── Add slide-up keyframe ────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
