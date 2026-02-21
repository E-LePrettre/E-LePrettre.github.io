<style>
/* ===== Grille responsive ===== */
.cards-grid{
  display:grid;
  grid-template-columns: 1fr;
  gap:22px;
  margin: 24px 0;
}
@media (min-width: 720px){
  .cards-grid{ grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1100px){
  .cards-grid{ grid-template-columns: repeat(3, 1fr); }
}

/* ===== Carte ===== */
.card{
  position:relative;
  display:block;
  padding:22px;
  border-radius:18px;
  background:#fff;
  border:1px solid rgba(0,0,0,.08);
  text-decoration:none !important;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  cursor:pointer;
}

/* Hover */
.card:hover{
  transform: translateY(-3px);
  box-shadow: 0 20px 40px rgba(15,23,42,.12);
}

/* ===== Thèmes ===== */
.card.nsi{
  border-left:6px solid #2563eb;
}
.card.bts{
  border-left:6px solid #6d28d9;
}

/* ===== Tag NSI / BTS ===== */
.tag{
  position:absolute;
  top:14px;
  right:14px;
  padding:4px 10px;
  font-size:11px;
  font-weight:700;
  border-radius:999px;
  color:#fff;
}
.card.nsi .tag{
  background:#2563eb;
}
.card.bts .tag{
  background:#6d28d9;
}

/* ===== En-tête ===== */
.card-head{
  display:flex;
  align-items:center;
  gap:14px;
  margin-bottom:18px;
}

/* Icône scientifique */
.card-icon{
  width:52px;
  height:52px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
  color:#fff;
}
.card.nsi .card-icon{
  background:linear-gradient(135deg,#2563eb,#0ea5e9);
}
.card.bts .card-icon{
  background:linear-gradient(135deg,#6d28d9,#a855f7);
}

/* Titre */
.card-title{
  margin:0;
  font-size:17px;
  font-weight:800;
  color:#0f172a;
}

/* ===== Bouton ===== */
.card-cta{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 14px;
  border-radius:12px;
  font-weight:800;
  font-size:13px;
  background:rgba(0,0,0,.05);
}
.card.nsi .card-cta{
  color:#1d4ed8;
}
.card.bts .card-cta{
  color:#6d28d9;
}
</style>

---

## 📘 Enseignements au lycée

<div class="cards-grid">

<a class="card nsi" href="https://e-leprettre.github.io/nsi-1ere/">
  <span class="tag">NSI</span>
  <div class="card-head">
    <div class="card-icon">💻</div>
    <p class="card-title">NSI — Première</p>
  </div>
  <span class="card-cta">👉 Accéder au cours</span>
</a>

<a class="card nsi" href="https://e-leprettre.github.io/nsi-tle/">
  <span class="tag">NSI</span>
  <div class="card-head">
    <div class="card-icon">🌐</div>
    <p class="card-title">NSI — Terminale</p>
  </div>
  <span class="card-cta">👉 Accéder au cours</span>
</a>

</div>

---

## 🧪 Enseignement supérieur

<div class="cards-grid">

<a class="card bts" href="https://e-leprettre.github.io/bts-mecp-physique-chimie/">
  <span class="tag">BTS</span>
  <div class="card-head">
    <div class="card-icon">⚛️</div>
    <p class="card-title">BTS MECP — Physique-Chimie</p>
  </div>
  <span class="card-cta">👉 Accéder au cours</span>
</a>



<a class="card bts" href="https://e-leprettre.github.io/bts-mecp-cosmetologie/">
  <span class="tag">BTS</span>
  <div class="card-head">
    <div class="card-icon">💄</div>
    <p class="card-title">BTS MECP — Cosmétologie</p>
  </div>
  <span class="card-cta">👉 Accéder au cours</span>
</a>

</div>

