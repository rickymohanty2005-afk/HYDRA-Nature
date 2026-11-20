// Generates dark-mode overrides for every color utility class used in src. Output is appended to src/index.css between markers.
import fs from 'fs'; import path from 'path';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const src=walk('src').filter(f=>/\.(tsx|ts)$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n')+fs.readFileSync('index.html','utf8');

const grays={50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827'};
const hydra={dark:'#13382B',darker:'#0C241B',deep:'#1A4938',accent:'#C5A880',accentLight:'#E8DFD0',accentDark:'#A68962',sand:'#FAF8F5',cream:'#F4F0EB',sage:'#EAF1EB',sageText:'#3F6352',border:'#E8E4DD',muted:'#687770',charcoal:'#1A211D'};
const orig=(tok)=>{
  if(tok==='white')return '#ffffff'; if(tok==='black')return '#000000';
  let m=tok.match(/^\[(#[0-9a-fA-F]{3,6})\]$/); if(m)return m[1];
  m=tok.match(/^gray-(\d+)$/); if(m)return grays[m[1]]||null;
  m=tok.match(/^hydra-(\w+)$/); if(m)return hydra[m[1]]||null;
  return null;
};
const norm=h=>{h=h.toLowerCase(); if(h.length===4)h='#'+[...h.slice(1)].map(c=>c+c).join(''); return h;};

// kind -> { hex(lowercase, original) : dark replacement }
const BG={'#faf8f5':'#0e1512','#ffffff':'#16201b','#eaf1eb':'#1b2a23','#f4f0eb':'#1b2620','#f7faf8':'#18221d','#f6faf6':'#18221d','#f7f5f0':'#1b2620','#fbf7f0':'#1b2620','#f0ece4':'#1b2620','#ede8e1':'#243029','#f9fafb':'#18221d','#f3f4f6':'#1b2620','#e5e7eb':'#2a3830','#d1d5db':'#33443b','#13382b':'#1f5a45','#1e4d3b':'#25624c','#f3e4c8':'#3a3222','#d3eeee':'#17383a','#e8dfd0':'#33382d','#c9beb0':'#4a463f','#2e6b48':'#2e6b48','#fff7ed':'#2f2519','#fef2f2':'#33201f','#f0fdf4':'#17291d','#ecfdf5':'#17291d','#eff6ff':'#18273a','#fefce8':'#2f2b17'};
const TEXT={'#13382b':'#e6efe9','#2e6b48':'#7fcb9c','#04282b':'#e3f1f1','#031f26':'#e3f1f1','#3f6352':'#a9c7b8','#1a211d':'#e8edea','#687770':'#9db0a6','#6b8075':'#a3b5ab','#556b60':'#a3b5ab','#56645d':'#a3b5ab','#708078':'#a3b5ab','#8e9e95':'#a3b5ab','#9caaa1':'#a3b5ab','#2d634c':'#7fcb9c','#111827':'#edf2ef','#1f2937':'#edf2ef','#374151':'#c9d3cd','#4b5563':'#c9d3cd','#6b7280':'#a5b2ab','#9ca3af':'#8a9992','#000000':'#edf2ef','#b91c1c':'#f08a8a','#a68962':'#d1b88e'};
const BORDER={'#ede8e1':'#2a3830','#e2dbd1':'#2f3e35','#e8dfd0':'#2f3e35','#d9d0c4':'#385044','#e8e4dd':'#2a3830','#f3f4f6':'#25312a','#e5e7eb':'#2a3830','#d1d5db':'#33443b','#9ca3af':'#4a5c52','#13382b':'#4a9a7c','#b8dac2':'#2f4a3d','#b9d1be':'#2f4a3d','#c5dbcb':'#2f4a3d','#22503e':'#3a6a56','#2e6b48':'#3f8a63','#04282b':'#2e6b6f'};
const maps={bg:BG,text:TEXT,border:BORDER,divide:BORDER,ring:{'#13382b':'#5fb08f'},placeholder:TEXT};
const prop={bg:'background-color',text:'color',border:'border-color',divide:'border-color',ring:'--tw-ring-color',placeholder:'color'};
const BP={sm:640,md:768,lg:1024,xl:1280,'2xl':1536};
const rgb=h=>{h=norm(h);return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(',');};

const re=/(?<![\w-])((?:(?:sm|md|lg|xl|2xl|hover|focus|active|group-hover|focus-within):)*)(bg|text|border|divide|ring|placeholder)-(\[#[0-9a-fA-F]{3,6}\]|white|black|gray-\d+|hydra-\w+)(?:\/(\d+|\[[\d.]+\]))?(?![\w-])/g;
const seen=new Map();
for(const m of src.matchAll(re)){seen.set(m[0],m);}
const esc=s=>s.replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c);
const out=[], byBp={};
for(const [cls,m] of seen){
  const [,prefixes,kind,tok,op]=m;
  const o=orig(tok); if(!o)continue;
  const hex=norm(o);
  const parts=prefixes.split(':').filter(Boolean);
  const states=parts.filter(p=>!BP[p]);
  const bp=parts.find(p=>BP[p]);
  const isState=states.length>0;
  const mapped=maps[kind][hex];
  const val=mapped||(isState?hex:null);
  if(!val)continue;
  if(kind==='text'&&hex==='#ffffff'&&!isState)continue;
  let color=op?`rgba(${rgb(val)},${op.startsWith('[')?op.slice(1,-1):(+op/100)})`:val;
  let sel='.dark .'+esc(cls);
  if(states.includes('hover'))sel+=':hover';
  if(states.includes('focus'))sel+=':focus';
  if(states.includes('active'))sel+=':active';
  if(states.includes('focus-within'))sel+=':focus-within';
  if(states.includes('group-hover'))sel='.dark .group:hover .'+esc(cls);
  if(kind==='placeholder')sel+='::placeholder';
  if(kind==='divide')sel+=' > :not([hidden]) ~ :not([hidden])';
  let rule=`${sel}{${prop[kind]}:${color}}`;
  if(kind==='ring')rule=`${sel}{--tw-ring-color:${color}}`;
  if(bp)(byBp[bp]??=[]).push(rule); else out.push(rule);
}
// ordering: non-state before state so hover wins
const isSt=r=>/:hover|:focus|:active|group:hover/.test(r);
let css=[...out.filter(r=>!isSt(r)),...out.filter(isSt)].join('\n');
for(const bp of Object.keys(BP)) if(byBp[bp]) css+=`\n@media (min-width:${BP[bp]}px){\n${byBp[bp].join('\n')}\n}`;

const extra=`
.dark .bg-\\[\\#C5A880\\].text-\\[\\#13382B\\],.dark .bg-\\[\\#C5A880\\] .text-\\[\\#13382B\\]{color:#0c241b}
.dark .bg-\\[\\#F3E4C8\\] .text-\\[\\#13382B\\]{color:#f3e4c8}
.dark input,.dark textarea,.dark select{color:#edf2ef;color-scheme:dark}
.dark input::placeholder,.dark textarea::placeholder{color:#7f9288}
.dark ::-webkit-scrollbar-track{background:#0e1512}
.dark body{background-color:#0e1512;color:#e8edea}
.dark .luxury-card{background:#16201b;border-color:rgba(60,80,70,.6)}
.dark img{filter:brightness(.92)}
`;
const START='/* DARK-MODE:START (generated by scripts/gen-dark.mjs) */', END='/* DARK-MODE:END */';
let base=fs.readFileSync('src/index.css','utf8');
const i=base.indexOf(START); if(i>=0)base=base.slice(0,i).trimEnd()+'\n';
fs.writeFileSync('src/index.css',base+'\n'+START+'\n'+css+'\n'+extra+END+'\n');
console.log('rules',out.length+Object.values(byBp).flat().length);
