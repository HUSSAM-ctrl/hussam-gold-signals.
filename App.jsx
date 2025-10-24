import React, { useEffect, useState } from 'react';

export default function App(){
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState('غير متصل');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [password, setPassword] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(()=>{
    // بناء عنوان الويب سوكيت بناء على مكان الاستضافة
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.hostname;
    // هنا نفترض أن الخادم مصحوب بنفس الدومين على بورت 8000 أو استخدم نطاق الخادم
    const url = `${proto}://${host}/ws`;
    const socket = new WebSocket(url);
    socket.onopen = ()=> setStatus('متصل');
    socket.onclose = ()=> setStatus('مغلق');
    socket.onerror = ()=> setStatus('خطأ في الاتصال');
    socket.onmessage = (ev)=> {
      try{
        const msg = JSON.parse(ev.data);
        if(msg.type === 'signal') setSignals(prev=> [msg.payload, ...prev].slice(0,50));
      }catch(e){}
    };
    setWs(socket);
    return ()=> socket.close();
  },[]);

  useEffect(()=>{
    if(token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },[token]);

  async function doLogin(){
    try{
      const resp = await fetch('/api/loginProxy', { // note: deployed will proxy to backend
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({password})
      });
      if(!resp.ok) throw new Error('فشل تسجيل الدخول');
      const j = await resp.json();
      setToken(j.token);
      setPassword('');
      alert('تم تسجيل الدخول');
    }catch(e){ alert('خطأ تسجيل الدخول') }
  }

  async function sendManual(){
    const instrument = prompt('أدخل رمز الأداة (مثال XAUUSD):', 'XAUUSD');
    const action = prompt('BUY أو SELL؟', 'BUY');
    const entry = parseFloat(prompt('سعر الدخول مثلاً 1975.50', '0'));
    const sl = parseFloat(prompt('SL', '0'));
    const tp = parseFloat(prompt('TP', '0'));
    if(!instrument || !action) return;
    try{
      const resp = await fetch('/api/manualProxy', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key': token || '' },
        body: JSON.stringify({ instrument, action, entry, sl, tp })
      });
      if(!resp.ok) throw new Error('failed');
      alert('تم إرسال التوصية يدوياً');
    }catch(e){ alert('فشل إرسال التوصية') }
  }

  return (
    <div style={{fontFamily:'sans-serif',background:'#0f1720',minHeight:'100vh',color:'#fff',padding:20}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <h1 style={{fontSize:24,fontWeight:700,marginBottom:12}}>توصيات سريعة — ذهب (XAUUSD)</h1>

        <div style={{marginBottom:12}}>حالة الإتصال: <span style={{fontWeight:700}}>{status}</span></div>

        {!token ? (
          <div style={{marginBottom:12,background:'#111827',padding:12,borderRadius:8}}>
            <h3>تسجيل دخول</h3>
            <input placeholder="كلمة المرور" type="password" value={password}
              onChange={e=>setPassword(e.target.value)} style={{padding:8,marginRight:8}}/>
            <button onClick={doLogin} style={{padding:8}}>دخول</button>
            <div style={{fontSize:12,color:'#9CA3AF',marginTop:8}}>الموقع خاص؛ تحتاج كلمة مرور للدخول.</div>
          </div>
        ) : (
          <div style={{marginBottom:12}}>
            <button onClick={()=>{setToken(''); alert('تم تسجيل الخروج')}} style={{padding:8}}>خروج</button>
            <button onClick={sendManual} style={{padding:8, marginLeft:8}}>أضافة توصية يدوية</button>
          </div>
        )}

        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <div style={{flex:1,background:'#111827',padding:12,borderRadius:8}}>
            <h2 style={{fontWeight:600,marginBottom:8}}>آخر التوصيات</h2>
            {signals.length===0 && <div style={{color:'#9CA3AF'}}>لا توجد توصيات بعد</div>}
            <ul style={{listStyle:'none',padding:0,margin:0}}>
              {signals.map((s, i)=> (
                <li key={i} style={{padding:8,borderBottom:'1px solid #111',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700}}>{s.action} — {s.instrument} {s.manual ? '(يدوي)' : ''}</div>
                    <div style={{fontSize:12,color:'#9CA3AF'}}>{new Date(s.time).toLocaleString()}</div>
                  </div>
                  <div style={{textAlign:'right',fontSize:13}}>
                    <div>Entry: {s.entry}</div>
                    <div>SL: {s.sl}</div>
                    <div>TP: {s.tp}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{width:320,background:'#111827',padding:12,borderRadius:8}}>
            <h2 style={{fontWeight:600,marginBottom:8}}>سجل التيك (Tick Feed)</h2>
            <div style={{fontSize:12,color:'#9CA3AF'}}>يظهر هنا التيك والداتا الحية عند اتصال MT5</div>
          </div>
        </div>

        <div style={{marginTop:12,fontSize:12,color:'#94A3B8'}}>ملاحظة: هذه توصيات عرضية فقط. اختبر قبل التداول الحقيقي.</div>
      </div>
    </div>
  )
}