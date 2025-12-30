<!-- 🔬 Cartes scientifiques dynamiques : pictos + tag NSI/BTS -->
<style>
  .cards-grid{
    display:grid;
    grid-template-columns: 1fr;
    gap:20px;
    margin: 20px 0;
  }
  @media (min-width: 720px){
    .cards-grid{ grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1100px){
    .cards-grid{ grid-template-columns: repeat(3, 1fr); }
  }

  .card-link{
    display:block;
    position:relative;
    text-decoration:none !important;
    border-radius:18px;
    padding:18px;
    background:#fff;
    border:1px solid rgba(0,0,0,.08);
    transition: transform .2s ease, box-shadow .2s ease;
    overflow:hidden;
  }

  .card-link:hover{
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 18px 36px rgba(15,23,42,.15);
  }

  /* Tag coin haut droit */
  .tag{
    position:absolute;
    top:12px;
    right:12px;
    padding:4px 10px;
    font-size:11px;
    font-weight:700;
    letter-spacing:.4px;
    border-radius:999px;
    color:#fff;
  }

  .theme-nsi .tag{
    background:linear-gradient(135deg,#2563eb,#0ea5e9);
  }
  .theme-bts .tag{
    background:linear-gradient(135deg,#6d28d9,#a855f7);
  }

  .card-head{
    display:flex;
    align-items:center;
    gap:14px;
    margin-bottom:14px;
  }

  .icon{
    width:52px;
    height:52px;
    border-radius:14px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:26px;
    color:#fff;
  }

  .theme-nsi .icon{
    background:linear-gradient(135deg,#2563eb,#0ea5e9);
  }
  .theme-bts .icon{
    background:linear-gradient(135deg,#6d28d9,#a855f7);
  }

  .title{
    margin:0;
    font-size:17px;
    font-weight:800;
    color:#0f172a;
  }

  .subtitle{
    margin:4px 0 0;
    font-size:12px;
    opacity:.75;
  }

  .cta{
    margin-top:14px;
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:10px 14px;
    border-radius:12px;
    font-weight:800;
    font-size:13px;
    background:rgba(0,0,0,.05);
  }

  .theme-nsi .cta{ color:#1d4ed8; }
  .theme-bts .cta{ color:#6d28d9; }

</style>

---

## 📘 Enseignements au lycée

<div class="cards-grid">

<a class="card-link theme-nsi" href="https://eleprettre.forge.apps.education.fr/nsi-1ere/">
  <span class="tag">NSI</span>
  <div class="card-head">
    <div class="icon">💻</div>
    <div>
      <p class="title">NSI — Première</p>
      <p class="subtitle">Code • Algorithmes • Données</p>
    </div>
  </div>
  <span class="cta">👉 Accéder au cours</span>
</a>

<a class="card-link theme-nsi" href="https://eleprettre.forge.apps.education.fr/nsi-tle/">
  <span class="tag">NSI</span>
  <div class="card-head">
    <div class="icon">🌐</div>
    <div>
      <p class="title">NSI — Terminale</p>
      <p class="subtitle">Réseaux • IA • Structures</p>
    </div>
  </div>
  <span class="cta">👉 Accéder au cours</span>
</a>

</div>

---

## 🧪 Enseignement supérieur

<div class="cards-grid">

<a class="card-link theme-bts" href="https://bts-mecp-physique-chimie-688080.forge.apps.education.fr/">
  <span class="tag">BTS</span>
  <div class="card-head">
    <div class="icon">⚛️</div>
    <div>
      <p class="title">BTS MECP — Physique-Chimie</p>
      <p class="subtitle">Cosmétologie • Analyses • Sciences</p>
    </div>
  </div>
  <span class="cta">👉 Accéder au cours</span>
</a>

</div>
