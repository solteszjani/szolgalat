
import React,{useMemo,useState,useEffect}from"react";
import{createRoot}from"react-dom/client";
import{CalendarDays,Plus,Clock3,MapPin,FileText,Pencil,Trash2,ChevronLeft,ChevronRight,Moon,Sun,Save,X,Timer,BriefcaseBusiness,LogOut,RefreshCw,Cloud,CloudOff,Users,Table2,ArrowLeft,Search}from"lucide-react";
import"./styles.css";
import{registerServiceWorker}from"./registerSW.js";
const TYPES=["Járőr szolgálat","Egyéb","Blaha Poszt","Pápa tér poszt"],CALLSIGNS=["Józsefváros-121","Józsefváros-122","Józsefváros-123","Józsefváros-321","Józsefváros-322","Józsefváros-491","Józsefváros-141"],COLORS={"Járőr szolgálat":"#3b82f6","Egyéb":"#06b6d4","Blaha Poszt":"#8b5cf6","Pápa tér poszt":"#f59e0b"},pad=n=>String(n).padStart(2,"0"),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,dateKey=v=>{if(v instanceof Date)return Number.isNaN(v.getTime())?"":iso(v);const s=String(v??"");const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:""},fromISO=s=>{const k=dateKey(s);if(!k)return new Date(NaN);let[y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)},mins=t=>{let[h,m]=t.split(":").map(Number);return h*60+m},duration=(a,b)=>{let n=mins(b)-mins(a);if(n<0)n+=1440;return n/60};

async function api(url,opt={}){let token=localStorage.getItem("sz_token");let r=await fetch(url,{...opt,headers:{"Content-Type":"application/json",...(opt.headers||{}),...(token?{Authorization:"Bearer "+token}:{})}});let data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||"Hiba történt");return data}
function Auth({onAuth}){const[register,setRegister]=useState(false),[username,setUsername]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");const go=async e=>{e.preventDefault();setError("");setBusy(true);try{let d=await api(register?"/api/auth/register":"/api/auth/login",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem("sz_token",d.token);onAuth(d.user)}catch(e){setError(e.message)}finally{setBusy(false)}};return <div className="auth"><div className="authCard"><div className="authLogo"><CalendarDays/></div><h1>Szolgálat<br/><em>Naptár</em></h1><p>A szolgálatvezénylésed biztonságosan, online.</p><form onSubmit={go}><label>Felhasználónév<input type="text" value={username} onChange={e=>setUsername(e.target.value)} required minLength="3" maxLength="30" autoCapitalize="none" autoCorrect="off" placeholder="pl. kovacs.janos"/></label><label>Jelszó<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required placeholder="Legalább 6 karakter"/></label>{error&&<div className="error">{error}</div>}<button className="primary authBtn" disabled={busy}>{busy?"Feldolgozás…":register?"Fiók létrehozása":"Bejelentkezés"}</button></form><button className="linkBtn" onClick={()=>setRegister(!register)}>{register?"Már van fiókom":"Még nincs fiókom → Regisztráció"}</button><small className="privacy"><Cloud size={13}/> A szolgálatok online adatbázisban tárolódnak.</small></div></div>}


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
  const mh=ms.reduce((a,x)=>a+duration(x.start,x.end),0);
  const next=[...shifts].filter(x=>(x.date+x.start)>=iso(new Date())+pad(new Date().getHours())+pad(new Date().getMinutes())).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))[0];

  if(loading)return <div className={dark?"app dark":"app"}><div className="loadingScreen"><CalendarDays/><span>Betöltés…</span></div></div>;
  if(!user)return <Auth onAuth={u=>{setUser(u);load()}}/>;

  if(page==="tablo")return <div className={dark?"app dark":"app"}><Tablo dark={dark} onBack={()=>setPage("home")} onToggleDark={()=>{setDark(v=>{localStorage.setItem("szolgalat-dark",v?"0":"1");return !v})}} onLogout={logout}/></div>;

  return <div className={dark?"app dark":"app"}>
    <header className="nav">
      <div className="brand"><div className="brandIcon"><CalendarDays/></div><div><b>Szolgálat</b><span>Naptár</span></div></div>
      <div className="navRight">
        <span className="sync">{syncing?<RefreshCw className="spin"/>:<Cloud/>}</span>
        <button className="round" onClick={()=>setDark(v=>{localStorage.setItem("szolgalat-dark",v?"0":"1");return !v})}>{dark?<Sun/>:<Moon/>}</button>
        <button className="round logout" onClick={logout}><LogOut/></button>
        <button className="round tabloNav" title="Tabló" onClick={()=>setPage("tablo")}><Table2/></button>
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
        <Stat icon={<BriefcaseBusiness/>} title="Szolgálatok" value={ms.length} sub="bejegyzés ebben a hónapban"/>
        <Stat icon={<Timer/>} title="Mai nap" value={`${day.reduce((a,x)=>a+duration(x.start,x.end),0).toFixed(1)} óra`} sub={day.length?"szolgálat rögzítve":"nincs szolgálat"}/>
      </section>
      <section className="workspace">
        <div className="calendar card"><div className="sectionHead"><div><span>NAPTÁR</span><h2>{month.toLocaleDateString("hu-HU",{month:"long",year:"numeric"})}</h2></div><div className="arrows"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft/></button><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight/></button></div></div><Calendar month={month} selected={selected} shifts={shifts} onSelect={setSelected}/></div>
        <div className="agenda card"><div className="agendaHead"><div><span>NAPIRAJZ</span><h2>{selected.toLocaleDateString("hu-HU",{month:"long",day:"numeric"})}</h2><small>{selected.toLocaleDateString("hu-HU",{weekday:"long"})}</small></div><button className="miniAdd" onClick={()=>setModal({mode:"new"})}><Plus/></button></div><div className="agendaBody">{day.length?day.map(s=><Shift key={s.id} shift={s} edit={()=>setModal({mode:"edit",shift:s})} remove={()=>del(s.id)}/>):<div className="empty"><div><CalendarDays/></div><b>Szabadnap / nincs bejegyzés</b><span>Erre a napra még nincs rögzített szolgálat.</span><button onClick={()=>setModal({mode:"new"})}><Plus/> Szolgálat hozzáadása</button></div>}</div></div>
      </section>
    </main>
    <div className="mobileBar"><button className="active" onClick={()=>setSelected(new Date())}><CalendarDays/><span>Ma</span></button><button onClick={()=>setPage("tablo")}><Table2/><span>Tabló</span></button><button onClick={()=>setModal({mode:"new"})} className="fab"><Plus/></button><button onClick={load}><Cloud/><span>Szinkron</span></button></div>
    {modal&&<Editor shift={modal.mode==="edit"?modal.shift:null} defaultDate={selected} close={()=>setModal(null)} save={saveShift} remove={modal.mode==="edit"?()=>del(modal.shift.id):null}/>}
  </div>
}


function Tablo({dark,onBack,onToggleDark,onLogout}){
  const[data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[search,setSearch]=useState(""),[typeFilter,setTypeFilter]=useState("Mind"),[selectedDate,setSelectedDate]=useState(new Date()),[selectedShift,setSelectedShift]=useState(null);
  const loadTablo=()=>{setLoading(true);api("/api/tablo").then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
  useEffect(()=>{loadTablo()},[]);
  const days=useMemo(()=>{const base=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),selectedDate.getDate());return Array.from({length:10},(_,i)=>new Date(base.getFullYear(),base.getMonth(),base.getDate()+i))},[selectedDate]);
  const filtered=data.filter(x=>{const q=search.trim().toLowerCase();const ms=!q||[x.username,x.call_sign,x.type,x.location,x.note,x.date,x.start,x.end].join(" ").toLowerCase().includes(q);const mt=typeFilter==="Mind"||x.type===typeFilter;return ms&&mt});
  const users=useMemo(()=>{const m=new Map();filtered.forEach(x=>{if(!m.has(x.user_id))m.set(x.user_id,x.username)});return [...m.entries()]},[filtered]);
  const shiftParts=(x,day)=>{
    const d=dateKey(x.date),dayDiff=Math.round((day-fromISO(d))/86400000),sm=mins(x.start),em=mins(x.end);
    if(!d||dayDiff<0||dayDiff>1)return null;
    if(dayDiff===0){
      if(em>sm)return {dayIndex:dayDiff,from:sm,to:em,overnight:false};
      return {dayIndex:dayDiff,from:sm,to:1440,overnight:true};
    }
    if(dayDiff===1&&em<=sm)return {dayIndex:dayDiff,from:0,to:em,overnight:true};
    return null;
  };
  const dayWidth=100/10;
  const shiftStyle=(part)=>({
    left:`${(part.dayIndex + part.from/1440)*dayWidth}%`,
    width:`${Math.max((part.to-part.from)/1440*dayWidth,2.5)}%`
  });
  const shiftStart=(x,base)=>{
    const diff=Math.round((fromISO(dateKey(x.date))-base)/86400000);
    return diff*1440+mins(x.start);
  };
  const shiftEnd=(x,base)=>{
    const start=shiftStart(x,base),sm=mins(x.start),em=mins(x.end);
    return start+(em>sm?em-sm:1440-sm+em);
  };
  const makeLanes=(items,base)=>{
    const lanes=[],laneById={};
    [...items].sort((a,b)=>shiftStart(a,base)-shiftStart(b,base)).forEach(x=>{
      const start=shiftStart(x,base),end=shiftEnd(x,base);
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
      <div className="navRight"><button className="round" onClick={onToggleDark}>{dark?<Sun/>:<Moon/>}</button><button className="round" onClick={onBack}><ArrowLeft/></button><button className="round logout" onClick={onLogout}><LogOut/></button></div>
    </header>
    <main>
      <section className="tabloHero"><div><div className="kicker">KÖZÖS SZOLGÁLATI TÁBLÓ</div><h1>Tabló</h1><p>Az állomány szolgálatai egy közös, 10 napos idősávban.</p></div><div className="tabloCount"><Users/><strong>{users.length}</strong><span>regisztrált tag</span></div></section>
      <div className="tabloToolbar card">
        <div className="searchBox"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Keresés név, hívónév vagy szolgálat alapján…"/></div>
        <select className="tabloFilter" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>Mind</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
        <label className="dateJump"><CalendarDays/><input type="date" value={iso(selectedDate)} onChange={e=>{if(e.target.value)setSelectedDate(fromISO(e.target.value))}}/></label>
        <div className="tabloNavDates"><button onClick={()=>setSelectedDate(d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()-10))}><ChevronLeft/></button><button onClick={()=>setSelectedDate(new Date())}>Ma</button><button onClick={()=>setSelectedDate(d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+10))}><ChevronRight/></button></div>
      </div>
      {error&&<div className="error pageError">{error}</div>}
      {loading?<div className="card tabloEmpty">Betöltés…</div>:<div className="card roster">
        <div className="rosterTop"><div className="rosterNameHead">ÁLLOMÁNY</div><div className="rosterDays">{days.map((d,i)=><div key={i} className={iso(d)===iso(new Date())?"todayCol":""}><b>{fmtDay(d)}</b><span>{d.getDate()}</span></div>)}</div></div>
        {users.length?users.map(([uid,username])=>{
          const personShifts=filtered.filter(x=>String(x.user_id)===String(uid));
          const visiblePersonShifts=personShifts.filter(x=>days.some(d=>shiftParts(x,d)));
          const laneInfo=makeLanes(visiblePersonShifts,days[0]);
          const rowHeight=24+laneInfo.lanes*43;
          return <div className="rosterRow" key={uid} style={{minHeight:rowHeight}}><div className="rosterUser"><div className="personAvatar">{String(username||"?").slice(0,1).toUpperCase()}</div><div><strong>{username}</strong><small>{personShifts.length} szolgálat</small></div></div><div className="rosterTimeline" style={{minHeight:rowHeight}}>
            {days.map((d,i)=><div className="rosterCell" key={i} style={{minHeight:rowHeight}}></div>)}
            {personShifts.map(x=>days.map((d,i)=>{const p=shiftParts(x,d);if(!p)return null;const overnight=p.overnight;const lane=laneInfo.laneById[x.id]||0;return <button key={`${x.id}-${i}`} className={`rosterShift ${overnight?"overnight":""} ${x.type==="Egyéb"?"otherShift":""}`} style={{...shiftStyle(p),top:10+lane*43}} onClick={()=>setSelectedShift(x)} title={`${x.start}–${x.end}`}><span>{i===0?`${x.start}–${x.end}`:`↳ ${x.end}`}{overnight&&<Moon className="nightIcon"/>}</span></button>}))}
          </div></div>
        }):<div className="tabloEmpty">Nincs a szűrésnek megfelelő szolgálat.</div>}
      </div>}
      <div className="timelineLegend"><span><i className="legendDot"></i> Járőr szolgálat</span><span><i className="legendDot other"></i> Egyéb</span><span>↪ átnyúló / éjszakai</span></div>
      <p className="tabloNotice">A Tabló az elmúlt 90 nap és a jövőbeli szolgálatok adatait jeleníti meg. 10 nap látható egyszerre.</p>
    </main>
    {selectedShift&&<div className="modalBg tabloDetailBg" onMouseDown={e=>e.target===e.currentTarget&&setSelectedShift(null)}><div className="tabloDetail card">
      <div className="tabloDetailTop"><div><span>SZOLGÁLATI RÉSZLETEK</span><h2>{selectedShift.type}</h2></div><button className="close" onClick={()=>setSelectedShift(null)}><X/></button></div>
      <div className="tabloDetailUser"><div className="personAvatar">{String(selectedShift.username||"?").slice(0,1).toUpperCase()}</div><div><strong>{selectedShift.username}</strong><small>{selectedShift.call_sign||"Hívónév nincs megadva"}</small></div></div>
      <div className="tabloDetailGrid">
        <div><CalendarDays/><span><small>Dátum</small><strong>{fmtFull(fromISO(selectedShift.date))}</strong></span></div>
        <div><Clock3/><span><small>Kezdés – befejezés</small><strong>{selectedShift.start} – {selectedShift.end}</strong></span></div>
        <div><Table2/><span><small>Szolgálat típusa</small><strong>{selectedShift.type}</strong></span></div>
        <div><Users/><span><small>Hívónév</small><strong>{selectedShift.call_sign||"Nincs megadva"}</strong></span></div>
        <div className="full"><MapPin/><span><small>Helyszín</small><strong>{selectedShift.location||"Nincs megadva"}</strong></span></div>
        <div className="full"><FileText/><span><small>Megjegyzés</small><strong>{selectedShift.note||"Nincs megadva"}</strong></span></div>
      </div>
      <button className="tabloDetailClose" onClick={()=>setSelectedShift(null)}>Bezárás</button>
    </div></div>}
  </div>
}

function Stat({icon,title,value,sub}){return <div className="stat card"><div className="statIcon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{sub}</small></div></div>}
function Calendar({month,selected,shifts,onSelect}){let first=new Date(month.getFullYear(),month.getMonth(),1),start=(first.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),cells=[];for(let i=0;i<start;i++)cells.push(null);for(let d=1;d<=days;d++)cells.push(new Date(month.getFullYear(),month.getMonth(),d));while(cells.length%7)cells.push(null);return <><div className="week">{["H","K","Sze","Cs","P","Szo","V"].map(x=><span>{x}</span>)}</div><div className="days">{cells.map((d,i)=>d?<button key={i} className={iso(d)===iso(selected)?"selected":""} onClick={()=>onSelect(d)}><b>{d.getDate()}</b>{shifts.filter(x=>dateKey(x.date)===iso(d)).map((x,j)=><i key={j} style={{background:COLORS[x.type]||COLORS.Egyéb}}/>)}</button>:<div key={i}/>)}</div></>}
function Shift({shift,edit,remove}){return <div className="shift"><div className="stripe" style={{background:COLORS[shift.type]||COLORS.Egyéb}}/><div className="shiftMain"><div className="shiftLine"><span className="badge" style={{background:(COLORS[shift.type]||COLORS.Egyéb)+"18",color:COLORS[shift.type]||COLORS.Egyéb}}>{shift.type}</span><small>{duration(shift.start,shift.end).toFixed(1)} óra</small></div><h3>{shift.start} <i>→</i> {shift.end}</h3>{shift.location&&<p><MapPin/>{shift.location}</p>}{shift.note&&<p><FileText/>{shift.note}</p>}</div><div className="shiftButtons"><button onClick={edit}><Pencil/></button><button onClick={remove} className="trash"><Trash2/></button></div></div>}
function Editor({shift,defaultDate,close,save,remove}){const[date,setDate]=useState(shift?.date||iso(defaultDate)),[start,setStart]=useState(shift?.start||"06:00"),[end,setEnd]=useState(shift?.end||"18:00"),[type,setType]=useState(shift?.type||"Járőr szolgálat"),[callSign,setCallSign]=useState(shift?.call_sign||""),[location,setLocation]=useState(shift?.location||""),[note,setNote]=useState(shift?.note||"");return <div className="modalBg" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="editor"><div className="editorTop"><div><span>BEJEGYZÉS</span><h2>{shift?"Szolgálat szerkesztése":"Új szolgálat"}</h2></div><button className="close" onClick={close}><X/></button></div><div className="formGrid"><label className="full">Dátum<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Kezdés<input type="time" value={start} onChange={e=>setStart(e.target.value)} required/></label><label>Befejezés<input type="time" value={end} onChange={e=>setEnd(e.target.value)} required/></label><label className="full">Szolgálat típusa<select value={type} onChange={e=>setType(e.target.value)} required>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label><label className="full">Hívónév <span className="optional">(nem kötelező)</span><select value={callSign} onChange={e=>setCallSign(e.target.value)}><option value="">Nincs megadva</option>{CALLSIGNS.map(c=><option key={c}>{c}</option>)}</select></label><label className="full">Szolgálati hely <span className="optional">(nem kötelező)</span><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="pl. BRFK TIK"/></label><label className="full">Megjegyzés <span className="optional">(nem kötelező)</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Opcionális megjegyzés..."/></label></div><div className="editorBottom">{remove?<button className="delete" onClick={remove}><Trash2/> Törlés</button>:<span/>}<div><button className="cancel" onClick={close}>Mégse</button><button className="save" onClick={()=>save({id:shift?.id,date,start,end,type,call_sign:callSign,location,note})}><Save/> Mentés</button></div></div></div></div>}
registerServiceWorker();
createRoot(document.getElementById("root")).render(<App/>);
