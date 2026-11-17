// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Demo data. Every key here is saved to the browser and synced across tabs.
// Local date as YYYY-MM-DD, `offset` days from today.
export const dayKey = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

// Money in and out recorded directly by Finance (salaries, rent, suppliers, other income), over the last 70 days.
function ledgerSeed() {
  const L = [], add = (off, dir, amt, cat, party, p, ref) => L.push({ id: 'LG' + (L.length + 1), at: dayKey(off), dir, amt, cat, party, p: p || '', method: dir === 'in' ? 'Bank' : (amt < 500000 ? 'Cash' : 'Bank'), ref: ref || '', by: 'RT' });
  [-62, -32, -2].forEach(o => { add(o, 'out', 18400000, 'Salaries', 'Staff payroll'); add(o + 1, 'out', 2600000, 'Statutory (NSSF, PAYE)', 'TRA / NSSF'); add(o, 'out', 3200000, 'Rent', 'Mikocheni office landlord'); });
  [-58, -28].forEach(o => { add(o, 'out', 410000, 'Utilities', 'TANESCO'); add(o + 2, 'out', 280000, 'Utilities', 'DAWASA'); add(o + 3, 'out', 650000, 'Internet & phone', 'Vodacom Business'); });
  const sup = [[-66, 7800000, 'PRJ-0231', 'Chapa Supplies'], [-54, 4300000, 'PRJ-0228', 'Vinyl House'], [-47, 9600000, 'PRJ-0233', 'Kariakoo Carpentry'], [-39, 3100000, 'PRJ-0226', 'Kivuko T-shirts Ltd'], [-30, 5400000, 'PRJ-0230', 'Outdoor Sites Co'], [-21, 6800000, 'PRJ-0231', 'Lake Zone Sound'], [-12, 2950000, 'PRJ-0228', 'Vinyl House'], [-6, 4100000, 'PRJ-0233', 'Kariakoo Carpentry'], [-1, 1750000, 'PRJ-0235', 'Serena Events']];
  sup.forEach(([o, a, p, who]) => add(o, 'out', a, 'Suppliers & production', who, p));
  for (let o = -68; o <= 0; o += 4) add(o, 'out', 180000 + ((o * 37) % 5) * 45000 + 90000, 'Fuel & transport', 'Puma / Oryx', o % 8 === 0 ? 'PRJ-0231' : '');
  [-60, -45, -25, -9].forEach(o => add(o, 'out', 350000, 'Office supplies', 'Mlimani Stationers'));
  [[-50, 22000000, 'Kilimo Bank', 'PRJ-0230'], [-35, 31500000, 'Mlimani Bank', 'PRJ-0233'], [-18, 15800000, 'Pwani Beverages', 'PRJ-0228'], [-8, 12600000, 'Kivuko Foods', 'PRJ-0226'], [-4, 9400000, 'Nyota Insurance', 'PRJ-0224']].forEach(([o, a, c, p]) => add(o, 'in', a, 'Client payment', c, p, 'CRDB'));
  add(-26, 'in', 1200000, 'Other income', 'Equipment hire · Safari Mobile');
  return L;
}

export function seed() {
  return {
  projects:[
    {id:'PRJ-0231',name:'Lake Zone Roadshow',client:'Serengeti Telecom',pm:'SK',st:'on',prog:58,val:168,bud:116,spent:71.4,stage:9,due:'10 Oct',team:['SK','MM','JM','GM','AJ']},
    {id:'PRJ-0228',name:'Outlet Branding · 8 outlets',client:'Pwani Beverages',pm:'SK',st:'risk',prog:72,val:94,bud:62,spent:69.4,stage:10,due:'23 Sep',team:['SK','JM','AJ']},
    {id:'PRJ-0233',name:'Expo Stand 2026',client:'Mlimani Bank',pm:'NL',st:'late',prog:44,val:126,bud:88,spent:41.2,stage:7,due:'25 Sep',team:['NL','MM','AJ','JA']},
    {id:'PRJ-0226',name:'Product Activation',client:'Kivuko Foods',pm:'MM',st:'on',prog:86,val:58,bud:39,spent:31.8,stage:12,due:'30 Sep',team:['MM','JM','FH']},
    {id:'PRJ-0235',name:'Brand Launch Gala',client:'Safari Mobile',pm:'NL',st:'on',prog:18,val:210,bud:148,spent:12.6,stage:3,due:'14 Nov',team:['NL','SK','RT','RS']},
    {id:'PRJ-0219',name:'Staff Uniforms · 1,200 pcs',client:'Bahari Logistics',pm:'MM',st:'done',prog:100,val:42,bud:28,spent:26.1,stage:15,due:'12 Sep',team:['MM','JA']},
    {id:'PRJ-0230',name:'Billboard Campaign · 12 sites',client:'Kilimo Bank',pm:'SK',st:'risk',prog:51,val:132,bud:90,spent:58.3,stage:8,due:'06 Oct',team:['SK','AJ','GM','PL']},
    {id:'PRJ-0224',name:'Corporate Calendar 2027',client:'Nyota Insurance',pm:'RT',st:'on',prog:64,val:36,bud:22,spent:12.4,stage:7,due:'20 Oct',team:['RT','RS']}
  ],
  tasks:[
    // Design briefs from Client Service to Creative (kind 'brief').
    {id:'B1',kind:'brief',t:'Stage backdrop and 3 roll-up banners',p:'PRJ-0235',who:'RS',from:'NL',place:'Indoor event',note:'Gala dinner, gold and black theme. Backdrop 6 m wide.',due:'Fri 21',st:'todo',pri:'high'},
    {id:'B2',kind:'brief',t:'Truck wrap artwork · 22 trucks',p:'PRJ-0231',who:'DS',from:'NL',place:'Outdoor event',note:'Use the new logo lock-up; client wants two options.',due:'Mon 24',st:'prog',pri:'med',files:[{name:'Truck wrap · option A.svg',url:'/mockups/truck.svg',mime:'image/svg+xml',by:'DS',at:'2026-11-16'}]},
    {id:'B3',kind:'brief',t:'Outlet wall branding layouts',p:'PRJ-0228',who:'DS',from:'KM',place:'Outdoor event',note:'8 outlets, measurements in the site photos.',due:'Wed 19',st:'review',pri:'med',files:[{name:'Outlet wall · layout.svg',url:'/mockups/stand.svg',mime:'image/svg+xml',by:'DS',at:'2026-11-15'},{name:'Roll-up 85x200.svg',url:'/mockups/rollup.svg',mime:'image/svg+xml',by:'DS',at:'2026-11-15'}]},
    {id:'T1',by:'MM',t:'Load display units + gazebo for Mwanza',p:'PRJ-0231',who:'AJ',due:'Today 14:00',st:'prog',pri:'high'},
    {id:'T2',by:'MM',t:'Confirm venue permits · Musoma & Bukoba',p:'PRJ-0231',who:'GM',due:'Today 17:00',st:'todo',pri:'high'},
    {id:'T3',by:'MM',t:'Crew briefing pack + brand guidelines',p:'PRJ-0231',who:'SK',due:'Wed 23',st:'review',pri:'med'},
    {id:'T4',by:'MM',t:'Print 2,000 Swahili flyers',p:'PRJ-0231',who:'JA',due:'Thu 24',st:'todo',pri:'med'},
    {id:'T5',by:'SK',t:'Install wall branding · outlets 4–8',p:'PRJ-0228',who:'JM',due:'Wed 23',st:'prog',pri:'high'},
    {id:'T6',by:'MM',t:'Order 2 extra vinyl rolls',p:'PRJ-0228',who:'FH',due:'Today',st:'todo',pri:'high'},
    {id:'T7',by:'GN',t:'Get 2 supplier quotes for stand print',p:'PRJ-0233',who:'NL',due:'Today 14:00',st:'prog',pri:'high'},
    {id:'T8',by:'GN',t:'Stand carpentry sign-off',p:'PRJ-0233',who:'MM',due:'Thu 24',st:'todo',pri:'med'},
    {id:'T9',t:'QC 400 branded T-shirts',p:'PRJ-0226',who:'MM',due:'Tue 22',st:'done',pri:'med'},
    {id:'T10',by:'DK',t:'Venue walkthrough · Serena ballroom',p:'PRJ-0235',who:'NL',due:'Fri 25',st:'todo',pri:'low'},
    {id:'T11',by:'MM',t:'Billboard site photos · 6 sites',p:'PRJ-0230',who:'GM',due:'Fri 25',st:'review',pri:'med'},
      {id:'T12',by:'NL',t:'Final artwork approval from client',p:'PRJ-0224',who:'RS',due:'Mon 28',st:'prog',pri:'low'},
    {id:'T13',t:'Collect roll-ups from store · SIN-0932',p:'PRJ-0231',who:'JM',due:'Today 07:30',st:'done',pri:'med'},
    {id:'T14',by:'SK',t:'Install wall branding · Kariakoo outlet 4 of 8',p:'PRJ-0228',who:'JM',due:'Today 08:00',st:'prog',pri:'high'},
    {id:'T15',by:'MM',t:'Check printing production · print floor',p:'PRJ-0233',who:'JM',due:'Today 10:00',st:'todo',pri:'med'},
    {id:'T16',by:'SK',t:'Deliver banners · Mikocheni',p:'PRJ-0226',who:'JM',due:'Today 14:00',st:'todo',pri:'med'}
  ],
  reqs:[
    {id:'REQ-0418',who:'JM',amt:300000,cat:'Transport',purpose:'Bajaji and daladala fares for a 6-person install crew, Mwanza activations Tue–Thu. The company van is on the Musoma run.',p:'PRJ-0231',need:'Today 12:00',step:4,st:'pending',log:['07:12','07:40','08:05','08:38']},
    {id:'REQ-0421',who:'NL',amt:2400000,cat:'Supplier deposit',purpose:'50% deposit to an outsourced printer for Mlimani stand graphics — our large-format printer is down.',p:'PRJ-0233',need:'Wed 23',step:4,st:'pending',log:['Mon 16:10','Mon 16:30','Mon 17:02','08:20']},
    {id:'REQ-0423',who:'GM',amt:180000,cat:'Permits',purpose:'Municipal venue permit fees · Musoma.',p:'PRJ-0231',need:'Thu 24',step:4,st:'pending',log:['Mon 11:02','Mon 12:15','Mon 14:40','08:31']},
    {id:'REQ-0425',who:'AJ',amt:450000,cat:'Fuel',purpose:'Fuel for T 119 DKL, Dar → Musoma round trip.',p:'PRJ-0231',need:'Thu 24',step:3,st:'pending',log:['07:50','08:02','08:26']},
    {id:'REQ-0426',who:'JM',amt:120000,cat:'Materials',purpose:'Adhesive and cleaning supplies for outlet installs.',p:'PRJ-0228',need:'Wed 23',step:1,st:'pending',log:['08:44']},
    {id:'REQ-0412',paidOn:dayKey(-3),who:'GM',amt:250000,cat:'Transport',purpose:'Site visits for billboard photos.',p:'PRJ-0230',need:'Mon 21',step:6,st:'paid',log:['Fri 09:10','Fri 09:40','Fri 10:05','Fri 11:20','Fri 12:00','Fri 14:30']},
    {id:'REQ-0409',paidOn:dayKey(-5),who:'AJ',amt:600000,cat:'Fuel',purpose:'Arusha delivery run.',p:'PRJ-0226',need:'Fri 18',step:6,st:'paid',rec:{spent:540000,back:60000,file:null,at:dayKey(-1),st:'submitted'},log:['Thu','Thu','Thu','Thu','Thu','Fri']},
    {id:'REQ-0405',who:'SK',amt:90000,cat:'Meals',purpose:'Crew lunch — overtime.',p:'PRJ-0228',need:'Thu 17',step:2,st:'rejected',log:['Wed 18:00','Wed 18:20','Thu 08:10']}
  ],
  notes:[
    {id:1,ic:'banknote',t:'John M. requested TZS 300,000',s:'Lake Zone Roadshow · awaiting your approval',time:'08:42',read:false,go:'requests'},
    {id:2,ic:'alert',t:'Pwani outlet branding over budget by 12%',s:'Spent TZS 69.4M of 62.0M budget',time:'08:20',read:false,go:'project:PRJ-0228'},
    {id:3,ic:'users',t:'New website lead · Safari Mobile',s:'Road show, 6 regions',time:'07:58',read:false,go:'crm'},
    {id:4,ic:'package',t:'Low stock · Vinyl 1.37m gloss',s:'3 rolls left, minimum 10',time:'07:55',read:false,go:'store'},
    {id:5,ic:'clock',t:'4 staff missed yesterday\u2019s report',s:'Peter L., Rehema S., Juma A., Fatma H.',time:'07:00',read:false,go:'staff'},
    {id:6,ic:'check',t:'Production completed · 400 T-shirts',s:'Kivuko Foods · QC passed',time:'Mon',read:true,go:'project:PRJ-0226'}
  ],
  stock:[
    {sku:'VNL-137G',n:'Vinyl 1.37m gloss',cat:'Print media',q:3,min:10,u:'rolls',loc:'A-02',cost:185000},
    {sku:'VNL-137M',n:'Vinyl 1.37m matte',cat:'Print media',q:14,min:8,u:'rolls',loc:'A-03',cost:190000},
    {sku:'BNR-FLX',n:'Flex banner 3.2m',cat:'Print media',q:9,min:6,u:'rolls',loc:'A-05',cost:240000},
    {sku:'INK-ECO-C',n:'Eco-solvent ink · Cyan',cat:'Consumables',q:4,min:6,u:'L',loc:'B-01',cost:95000},
    {sku:'INK-ECO-K',n:'Eco-solvent ink · Black',cat:'Consumables',q:11,min:6,u:'L',loc:'B-01',cost:95000},
    {sku:'ADH-SPR',n:'Spray adhesive',cat:'Consumables',q:5,min:12,u:'cans',loc:'B-06',cost:18000},
    {sku:'TSH-WHT-L',n:'T-shirt white · L',cat:'Apparel',q:820,min:300,u:'pcs',loc:'C-10',cost:6500},
    {sku:'RLU-850',n:'Roll-up stand 85×200',cat:'Display',q:18,min:10,u:'pcs',loc:'D-04',cost:78000},
    {sku:'PVC-5MM',n:'Forex PVC board 5mm',cat:'Boards',q:40,min:20,u:'sheets',loc:'A-09',cost:52000},
    {sku:'GZB-3X3',n:'Gazebo tent 3×3',cat:'Equipment',q:6,min:4,u:'pcs',loc:'E-01',cost:420000},
    {sku:'CST-VNL',n:'Cast vinyl 1.52m (vehicle wrap)',cat:'Print media',q:1,min:2,u:'rolls',loc:'A-06',cost:690000},
    {sku:'LAM-GLS',n:'Gloss laminate 1.37m',cat:'Print media',q:7,min:4,u:'rolls',loc:'A-04',cost:160000},
    {sku:'SEG-FAB',n:'SEG fabric 3.2m',cat:'Print media',q:2,min:3,u:'rolls',loc:'A-10',cost:380000},
    {sku:'DTF-FILM',n:'DTF transfer film 60cm',cat:'Print media',q:6,min:4,u:'rolls',loc:'A-07',cost:145000},
    {sku:'PET-ROLL',n:'PET roll-up film 85cm',cat:'Print media',q:5,min:4,u:'rolls',loc:'A-08',cost:210000}
  ],
  proc:[
    {id:'PR-0207',t:'Vinyl rolls × 12',p:'PRJ-0228',v:2.2,s:3,sup:'Chapa Supplies',sku:'VNL-137G',qty:12,srq:'SRQ-0104'},
    {id:'PR-0209',t:'Stand graphics print (outsourced)',p:'PRJ-0233',v:4.8,s:1,sup:'PrintHub DSM'},
    {id:'PR-0210',t:'Eco-solvent ink × 8L',p:'',v:0.76,s:0,sup:'—',sku:'INK-ECO-C',qty:8},
    {id:'PR-0211',t:'Gazebo tents × 2',p:'PRJ-0235',v:0.84,s:2,sup:'Kariakoo Tents',sku:'GZB-3X3',qty:2},
    {id:'PR-0204',t:'Forex boards × 30',p:'PRJ-0230',v:1.56,s:4,sup:'Plastiko Ltd'},
    {id:'PR-0212',t:'Spray adhesive × 24',p:'PRJ-0228',v:0.43,s:0,sup:'—',sku:'ADH-SPR',qty:24},
    {id:'PR-0206',t:'Polo shirts × 300',p:'PRJ-0235',v:3.9,s:1,sup:'Mavazi Wear'}
  ],
  // Leads: New → Contacted → Meeting → Proposal sent → Negotiation → Won / Lost (sv:2 = these stages).
  leads:[
    {id:'L1',sv:2,c:'Safari Mobile',t:'Road show · 6 regions',v:185,s:0,src:'Email to Management',owner:'KM',next:'Today',at:dayKey(0),hist:[{s:0,by:'DK',at:dayKey(0),note:'Received by email, assigned to Khadija'}]},
    {id:'L2',sv:2,c:'Serena Hotels',t:'Lobby & signage refresh',v:38,s:1,src:'Referral',owner:'KM',next:'Fri',at:dayKey(-2),hist:[{s:0,by:'NL',at:dayKey(-4)},{s:1,by:'KM',at:dayKey(-2),note:'Called the marketing manager'}]},
    {id:'L3',sv:2,c:'Nyota Insurance',t:'AGM 2026 production',v:64,s:2,src:'Existing client',owner:'NL',next:'Thu',at:dayKey(-1),hist:[{s:1,by:'NL',at:dayKey(-6)},{s:2,by:'NL',at:dayKey(-1),note:'Site visit at the venue'}]},
    {id:'L4',sv:2,c:'Zawadi Telecom',t:'Christmas activations · 4 regions',v:96,s:3,src:'Tender',owner:'NL',next:'Mon',at:dayKey(-9),proposal:{name:'Zawadi Christmas proposal.pdf',size:842000,by:'NL',at:dayKey(-9)},hist:[{s:1,by:'NL',at:dayKey(-15)},{s:2,by:'NL',at:dayKey(-12)},{s:3,by:'NL',at:dayKey(-9),note:'Proposal emailed to procurement'}]},
    {id:'L5',sv:2,c:'Kilimo Bank',t:'Branch rebrand · 18 branches',v:240,s:4,src:'Existing client',owner:'NL',next:'Tomorrow',at:dayKey(-1),proposal:{name:'Kilimo Bank rebrand proposal.pdf',size:1240000,by:'NL',at:dayKey(-5)},hist:[{s:3,by:'NL',at:dayKey(-5)},{s:4,by:'NL',at:dayKey(-1),note:'Client asked for a 5% discount'}]},
    {id:'L6',sv:2,c:'Tumaini Beverages',t:'Sampling campaign · 3 cities',v:78,s:3,src:'Phone call',owner:'KM',next:'Wed',at:dayKey(-3),proposal:{name:'Tumaini sampling proposal.pdf',size:610000,by:'KM',at:dayKey(-3)},hist:[{s:3,by:'KM',at:dayKey(-3)}]},
    {id:'L7',sv:2,c:'Bahari Logistics',t:'Fleet wrap · 22 trucks',v:55,s:5,src:'Existing client',owner:'NL',at:dayKey(-7),hist:[{s:5,by:'NL',at:dayKey(-7),note:'PO received'}]},
    {id:'L8',sv:2,c:'Coastal Cement',t:'Dealer signage · 40 outlets',v:72,s:6,src:'Tender',owner:'KM',lost:'Chose a competitor',at:dayKey(-10),hist:[{s:6,by:'KM',at:dayKey(-10),note:'Lower price from another agency'}]}
  ],
  // Customers we work with (the directory).
  customers:[
    {id:'C1',n:'Serengeti Telecom',contact:'Asha Mollel · Brand Manager',phone:'+255 754 210 334',email:'asha.mollel@serengeti.co.tz',tin:'102-334-871',city:'Dar es Salaam',owner:'NL'},
    {id:'C2',n:'Pwani Beverages',contact:'Hamisi Juma · Trade Marketing',phone:'+255 713 448 120',email:'hamisi@pwanibev.co.tz',tin:'117-902-445',city:'Dar es Salaam',owner:'KM'},
    {id:'C3',n:'Mlimani Bank',contact:'Rehema Kweka · Marketing',phone:'+255 767 300 912',email:'r.kweka@mlimanibank.co.tz',tin:'100-221-118',city:'Dar es Salaam',owner:'NL'},
    {id:'C4',n:'Kivuko Foods',contact:'Joseph Mrema · Sales Director',phone:'+255 715 662 004',email:'joseph@kivuko.co.tz',tin:'131-558-290',city:'Arusha',owner:'KM'},
    {id:'C5',n:'Safari Mobile',contact:'Fatuma Said · Head of Brand',phone:'+255 744 118 650',email:'fatuma.said@safarimobile.co.tz',tin:'109-776-321',city:'Dar es Salaam',owner:'NL'},
    {id:'C6',n:'Bahari Logistics',contact:'Peter Massawe · Operations',phone:'+255 682 905 770',email:'pmassawe@bahari.co.tz',tin:'124-310-667',city:'Dar es Salaam',owner:'NL'},
    {id:'C7',n:'Kilimo Bank',contact:'Grace Lyimo · Procurement',phone:'+255 754 880 213',email:'procurement@kilimobank.co.tz',tin:'100-912-504',city:'Dodoma',owner:'NL'},
    {id:'C8',n:'Nyota Insurance',contact:'David Mushi · Corporate Affairs',phone:'+255 716 540 228',email:'dmushi@nyota.co.tz',tin:'118-445-902',city:'Dar es Salaam',owner:'NL'}
  ],
  staff:[
    {k:'SK',role:'Project Manager',dept:'operations',rep:true,fl:0},{k:'MM',role:'Operations Manager',dept:'operations',rep:true,fl:0},{k:'NL',role:'Client Service Manager',dept:'clientservice',rep:true,fl:0},{k:'RT',role:'Finance Officer',dept:'finance',rep:true,fl:0},
    {k:'JM',role:'Field Supervisor',dept:'operations',rep:true,fl:300000},{k:'GM',role:'Field Officer',dept:'operations',rep:true,fl:180000},{k:'AJ',role:'Driver',dept:'operations',rep:true,fl:450000},{k:'PL',role:'Installer',dept:'operations',rep:false,fl:250000},
    {k:'RS',role:'Creative Lead',dept:'creative',rep:false,fl:0},{k:'DS',role:'Graphic Designer',dept:'creative',rep:false,fl:0},{k:'KM',role:'Client Service Executive',dept:'clientservice',rep:false,fl:0},
    {k:'JA',role:'Printer Operator',dept:'production',rep:false,fl:0},{k:'FH',role:'Storekeeper',dept:'store',rep:false,fl:0},{k:'AM',role:'Front Office',dept:'reception',rep:false,fl:0}
  ],
  float:{grants:[{id:'FG1',amt:15000000,note:'November float',by:'DK',at:'2026-11-03'}],allocs:[{id:'FL1',to:'PRJ-0231',amt:6000000,at:'2026-11-03',by:'RT'},{id:'FL2',to:'PRJ-0233',amt:3500000,at:'2026-11-04',by:'RT'},{id:'FL3',to:'office:Office running',amt:1500000,at:'2026-11-04',by:'RT'},{id:'FL4',to:'office:Transport',amt:800000,at:'2026-11-05',by:'RT'}],asks:[]},
  invoices:[
    {id:'INV-0187',c:'Kivuko Foods',p:'PRJ-0226',v:18.6,st:'overdue',due:'21 days late'},
    {id:'INV-0189',c:'Kilimo Bank',p:'PRJ-0230',v:22.6,st:'overdue',due:'9 days late'},
    {id:'INV-0192',c:'Pwani Beverages',p:'PRJ-0228',v:24.0,st:'sent',due:'30 Sep'},
    {id:'INV-0196',c:'Mlimani Bank',p:'PRJ-0233',v:63.0,st:'sent',due:'05 Oct'},
    {id:'INV-0197',c:'Safari Mobile',p:'PRJ-0235',v:58.2,st:'sent',due:'12 Oct'},
    {id:'INV-0195',c:'Serengeti Telecom',p:'PRJ-0231',v:84.0,st:'paid',due:'Paid',payments:[{id:'PY0',amt:84000000,ref:'CRDB TT 87001',at:dayKey(-40),rec:'RT',ok:'DK'}]},
    {id:'INV-0198',c:'Nyota Insurance',p:'PRJ-0224',v:18.0,st:'draft',due:'—'},
    {id:'INV-0199',c:'Serengeti Telecom',tin:'100-146-304',vrn:'10-0066-45-E',p:'PRJ-0231',title:'Lake Zone Roadshow · Phase 2 activation',po:'PO-55821',poDate:'2026-11-02',vendor:'V-2219',signer:'ED',at:'2026-11-12',due:'30 days',by:'RT',admin:15,vat:18,st:'partial',v:19.1337,
      lines:[{item:'Brand ambassadors',n:12,rate:60000,days:6,events:1},{item:'Roadshow truck with sound system',n:1,rate:850000,days:6,events:1},{item:'Gazebos 3×3 branded',n:4,rate:120000,days:6,events:1},{item:'Event supervisor',n:2,rate:150000,days:6,events:1}],
      signed:{by:'DK',name:'Daniel K.',at:'2026-11-12'},payments:[{id:'PY1',amt:6000000,ref:'CRDB TT 88213',at:dayKey(-3),rec:'RT',ok:'DK'},{id:'PY2',amt:4000000,ref:'CRDB TT 88907',at:dayKey(-1),rec:'RT',ok:null}]}
  ],
  activity:[
    {time:'08:42',ic:'banknote',tone:'amber',t:'John M. requested TZS 300,000 for crew transport',s:'Lake Zone Roadshow · REQ-0418'},
    {time:'08:31',ic:'check',tone:'purple',t:'Sarah K. approved purchase request PR-0207',s:'Vinyl rolls × 12 · Pwani Beverages'},
    {time:'08:15',ic:'printer',tone:'green',t:'Production completed · 400 branded T-shirts',s:'Kivuko Foods Activation · QC passed'},
    {time:'07:58',ic:'users',tone:'blue',t:'New website lead · Safari Mobile',s:'Road show, 6 regions · assigned to Sales'},
    {time:'07:40',ic:'truck',tone:'dark',t:'Van T 482 DXY dispatched to Mwanza',s:'Driver Amani J. · 3 display units'}
  ],
  actions:[
    {d:'Pwani branding must complete Wednesday',a:'Add night shift on outlet installs',o:'MM',dl:'Wed 23 · 16:00',task:'TSK-1042'},
    {d:'Outsource Mlimani stand print',a:'Get 2 supplier quotes by 14:00',o:'NL',dl:'Today · 14:00',task:'TSK-1043'},
    {d:'Escalate Kivuko overdue invoice',a:'MD to call client finance lead',o:'DK',dl:'Tue 22 · 12:00',task:'TSK-1044'}
  ],
  agenda:[true,true,false,false,false,false],
  requisitions:[
    {id:'SRQ-0105',job:'JOB-0314',p:'PRJ-0233',by:'RS',purpose:'Expo stand graphics',items:[{sku:'SEG-FAB',qty:4,issued:0},{sku:'PVC-5MM',qty:18,issued:0}],st:'pending',d:'Today · 08:10'},
    {id:'SRQ-0104',job:'JOB-0315',p:'PRJ-0228',by:'JM',purpose:'Outlet wall branding · 8 walls',items:[{sku:'VNL-137G',qty:8,issued:8},{sku:'LAM-GLS',qty:2,issued:2}],st:'issued',d:'Mon 21 · 09:40'},
    {id:'SRQ-0103',job:'JOB-0311',p:'PRJ-0231',by:'JA',purpose:'Branded T-shirts × 600',items:[{sku:'TSH-WHT-L',qty:600,issued:600},{sku:'DTF-FILM',qty:3,issued:3}],st:'issued',d:'Mon 21 · 08:20'},
    {id:'SRQ-0102',job:'JOB-0316',p:'PRJ-0230',by:'JA',purpose:'Billboard skins × 12',items:[{sku:'BNR-FLX',qty:4,issued:4},{sku:'INK-ECO-K',qty:2,issued:2}],st:'issued',d:'Fri 18 · 14:05'},
    {id:'SRQ-0101',job:'JOB-0312',p:'PRJ-0231',by:'JA',purpose:'Roll-up banners × 24',items:[{sku:'RLU-850',qty:24,issued:24},{sku:'PET-ROLL',qty:3,issued:3}],st:'issued',d:'Thu 17 · 10:30'}
  ],
  movements:[
    {id:'MV-0212',d:'Mon 21 · 09:52',sku:'VNL-137G',type:'issue',qty:-8,ref:'SRQ-0104',p:'PRJ-0228',by:'FH',v:1520000},
    {id:'MV-0211',d:'Mon 21 · 09:52',sku:'LAM-GLS',type:'issue',qty:-2,ref:'SRQ-0104',p:'PRJ-0228',by:'FH',v:320000},
    {id:'MV-0210',d:'Mon 21 · 08:35',sku:'TSH-WHT-L',type:'issue',qty:-600,ref:'SRQ-0103',p:'PRJ-0231',by:'FH',v:3900000},
    {id:'MV-0209',d:'Mon 21 · 08:35',sku:'DTF-FILM',type:'issue',qty:-3,ref:'SRQ-0103',p:'PRJ-0231',by:'FH',v:435000},
    {id:'MV-0208',d:'Sat 19 · 11:00',sku:'ADH-SPR',type:'adjust',qty:-2,ref:'Stock count · 2 cans damaged',p:'',by:'FH',v:-36000},
    {id:'MV-0207',d:'Fri 18 · 16:20',sku:'TSH-WHT-L',type:'receipt',qty:1000,ref:'GRN-0398 · Mavazi Wear',p:'',by:'FH',v:6500000},
    {id:'MV-0206',d:'Fri 18 · 14:15',sku:'BNR-FLX',type:'issue',qty:-4,ref:'SRQ-0102',p:'PRJ-0230',by:'FH',v:960000},
    {id:'MV-0205',d:'Fri 18 · 14:15',sku:'INK-ECO-K',type:'issue',qty:-2,ref:'SRQ-0102',p:'PRJ-0230',by:'FH',v:190000},
    {id:'MV-0204',d:'Thu 17 · 17:40',sku:'RLU-850',type:'return',qty:2,ref:'Unused from JOB-0312',p:'PRJ-0231',by:'JA',v:156000},
    {id:'MV-0203',d:'Thu 17 · 10:45',sku:'RLU-850',type:'issue',qty:-24,ref:'SRQ-0101',p:'PRJ-0231',by:'FH',v:1872000},
    {id:'MV-0202',d:'Thu 17 · 10:45',sku:'PET-ROLL',type:'issue',qty:-3,ref:'SRQ-0101',p:'PRJ-0231',by:'FH',v:630000},
    {id:'MV-0201',d:'Wed 16 · 15:10',sku:'PET-ROLL',type:'receipt',qty:6,ref:'GRN-0396 · Chapa Supplies',p:'',by:'FH',v:1260000}
  ],
  reportsSub:44, reportsToday:{}, reportText:'', fieldReq:{amt:'',purpose:'',p:'PRJ-0231',cat:'Team'},
  // Company-wide setup: requests up to smallLimit (TZS) need only the PM and Finance; `off` hides sections.
  outbox:[],
  cal:[{id:'CE1',title:'Staff meeting · monthly',date:dayKey(2),time:'08:30',kind:'Staff meeting',by:'GN'},{id:'CE2',title:'Q4 results presentation to the board',date:dayKey(6),time:'10:00',kind:'Presentation',by:'DK'},{id:'CE3',title:'Public holiday · Independence Day',date:dayKey(23),time:'',kind:'Holiday',by:'GN'}],
  meetings:[
    {id:'MT1',title:'Gala planning with Safari Mobile',date:dayKey(0),time:'16:00',place:'Boardroom',kind:'client',to:{all:false,depts:['clientservice'],people:['GN']},guest:{name:'Halima Juma',co:'Safari Mobile',phone:'+255 767 300 900'},by:'DK',at:dayKey(-1)},
    {id:'MT2',title:'Weekly project review',date:dayKey(1),time:'09:00',place:'Boardroom',kind:'internal',to:{all:false,depts:['operations','creative'],people:[]},guest:null,by:'GN',at:dayKey(-1)},
    {id:'MT3',title:'All staff: end of year plans',date:dayKey(3),time:'14:00',place:'Main hall',kind:'internal',to:{all:true,depts:[],people:[]},guest:null,by:'DK',at:dayKey(-1)}
  ],
  ledger:ledgerSeed(),
  company:{notify:{wa:true,sms:false,email:false,events:{clients:true,approvals:true,designs:true,payments:true,tasks:false}},phones:{DK:'+255 754 000 101',GN:'+255 754 000 102',NL:'+255 754 000 103',RS:'+255 754 000 104',MM:'+255 754 000 105',RT:'+255 754 000 106'},smallLimit:200000, off:['ceomobile'], managers:{}, csTarget:500},
  // Daily to-do: what each person did today and plans to do.
  todos:[
    {id:'TD-1',k:'GM',t:'Delivered branded tents to Mwanza site',st:'done',d:dayKey(0),doneOn:dayKey(0)},
    {id:'TD-2',k:'GM',t:'Set up 4 gazebos for the roadshow',st:'todo',d:dayKey(0)},
    {id:'TD-3',k:'GM',t:'Send site photos to Sarah',st:'todo',d:dayKey(-1)},
    {id:'TD-4',k:'SK',t:'Confirmed truck wrap artwork with client',st:'done',d:dayKey(0),doneOn:dayKey(0)},
    {id:'TD-5',k:'SK',t:'Approve roadshow budget changes',st:'todo',d:dayKey(0)},
    {id:'TD-6',k:'JA',t:'Printed 24 roll-up banners',st:'done',d:dayKey(0),doneOn:dayKey(0)},
    {id:'TD-7',k:'JA',t:'Laminate truck wrap panels',st:'todo',d:dayKey(0)},
    {id:'TD-8',k:'FH',t:'Issued vinyl and laminate for JOB-0313',st:'done',d:dayKey(0),doneOn:dayKey(0)}
  ],
  proposals:[
    {id:'PRO-0152',c:'Zawadi Telecom',t:'Christmas activations · 4 regions',v:96,s:0,own:'NL',valid:'30 Oct'},
    {id:'PRO-0150',c:'Nyota Insurance',t:'AGM 2026 production',v:64,s:1,own:'NL',valid:'22 Oct'},
    {id:'PRO-0148',c:'Kilimo Bank',t:'Branch rebrand · 18 branches',v:240,s:3,own:'SK',valid:'15 Oct'},
    {id:'PRO-0147',c:'Tumaini Beverages',t:'Sampling campaign · 3 cities',v:78,s:4,own:'NL',valid:'12 Oct'},
    {id:'PRO-0145',c:'Bahari Logistics',t:'Fleet wrap · 22 trucks',v:55,s:5,own:'MM',valid:'08 Oct'},
    {id:'PRO-0141',c:'Safari Mobile',t:'Brand Launch Gala',v:210,s:6,own:'NL',valid:'—',conv:true}
  ],
  jobs:[
    {id:'JOB-0311',t:'Branded T-shirts × 600',p:'PRJ-0231',mat:'Cotton tees, DTF film',qty:600,s:3,due:'Thu 24',who:'JA',cost:3.9,waste:2,bom:[{sku:'TSH-WHT-L',qty:600},{sku:'DTF-FILM',qty:3}],req:'SRQ-0103'},
    {id:'JOB-0312',t:'Roll-up banners × 24',p:'PRJ-0231',mat:'Roll-up 85×200, PET film',qty:24,s:6,due:'Mon 21',who:'JA',cost:1.9,waste:0,bom:[{sku:'RLU-850',qty:24},{sku:'PET-ROLL',qty:3}],req:'SRQ-0101'},
    {id:'JOB-0313',t:'Truck wrap · 1 vehicle',p:'PRJ-0231',mat:'Cast vinyl + laminate',qty:1,s:2,due:'Fri 25',who:'RS',cost:0.4,waste:0,bom:[{sku:'CST-VNL',qty:3},{sku:'LAM-GLS',qty:1}]},
    {id:'JOB-0314',t:'Expo stand graphics',p:'PRJ-0233',mat:'SEG fabric, Forex 5mm',qty:18,s:1,due:'Wed 23',who:'RS',cost:1.1,waste:0,bom:[{sku:'SEG-FAB',qty:4},{sku:'PVC-5MM',qty:18}],req:'SRQ-0105'},
    {id:'JOB-0315',t:'Outlet wall branding · 8 walls',p:'PRJ-0228',mat:'Vinyl 1.37m gloss',qty:8,s:3,due:'Wed 23',who:'JM',cost:4.1,waste:6,bom:[{sku:'VNL-137G',qty:8},{sku:'LAM-GLS',qty:2}],req:'SRQ-0104'},
    {id:'JOB-0316',t:'Billboard skins × 12',p:'PRJ-0230',mat:'Flex banner 3.2m',qty:12,s:4,due:'Mon 28',who:'JA',cost:5.6,waste:3,bom:[{sku:'BNR-FLX',qty:4},{sku:'INK-ECO-K',qty:2}],req:'SRQ-0102'}
  ],
  trips:[
    {id:'TRP-0091',what:'3 display units + gazebo',p:'PRJ-0231',to:'Mwanza',veh:'T 482 DXY',drv:'Amani Juma',s:1,date:'Tue 22 · 05:30'},
    {id:'TRP-0092',what:'Roll-up banners × 24',p:'PRJ-0231',to:'Musoma',veh:'T 119 DKL',drv:'Hassan Rajab',s:0,date:'Thu 24 · 06:00'},
    {id:'TRP-0093',what:'Expo stand structure',p:'PRJ-0233',to:'Mlimani City',veh:'T 733 DGH',drv:'Hassan Rajab',s:0,date:'Thu 24 · 14:00'},
    {id:'TRP-0089',what:'Banners delivery',p:'PRJ-0226',to:'Mikocheni',veh:'T 733 DGH',drv:'Amani Juma',s:3,date:'Mon 21 · 14:00'},
    {id:'TRP-0087',what:'Uniform cartons × 40',p:'PRJ-0219',to:'Bahari HQ',veh:'T 119 DKL',drv:'Hassan Rajab',s:4,date:'Fri 18'}
  ],
  vehicles:[{reg:'T 482 DXY',type:'Isuzu NPR · 3 tonne'},{reg:'T 119 DKL',type:'Toyota Hiace · crew van'},{reg:'T 733 DGH',type:'Mitsubishi Canter',svc:'30 Sep'}],
  docs:[
    {id:1,n:'Serengeti Telecom — signed contract.pdf',type:'Contract',p:'PRJ-0231',by:'SK',d:'02 Sep',sz:'1.2 MB'},
    {id:2,n:'Lake Zone roadshow brief.pdf',type:'Brief',p:'PRJ-0231',by:'NL',d:'28 Aug',sz:'640 KB'},
    {id:3,n:'Pwani outlet designs v3.png',type:'Design',p:'PRJ-0228',by:'RS',d:'15 Sep',sz:'4.8 MB'},
    {id:4,n:'Kilimo Bank proposal PRO-0148.pdf',type:'Proposal',p:'PRJ-0230',by:'SK',d:'12 Sep',sz:'2.1 MB'},
    {id:5,n:'INV-0195 payment receipt.pdf',type:'Receipt',p:'PRJ-0231',by:'RT',d:'15 Sep',sz:'180 KB'},
    {id:6,n:'Mlimani stand — client approval.pdf',type:'Client approval',p:'PRJ-0233',by:'NL',d:'19 Sep',sz:'920 KB'},
    {id:7,n:'PO-0204 Plastiko Ltd.pdf',type:'Purchase',p:'PRJ-0230',by:'FH',d:'18 Sep',sz:'210 KB'},
    {id:8,n:'W38 Monday Briefing minutes.pdf',type:'Report',p:'',by:'DK',d:'15 Sep',sz:'350 KB'}
  ],
  events:[
    {id:1,d:'Mon 21',t:'08:00',n:'Monday Briefing',k:'meet'},{id:2,d:'Mon 21',t:'11:00',n:'Safari Mobile pitch prep',k:'proj'},
    {id:3,d:'Tue 22',t:'05:30',n:'Dispatch to Mwanza',k:'log'},{id:4,d:'Tue 22',t:'09:00',n:'Serengeti contract review · Boardroom',k:'client'},
    {id:5,d:'Tue 22',t:'14:00',n:'Mlimani Bank pitch · Boardroom',k:'client'},{id:6,d:'Wed 23',t:'16:00',n:'Pwani outlet branding deadline',k:'dead'},
    {id:7,d:'Thu 24',t:'06:00',n:'Roadshow crew → Musoma',k:'log'},{id:8,d:'Thu 24',t:'14:00',n:'Expo stand delivery',k:'log'},
    {id:9,d:'Fri 25',t:'09:00',n:'Mlimani Bank Expo opens',k:'event'},{id:10,d:'Fri 25',t:'15:00',n:'Venue walkthrough · Serena',k:'proj'}
  ],
  teamUpdates:[
    {id:1,who:'JM',t:'Outlet 3 branding on schedule. Outlet 4 wall is damp \u2014 needs repair before we install.',pres:false,time:'Fri 16:40'},
    {id:2,who:'AJ',t:'Mwanza delivery route confirmed for Tuesday. Fuel float is at 60% used.',pres:false,time:'Fri 17:05'},
    {id:3,who:'NL',t:'Mlimani Bank walkthrough deck ready \u2014 covers stand concept, timeline and cost options.',pres:true,time:'Mon 07:50'}
  ],
  newUpdate:{who:'SK', t:'', pres:false},
  visitors:[
    {id:'V1',name:'James Mollel',co:'Serengeti Telecom',phone:'+255 713 220 114',purpose:'Contract review',host:'SK',date:dayKey(0),time:'09:15',st:'in'},
    {id:'V2',name:'Grace Kimaro',co:'Chapa Supplies',phone:'+255 754 880 201',purpose:'Delivery',host:'RT',date:dayKey(0),time:'10:02',st:'out',outAt:'10:20'},
    {id:'V3',name:'Peter Nnko',co:'Applicant',phone:'+255 688 410 552',purpose:'Interview',host:'MM',date:dayKey(0),time:'15:30',st:'expected'},
    {id:'V4',name:'Halima Juma',co:'Safari Mobile',phone:'+255 767 300 900',purpose:'Gala planning meeting',host:'DK',date:dayKey(0),time:'16:00',st:'expected',meeting:'MT1'}
  ],
  newVisitor:{name:'',co:'',purpose:'',host:'SK'},
  rooms:[
    {id:'R1',n:'Boardroom',cap:12,b:{'09':['SK','Serengeti contract review'],'10':['SK','Serengeti contract review'],'14':['DK','Mlimani Bank pitch']}},
    {id:'R2',n:'Creative studio',cap:6,b:{'11':['RS','Design review · Nyota'],'15':['NL','Safari Mobile concept']}},
    {id:'R3',n:'Huddle room',cap:4,b:{'08':['MM','Ops stand-up']}}
  ],
  roomTitle:'Client meeting',
  deliveries:[
    {id:'DLV-401',from:'Chapa Supplies',items:'Vinyl rolls × 12',st:'arrived',time:'08:50',sku:'VNL-137G',qty:12},
    {id:'DLV-402',from:'PrintHub DSM',items:'Stand graphics proof',st:'expected',time:'14:00'},
    {id:'DLV-403',from:'Kariakoo Tents',items:'Gazebo tents × 2',st:'arrived',time:'09:30',sku:'GZB-3X3',qty:2}
  ]
};
}
