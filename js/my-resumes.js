// My Resumes — loads current user's saved resumes & re-downloads PDF
(function(){
  const accent = document.body.classList.contains('prime') ? '#a78bfa' : '#d4af37';
  function ensureJsPDF() {
    return new Promise((resolve, reject) => {
      if (window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = () => resolve(window.jspdf.jsPDF);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function fmtDate(ts) {
    try {
      const d = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
      return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    } catch(_) { return ''; }
  }

  function buildPdf(profile, r) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const M = 40, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    let y = M;
    const heading = (t) => {
      if (y > H - 80) { doc.addPage(); y = M; }
      doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(212,175,55);
      doc.text(t.toUpperCase(), M, y); y += 4;
      doc.setDrawColor(212,175,55); doc.setLineWidth(1); doc.line(M, y+3, W-M, y+3); y += 14;
    };
    const line = (txt) => {
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(40,40,55);
      const wrapped = doc.splitTextToSize(String(txt||''), W - M*2);
      wrapped.forEach(w => { if (y > H - 40) { doc.addPage(); y = M; } doc.text(w, M, y); y += 13; });
      y += 4;
    };
    // Header + photo
    const headerTop = y, photoSize = 70, hasPhoto = !!profile.photo;
    if (hasPhoto) { try { doc.addImage(profile.photo, 'JPEG', W - M - photoSize, headerTop - 10, photoSize, photoSize); } catch(_){} }
    const tw = hasPhoto ? (W - M*2 - photoSize - 14) : (W - M*2);
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(26,26,46);
    doc.text(profile.fullName||'', M, y, { maxWidth: tw }); y += 22;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(120,120,130);
    doc.text(profile.jobTitle||'', M, y, { maxWidth: tw }); y += 14;
    const contact = [profile.email, profile.phone, profile.city].filter(Boolean).join(' · ');
    if (contact) {
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(120,120,130);
      doc.splitTextToSize(contact, tw).forEach(w => { doc.text(w, M, y); y += 11; });
    }
    if (hasPhoto && y < headerTop + photoSize) y = headerTop + photoSize + 4;

    if (r.summary) { heading('Professional Summary'); line(r.summary); }
    if (r.skills?.length) { heading('Key Skills'); line('• ' + r.skills.join('   • ')); }
    if (r.experience?.length) {
      heading('Experience');
      r.experience.forEach(j => {
        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(26,26,46);
        line(`${j.title||''} – ${j.company||''}  (${j.period||''})`);
        (j.bullets||[]).forEach(b => line('• ' + b));
      });
    }
    if (r.education?.length) {
      heading('Education');
      r.education.forEach(e => line(`${e.degree||''} – ${e.institution||''}  (${e.period||''})`));
    }
    if (r.certifications?.length) { heading('Certifications'); line('• ' + r.certifications.join('   • ')); }
    if (r.languages?.length) { heading('Languages'); line(r.languages.join(', ')); }
    if (r.hobbies?.length) { heading('Hobbies'); line(r.hobbies.join(', ')); }
    const safe = (profile.fullName||'resume').replace(/[^a-z0-9]+/gi,'_');
    doc.save(`${safe}_Resume.pdf`);
  }

  async function downloadById(docId, btn) {
    const original = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
      const { getFirestore, doc: fsDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const { getApps, initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const apps = getApps();
      const app = apps.length ? apps[0] : initializeApp(window.__FIREBASE_CFG__);
      const db = getFirestore(app);
      const snap = await getDoc(fsDoc(db, 'aiResumes', docId));
      if (!snap.exists()) throw new Error('Resume not found');
      const d = snap.data();
      const profile = d.profileJson ? JSON.parse(d.profileJson) : { fullName: d.name, jobTitle: d.jobTitle, email: d.email, phone: d.phone, city: d.location, photo: d.photo };
      profile.photo = profile.photo || d.photo || '';
      const resume = d.resumeJson ? JSON.parse(d.resumeJson) : { summary:'', skills:[], experience:[], education:[] };
      await ensureJsPDF();
      buildPdf(profile, resume);
    } catch(e) { alert('Could not download: ' + (e.message||e)); }
    finally { btn.disabled = false; btn.innerHTML = original; }
  }
  window.__downloadMyResume = downloadById;

  window.loadMyResumes = async function(uid, db, fns) {
    const sec = document.getElementById('myResumesSection');
    const list = document.getElementById('myResumesList');
    const counter = document.getElementById('myResumesCount');
    if (!sec || !list || !uid) return;
    const { collection, query, where, getDocs } = fns;
    try {
      const snap = await getDocs(query(collection(db, 'aiResumes'), where('uid','==', uid)));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => {
          const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      if (!items.length) return; // keep section hidden when empty
      sec.style.display = 'block';
      counter.textContent = `(${items.length})`;
      list.innerHTML = items.slice(0, 8).map(r => {
        const photo = r.photo ? `<img src="${r.photo}" style="width:38px;height:38px;border-radius:8px;object-fit:cover;flex-shrink:0">` 
          : `<div style="width:38px;height:38px;border-radius:8px;background:rgba(212,175,55,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-file-alt" style="color:${accent}"></i></div>`;
        const name = (r.name||'Untitled').replace(/[<>]/g,'');
        const role = (r.jobTitle||'').replace(/[<>]/g,'');
        const date = fmtDate(r.createdAt);
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;margin-bottom:6px">
          ${photo}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
            <div style="font-size:11px;color:var(--gray)">${role}${date?' · '+date:''}</div>
          </div>
          <button onclick="window.__downloadMyResume('${r.id}', this)" style="background:${accent};color:#000;border:none;padding:7px 12px;border-radius:7px;font-size:11px;font-weight:800;cursor:pointer;flex-shrink:0"><i class="fas fa-download"></i> PDF</button>
        </div>`;
      }).join('');
    } catch(e) { console.error('loadMyResumes:', e); }
  };
})();
