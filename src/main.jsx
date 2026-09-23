
import React,{useMemo,useState,useEffect}from"react";
import{createRoot}from"react-dom/client";
import{CalendarDays,Plus,Clock3,MapPin,FileText,Pencil,Trash2,ChevronLeft,ChevronRight,Moon,Sun,Save,X,Timer,BriefcaseBusiness,LogOut,RefreshCw,Cloud,CloudOff,Users,Table2,ArrowLeft,Search}from"lucide-react";
import"./styles.css";
import{registerServiceWorker}from"./registerSW.js";
const TYPES=["Járőr szolgálat","Egyéb","Blaha Poszt","Pápa tér poszt"],ENTRY_TYPES=["Szolgálat","Szabadság","Túlóra"],CALLSIGNS=["Józsefváros-121","Józsefváros-122","Józsefváros-123","Józsefváros-321","Józsefváros-322","Józsefváros-491","Józsefváros-141"],COLORS={"Járőr szolgálat":"#3b82f6","Egyéb":"#06b6d4","Blaha Poszt":"#8b5cf6","Pápa tér poszt":"#f59e0b"},pad=n=>String(n).padStart(2,"0"),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,dateKey=v=>{if(v instanceof Date)return Number.isNaN(v.getTime())?"":iso(v);const s=String(v??"");const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:""},fromISO=s=>{const k=dateKey(s);if(!k)return new Date(NaN);let[y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)},mins=t=>{if(typeof t!=="string"||!/^[0-9]{1,2}:[0-9]{2}$/.test(t))return NaN;let[h,m]=t.split(":").map(Number);return h*60+m},duration=(a,b)=>{let n=mins(b)-mins(a);if(n<0)n+=1440;return n/60};

async function api(url,opt={}){let token=localStorage.getItem("sz_token");let r=await fetch(url,{...opt,headers:{"Content-Type":"application/json",...(opt.headers||{}),...(token?{Authorization:"Bearer "+token}:{})}});let data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||"Hiba történt");return data}
function Auth({onAuth}){const[register,setRegister]=useState(false),[username,setUsername]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");const go=async e=>{e.preventDefault();setError("");setBusy(true);try{let d=await api(register?"/api/auth/register":"/api/auth/login",{method:"POST",body:JSON.stringify({username,email,password})});localStorage.setItem("sz_token",d.token);onAuth(d.user)}catch(e){setError(e.message)}finally{setBusy(false)}};return <div className="auth"><div className="authCard"><div className="authLogo"><CalendarDays/></div><h1>Szolgálat<br/><em>Naptár</em></h1><p>A szolgálatvezénylésed biztonságosan, online.</p><form onSubmit={go}><label>Felhasználónév<input type="text" value={username} onChange={e=>setUsername(e.target.value)} required minLength="3" maxLength="30" autoCapitalize="none" autoCorrect="off" placeholder="pl. kovacs.janos"/></label><label>{register?"E-mail cím (opcionális)":"Felhasználónév vagy e-mail"}{register&&<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="pl. nev@example.com"/>}</label><label>Jelszó<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required placeholder="Legalább 6 karakter"/></label>{error&&<div className="error">{error}</div>}<button className="primary authBtn" disabled={busy}>{busy?"Feldolgozás…":register?"Fiók létrehozása":"Bejelentkezés"}</button></form><button className="linkBtn" onClick={()=>setRegister(!register)}>{register?"Már van fiókom":"Még nincs fiókom → Regisztráció"}</button><small className="privacy"><Cloud size={13}/> A szolgálatok online adatbázisban tárolódnak.</small></div></div>}


class AppErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error("Alkalmazás hiba",error,info)}
  render(){if(this.state.error)return <div className="app dark"><div className="loadingScreen"><CalendarDays/><strong>Az oldal betöltése közben hiba történt.</strong><small style={{maxWidth:520,textAlign:"center",color:"#94a3b8"}}>{this.state.error?.message||"Ismeretlen hiba"}</small><button className="primary" onClick={()=>window.location.reload()}>Újratöltés</button></div></div>;return this.props.children}
}

function App(){
  const [user,setUser]=useState(null),[shifts,setShifts]=useState([]),[page,setPage]=useState("home");
  const [loading,setLoading]=useState(true),[syncing,setSyncing]=useState(false),[error,setError]=useState("");
  const [dark,setDark]=useState(()=>localStorage.getItem("szolgalat-dark")!=="0");
  const [selected,setSelected]=useState(new Date()),[month,setMonth]=useState(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [modal,setModal]=useState(null);

  const load=async()=>{
    setSyncing(true);setError("");
    try{const d=await api("/api/shifts");setShifts(Array.isArray(d)?d:[]);}
    catch(e){if(/401|Unauthorized|token/i.test(e.message||"")){localStorage.removeItem("sz_token");setUser(null);}else setError(e.message);}
    finally{setSyncing(false);}
  };

  useEffect(()=>{
    const token=localStorage.getItem("sz_token");
    if(!token){setLoading(false);return;}
    api("/api/me").then(u=>{setUser(u);return load();}).catch(()=>{localStorage.removeItem("sz_token");setUser(null)}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{document.documentElement.classList.toggle("dark-mode",dark)},[dark]);

  const logout=()=>{localStorage.removeItem("sz_token");setUser(null);setShifts([]);setPage("home");};
  const saveShift=async payload=>{
    setSyncing(true);setError("");
    try{
      const isEdit=Boolean(payload.id);
      const d=await api(isEdit?`/api/shifts/${payload.id}`:"/api/shifts",{method:isEdit?"PUT":"POST",body:JSON.stringify(payload)});
      setShifts(v=>isEdit?v.map(x=>x.id===d.id?d:x):[...v,d].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)));
      setModal(null);
    }catch(e){setError(e.message);}
    finally{setSyncing(false);}
  };
  const del=async id=>{
    if(!confirm("Biztosan törlöd ezt a szolgálatot?"))return;
    setSyncing(true);
    try{await api(`/api/shifts/${id}`,{method:"DELETE"});setShifts(v=>v.filter(x=>x.id!==id));setModal(null);}
    catch(e){setError(e.message)}
    finally{setSyncing(false)}
  };

  const selectedKey=iso(selected);
  const day=shifts.filter(x=>dateKey(x.date)===selectedKey);
  const monthKey=`${month.getFullYear()}-${pad(month.getMonth()+1)}`;
  const ms=shifts.filter(x=>dateKey(x.date).startsWith(monthKey));
  const mh=ms.filter(x=>x.kind!=="vacation").reduce((a,x)=>a+duration(x.start,x.end),0);
  const next=[...shifts].filter(x=>x.kind!=="vacation"&&(x.date+x.start)>=iso(new Date())+pad(new Date().getHours())+pad(new Date().getMinutes())).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))[0];

  if(loading)return <div className={dark?"app dark":"app"}><div className="loadingScreen"><CalendarDays/><span>Betöltés…</span></div></div>;
  if(!user)return <Auth onAuth={u=>{setUser(u);load()}}/>;

  if(page==="tablo")return <div className={dark?"app dark":"app"}><Tablo dark={dark} onBack={()=>setPage("home")} onToggleDark={()=>{setDark(v=>{localStorage.setItem("szolgalat-dark",v?"0":"1");return !v})}} onLogout={logout} onStats={()=>setPage("stats")} onAdmin={()=>setPage("admin")} isAdmin={Boolean(user.is_admin)}/></div>;
  if(page==="stats")return <div className={dark?"app dark":"app"}><StatsPage shifts={shifts} user={user} dark={dark} onBack={()=>setPage("home")} onToggleDark={()=>{setDark(v=>{localStorage.setItem("szolgalat-dark",v?"0":"1");return !v})}} onLogout={logout}/></div>;
  if(page==="admin")return <div className={dark?"app dark":"app"}><AdminPage dark={dark} onBack={()=>setPage("home")} onToggleDark={()=>{setDark(v=>{localStorage.setItem("szolgalat-dark",v?"0":"1");return !v})}} onLogout={logout}/></div>;

  return <div className={dark?"app dark":"app"}>
    <header className="nav">
      <div className="brand"><div className="brandIcon"><CalendarDays/></div><div><b>Szolgálat</b><span>Naptár</span></div></div>
      <div className="navRight">
        <span className="sync">{syncing?<RefreshCw className="spin"/>:<Cloud/>}</span>
        <button className="round" onClick={()=>setDark(v=>{localStorage.setItem("szolgalat-dark",v?"0":"1");return !v})}>{dark?<Sun/>:<Moon/>}</button>
        <button className="round logout" onClick={logout}><LogOut/></button>
        <button className="round tabloNav" title="Tabló" onClick={()=>setPage("tablo")}><Table2/></button><button className="round" title="Statisztikák" onClick={()=>setPage("stats")}><Clock3/></button>{user.is_admin&&<button className="round" title="Adminisztráció" onClick={()=>setPage("admin")}><Users/></button> }
        <button className="primary" onClick={()=>setModal({mode:"new"})}><Plus/><span>Új szolgálat</span></button>
      </div>
    </header>
    <main>
      {error&&<div className="error pageError">{error}</div>}
      <section className="welcome">
        <div><div className="kicker">SZOLGÁLATVEZÉNYLÉS</div><h1>A szolgálataid,<br/><em>egy helyen.</em></h1><p>Bejelentkezve: {user.username}. A bejegyzéseid minden eszközödön elérhetők.</p></div>
        <div className="nextCard"><span>KÖVETKEZŐ SZOLGÁLAT</span>{next?<><strong>{fromISO(next.date).toLocaleDateString("hu-HU",{month:"long",day:"numeric"})}</strong><b>{next.start}–{next.end}</b><small>{next.type}{next.call_sign?` · ${next.call_sign}`:""}</small></>:<><strong>Nincs bejegyzett szolgálat</strong><small>Rögzíts egy új szolgálatot.</small></>}</div>
      </section>
      <section className="stats">
        <Stat icon={<Clock3/>} title="Ebben a hónapban" value={`${mh.toFixed(1)} óra`} sub="összes szolgálati idő"/>
        <Stat icon={<BriefcaseBusiness/>} title="Szolgálatok" value={ms.filter(x=>x.kind!=="vacation").length} sub="szolgálat ebben a hónapban"/>
        <Stat icon={<Timer/>} title="Mai nap" value={`${day.filter(x=>x.kind!=="vacation").reduce((a,x)=>a+duration(x.start,x.end),0).toFixed(1)} óra`} sub={day.length?"bejegyzés rögzítve":"nincs bejegyzés"}/>
      </section>
      <section className="workspace">
        <div className="calendar card"><div className="sectionHead"><div><span>NAPTÁR</span><h2>{month.toLocaleDateString("hu-HU",{month:"long",year:"numeric"})}</h2></div><div className="arrows"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft/></button><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight/></button></div></div><Calendar month={month} selected={selected} shifts={shifts} onSelect={setSelected}/></div>
        <div className="agenda card"><div className="agendaHead"><div><span>NAPIRAJZ</span><h2>{selected.toLocaleDateString("hu-HU",{month:"long",day:"numeric"})}</h2><small>{selected.toLocaleDateString("hu-HU",{weekday:"long"})}</small></div><button className="miniAdd" onClick={()=>setModal({mode:"new"})}><Plus/></button></div><div className="agendaBody">{day.length?day.map(s=><Shift key={s.id} shift={s} edit={()=>setModal({mode:"edit",shift:s})} remove={()=>del(s.id)}/>):<div className="empty"><div><CalendarDays/></div><b>Szabadnap / nincs bejegyzés</b><span>Erre a napra még nincs rögzített szolgálat.</span><button onClick={()=>setModal({mode:"new"})}><Plus/> Szolgálat hozzáadása</button></div>}</div></div>
      </section>
    </main>
    <div className="mobileBar"><button className="active" onClick={()=>setSelected(new Date())}><CalendarDays/><span>Ma</span></button><button onClick={()=>setPage("tablo")}><Table2/><span>Tabló</span></button><button onClick={()=>setModal({mode:"new"})} className="fab"><Plus/></button><button onClick={load}><Cloud/><span>Szinkron</span></button></div>
    {modal&&<Editor shift={modal.mode==="edit"?modal.shift:null} defaultDate={selected} existingShifts={shifts} close={()=>setModal(null)} save={saveShift} remove={modal.mode==="edit"?()=>del(modal.shift.id):null}/>}
  </div>
}


function Tablo({dark,onBack,onToggleDark,onLogout,onStats,onAdmin,isAdmin}){
  const[data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[search,setSearch]=useState(""),[typeFilter,setTypeFilter]=useState("Mind"),[selectedDate,setSelectedDate]=useState(new Date()),[selectedShift,setSelectedShift]=useState(null),[viewMode,setViewMode]=useState("10");
  const[cfg,setCfg]=useState({service_types:TYPES,call_signs:CALLSIGNS});
  useEffect(()=>{api("/api/settings").then(setCfg).catch(()=>{})},[]);
  const loadTablo=()=>{setLoading(true);setError("");api("/api/tablo").then(d=>setData(Array.isArray(d)?d:[])).catch(e=>{setData([]);setError(e.message||"A Tabló adatai nem tölthetők be.")}).finally(()=>setLoading(false))};
  useEffect(()=>{loadTablo()},[]);
  const days=useMemo(()=>{const base=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),selectedDate.getDate());return Array.from({length:10},(_,i)=>new Date(base.getFullYear(),base.getMonth(),base.getDate()+i))},[selectedDate]);
  const filtered=(Array.isArray(data)?data:[]).filter(x=>{const q=search.trim().toLowerCase();const ms=!q||[x.username,x.call_sign,x.type,x.kind,x.location,x.note,x.date,x.start,x.end].map(v=>v??"").join(" ").toLowerCase().includes(q);const mt=typeFilter==="Mind"||x.type===typeFilter;return ms&&mt});
  const users=useMemo(()=>{const m=new Map();filtered.forEach(x=>{if(!m.has(x.user_id))m.set(x.user_id,x.username)});return [...m.entries()]},[filtered]);
  const shiftInterval=(x,base)=>{
    if(!x||!x.start||!x.end)return null;
    const startDay=fromISO(dateKey(x.date));
    if(Number.isNaN(startDay.getTime()))return null;
    const start=Math.round((startDay-base)/86400000)*1440+mins(x.start);
    const sm=mins(x.start),em=mins(x.end);
    const end=start+(em>sm?em-sm:1440-sm+em);
    const viewStart=0,viewEnd=10*1440;
    const from=Math.max(start,viewStart),to=Math.min(end,viewEnd);
    if(to<=from)return null;
    return {from,to,overnight:em<=sm};
  };
  const shiftStyle=(part)=>({
    left:`${part.from/(10*1440)*100}%`,
    width:`${Math.max((part.to-part.from)/(10*1440)*100,.8)}%`
  });
  const shiftStart=(x,base)=>{
    if(!x||!x.start)return Number.POSITIVE_INFINITY;
    const diff=Math.round((fromISO(dateKey(x.date))-base)/86400000);
    return diff*1440+mins(x.start);
  };
  const shiftEnd=(x,base)=>{
    if(!x||!x.start||!x.end)return Number.POSITIVE_INFINITY;
    const start=shiftStart(x,base),sm=mins(x.start),em=mins(x.end);
    return start+(em>sm?em-sm:1440-sm+em);
  };
  const makeLanes=(items,base)=>{
    const lanes=[],laneById={};
    [...items].sort((a,b)=>shiftStart(a,base)-shiftStart(b,base)).forEach(x=>{
      const rawStart=shiftStart(x,base),rawEnd=shiftEnd(x,base);
      const start=Math.max(0,rawStart),end=Math.min(10*1440,rawEnd);
      if(end<=start)return;
      let lane=lanes.findIndex(lastEnd=>lastEnd<=start);
      if(lane<0){lane=lanes.length;lanes.push(end)}else lanes[lane]=end;
      laneById[x.id]=lane;
    });
    return {laneById,lanes:Math.max(1,lanes.length)};
  };
  const fmtDay=d=>d.toLocaleDateString("hu-HU",{weekday:"short"}).replace(".","").toUpperCase();
  const fmtFull=d=>d.toLocaleDateString("hu-HU",{year:"numeric",month:"long",day:"numeric"});
  return <div className="tabloPage">
    <header className="nav">
      <div className="brand"><div className="brandIcon"><Table2/></div><div><b>Szolgálat</b><span>Tabló</span></div></div>
      <div className="navRight"><button className="round" onClick={onToggleDark}>{dark?<Sun/>:<Moon/>}</button><button className="round" title="Statisztikák" onClick={onStats}><Clock3/></button>{isAdmin&&<button className="round" title="Adminisztráció" onClick={onAdmin}><Users/></button>}<button className="round" onClick={onBack}><ArrowLeft/></button><button className="round logout" onClick={onLogout}><LogOut/></button></div>
    </header>
    <main>
      <section className="tabloHero"><div><div className="kicker">KÖZÖS SZOLGÁLATI TÁBLÓ</div><h1>Tabló</h1><p>Az állomány szolgálatai közös, idővonalas nézetben.</p></div><div className="tabloCount"><Users/><strong>{users.length}</strong><span>regisztrált tag</span></div></section>
      <div className="tabloToolbar card">
        <div className="searchBox"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Keresés név, hívónév vagy szolgálat alapján…"/></div>
        <select className="tabloFilter" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>Mind</option>{(cfg.service_types||TYPES).map(t=><option key={t}>{t}</option>)}<option>Szabadság</option><option>Túlóra</option></select>
        <label className="dateJump"><CalendarDays/><input type="date" value={iso(selectedDate)} onChange={e=>{if(e.target.value)setSelectedDate(fromISO(e.target.value))}}/></label>
        <div className="tabloNavDates"><button onClick={()=>setSelectedDate(d=>viewMode==="month"?new Date(d.getFullYear(),d.getMonth()-1,1):new Date(d.getFullYear(),d.getMonth(),d.getDate()-10))}><ChevronLeft/></button><button onClick={()=>setSelectedDate(new Date())}>Ma</button><button onClick={()=>setSelectedDate(d=>viewMode==="month"?new Date(d.getFullYear(),d.getMonth()+1,1):new Date(d.getFullYear(),d.getMonth(),d.getDate()+10))}><ChevronRight/></button></div><div className="viewToggle"><button className={viewMode==="10"?"active":""} onClick={()=>setViewMode("10")}>10 nap</button><button className={viewMode==="month"?"active":""} onClick={()=>setViewMode("month")}>Havi nézet</button></div>
      </div>
      {error&&<div className="error pageError">{error}</div>}
      {loading?<div className="card tabloEmpty">Betöltés…</div>:viewMode==="10"?<div className="card roster">
        <div className="rosterTop"><div className="rosterNameHead">ÁLLOMÁNY</div><div className="rosterDays">{days.map((d,i)=><div key={i} className={iso(d)===iso(new Date())?"todayCol":""}><b>{fmtDay(d)}</b><span>{d.getDate()}</span></div>)}</div></div>
        {users.length?users.map(([uid,username])=>{
          const personShifts=filtered.filter(x=>String(x.user_id)===String(uid));
          const visiblePersonShifts=personShifts.filter(x=>x.kind!=="vacation"&&shiftInterval(x,days[0]));
          const laneInfo=makeLanes(visiblePersonShifts,days[0]);
          const rowHeight=24+laneInfo.lanes*43;
          return <div className="rosterRow" key={uid} style={{minHeight:rowHeight}}><div className="rosterUser"><div className="personAvatar">{String(username||"?").slice(0,1).toUpperCase()}</div><div><strong>{username}</strong><small>{personShifts.filter(x=>x.kind==="service").length} szolgálat</small></div></div><div className="rosterTimeline" style={{minHeight:rowHeight}}>
            {days.map((d,i)=><div className="rosterCell" key={i} style={{minHeight:rowHeight}}></div>)}
            {personShifts.filter(x=>x.kind==="vacation").map(x=>{const idx=Math.round((fromISO(x.date)-days[0])/86400000);if(idx<0||idx>=10)return null;return <button key={x.id} className="rosterVacation" style={{left:`${idx*10}%`,width:"10%"}} onClick={()=>setSelectedShift(x)} title="Szabadság">×</button>})}
            {personShifts.filter(x=>x.kind!=="vacation").map(x=>{const p=shiftInterval(x,days[0]);if(!p)return null;const overnight=p.overnight;const lane=laneInfo.laneById[x.id]??0;const overtime=x.kind==="overtime";return <button key={x.id} className={`rosterShift ${overnight?"overnight":""} ${x.type==="Egyéb"?"otherShift":""} ${overtime?"overtimeShift":""}`} style={{...shiftStyle(p),top:10+lane*43}} onClick={()=>setSelectedShift(x)} title={`${x.start}–${x.end}`}><span>{x.start}–{x.end}{overnight&&!overtime&&<Moon className="nightIcon"/>}</span></button>})}
          </div></div>
        }):<div className="tabloEmpty">Nincs a szűrésnek megfelelő szolgálat.</div>}
      </div>:<MonthlyRoster data={filtered} selectedDate={selectedDate} onSelect={setSelectedShift}/>}
      <div className="timelineLegend"><span><i className="legendDot"></i> Járőr szolgálat</span><span><i className="legendDot other"></i> Egyéb</span><span><i className="legendDot overtimeLegend"></i> Túlóra</span><span><i className="legendX">×</i> Szabadság</span><span>↪ átnyúló / éjszakai</span></div>
      <p className="tabloNotice">A Tabló az elmúlt 90 nap és a jövőbeli szolgálatok adatait jeleníti meg. A havi nézetben a teljes hónap látható.</p>
    </main>
    {selectedShift&&<div className="modalBg tabloDetailBg" onMouseDown={e=>e.target===e.currentTarget&&setSelectedShift(null)}><div className="tabloDetail card">
      <div className="tabloDetailTop"><div><span>SZOLGÁLATI RÉSZLETEK</span><h2>{selectedShift.kind==="vacation"?"Szabadság":selectedShift.kind==="overtime"?"Túlóra":selectedShift.type}</h2></div><button className="close" onClick={()=>setSelectedShift(null)}><X/></button></div>
      <div className="tabloDetailUser"><div className="personAvatar">{String(selectedShift.username||"?").slice(0,1).toUpperCase()}</div><div><strong>{selectedShift.username}</strong><small>{selectedShift.call_sign||"Hívónév nincs megadva"}</small></div></div>
      <div className="tabloDetailGrid">
        <div><CalendarDays/><span><small>Dátum</small><strong>{fmtFull(fromISO(selectedShift.date))}</strong></span></div>
        <div><Clock3/><span><small>Kezdés – befejezés</small><strong>{selectedShift.kind==="vacation"?"—":`${selectedShift.start} – ${selectedShift.end}`}</strong></span></div>
        <div><Table2/><span><small>Bejegyzés típusa</small><strong>{selectedShift.kind==="vacation"?"Szabadság":selectedShift.kind==="overtime"?"Túlóra":selectedShift.type}</strong></span></div>
        <div><Users/><span><small>Hívónév</small><strong>{selectedShift.call_sign||"Nincs megadva"}</strong></span></div>
        <div className="full"><MapPin/><span><small>Helyszín</small><strong>{selectedShift.location||"Nincs megadva"}</strong></span></div>
        <div className="full"><FileText/><span><small>Megjegyzés</small><strong>{selectedShift.note||"Nincs megadva"}</strong></span></div>
      </div>
      <button className="tabloDetailClose" onClick={()=>setSelectedShift(null)}>Bezárás</button>
    </div></div>}
  </div>
}


function MonthlyRoster({data,selectedDate,onSelect}){
  const year=selectedDate.getFullYear(), month=selectedDate.getMonth();
  const days=Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>new Date(year,month,i+1));
  const dayCount=days.length;
  const base=days[0];
  const users=[...new Map(data.map(x=>[x.user_id,x.username])).entries()];
  // A havi Tablóban a teljes hónap férjen el egyetlen idővonalban.
  // A cellák szándékosan kompaktak; az éjszakai szolgálat a tényleges időtartamán
  // végignyúlik a következő napra is.
  const dayPixelWidth=86;
  const monthWidth=dayCount*dayPixelWidth;
  const dayWidth=`repeat(${dayCount},${dayPixelWidth}px)`;
  const dayMinutes=1440;
  const totalMinutes=dayCount*dayMinutes;

  const shiftStart=(x)=>{
    if(!x?.start)return Number.POSITIVE_INFINITY;
    const diff=Math.round((fromISO(dateKey(x.date))-base)/86400000);
    return diff*dayMinutes+mins(x.start);
  };
  const shiftEnd=(x)=>{
    if(!x?.start||!x?.end)return Number.POSITIVE_INFINITY;
    const start=shiftStart(x),sm=mins(x.start),em=mins(x.end);
    return start+(em>sm?em-sm:1440-sm+em);
  };
  const shiftPart=(x)=>{
    const start=shiftStart(x),end=shiftEnd(x);
    if(!Number.isFinite(start)||!Number.isFinite(end))return null;
    const from=Math.max(0,start),to=Math.min(totalMinutes,end);
    if(to<=from)return null;
    return {
      from,to,
      overnight:mins(x.end)<=mins(x.start),
      style:{
        left:`${from/totalMinutes*100}%`,
        width:`${Math.max((to-from)/totalMinutes*100,.8)}%`
      }
    };
  };
  const makeLanes=(items)=>{
    const lanes=[],laneById={};
    [...items].sort((a,b)=>shiftStart(a)-shiftStart(b)).forEach(x=>{
      const p=shiftPart(x);
      if(!p)return;
      let lane=lanes.findIndex(lastEnd=>lastEnd<=p.from);
      if(lane<0){lane=lanes.length;lanes.push(p.to)}else lanes[lane]=p.to;
      laneById[x.id]=lane;
    });
    return {laneById,lanes:Math.max(1,lanes.length)};
  };
  const fmtDay=d=>d.toLocaleDateString("hu-HU",{weekday:"short"}).replace(".","").toUpperCase();

  return <div className="card monthRoster">
    <div className="monthRosterHead" style={{gridTemplateColumns:`190px ${monthWidth}px`,minWidth:`${190+monthWidth}px`}}>
      <div className="monthHeadName">ÁLLOMÁNY</div>
      <div className="monthHeaderDays" style={{gridTemplateColumns:dayWidth,minWidth:`${monthWidth}px`}}>
        {days.map(d=><div key={iso(d)} className={iso(d)===iso(new Date())?"todayCol":""}>
          <b>{fmtDay(d)}</b><span>{d.getDate()}</span>
        </div>)}
      </div>
    </div>

    {users.length ? users.map(([uid,name])=>{
      const personShifts=data.filter(x=>String(x.user_id)===String(uid));
      const visible=personShifts.filter(x=>x.kind!=="vacation"&&shiftPart(x));
      const laneInfo=makeLanes(visible);
      const rowHeight=24+laneInfo.lanes*43;

      return <div className="monthRosterRow" key={uid} style={{minHeight:rowHeight,gridTemplateColumns:`190px ${monthWidth}px`,minWidth:`${190+monthWidth}px`}}>
        <div className="monthRosterUser">
          <div className="personAvatar">{String(name||"?").slice(0,1).toUpperCase()}</div>
          <div><strong>{name}</strong><small>{personShifts.filter(x=>x.kind==="service").length} szolgálat</small></div>
        </div>

        <div className="monthRosterTimeline" style={{minHeight:rowHeight,minWidth:`${monthWidth}px`}}>
          <div className="monthRosterGrid" style={{gridTemplateColumns:dayWidth,minHeight:rowHeight,minWidth:`${monthWidth}px`}}>
            {days.map(d=><div className="monthCell" key={iso(d)}></div>)}
          </div>

          {personShifts.filter(x=>x.kind==="vacation").map(x=>{
            const idx=Math.round((fromISO(x.date)-base)/86400000);
            if(idx<0||idx>=dayCount)return null;
            return <button key={x.id} className="monthVacation" style={{
              left:`${idx/dayCount*100}%`,width:`${100/dayCount}%`
            }} onClick={()=>onSelect(x)} title="Szabadság">×</button>
          })}

          {visible.map(x=>{
            const startIdx=Math.round((fromISO(dateKey(x.date))-base)/86400000);
            if(startIdx<0||startIdx>=dayCount)return null;
            const overnight=mins(x.end)<=mins(x.start);
            const overtime=x.kind==="overtime";
            const lane=laneInfo.laneById[x.id]??0;
            return <button key={x.id}
              className={`monthShift ${overnight?"overnight":""} ${x.type==="Egyéb"?"otherShift":""} ${overtime?"monthOvertimeShift":""}`}
              style={{
                left:`${shiftStart(x)/totalMinutes*100}%`,
                width:`${Math.max((shiftEnd(x)-shiftStart(x))/totalMinutes*100, 2.2)}%`,
                top:10+lane*43
              }}
              onClick={()=>onSelect(x)}
              title={`${x.start}–${x.end}${x.note?` · ${x.note}`:""}`}>
              <span>{x.start}–{x.end}{overnight&&!overtime&&<Moon className="nightIcon"/>}</span>
            </button>
          })}
        </div>
      </div>
    }):<div className="tabloEmpty">Nincs a hónapra illeszkedő bejegyzés.</div>}
  </div>
}

function StatsPage({shifts,user,dark,onBack,onToggleDark,onLogout}){
  const [month,setMonth]=useState(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const key=`${month.getFullYear()}-${pad(month.getMonth()+1)}`;
  const items=shifts.filter(x=>dateKey(x.date).startsWith(key));
  const services=items.filter(x=>x.kind==="service"), overtime=items.filter(x=>x.kind==="overtime"), vacation=items.filter(x=>x.kind==="vacation");
  const hours=xs=>xs.reduce((a,x)=>a+duration(x.start,x.end),0);
  const byType=TYPES.map(t=>({t,n:services.filter(x=>x.type===t).length,h:hours(services.filter(x=>x.type===t))}));
  return <div className="statsPage"><header className="nav"><div className="brand"><div className="brandIcon"><Clock3/></div><div><b>Szolgálat</b><span>Statisztikák</span></div></div><div className="navRight"><button className="round" onClick={onToggleDark}>{dark?<Sun/>:<Moon/>}</button><button className="round" onClick={onBack}><ArrowLeft/></button><button className="round logout" onClick={onLogout}><LogOut/></button></div></header><main><section className="pageHero"><div><div className="kicker">SAJÁT STATISZTIKÁK</div><h1>{month.toLocaleDateString("hu-HU",{month:"long",year:"numeric"})}</h1><p>{user.username} havi összesítése.</p></div><div className="monthPager"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft/></button><button onClick={()=>setMonth(new Date())}>Ma</button><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight/></button></div></section><div className="stats"><Stat icon={<Clock3/>} title="Szolgálati idő" value={`${hours(services).toFixed(1)} óra`} sub={`${services.length} szolgálat`}/><Stat icon={<Timer/>} title="Túlóra" value={`${hours(overtime).toFixed(1)} óra`} sub={`${overtime.length} bejegyzés`}/><Stat icon={<CalendarDays/>} title="Szabadság" value={vacation.length} sub="nap"/></div><section className="statsGrid"><div className="card statPanel"><h2>Szolgálattípusok</h2>{byType.map(x=><div className="statRow" key={x.t}><span>{x.t}</span><b>{x.n} db · {x.h.toFixed(1)} óra</b></div>)}</div><div className="card statPanel"><h2>Havi összegzés</h2><div className="bigNumber">{(hours(services)+hours(overtime)).toFixed(1)} óra</div><p>szolgálat + túlóra együtt</p><div className="statRow"><span>Első bejegyzés</span><b>{items.length?items.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))[0].date:"—"}</b></div><div className="statRow"><span>Szolgálatos napok</span><b>{new Set(services.map(x=>x.date)).size}</b></div></div></section></main></div>
}

function AdminPage({dark,onBack,onToggleDark,onLogout}){
  const [data,setData]=useState({users:[]}),[settings,setSettings]=useState({app_name:"Szolgálat Naptár",retention_days:90,service_types:TYPES,call_signs:CALLSIGNS}),[loading,setLoading]=useState(true),[error,setError]=useState(""),[tab,setTab]=useState("users"),[editUser,setEditUser]=useState(null),[saving,setSaving]=useState(false);
  const load=async()=>{setLoading(true);setError("");try{const [u,st]=await Promise.all([api("/api/admin"),api("/api/admin/settings")]);setData(u);setSettings(st)}catch(e){setError(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const remove=async u=>{if(!confirm(`Biztosan törlöd a(z) ${u.username} felhasználót? A hozzá tartozó szolgálatok is törlődnek.`))return;try{await api(`/api/admin/users/${u.id}`,{method:"DELETE"});load()}catch(e){setError(e.message)}};
  const saveUser=async u=>{setSaving(true);try{await api(`/api/admin/users/${u.id}`,{method:"PUT",body:JSON.stringify(u)});setEditUser(null);load()}catch(e){setError(e.message)}finally{setSaving(false)}};
  const saveSettings=async e=>{e.preventDefault();setSaving(true);try{const b={...settings,service_types:settings.service_types.filter(Boolean),call_signs:settings.call_signs.filter(Boolean)};const r=await api("/api/admin/settings",{method:"PUT",body:JSON.stringify(b)});setSettings(r);setError("");alert("A rendszerbeállítások mentve.")}catch(e){setError(e.message)}finally{setSaving(false)}};
  return <div className="adminPage"><header className="nav"><div className="brand"><div className="brandIcon"><Users/></div><div><b>{settings.app_name||"Szolgálat"}</b><span>Adminisztráció</span></div></div><div className="navRight"><button className="round" onClick={onToggleDark}>{dark?<Sun/>:<Moon/>}</button><button className="round" onClick={onBack}><ArrowLeft/></button><button className="round logout" onClick={onLogout}><LogOut/></button></div></header><main><section className="pageHero"><div><div className="kicker">ADMINISZTRÁCIÓ</div><h1>{tab==="users"?"Felhasználók":"Rendszerbeállítások"}</h1><p>{tab==="users"?"Felhasználók kezelése, adatok módosítása és fiókok karbantartása.":"A szolgálati naptár központi beállításai."}</p></div></section>{error&&<div className="error pageError">{error}</div>}<div className="adminTabs"><button className={tab==="users"?"active":""} onClick={()=>setTab("users")}><Users/> Felhasználók</button><button className={tab==="settings"?"active":""} onClick={()=>setTab("settings")}><Save/> Rendszerbeállítások</button></div>{loading?<div className="card tabloEmpty">Betöltés…</div>:tab==="users"?<section className="card adminTable"><div className="adminTableHead"><span>Felhasználó</span><span>E-mail</span><span>Szolgálat</span><span>Túlóra</span><span>Óra</span><span>Művelet</span></div>{data.users.map(u=><div className="adminTableRow" key={u.id}><div><strong>{u.username}</strong><small>{new Date(u.created_at).toLocaleDateString("hu-HU")}</small></div><span>{u.email||"—"}</span><span>{u.service_count}</span><span>{u.overtime_count}</span><span>{Number(u.hours||0).toFixed(1)}</span><div className="adminActions"><button className="adminEdit" onClick={()=>setEditUser({...u,password:""})}><Pencil/></button><button className="adminDelete" disabled={u.username==="solteszjanos14"} onClick={()=>remove(u)}><Trash2/></button></div></div>)}</section>:<form className="card settingsPanel" onSubmit={saveSettings}><div className="settingsGrid"><label>Alkalmazás neve<input value={settings.app_name} onChange={e=>setSettings({...settings,app_name:e.target.value})}/></label><label>Adatok megőrzése (nap)<input type="number" min="1" max="3650" value={settings.retention_days} onChange={e=>setSettings({...settings,retention_days:Number(e.target.value)})}/><small>A szolgálatok ennél régebbi bejegyzései automatikusan törlődnek.</small></label><label className="full">Szolgálattípusok<small>Egy sor = egy választható típus.</small><textarea value={settings.service_types.join("\n")} onChange={e=>setSettings({...settings,service_types:e.target.value.split("\n").map(x=>x.trim()).filter(Boolean)})}/></label><label className="full">Hívónevek<small>Egy sor = egy választható hívónév.</small><textarea value={settings.call_signs.join("\n")} onChange={e=>setSettings({...settings,call_signs:e.target.value.split("\n").map(x=>x.trim()).filter(Boolean)})}/></label></div><div className="settingsBottom"><span>Az új beállítások a következő adatlekéréskor érvényesülnek.</span><button className="save" disabled={saving}><Save/> {saving?"Mentés…":"Beállítások mentése"}</button></div></form>}{editUser&&<UserEditor user={editUser} close={()=>setEditUser(null)} save={saveUser} saving={saving}/>}</main></div>
}
function UserEditor({user,close,save,saving}){const [u,setU]=useState(user);return <div className="modalBg" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="editor adminEditor"><div className="editorTop"><div><span>FELHASZNÁLÓ</span><h2>Felhasználó szerkesztése</h2></div><button className="close" onClick={close}><X/></button></div><div className="formGrid"><label>Felhasználónév<input value={u.username} disabled={u.username==="solteszjanos14"} onChange={e=>setU({...u,username:e.target.value})}/></label><label>E-mail<input type="email" value={u.email||""} disabled={u.username==="solteszjanos14"} onChange={e=>setU({...u,email:e.target.value})}/></label><label className="full">Új jelszó <span className="optional">(üresen hagyva nem változik)</span><input type="password" minLength="6" value={u.password||""} onChange={e=>setU({...u,password:e.target.value})}/></label></div><div className="editorBottom"><span>Az admin jogosultságot a fő admin azonosítója adja.</span><div><button className="cancel" onClick={close}>Mégse</button><button className="save" disabled={saving} onClick={()=>save(u)}><Save/> Mentés</button></div></div></div></div>}

function Stat({icon,title,value,sub}){return <div className="stat card"><div className="statIcon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{sub}</small></div></div>}
function Calendar({month,selected,shifts,onSelect}){let first=new Date(month.getFullYear(),month.getMonth(),1),start=(first.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),cells=[];for(let i=0;i<start;i++)cells.push(null);for(let d=1;d<=days;d++)cells.push(new Date(month.getFullYear(),month.getMonth(),d));while(cells.length%7)cells.push(null);return <><div className="week">{["H","K","Sze","Cs","P","Szo","V"].map(x=><span key={x}>{x}</span>)}</div><div className="days">{cells.map((d,i)=>d?<button key={i} className={iso(d)===iso(selected)?"selected":""} onClick={()=>onSelect(d)}><b>{d.getDate()}</b>{shifts.filter(x=>dateKey(x.date)===iso(d)&&x.kind!=="vacation").map((x,j)=><i key={j} style={{background:x.kind==="overtime"?"#ef4444":(COLORS[x.type]||COLORS.Egyéb)}}/>)}{shifts.some(x=>dateKey(x.date)===iso(d)&&x.kind==="vacation")&&<em className="calendarVacationMark">×</em>}</button>:<div key={i}/>)}</div></>}
function Shift({shift,edit,remove}){if(shift.kind==="vacation")return <div className="shift vacationShift"><div className="stripe"/><div className="shiftMain"><div className="shiftLine"><span className="badge vacationBadge">Szabadság</span><small>nem számít bele az órákba</small></div><h3>Szabadság</h3></div><div className="shiftButtons"><button onClick={edit}><Pencil/></button><button onClick={remove} className="trash"><Trash2/></button></div></div>;return <div className={`shift ${shift.kind==="overtime"?"overtimeShift":""}`}><div className="stripe" style={{background:shift.kind==="overtime"?"#ef4444":(COLORS[shift.type]||COLORS.Egyéb)}}/><div className="shiftMain"><div className="shiftLine"><span className="badge" style={{background:(shift.kind==="overtime"?"#ef4444":(COLORS[shift.type]||COLORS.Egyéb))+"18",color:shift.kind==="overtime"?"#ef4444":(COLORS[shift.type]||COLORS.Egyéb)}}>{shift.kind==="overtime"?"Túlóra":shift.type}</span><small>{duration(shift.start,shift.end).toFixed(1)} óra</small></div><h3>{shift.start} <i>→</i> {shift.end}</h3>{shift.location&&<p><MapPin/>{shift.location}</p>}{shift.note&&<p><FileText/>{shift.note}</p>}</div><div className="shiftButtons"><button onClick={edit}><Pencil/></button><button onClick={remove} className="trash"><Trash2/></button></div></div>}
function Editor({shift,defaultDate,existingShifts,close,save,remove}){
  const [cfg,setCfg]=useState({service_types:TYPES,call_signs:CALLSIGNS});
  useEffect(()=>{api("/api/settings").then(setCfg).catch(()=>{})},[]);
  const initialKind=shift?.kind==="vacation"?"vacation":shift?.kind==="overtime"?"overtime":"service";
  const[date,setDate]=useState(shift?.date||iso(defaultDate)),[kind,setKind]=useState(initialKind),[start,setStart]=useState(shift?.start||"06:00"),[end,setEnd]=useState(shift?.end||"18:00"),[type,setType]=useState(shift?.type||"Járőr szolgálat"),[parentId,setParentId]=useState(shift?.parent_shift_id?String(shift.parent_shift_id):""),[callSign,setCallSign]=useState(shift?.call_sign||""),[location,setLocation]=useState(shift?.location||""),[note,setNote]=useState(shift?.note||"");
  const services=(existingShifts||[]).filter(x=>x.kind!=="vacation"&&x.kind!=="overtime"&&(dateKey(x.date)===dateKey(date)||String(x.id)===String(parentId))&&String(x.id)!==String(shift?.id)).sort((a,b)=>(a.start||"").localeCompare(b.start||""));
  useEffect(()=>{if(kind==="overtime"&&parentId){const p=services.find(x=>String(x.id)===String(parentId));if(p)setStart(p.end)}},[kind,parentId,date]);
  useEffect(()=>{if(kind==="overtime"&&!parentId&&services.length===1){setParentId(String(services[0].id));setStart(services[0].end)}},[kind,date]);
  const submit=()=>{
    if(kind==="vacation")return save({id:shift?.id,date,start:"00:00",end:"00:00",type:"Szabadság",kind:"vacation",parent_shift_id:null,call_sign:"",location:"",note});
    if(kind==="overtime")return save({id:shift?.id,date,start,end,type:"Túlóra",kind:"overtime",parent_shift_id:parentId||null,call_sign:callSign,location,note});
    return save({id:shift?.id,date,start,end,type,kind:"service",parent_shift_id:null,call_sign:callSign,location,note});
  };
  return <div className="modalBg" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="editor"><div className="editorTop"><div><span>BEJEGYZÉS</span><h2>{shift?"Bejegyzés szerkesztése":"Új bejegyzés"}</h2></div><button className="close" onClick={close}><X/></button></div><div className="formGrid">
    <label className="full">Bejegyzés típusa<select value={kind} onChange={e=>{const v=e.target.value;setKind(v);if(v==="vacation"){setParentId("");setType("Szabadság")}else if(v==="service"){setParentId("");setType("Járőr szolgálat")}}}><option value="service">Szolgálat</option><option value="vacation">Szabadság</option><option value="overtime">Túlóra</option></select></label>
    <label className="full">Dátum<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>
    {kind!=="vacation"&&kind!=="overtime"&&<><label>Kezdés<input type="time" value={start} onChange={e=>setStart(e.target.value)} required/></label><label>Befejezés<input type="time" value={end} onChange={e=>setEnd(e.target.value)} required/></label><label className="full">Szolgálat típusa<select value={type} onChange={e=>setType(e.target.value)} required>{(cfg.service_types||TYPES).map(t=><option key={t}>{t}</option>)}</select></label></>}
    {kind==="overtime"&&<><label className="full">Kapcsolódó szolgálat<select value={parentId} onChange={e=>{setParentId(e.target.value);const p=services.find(x=>String(x.id)===e.target.value);if(p)setStart(p.end)}} required><option value="">Válassz szolgálatot…</option>{services.map(x=><option key={x.id} value={x.id}>{x.start}–{x.end} · {x.type}</option>)}</select></label><label>Kezdés<input type="time" value={start} readOnly/></label><label>Túlóra vége<input type="time" value={end} onChange={e=>setEnd(e.target.value)} required/></label></>}
    {kind!=="vacation"&&<><label className="full">Hívónév <span className="optional">(nem kötelező)</span><select value={callSign} onChange={e=>setCallSign(e.target.value)}><option value="">Nincs megadva</option>{(cfg.call_signs||CALLSIGNS).map(c=><option key={c}>{c}</option>)}</select></label><label className="full">Szolgálati hely <span className="optional">(nem kötelező)</span><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="pl. BRFK TIK"/></label><label className="full">Megjegyzés <span className="optional">(nem kötelező)</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Opcionális megjegyzés..."/></label></>}
    {kind==="vacation"&&<div className="vacationInfo full"><b>Szabadság</b><span>A Tablóban ezen a napon piros × jelenik meg, és a szabadság nem számít bele a szolgálati órákba.</span></div>}
    {kind==="overtime"&&<div className="overtimeInfo full"><b>Túlóra</b><span>A túlóra a kapcsolódó szolgálat végétől folytatódik, és a Tablóban piros sávként jelenik meg.</span></div>}
  </div><div className="editorBottom">{remove?<button className="delete" onClick={remove}><Trash2/> Törlés</button>:<span/>}<div><button className="cancel" onClick={close}>Mégse</button><button className="save" onClick={submit}><Save/> Mentés</button></div></div></div></div>}
registerServiceWorker();
createRoot(document.getElementById("root")).render(<AppErrorBoundary><App/></AppErrorBoundary>);
